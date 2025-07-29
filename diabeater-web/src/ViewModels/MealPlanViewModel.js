// MealPlanViewModel.js
import { makeAutoObservable, runInAction, computed } from 'mobx';
import MealPlanRepository from '../Repositories/MealPlanRepository';
import AuthService from '../Services/AuthService';
import CategoryRepository from '../Repositories/MealCategoryRepository'; // Make sure this is imported

class MealPlanViewModel {
    mealPlans = [];
    loading = false;
    error = '';
    success = '';
    searchTerm = '';
    selectedCategory = '';
    allCategories = [];
    mealCategories = [];
    loadingCategories = false;
    categoryError = '';
    currentUserId = null;
    currentUserRole = null;
    currentUserName = null;
    selectedMealPlanForDetail = null;
    selectedMealPlanForUpdate = null;
    notifications = [];
    unreadNotificationCount = 0;
    adminActiveTab = 'PENDING_APPROVAL';
    _notificationsUnsubscribe = null;

    constructor() {
        makeAutoObservable(this, {
            filteredMealPlans: computed,
            allCategoriesWithDetails: computed
        });
        this.initializeUser();
    }

    initializeUser = () => {
        const user = AuthService.getCurrentUser();
        if (user) {
            runInAction(() => {
                this.currentUserId = user.uid;
                this.currentUserRole = user.role;
                this.currentUserName = user.name || user.username || user.email;
            });
            if (user.role === 'admin') {
                this.fetchAdminMealPlans(this.adminActiveTab);
                this.fetchMealCategories();
            } else {
                this.fetchNutritionistMealPlans(user.uid);
                this.setupNotificationListener();
                this.fetchMealCategories();
            }
            this.fetchNotifications(user.uid);
        } else {
            console.warn("No authenticated user found in initializeUser.");
            runInAction(() => {
                this.mealPlans = [];
                this.allCategories = [];
                this.mealCategories = [];
                this.currentUserId = null;
                this.currentUserRole = null;
                this.currentUserName = null;
                this.notifications = [];
                this.unreadNotificationCount = 0;
            });
            this.dispose();
        }
    };

    setAdminActiveTab = async (tab) => {
        if (this.adminActiveTab !== tab) {
            runInAction(() => {
                this.adminActiveTab = tab;
            });
            if (this.currentUserRole === 'admin') {
                await this.fetchAdminMealPlans(tab);
            }
        }
    };

    setupNotificationListener = () => {
        if (!this.currentUserId || this.currentUserRole !== 'nutritionist') {
            console.warn("Cannot setup notification listener: User ID not available or not a nutritionist.");
            return;
        }
        if (this._notificationsUnsubscribe) {
            this._notificationsUnsubscribe();
            this._notificationsUnsubscribe = null;
            console.log("Existing notification listener unsubscribed.");
        }
        console.log(`Setting up notification listener for user: ${this.currentUserId}`);
        this._notificationsUnsubscribe = MealPlanRepository.onNotificationsSnapshot(this.currentUserId, (notifications) => {
            runInAction(() => {
                this.notifications = Array.isArray(notifications) ? notifications : [];
                this.unreadNotificationCount = this.notifications.filter(n => !n.read).length;
            });
        });
    };

    fetchNotifications = async (userId) => {
        if (!userId) {
            console.warn("User ID not available for fetching notifications.");
            return;
        }
        this.setLoading(true);
        try {
            const fetchedNotifications = await MealPlanRepository.getNotifications(userId);
            runInAction(() => {
                this.notifications = Array.isArray(fetchedNotifications) ? fetchedNotifications : [];
                this.unreadNotificationCount = this.notifications.filter(n => !n.read).length;
            });
        } catch (err) {
            console.error('Error fetching notifications:', err);
            this.setError('Failed to fetch notifications.');
            runInAction(() => {
                this.notifications = [];
                this.unreadNotificationCount = 0;
            });
        } finally {
            this.setLoading(false);
        }
    }

    markNotificationAsRead = async (notificationId) => {
        this.setLoading(true);
        try {
            await MealPlanRepository.markNotificationAsRead(notificationId);
            runInAction(() => {
                if (!Array.isArray(this.notifications)) {
                    this.notifications = [];
                }
                const notification = this.notifications.find(n => n._id === notificationId);
                if (notification) {
                    notification.read = true;
                    this.unreadNotificationCount = this.notifications.filter(n => !n.read).length;
                }
            });
            this.setSuccess('Notification marked as read.');
        } catch (err) {
            console.error('Error marking notification as read:', err);
            this.setError('Failed to mark notification as read.');
        } finally {
            this.setLoading(false);
        }
    }

