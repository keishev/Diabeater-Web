// src/Repositories/MealPlanRepository.js
import MealPlanService from '../Services/MealPlanService';

class MealPlanRepository {
    async addMealPlan(mealPlanData, uploadPhoto) {
        return await MealPlanService.createMealPlan(mealPlanData, uploadPhoto);
    }

    async getPendingMealPlans() {
        return await MealPlanService.getPendingMealPlans();
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

    // ⭐ NEW METHOD: Passthrough for real-time notifications ⭐
    onNotificationsSnapshot(userId, callback) {
        // Delegates to the service layer for the real-time listener
        return MealPlanService.onNotificationsSnapshot(userId, callback);
    }

    // ⭐ NEW METHOD: Passthrough for one-time notification fetch ⭐
    async getNotifications(userId) {
        return await MealPlanService.getNotifications(userId);
    }

    // ⭐ NEW METHOD: Passthrough for marking notification as read ⭐
    async markNotificationAsRead(notificationId) {
        return await MealPlanService.markNotificationAsRead(notificationId);
    }

    // ⭐ You will also need to add these methods as they were called in the ViewModel ⭐
    async getUploadedMealPlans() {
        return await MealPlanService.getUploadedMealPlans();
    }

    async getRejectedMealPlans() {
        return await MealPlanService.getRejectedMealPlans();
    }

    async getMealPlansByAuthor(authorId) {
        return await MealPlanService.getMealPlansByAuthor(authorId);
    }

    async deleteMealPlan(mealPlanId, imageFileName) {
        return await MealPlanService.deleteMealPlan(mealPlanId, imageFileName);
    }
}

export default new MealPlanRepository();