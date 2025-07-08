// src/ViewModels/MealPlanViewModel.js
import { makeAutoObservable, runInAction } from 'mobx'; // Import runInAction
import MealPlanRepository from '../Repositories/MealPlanRepository';
import AuthService from '../Services/AuthService'; // Import AuthService

class MealPlanViewModel {
    mealPlans = [];
    loading = false;
    error = '';
    success = '';
    searchTerm = '';
    selectedCategory = '';
    allCategories = [];

    // ⭐ NEW: Add user-related state and selected meal plan state ⭐
    currentUserId = null;
    currentUserRole = null;
    selectedMealPlanForDetail = null;
    selectedMealPlanForUpdate = null;
    notifications = [];
    unreadNotificationCount = 0;

    constructor() {
        makeAutoObservable(this);
        // ⭐ NEW: Initialize user and load initial data here ⭐
        this.initializeUser();
        // You might want to call loadMealPlans or setup listeners here too
        // For example, based on the user's role, fetch initial meal plans
        // this.loadMealPlans(); // This method will need to be added/adjusted later
        this.setupNotificationListener(); // Setup listener for notifications
    }

    // ⭐ NEW METHOD: initializeUser ⭐
    initializeUser = () => {
        const user = AuthService.getCurrentUser();
        if (user) {
            runInAction(() => {
                this.currentUserId = user.uid;
                this.currentUserRole = user.role;
                // Based on role, you might trigger initial data loads
                if (user.role === 'admin') {
                    this.fetchAdminMealPlans(); // You'll need to implement this
                } else { // Nutritionist
                    this.fetchNutritionistMealPlans(user.uid); // You'll need to implement this
                }
                this.fetchNotifications(user.uid); // Fetch initial notifications
            });
        } else {
            console.warn("No authenticated user found in initializeUser.");
            // Optionally, redirect to login or handle unauthenticated state
        }
    };

    // ⭐ NEW METHOD: setupNotificationListener ⭐
    setupNotificationListener = () => {
        if (!this.currentUserId) {
            // Wait until user is initialized
            // This is a simplified approach; a more robust solution might use reactions or autoruns in MobX
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

    // ⭐ NEW METHOD: fetchNotifications ⭐
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

    // ⭐ NEW METHOD: markNotificationAsRead ⭐
    async markNotificationAsRead(notificationId) {
        this.setLoading(true);
        try {
            await MealPlanRepository.markNotificationAsRead(notificationId);
            runInAction(() => {
                const notification = this.notifications.find(n => n._id === notificationId);
                if (notification) {
                    notification.read = true; // Mark as read in local state for immediate UI update
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

    // ⭐ NEW METHOD: loadMealPlanDetails ⭐
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

    // ⭐ NEW METHOD: selectMealPlanForUpdate ⭐
    selectMealPlanForUpdate(mealPlanId) {
        const mealPlan = this.mealPlans.find(plan => plan._id === mealPlanId);
        runInAction(() => {
            this.selectedMealPlanForUpdate = mealPlan;
        });
    }

    // ⭐ NEW METHOD: clearSelectedMealPlans ⭐
    clearSelectedMealPlans() {
        runInAction(() => {
            this.selectedMealPlanForDetail = null;
            this.selectedMealPlanForUpdate = null;
        });
    }

    // ⭐ NEW METHOD: deleteMealPlan ⭐
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

    // ⭐ NEW METHOD: approveOrRejectMealPlan ⭐
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

            // Refresh meal plans after approval/rejection
            // This might need to be adjusted based on how admin plans are filtered
            // For now, assuming it affects the list displayed
            if (this.currentUserRole === 'admin') {
                await this.fetchAdminMealPlans();
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

    // ⭐ NEW METHODS: Specific fetchers based on role ⭐
    async fetchAdminMealPlans() {
        this.setLoading(true);
        this.setError('');
        try {
            // Admin fetches all PENDING_APPROVAL, APPROVED (which are UPLOADED), and REJECTED plans
            const pending = await MealPlanRepository.getPendingMealPlans();
            const approved = await MealPlanRepository.getUploadedMealPlans(); // Assuming 'UPLOADED' is 'APPROVED' for admin view
            const rejected = await MealPlanRepository.getRejectedMealPlans();

            runInAction(() => {
                // Combine and uniquely identify plans if there's overlap (e.g., if a plan can move between states but stay in view)
                // For simplicity, just combining for now.
                this.mealPlans = [...pending, ...approved, ...rejected];
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

    // Placeholder for dispose, important for MobX cleanup if using reactions/autoruns with listeners
    dispose = () => {
        // Unsubscribe from Firebase listeners here if they were set up using onSnapshot
        // For example: if (this.notificationsUnsubscribe) this.notificationsUnsubscribe();
    };

    get filteredMealPlans() {
        return this.mealPlans.filter(plan => {
            const matchesSearchTerm = plan.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (plan.author && plan.author.toLowerCase().includes(this.searchTerm.toLowerCase()));
            const matchesCategory = this.selectedCategory === '' || (plan.categories && plan.categories.includes(this.selectedCategory));
            return matchesSearchTerm && matchesCategory;
        });
    }
}

export default new MealPlanViewModel();