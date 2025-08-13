// MealPlanRepository.js
import MealPlanService from '../Services/MealPlanService';

class MealPlanRepository {
    async addMealPlan(mealPlanData, uploadPhoto) {
        return await MealPlanService.createMealPlan(mealPlanData, uploadPhoto);
    }

    async getPendingMealPlans() {
        return await MealPlanService.getPendingMealPlans();
    }

    async getApprovedMealPlans() {
        return await MealPlanService.getApprovedMealPlans();
    }

    async getRejectedMealPlans() {
        return await MealPlanService.getRejectedMealPlans();
    }

    async getMealPlansByAuthor(authorId) {
        return await MealPlanService.getMealPlansByAuthor(authorId);
    }

    async updateMealPlanStatus(mealPlanId, status, rejectionReason = null) {
        return await MealPlanService.updateMealPlanStatus(mealPlanId, status, rejectionReason);
    }

    async getMealPlanDetails(mealPlanId) {
        return await MealPlanService.getMealPlanById(mealPlanId);
    }

    async addNotification(recipientId, type, message, mealPlanId, rejectionReason = null) {
        return await MealPlanService.createNotification(recipientId, type, message, mealPlanId, rejectionReason);
    }

    onNotificationsSnapshot(userId, callback) {
        return MealPlanService.onNotificationsSnapshot(userId, callback);
    }

    async getNotifications(userId) {
        return await MealPlanService.getNotifications(userId);
    }

    async markNotificationAsRead(notificationId) {
        return await MealPlanService.markNotificationAsRead(notificationId);
    }

    async deleteMealPlan(mealPlanId, imageFileName) {
        return await MealPlanService.deleteMealPlan(mealPlanId, imageFileName);
    }

    // ⭐ CRITICAL FIX: This method was missing! ⭐
    async updateMealPlan(mealPlanId, mealPlanData, newImageFile = null, originalImageFileName = null) {
        return await MealPlanService.updateMealPlan(mealPlanId, mealPlanData, newImageFile, originalImageFileName);
    }
    
    async getPopularMealPlans() {
        return await MealPlanService.getPopularMealPlans();
    }
}

export default new MealPlanRepository();