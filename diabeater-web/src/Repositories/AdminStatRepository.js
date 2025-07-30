import AdminStatService from '../Services/AdminStatService';
import SubscriptionService from '../Services/SubscriptionService';

class AdminStatRepository {
    constructor() {
        this.adminStatService = AdminStatService;
        this.subscriptionService = SubscriptionService;
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

    async getSubscriptionPrice() {
        return this.adminStatService.getSubscriptionPrice();
    }

    async getPremiumFeatures() {
        return this.adminStatService.getPremiumFeatures();
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

    async updateSubscriptionPrice(newPrice) {
        return this.adminStatService.updateSubscriptionPrice(newPrice);
    }

    async updatePremiumFeatures(features) {
        return this.adminStatService.updatePremiumFeatures(features);
    }
}

export default new AdminStatRepository();
