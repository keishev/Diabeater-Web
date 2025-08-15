
import { makeAutoObservable, runInAction, computed } from 'mobx';


let MealPlanRepository = null;
let AuthService = null;
let CategoryRepository = null;


const loadDependencies = async () => {
    if (!MealPlanRepository) {
        MealPlanRepository = (await import('../Repositories/MealPlanRepository')).default;
    }
    if (!AuthService) {
        AuthService = (await import('../Services/AuthService')).default;
    }
    if (!CategoryRepository) {
        CategoryRepository = (await import('../Repositories/MealCategoryRepository')).default;
    }
};

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
    adminActiveTab = 'PENDING_APPROVAL';
    _notificationsUnsubscribe = null;
    _dependenciesLoaded = false;

    constructor() {
        makeAutoObservable(this, {
            filteredMealPlans: computed,
            allCategoriesWithDetails: computed,
            pendingCount: computed,
            approvedCount: computed,
            rejectedCount: computed,
            filteredNotifications: computed,
            unreadNotificationCount: computed
        });
        
        
        this.initializeAsync();
    }

    initializeAsync = async () => {
        try {
            await loadDependencies();
            this._dependenciesLoaded = true;
            this.initializeUser();
        } catch (error) {
            console.error('Error loading dependencies:', error);
            this.setError('Failed to initialize application dependencies');
        }
    };

    get filteredNotifications() {
        if (!Array.isArray(this.notifications)) {
            return [];
        }
        
        return this.notifications.filter(notification => {
            return notification.type === 'MEAL_PLAN_STATUS_UPDATE' || 
                   notification.type === 'mealPlanApproval' || 
                   notification.type === 'mealPlanRejection';
        });
    }

    get unreadNotificationCount() {
        return this.filteredNotifications.filter(n => !n.read && !n.isRead).length;
    }

    initializeUser = () => {
        if (!this._dependenciesLoaded || !AuthService) {
            console.warn("Dependencies not loaded yet, deferring user initialization");
            return;
        }

        const user = AuthService.getCurrentUser();
        if (user) {
            runInAction(() => {
                this.currentUserId = user.uid;
                this.currentUserRole = user.role;
                this.currentUserName = user.name || user.username || user.email;
            });
            if (user.role === 'admin') {
                this.fetchAdminMealPlans();
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
            });
            this.dispose();
        }
    };

    setAdminActiveTab = async (tab) => {
        if (this.adminActiveTab !== tab) {
            runInAction(() => {
                this.adminActiveTab = tab;
            });
        }
    };

    setupNotificationListener = () => {
        if (!this.currentUserId || this.currentUserRole !== 'nutritionist' || !MealPlanRepository) {
            console.warn("Cannot setup notification listener: Dependencies not ready");
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
            });
        });
    };

    fetchNotifications = async (userId) => {
        if (!userId || !MealPlanRepository) {
            console.warn("Cannot fetch notifications: Dependencies not ready");
            return;
        }
        
        this.setLoading(true);
        try {
            const fetchedNotifications = await MealPlanRepository.getNotifications(userId);
            runInAction(() => {
                this.notifications = Array.isArray(fetchedNotifications) ? fetchedNotifications : [];
            });
        } catch (err) {
            console.error('Error fetching notifications:', err);
            this.setError('Failed to fetch notifications.');
            runInAction(() => {
                this.notifications = [];
            });
        } finally {
            this.setLoading(false);
        }
    }

    markNotificationAsRead = async (notificationId) => {
        if (!MealPlanRepository) {
            console.warn("Cannot mark notification as read: Repository not loaded");
            return;
        }
        
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
        if (!MealPlanRepository) {
            console.warn("Cannot load meal plan details: Repository not loaded");
            return;
        }
        
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
        if (!MealPlanRepository) {
            console.warn("Cannot delete meal plan: Repository not loaded");
            return false;
        }
        
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
        if (!MealPlanRepository) {
            console.warn("Cannot approve/reject meal plan: Repository not loaded");
            return false;
        }
        
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
                await this.fetchAdminMealPlans();
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
        if (!MealPlanRepository || !AuthService) {
            console.warn("Cannot create meal plan: Dependencies not loaded");
            return false;
        }
        
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
                await this.fetchAdminMealPlans();
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
        if (!MealPlanRepository) {
            console.warn("Cannot update meal plan: Repository not loaded");
            return false;
        }
        
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

    fetchAdminMealPlans = async (statusFilter = null) => {
        if (!MealPlanRepository) {
            console.warn("Cannot fetch admin meal plans: Repository not loaded");
            return;
        }
        
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
            } else if (statusFilter === 'POPULAR') {
                fetchedPlans = await MealPlanRepository.getPopularMealPlans();
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
        if (!authorId || !MealPlanRepository) {
            console.warn("Cannot fetch nutritionist meal plans: Dependencies not ready");
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
        if (!CategoryRepository) {
            console.warn("Cannot fetch meal categories: Repository not loaded");
            return;
        }
        
        runInAction(() => {
            this.loadingCategories = true;
            this.categoryError = '';
        });
        try {
            const categories = await CategoryRepository.getMealCategories();
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
        if (!CategoryRepository) {
            console.warn("Cannot create meal category: Repository not loaded");
            return;
        }
        
        runInAction(() => {
            this.loadingCategories = true;
            this.categoryError = '';
        });
        try {
            const dataToSave = {
                categoryName: categoryData.categoryName,
                categoryDescription: categoryData.categoryDescription,
            };
            if (categoryData.categoryId) {
                dataToSave.categoryId = categoryData.categoryId;
            }

            await CategoryRepository.addMealCategory(dataToSave);
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
        if (!CategoryRepository) {
            console.warn("Cannot update meal category: Repository not loaded");
            return;
        }
        
        runInAction(() => {
            this.loadingCategories = true;
            this.categoryError = '';
        });
        try {
            const dataToUpdateFiltered = {};
            for (const key in updatedData) {
                if (updatedData[key] !== undefined) {
                    dataToUpdateFiltered[key] = updatedData[key];
                }
            }
            delete dataToUpdateFiltered.id;
            delete dataToUpdateFiltered.categoryId;

            await CategoryRepository.updateMealCategory(categoryId, dataToUpdateFiltered);
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
        if (!CategoryRepository) {
            console.warn("Cannot delete meal category: Repository not loaded");
            return;
        }
        
        runInAction(() => {
            this.loadingCategories = true;
            this.categoryError = '';
        });
        try {
            await CategoryRepository.deleteMealCategory(categoryId);
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

    get pendingCount() {
        return this.mealPlans.filter(p => p.status === 'PENDING_APPROVAL').length;
    }

    get approvedCount() {
        return this.mealPlans.filter(p => p.status === 'APPROVED').length;
    }

    get rejectedCount() {
        return this.mealPlans.filter(p => p.status === 'REJECTED').length;
    }

    get filteredMealPlans() {
        let plansToFilter = Array.isArray(this.mealPlans) ? this.mealPlans : [];
        if (this.currentUserRole === 'admin' && this.adminActiveTab !== 'POPULAR') {
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