    loadMealPlanDetails = async (mealPlanId) => {
        this.setLoading(true);
        this.setError('');
        try {
            const details = await MealPlanRepository.getMealPlanDetails(mealPlanId);
            runInAction(() => {
                this.selectedMealPlanForDetail = details;
            });
        } catch (err) {
            console.error('Error loading meal plan details:', err);
            this.setError('Failed to load meal plan details: ' + err.message);
        } finally {
            this.setLoading(false);
        }
    }

    selectMealPlanForUpdate = (mealPlanId) => {
        console.log("ViewModel: All meal plans:", this.mealPlans.map(p => ({ id: p._id, name: p.name })));
        console.log("ViewModel: Looking for mealPlanId for update:", mealPlanId);
        const mealPlan = this.mealPlans.find(plan => plan._id === mealPlanId);
        if (mealPlan) {
            runInAction(() => {
                this.selectedMealPlanForUpdate = mealPlan;
                console.log("ViewModel: selectedMealPlanForUpdate set to:", this.selectedMealPlanForUpdate);
            });
            this.setSuccess(`Ready to update meal plan: ${mealPlan.name}`);
        } else {
            console.error("ViewModel: Meal plan NOT found in 'mealPlans' array for ID:", mealPlanId);
            runInAction(() => {
                this.selectedMealPlanForUpdate = null;
                this.setError("Could not find meal plan to update. Please refresh and try again.");
            });
        }
    };

    clearSelectedMealPlans = () => {
        runInAction(() => {
            this.selectedMealPlanForDetail = null;
            this.selectedMealPlanForUpdate = null;
        });
    }

