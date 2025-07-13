// src/models/ReportModel.js

class ReportModel {
    constructor({
        totalUsers = 0,
        totalNutritionists = 0,
        totalMealPlansCreated = 0,
        averageDailyLogins = 0,
        reportsGeneratedLastMonth = 0,
        activeSubscriptions = 0,
        mealsAddedToday = 0
    }) {
        this.totalUsers = totalUsers;
        this.totalNutritionists = totalNutritionists;
        this.totalMealPlansCreated = totalMealPlansCreated;
        this.averageDailyLogins = averageDailyLogins;
        this.reportsGeneratedLastMonth = reportsGeneratedLastMonth;
        this.activeSubscriptions = activeSubscriptions;
        this.mealsAddedToday = mealsAddedToday;
    }
}

export default ReportModel;