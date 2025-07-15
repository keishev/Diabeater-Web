import { makeAutoObservable, runInAction } from 'mobx';
import AdminStatService from '../Services/AdminStatService'; // Adjust path if needed
import SubscriptionService from '../Services/SubscriptionService'; // Assuming this exists as discussed earlier

class AdminStatViewModel {
    loading = false;
    error = null;
    success = null;

    // Dashboard Stats
    totalUsers = 0;
    totalNutritionists = 0;
    totalApprovedMealPlans = 0;
    // ⭐ ADJUSTED: Change 'PENDING' to 'PENDING_APPROVAL' for consistency with MealPlanService
    totalPendingMealPlans = 0;
    totalSubscriptions = 0;
    dailySignupsData = {};
    weeklyTopMealPlans = [];
    userAccounts = []; // For management table
    allSubscriptions = []; // For subscriptions table
    selectedUserForManagement = null; // For modal

    // Observable for Premium Subscription Price
    premiumSubscriptionPrice = 0; // Initialize with a default value

    constructor() {
        makeAutoObservable(this);
        this.loadDashboardData();
    }

    setLoading(status) {
        runInAction(() => {
            this.loading = status;
        });
    }

    setError(message) {
        runInAction(() => {
            this.error = message;
        });
    }

    setSuccess(message) {
        runInAction(() => {
            this.success = message;
        });
    }

    async loadDashboardData() {
        console.log("[ViewModel] Starting loadDashboardData...");
        this.setLoading(true);
        this.setError(null);
        try {
            const [
                totalUsers,
                totalNutritionists,
                totalApprovedMealPlans,
                totalPendingMealPlans, // This value is now correct
                totalSubscriptions,
                dailySignupsRawData,
                weeklyTopMealPlans,
                allSubscriptions
            ] = await Promise.all([
                AdminStatService.getDocumentCount('user_accounts'),
                AdminStatService.getDocumentCount('user_accounts', 'role', '==', 'nutritionist'),
                AdminStatService.getDocumentCount('meal_plans', 'status', '==', 'APPROVED'),
                // ⭐ ADJUSTED: Align status value with MealPlanService for pending plans
                AdminStatService.getDocumentCount('meal_plans', 'status', '==', 'PENDING_APPROVAL'),
                AdminStatService.getDocumentCount('subscriptions'),
                AdminStatService.getDailySignups(7),
                AdminStatService.getWeeklyTopMealPlans(5),
                AdminStatService.getAllSubscriptions()
            ]);

            // Fetch Premium Subscription Price
            const fetchedPremiumPrice = await SubscriptionService.getSubscriptionPrice('premium');

            // Process dailySignupsRawData into desired format (e.g., date: count)
            const processedDailySignups = dailySignupsRawData.reduce((acc, user) => {
                const createdAtDate = user.createdAt instanceof Date ? user.createdAt : user.createdAt?.toDate ? user.createdAt.toDate() : null;

                if (createdAtDate) {
                    const dateString = createdAtDate.toISOString().split('T')[0]; // YYYY-MM-DD
                    acc[dateString] = (acc[dateString] || 0) + 1;
                }
                return acc;
            }, {});

            runInAction(() => {
                this.totalUsers = totalUsers;
                this.totalNutritionists = totalNutritionists;
                this.totalApprovedMealPlans = totalApprovedMealPlans;
                this.totalPendingMealPlans = totalPendingMealPlans;
                this.totalSubscriptions = totalSubscriptions;
                this.dailySignupsData = processedDailySignups;
                this.weeklyTopMealPlans = weeklyTopMealPlans;
                this.allSubscriptions = allSubscriptions;
                this.premiumSubscriptionPrice = fetchedPremiumPrice !== null ? fetchedPremiumPrice : 0;
            });
            console.log("[ViewModel] Dashboard data loaded successfully.");
            console.log("[ViewModel] Fetched Stats:", {
                totalUsers: this.totalUsers,
                totalNutritionists: this.totalNutritionists,
                totalApprovedMealPlans: this.totalApprovedMealPlans,
                totalPendingMealPlans: this.totalPendingMealPlans,
                totalSubscriptions: this.totalSubscriptions,
            });
            console.log("[ViewModel] Processed Daily Signups:", this.dailySignupsData);
            console.log("[ViewModel] Weekly Top Meal Plans:", this.weeklyTopMealPlans);
            console.log("[ViewModel] All Subscriptions:", this.allSubscriptions);
            console.log("[ViewModel] Premium Subscription Price:", this.premiumSubscriptionPrice);

            this.setSuccess('Dashboard data refreshed.');

        } catch (error) {
            console.error("[ViewModel] Error in loadDashboardData:", error);
            this.setError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async updatePremiumSubscriptionPrice(newPrice) {
        console.log(`[ViewModel] Attempting to update premium subscription price to: ${newPrice}`);
        this.setLoading(true);
        this.setError(null);
        try {
            await SubscriptionService.updateSubscriptionPrice('premium', newPrice);

            runInAction(() => {
                this.premiumSubscriptionPrice = newPrice;
                this.setSuccess(`Premium subscription price updated to $${newPrice.toFixed(2)}.`);
            });
            console.log(`[ViewModel] Premium subscription price successfully updated to: ${newPrice}`);
            return { success: true };
        } catch (error) {
            console.error("[ViewModel] Error updating premium subscription price:", error);
            this.setError(`Failed to update premium subscription price: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }


    async updateUserRole(userId, newRole) {
        this.setLoading(true);
        this.setError(null);
        try {
            await AdminStatService.updateUserRole(userId, newRole);
            this.setSuccess(`User role updated to ${newRole}.`);
            await this.loadDashboardData();
        } catch (error) {
            this.setError(`Failed to update user role: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    async deleteUserAccount(userId) {
        this.setLoading(true);
        this.setError(null);
        try {
            await AdminStatService.deleteUserAccount(userId);
            this.setSuccess('User account deleted.');
            await this.loadDashboardData();
        } catch (error) {
            this.setError(`Failed to delete user account: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    async updateNutritionistStatus(userId, newStatus) {
        this.setLoading(true);
        this.setError(null);
        try {
            await AdminStatService.updateNutritionistStatus(userId, newStatus);
            this.setSuccess(`Nutritionist status updated to ${newStatus}.`);
            await this.loadDashboardData();
        } catch (error) {
            this.setError(`Failed to update nutritionist status: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    setSelectedUserForManagement(user) {
        runInAction(() => {
            this.selectedUserForManagement = user;
        });
    }

    clearSelectedUserForManagement() {
        runInAction(() => {
            this.selectedUserForManagement = null;
        });
    }
}

const adminStatViewModel = new AdminStatViewModel();
export default adminStatViewModel;