import { makeAutoObservable, runInAction, computed } from 'mobx';
import MealPlanRepository from '../Repositories/MealPlanRepository';
import AuthService from '../Services/AuthService';

class MealPlanViewModel {
    mealPlans = [];
    loading = false;
    error = '';
    success = '';
    searchTerm = '';
    selectedCategory = '';
    allCategories = [];

    currentUserId = null;
    currentUserRole = null;
    currentUserName = null;
    selectedMealPlanForDetail = null;
    selectedMealPlanForUpdate = null; // This state must hold the full meal plan object for the UpdateMealPlan component
    notifications = [];
    unreadNotificationCount = 0;

    adminActiveTab = 'PENDING_APPROVAL';
    _notificationsUnsubscribe = null;

    constructor() {
        makeAutoObservable(this, {
            filteredMealPlans: computed,
        });

        this.initializeUser();
        this.setupNotificationListener();
    }

    initializeUser = () => {
        const user = AuthService.getCurrentUser();
        if (user) {
            runInAction(() => {
                this.currentUserId = user.uid;
                this.currentUserRole = user.role;
                this.currentUserName = user.name || user.username || user.email;
            });
            // Ensure meal plans are fetched here based on role
            if (user.role === 'admin') {
                this.fetchAdminMealPlans(this.adminActiveTab);
            } else { // Nutritionist
                this.fetchNutritionistMealPlans(user.uid);
            }
            this.fetchNotifications(user.uid);
        } else {
            console.warn("No authenticated user found in initializeUser.");
            // If no user, ensure lists are cleared
            runInAction(() => {
                this.mealPlans = [];
                this.allCategories = [];
            });
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
            if (!this.currentUserId) {
                // Re-attempt after a short delay if user ID is not yet available
                setTimeout(this.setupNotificationListener, 500);
            }
            return;
        }

        if (this._notificationsUnsubscribe) {
            this._notificationsUnsubscribe();
            this._notificationsUnsubscribe = null;
        }

        this._notificationsUnsubscribe = MealPlanRepository.onNotificationsSnapshot(this.currentUserId, (notifications) => {
            runInAction(() => {
                this.notifications = notifications;
                this.unreadNotificationCount = notifications.filter(n => !n.isRead).length;
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
                this.notifications = fetchedNotifications;
                this.unreadNotificationCount = fetchedNotifications.filter(n => !n.isRead).length;
            });
        } catch (err) {
            console.error('Error fetching notifications:', err);
            this.setError('Failed to fetch notifications.');
        } finally {
            this.setLoading(false);
        }
    }

    markNotificationAsRead = async (notificationId) => {
        this.setLoading(true);
        try {
            await MealPlanRepository.markNotificationAsRead(notificationId);
            runInAction(() => {
                const notification = this.notifications.find(n => n.id === notificationId);
                if (notification) {
                    notification.isRead = true;
                    this.unreadNotificationCount = this.notifications.filter(n => !n.isRead).length;
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

    /**
     * ⭐ CRITICAL FUNCTION: Sets the meal plan object to be used for the update form.
     * This relies on `this.mealPlans` being correctly populated.
     */
    selectMealPlanForUpdate = (mealPlanId) => {
        // Log to see what mealPlans contains
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
                this.selectedMealPlanForUpdate = null; // Explicitly set to null if not found
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
                newStatus,
                adminId,
                adminName
            );

            // Re-fetch meal plans to reflect status change immediately
            if (this.currentUserRole === 'admin') {
                await this.fetchAdminMealPlans(this.adminActiveTab);
            } else if (this.currentUserId === authorId) {
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
            // After creation, trigger a refresh of the appropriate meal plan list
            if (this.currentUserRole === 'admin') {
                await this.fetchAdminMealPlans(this.adminActiveTab);
            } else {
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

            // The repository should return the updated meal plan object, especially if image URL changes
            const returnedMealPlan = await MealPlanRepository.updateMealPlan(_id, dataToUpdate, imageFile, originalImageFileName);

            runInAction(() => {
                // Find and update the meal plan in the local array
                const index = this.mealPlans.findIndex(plan => plan._id === _id);
                if (index !== -1) {
                    // Update the local meal plan with the data returned from the repository
                    this.mealPlans[index] = { ...this.mealPlans[index], ...returnedMealPlan };
                }
                // Clear the selected meal plan for update after a successful update
                this.selectedMealPlanForUpdate = null;
            });

            // Re-fetch the relevant list to ensure consistency, especially if status changed or image URL
            if (this.currentUserRole === 'admin') {
                await this.fetchAdminMealPlans(this.adminActiveTab);
            } else if (this.currentUserId) {
                await this.fetchNutritionistMealPlans(this.currentUserId);
            }

            this.setSuccess('Meal plan updated successfully!');
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
            // If `MealPlanRepository.getAllMealPlansByStatus` exists and handles all, use it.
            // Otherwise, combine results from specific status fetches.
            if (MealPlanRepository.getAllMealPlansByStatus) {
                fetchedPlans = await MealPlanRepository.getAllMealPlansByStatus(statusFilter);
            } else {
                // Fallback if specific methods are needed and getAllMealPlansByStatus is not implemented
                if (statusFilter === 'PENDING_APPROVAL') {
                    fetchedPlans = await MealPlanRepository.getPendingMealPlans();
                } else if (statusFilter === 'APPROVED') {
                    fetchedPlans = await MealPlanRepository.getApprovedMealPlans();
                } else if (statusFilter === 'REJECTED') {
                    fetchedPlans = await MealPlanRepository.getRejectedMealPlans();
                } else { // Default or 'ALL' case
                    const pending = await MealPlanRepository.getPendingMealPlans();
                    const approved = await MealPlanRepository.getApprovedMealPlans();
                    const rejected = await MealPlanRepository.getRejectedMealPlans();
                    fetchedPlans = [...pending, ...approved, ...rejected];
                }
            }


            runInAction(() => {
                this.mealPlans = fetchedPlans;
                // Ensure `plan.categories` is an array for flatMap to work, or use `plan.category` if it's a single string
                const categories = [...new Set(this.mealPlans.flatMap(plan => plan.categories || (plan.category ? [plan.category] : [])))];
                this.setAllCategories(categories.sort());
            });
        } catch (err) {
            console.error('Error fetching admin meal plans:', err);
            this.setError('Failed to fetch meal plans for admin.');
            runInAction(() => {
                this.mealPlans = [];
                this.setAllCategories([]);
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
                this.mealPlans = nutritionistPlans;
                // Ensure `plan.categories` is an array for flatMap to work, or use `plan.category` if it's a single string
                const categories = [...new Set(nutritionistPlans.flatMap(plan => plan.categories || (plan.category ? [plan.category] : [])))];
                this.setAllCategories(categories.sort());
            });
        } catch (err) {
            console.error('Error fetching nutritionist meal plans:', err);
            this.setError('Failed to fetch nutritionist meal plans.');
            runInAction(() => {
                this.mealPlans = [];
                this.setAllCategories([]);
            });
        } finally {
            this.setLoading(false);
        }
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
        let plansToFilter = this.mealPlans;

        if (this.currentUserRole === 'admin') {
            // Admin filters by `adminActiveTab` which is a status
            plansToFilter = plansToFilter.filter(plan => plan.status === this.adminActiveTab);
        }

        return plansToFilter.filter(plan => {
            const matchesSearchTerm = plan.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (plan.author && plan.author.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
                (plan.description && plan.description.toLowerCase().includes(this.searchTerm.toLowerCase())); // Also search description

            // Check if plan.categories is an array, or if plan.category exists
            const matchesCategory = this.selectedCategory === '' ||
                                    (Array.isArray(plan.categories) && plan.categories.includes(this.selectedCategory)) ||
                                    (plan.category && plan.category === this.selectedCategory);

            return matchesSearchTerm && matchesCategory;
        });
    }
}

const mealPlanViewModel = new MealPlanViewModel();
export default mealPlanViewModel;