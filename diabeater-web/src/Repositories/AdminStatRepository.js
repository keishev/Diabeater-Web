// src/Repositories/AdminStatRepository.js
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

    // Removed getSubscriptionPrice from here as it's now in PremiumRepository
    // Removed getPremiumFeatures from here as it's now in PremiumRepository

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

    // Removed updateSubscriptionPrice from here as it's now in PremiumRepository
    // Removed updatePremiumFeatures from here as it's now in PremiumRepository
}

export default new AdminStatRepository();