    deleteMealPlan = async (mealPlanId, imageFileName) => {
        this.setLoading(true);
        this.setError('');
        this.setSuccess('');
        try {
            await MealPlanRepository.deleteMealPlan(mealPlanId, imageFileName);
            runInAction(() => {
                this.mealPlans = this.mealPlans.filter(plan => plan._id !== mealPlanId);
            });
            this.setSuccess('Meal plan deleted successfully!');
            return true;
        } catch (err) {
            console.error('Error deleting meal plan:', err);
            this.setError('Failed to delete meal plan: ' + err.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    approveOrRejectMealPlan = async (mealPlanId, newStatus, authorId, adminName, adminId, rejectionReason = null) => {
        this.setLoading(true);
        this.setError('');
        this.setSuccess('');
        try {
            const mealPlanToUpdate = this.mealPlans.find(p => p._id === mealPlanId);
            if (!mealPlanToUpdate) {
                throw new Error("Meal plan not found for approval/rejection.");
            }
            await MealPlanRepository.updateMealPlanStatus(mealPlanId, newStatus, rejectionReason);
            let notificationMessage;
            if (newStatus === 'APPROVED') {
                notificationMessage = `Your meal plan "${mealPlanToUpdate.name}" has been APPROVED by ${adminName}.`;
            } else {
                notificationMessage = `Your meal plan "${mealPlanToUpdate.name}" has been REJECTED by ${adminName}. Reason: ${rejectionReason || 'No reason provided.'}`;
            }
            await MealPlanRepository.addNotification(
                authorId,
                'MEAL_PLAN_STATUS_UPDATE',
                notificationMessage,
                mealPlanId,
                rejectionReason
            );
            if (this.currentUserRole === 'admin') {
                await this.fetchAdminMealPlans(this.adminActiveTab);
            } else if (this.currentUserId) {
                await this.fetchNutritionistMealPlans(this.currentUserId);
            }
            this.setSuccess(`Meal plan ${newStatus.toLowerCase()} successfully!`);
            return true;
        } catch (err) {
            console.error(`Error ${newStatus.toLowerCase()}ing meal plan:`, err);
            this.setError(`Failed to ${newStatus.toLowerCase()} meal plan: ` + err.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    createMealPlan = async (mealPlanData, imageFile) => {
        this.setLoading(true);
        this.setError('');
        this.setSuccess('');
        try {
            const currentUser = AuthService.getCurrentUser();
            if (!currentUser) {
                throw new Error("No authenticated user found. Please log in.");
            }
            const authorId = currentUser.uid;
            const authorName = currentUser.name || currentUser.username || "Unknown Author";
            const newMealPlan = {
                ...mealPlanData,
                authorId: authorId,
                author: authorName,
                status: 'PENDING_APPROVAL',
                createdAt: new Date().toISOString(),
            };
            await MealPlanRepository.addMealPlan(newMealPlan, imageFile);
            this.setSuccess('Meal plan created successfully and sent for approval!');
            if (this.currentUserRole === 'admin') {
                await this.fetchAdminMealPlans(this.adminActiveTab);
            } else if (this.currentUserId) {
                await this.fetchNutritionistMealPlans(authorId);
            }
            return true;
        } catch (err) {
            console.error('Error creating meal plan:', err);
            this.setError('Failed to create meal plan: ' + err.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    updateMealPlan = async (updatedMealPlanData) => {
        this.setLoading(true);
        this.setError('');
        this.setSuccess('');
        try {
            const { _id, imageFile, originalImageFileName, ...dataToUpdate } = updatedMealPlanData;
            dataToUpdate.status = 'PENDING_APPROVAL';
            const returnedMealPlan = await MealPlanRepository.updateMealPlan(_id, dataToUpdate, imageFile, originalImageFileName);
            runInAction(() => {
                const index = this.mealPlans.findIndex(plan => plan._id === _id);
                if (index !== -1) {
                    this.mealPlans[index] = { ...this.mealPlans[index], ...returnedMealPlan };
                }
                this.selectedMealPlanForUpdate = null;
            });
            if (this.currentUserId) {
                await this.fetchNutritionistMealPlans(this.currentUserId);
            }
            this.setSuccess('Meal plan updated successfully and sent for re-approval!');
            return true;
        } catch (err) {
            console.error('Error updating meal plan:', err);
            this.setError('Failed to update meal plan: ' + err.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    fetchAdminMealPlans = async (statusFilter) => {
        this.setLoading(true);
        this.setError('');
        try {
            let fetchedPlans = [];
            if (statusFilter === 'PENDING_APPROVAL') {
                fetchedPlans = await MealPlanRepository.getPendingMealPlans();
            } else if (statusFilter === 'APPROVED') {
                fetchedPlans = await MealPlanRepository.getApprovedMealPlans();
            } else if (statusFilter === 'REJECTED') {
                fetchedPlans = await MealPlanRepository.getRejectedMealPlans();
            } else {
                const pending = await MealPlanRepository.getPendingMealPlans();
                const approved = await MealPlanRepository.getApprovedMealPlans();
                const rejected = await MealPlanRepository.getRejectedMealPlans();
                fetchedPlans = [...pending, ...approved, ...rejected];
            }
            runInAction(() => {
                this.mealPlans = Array.isArray(fetchedPlans) ? fetchedPlans : [];
            });
        } catch (err) {
            console.error('Error fetching admin meal plans:', err);
            this.setError('Failed to fetch meal plans for admin.');
            runInAction(() => {
                this.mealPlans = [];
            });
        } finally {
            this.setLoading(false);
        }
    }

    fetchNutritionistMealPlans = async (authorId) => {
        if (!authorId) {
            console.warn("Author ID not available for fetching nutritionist meal plans.");
            return;
        }
        this.setLoading(true);
        this.setError('');
        try {
            const nutritionistPlans = await MealPlanRepository.getMealPlansByAuthor(authorId);
            runInAction(() => {
                this.mealPlans = Array.isArray(nutritionistPlans) ? nutritionistPlans : [];
            });
        } catch (err) {
            console.error('Error fetching nutritionist meal plans:', err);
            this.setError('Failed to fetch nutritionist meal plans.');
            runInAction(() => {
                this.mealPlans = [];
            });
        } finally {
            this.setLoading(false);
        }
    }

    updateAllCategoriesFromMealCategories = () => {
        const categoryNames = this.mealCategories
            .map(category => category.categoryName)
            .filter(name => name)
            .sort();
        runInAction(() => {
            this.allCategories = categoryNames;
        });
    }

    fetchMealCategories = async () => {
        runInAction(() => {
            this.loadingCategories = true;
            this.categoryError = '';
        });
        try {
            const categories = await CategoryRepository.getMealCategories(); // Changed to getMealCategories
            runInAction(() => {
                this.mealCategories = Array.isArray(categories) ? categories : [];
                this.updateAllCategoriesFromMealCategories();
            });
        } catch (error) {
            console.error('Error fetching meal categories:', error);
            runInAction(() => {
                this.categoryError = 'Failed to fetch categories: ' + error.message;
                this.mealCategories = [];
                this.allCategories = [];
            });
        } finally {
            runInAction(() => {
                this.loadingCategories = false;
            });
        }
    };

    createMealCategory = async (categoryData) => {
        runInAction(() => {
            this.loadingCategories = true;
            this.categoryError = '';
        });
        try {
            // ⭐ CRITICAL CHANGE HERE ⭐
            // Create a clean object with only the data you intend to store.
            // Explicitly exclude categoryId if it's undefined or null,
            // as it will be auto-generated by Firestore or set by the service.
            const dataToSave = {
                categoryName: categoryData.categoryName,
                categoryDescription: categoryData.categoryDescription,
            };
            // If categoryId is provided and valid (not null or undefined), include it.
            if (categoryData.categoryId) {
                dataToSave.categoryId = categoryData.categoryId;
            }

            // Call the repository with the *cleaned* dataToSave object
            await CategoryRepository.addMealCategory(dataToSave); // Changed to addMealCategory
            await this.fetchMealCategories();
            this.setSuccess('Category added successfully!');
        } catch (error) {
            console.error('Error creating meal category:', error);
            this.setError('Failed to create category: ' + error.message);
            runInAction(() => this.categoryError = 'Failed to create category: ' + error.message);
            throw error;
        } finally {
            runInAction(() => {
                this.loadingCategories = false;
            });
        }
    };

    updateMealCategory = async (categoryId, updatedData) => {
        runInAction(() => {
            this.loadingCategories = true;
            this.categoryError = '';
        });
        try {
            // ⭐ CRITICAL CHANGE HERE FOR UPDATE ⭐
            // Create a new object for updates to ensure no undefined values are passed.
            const dataToUpdateFiltered = {};
            for (const key in updatedData) {
                // Only include properties that are not undefined
                if (updatedData[key] !== undefined) {
                    dataToUpdateFiltered[key] = updatedData[key];
                }
            }
            // If the UI form includes 'id' or 'categoryId' which should not be updated,
            // explicitly delete them from the filtered object.
            delete dataToUpdateFiltered.id;
            // The categoryId field within the document usually shouldn't be updated manually
            // if it's meant to match the document ID. If it's a separate editable field, keep it.
            // For now, let's assume it should not be updated explicitly if it came from the form.
            delete dataToUpdateFiltered.categoryId;


            await CategoryRepository.updateMealCategory(categoryId, dataToUpdateFiltered); // Changed to updateMealCategory
            await this.fetchMealCategories();
            this.setSuccess('Category updated successfully!');
        } catch (error) {
            console.error('Error updating meal category:', error);
            this.setError('Failed to update category: ' + error.message);
            runInAction(() => this.categoryError = 'Failed to update category: ' + error.message);
            throw error;
        } finally {
            runInAction(() => {
                this.loadingCategories = false;
            });
        }
    };

    deleteMealCategory = async (categoryId) => {
        runInAction(() => {
            this.loadingCategories = true;
            this.categoryError = '';
        });
        try {
            await CategoryRepository.deleteMealCategory(categoryId); // Changed to deleteMealCategory
            await this.fetchMealCategories();
            this.setSuccess('Category deleted successfully!');
        } catch (error) {
            console.error('Error deleting meal category:', error);
            this.setError('Failed to delete category: ' + error.message);
            runInAction(() => this.categoryError = 'Failed to delete category: ' + error.message);
            throw error;
        } finally {
            runInAction(() => {
                this.loadingCategories = false;
            });
        }
    };

    get allCategoriesWithDetails() {
        return Array.isArray(this.mealCategories) ? this.mealCategories : [];
    }

    setLoading = (isLoading) => {
        runInAction(() => {
            this.loading = isLoading;
        });
    }

    setError = (message) => {
        runInAction(() => {
            this.error = message;
            if (message) {
                setTimeout(() => runInAction(() => this.error = ''), 5000);
            }
        });
    }

    setSuccess = (message) => {
        runInAction(() => {
            this.success = message;
            if (message) {
                setTimeout(() => runInAction(() => this.success = ''), 5000);
            }
        });
    }

    setSearchTerm = (term) => {
        runInAction(() => {
            this.searchTerm = term;
        });
    }

    setSelectedCategory = (category) => {
        runInAction(() => {
            this.selectedCategory = category;
        });
    }

    setAllCategories = (categories) => {
        runInAction(() => {
            this.allCategories = categories;
        });
    }

    dispose = () => {
        if (this._notificationsUnsubscribe) {
            this._notificationsUnsubscribe();
            console.log("Unsubscribed from notifications listener.");
        }
    };

    get filteredMealPlans() {
        let plansToFilter = Array.isArray(this.mealPlans) ? this.mealPlans : [];
        if (this.currentUserRole === 'admin') {
            plansToFilter = plansToFilter.filter(plan => plan.status === this.adminActiveTab);
        }
        return plansToFilter.filter(plan => {
            const planName = plan.name || '';
            const planAuthor = plan.author || '';
            const planDescription = plan.description || '';
            const matchesSearchTerm = planName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                planAuthor.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                planDescription.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesCategory = this.selectedCategory === '' ||
                                     (Array.isArray(plan.categories) && plan.categories.includes(this.selectedCategory)) ||
                                     (plan.category && plan.category === this.selectedCategory);
            return matchesSearchTerm && matchesCategory;
        });
    }
}

const mealPlanViewModel = new MealPlanViewModel();
export default mealPlanViewModel;