import AdminStatService from '../Services/AdminStatService';
import SubscriptionService from '../Services/SubscriptionService'; // Still needed if AdminStatService doesn't completely replace its functions

class AdminStatRepository {
    constructor() {
        this.adminStatService = AdminStatService;
        this.subscriptionService = SubscriptionService; // Keep if other parts use it
    }

    async getAllUserAccounts() {
        return this.adminStatService.getAllUserAccounts();
    }

    async getUserAccountById(userId) {
        return this.adminStatService.getUserAccountById(userId);
    }

    async getAllSubscriptions() {
        // This is the method that provides the raw data for monthlyRevenue and cancelledSubscriptionsCount
        return this.adminStatService.getAllSubscriptions();
    }

    async getUserSubscriptions(userId) {
        return this.adminStatService.getUserSubscriptions(userId);
    }

    async getDocumentCount(...args) {
        return this.adminStatService.getDocumentCount(...args);
    }

    async getMealPlans() {
        return this.adminStatService.getMealPlans();
    }

    async getDailySignups() {
        return this.adminStatService.getDailySignups();
    }

    async getWeeklyTopMealPlans() {
        return this.adminStatService.getWeeklyTopMealPlans();
    }

    // This method is for specific monthly breakdowns, not currently used by the
    // main dashboard's monthlyRevenue/cancelledSubscriptionsCount directly,
    // as those are aggregated from getAllSubscriptions in the ViewModel.
    async getMonthlySubscriptionStats(year, month) {
        try {
            const result = await this.adminStatService.getSubscriptionsByMonth(year, month);
            if (result.success) {
                // Calculate total new subscriptions and revenue
                const newSubscriptionsCount = result.subscriptions.length;
                // Ensure 'price' field exists and is a number, default to 0 if not
                const totalRevenue = result.subscriptions.reduce((sum, sub) => sum + (typeof sub.price === 'number' ? sub.price : 0), 0);

                return {
                    success: true,
                    month: month,
                    year: year,
                    newSubscriptionsCount: newSubscriptionsCount,
                    totalRevenue: totalRevenue,
                    subscriptions: result.subscriptions // Optionally return subs for more detailed view later
                };
            } else {
                // Propagate error from service
                throw new Error(result.error || 'Failed to fetch monthly subscriptions.');
            }
        } catch (error) {
            console.error("[AdminStatRepository] Error getting monthly subscription stats:", error);
            // Return a consistent error structure
            return { success: false, error: error.message, newSubscriptionsCount: 0, totalRevenue: 0 };
        }
    }

    async updateUserRole(userId, role) {
        return this.adminStatService.updateUserRole(userId, role);
    }

    async updateNutritionistStatus(userId, status) {
        return this.adminStatService.updateNutritionistStatus(userId, status);
    }

    async deleteUserAccount(userId) {
        return this.adminStatService.deleteUserAccount(userId);
    }

    async suspendUserAccount(userId, suspend) {
        return this.adminStatService.updateUserStatus(userId, suspend ? 'suspended' : 'active');
    }
}

export default new AdminStatRepository();