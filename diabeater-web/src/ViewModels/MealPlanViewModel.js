// src/ViewModels/MealPlanViewModel.js
import { makeAutoObservable, runInAction, computed } from 'mobx'; // Import computed
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
    selectedMealPlanForDetail = null;
    selectedMealPlanForUpdate = null;
    notifications = [];
    unreadNotificationCount = 0;

    adminActiveTab = 'PENDING_APPROVAL'; // Default tab for admin view

    constructor() {
        // Use makeAutoObservable to automatically make all properties observable
        // and all actions methods (functions).
        // Explicitly mark 'filteredMealPlans' as a computed property.
        makeAutoObservable(this, {
            filteredMealPlans: computed,
            // Any other properties or methods that need specific MobX behavior
            // (e.g., 'action.bound' for methods if you weren't using arrow functions for actions)
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
                if (user.role === 'admin') {
                    // Call fetchAdminMealPlans with the default adminActiveTab
                    this.fetchAdminMealPlans(this.adminActiveTab);
                } else { // Nutritionist
                    this.fetchNutritionistMealPlans(user.uid);
                }
                this.fetchNotifications(user.uid);
            });
        } else {
            console.warn("No authenticated user found in initializeUser.");
        }
    };

    // New method to update the active tab for admins
    setAdminActiveTab = async (tab) => {
        if (this.adminActiveTab !== tab) {
            runInAction(() => {
                this.adminActiveTab = tab;
            });
            // Re-fetch meal plans based on the new active tab
            if (this.currentUserRole === 'admin') {
                await this.fetchAdminMealPlans(tab);
            }
        }
    };

    setupNotificationListener = () => {
        if (!this.currentUserId) {
            setTimeout(this.setupNotificationListener, 500);
            return;
        }
        MealPlanRepository.onNotificationsSnapshot(this.currentUserId, (notifications) => {
            runInAction(() => {
                this.notifications = notifications;
                this.unreadNotificationCount = notifications.filter(n => !n.read).length;
            });
        });
    };

    async fetchNotifications(userId) {
        this.setLoading(true);
        try {
            const fetchedNotifications = await MealPlanRepository.getNotifications(userId);
            runInAction(() => {
                this.notifications = fetchedNotifications;
                this.unreadNotificationCount = fetchedNotifications.filter(n => !n.read).length;
            });
        } catch (err) {
            console.error('Error fetching notifications:', err);
            this.setError('Failed to fetch notifications.');
        } finally {
            this.setLoading(false);
        }
    }

    async markNotificationAsRead(notificationId) {
        this.setLoading(true);
        try {
            await MealPlanRepository.markNotificationAsRead(notificationId);
            runInAction(() => {
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

    async loadMealPlanDetails(mealPlanId) {
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

    selectMealPlanForUpdate(mealPlanId) {
        const mealPlan = this.mealPlans.find(plan => plan._id === mealPlanId);
        runInAction(() => {
            this.selectedMealPlanForUpdate = mealPlan;
        });
    }

    clearSelectedMealPlans() {
        runInAction(() => {
            this.selectedMealPlanForDetail = null;
            this.selectedMealPlanForUpdate = null;
        });
    }

    async deleteMealPlan(mealPlanId, imageFileName) {
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

    async approveOrRejectMealPlan(mealPlanId, newStatus, authorId, adminName, adminId, rejectionReason = null) {
        this.setLoading(true);
        this.setError('');
        this.setSuccess('');
        try {
            await MealPlanRepository.updateMealPlanStatus(mealPlanId, newStatus, rejectionReason);

            let notificationMessage;
            if (newStatus === 'APPROVED') {
                notificationMessage = `Your meal plan has been APPROVED by ${adminName}.`;
            } else { // REJECTED
                notificationMessage = `Your meal plan has been REJECTED by ${adminName}. Reason: ${rejectionReason || 'No reason provided.'}`;
            }

            await MealPlanRepository.addNotification(
                authorId,
                newStatus === 'APPROVED' ? 'mealPlanApproval' : 'mealPlanRejection',
                notificationMessage,
                mealPlanId,
                rejectionReason
            );

            if (this.currentUserRole === 'admin') {
                // After approval/rejection, refresh the admin's current active tab
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

    async createMealPlan(mealPlanData, imageFile) {
        this.setLoading(true);
        this.setError('');
        this.setSuccess('');
        try {
            const currentUser = AuthService.getCurrentUser();
            if (!currentUser) {
                throw new Error("No authenticated user found. Please log in.");
            }

            const authorId = currentUser.uid;
            const authorName = currentUser.name || "Unknown Author";

            const newMealPlan = {
                ...mealPlanData,
                authorId: authorId,
                author: authorName,
                status: 'PENDING_APPROVAL', // Set initial status
                createdAt: new Date().toISOString(),
            };

            const result = await MealPlanRepository.addMealPlan(newMealPlan, imageFile); // Corrected method name
            runInAction(() => {
                // If a nutritionist creates a plan, and they are viewing their own plans, add it to the list
                if (this.currentUserRole === 'nutritionist' && this.currentUserId === authorId) {
                    this.mealPlans.push(result);
                }
            });
            this.setSuccess('Meal plan created successfully and sent for approval!');
            return true;
        } catch (err) {
            console.error('Error creating meal plan:', err);
            this.setError('Failed to create meal plan: ' + err.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }


    setLoading(isLoading) {
        this.loading = isLoading;
    }

    setError(errorMessage) {
        this.error = errorMessage;
    }

    setSuccess(successMessage) {
        this.success = successMessage;
    }

    setSearchTerm(term) {
        this.searchTerm = term;
    }

    setSelectedCategory(category) {
        this.selectedCategory = category;
    }

    setAllCategories(categories) {
        this.allCategories = categories;
    }

    /**
     * Fetches meal plans for an admin based on a status filter.
     * @param {string} statusFilter - 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', or 'ALL'.
     */
    async fetchAdminMealPlans(statusFilter) {
        this.setLoading(true);
        this.setError('');
        try {
            let fetchedPlans = [];
            if (statusFilter === 'PENDING_APPROVAL') {
                fetchedPlans = await MealPlanRepository.getPendingMealPlans();
            } else if (statusFilter === 'APPROVED') {
                // Fetch approved plans. Ensure MealPlanRepository has getApprovedMealPlans
                fetchedPlans = await MealPlanRepository.getApprovedMealPlans();
            } else if (statusFilter === 'REJECTED') {
                fetchedPlans = await MealPlanRepository.getRejectedMealPlans();
            } else { // Handle 'ALL' or other cases by fetching all
                const pending = await MealPlanRepository.getPendingMealPlans();
                const approved = await MealPlanRepository.getApprovedMealPlans(); // Use getApprovedMealPlans
                const rejected = await MealPlanRepository.getRejectedMealPlans();
                fetchedPlans = [...pending, ...approved, ...rejected];
            }

            runInAction(() => {
                this.mealPlans = fetchedPlans;
                const categories = [...new Set(this.mealPlans.flatMap(plan => plan.categories || []))];
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

    async fetchNutritionistMealPlans(authorId) {
        this.setLoading(true);
        this.setError('');
        try {
            const nutritionistPlans = await MealPlanRepository.getMealPlansByAuthor(authorId);
            runInAction(() => {
                this.mealPlans = nutritionistPlans;
                const categories = [...new Set(nutritionistPlans.flatMap(plan => plan.categories || []))];
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

    dispose = () => {
        // Unsubscribe from Firebase listeners here if they were set up using onSnapshot
        // For example: if (this.notificationsUnsubscribe) this.notificationsUnsubscribe();
    };

    // This is a computed property, automatically derived from other observables
    get filteredMealPlans() {
        let plansToFilter = this.mealPlans;

        // Apply admin tab filter if current user is an admin
        if (this.currentUserRole === 'admin') {
            plansToFilter = plansToFilter.filter(plan => plan.status === this.adminActiveTab);
        }

        // Apply search term and category filters
        return plansToFilter.filter(plan => {
            const matchesSearchTerm = plan.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (plan.author && plan.author.toLowerCase().includes(this.searchTerm.toLowerCase())); // Ensure 'author' property exists
            const matchesCategory = this.selectedCategory === '' || (plan.categories && plan.categories.includes(this.selectedCategory));
            return matchesSearchTerm && matchesCategory;
        });
    }
}

export default new MealPlanViewModel();