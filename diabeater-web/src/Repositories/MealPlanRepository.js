// src/Repository/MealPlanRepository.js
// This layer primarily serves as an abstraction over the data source.
// In this case, since MealPlanService directly uses Firebase SDK,
// the Repository might seem thin. However, it's good practice for
// separation of concerns, allowing for easier switching of data sources
// (e.g., from Firebase to a custom backend API) in the future without
// affecting the Service layer.

import MealPlanService from '../Services/MealPlanService'; // Renamed to MealPlanService to avoid confusion

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
}

export default new MealPlanRepository();