// src/Models/ReportModel.js
export default class ReportModel {
    constructor({
        // User Metrics
        totalUsers = 0,
        totalNutritionists = 0,
        newUsersThisMonth = 0,
        newUsersLastMonth = 0,
        userGrowthRate = 0,
        
        // Subscription & Revenue Metrics
        totalSubscriptions = 0,
        activeSubscriptions = 0,
        cancelledSubscriptions = 0,
        cancelledThisMonth = 0,
        cancelledLastMonth = 0,
        currentMonthRevenue = 0,
        lastMonthRevenue = 0,
        revenueGrowthRate = 0,
        averageRevenuePerUser = 0,
        churnRate = 0,
        
        // Content Metrics
        totalMealPlansCreated = 0,
        approvedMealPlans = 0,
        pendingMealPlans = 0,
        mealPlansCreatedThisMonth = 0,
        mealPlansCreatedLastMonth = 0,
        totalMealPlanSaves = 0,
        mealPlanEngagementRate = 0,
        
        // Business Performance
        conversionRate = 0,
        averageSubscriptionValue = 0,
        lifetimeValue = 0,
        
        // Time-based data
        reportGeneratedAt = new Date(),
        reportPeriod = 'Monthly'
    } = {}) {
        // User Metrics
        this.totalUsers = totalUsers;
        this.totalNutritionists = totalNutritionists;
        this.newUsersThisMonth = newUsersThisMonth;
        this.newUsersLastMonth = newUsersLastMonth;
        this.userGrowthRate = userGrowthRate;
        
        // Subscription & Revenue Metrics
        this.totalSubscriptions = totalSubscriptions;
        this.activeSubscriptions = activeSubscriptions;
        this.cancelledSubscriptions = cancelledSubscriptions;
        this.cancelledThisMonth = cancelledThisMonth;
        this.cancelledLastMonth = cancelledLastMonth;
        this.currentMonthRevenue = currentMonthRevenue;
        this.lastMonthRevenue = lastMonthRevenue;
        this.revenueGrowthRate = revenueGrowthRate;
        this.averageRevenuePerUser = averageRevenuePerUser;
        this.churnRate = churnRate;
        
        // Content Metrics
        this.totalMealPlansCreated = totalMealPlansCreated;
        this.approvedMealPlans = approvedMealPlans;
        this.pendingMealPlans = pendingMealPlans;
        this.mealPlansCreatedThisMonth = mealPlansCreatedThisMonth;
        this.mealPlansCreatedLastMonth = mealPlansCreatedLastMonth;
        this.totalMealPlanSaves = totalMealPlanSaves;
        this.mealPlanEngagementRate = mealPlanEngagementRate;
        
        // Business Performance
        this.conversionRate = conversionRate;
        this.averageSubscriptionValue = averageSubscriptionValue;
        this.lifetimeValue = lifetimeValue;
        
        // Meta data
        this.reportGeneratedAt = reportGeneratedAt;
        this.reportPeriod = reportPeriod;
    }

    // Helper methods for formatting
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    }

    formatPercentage(value) {
        return `${(value || 0).toFixed(1)}%`;
    }

    formatNumber(value) {
        return new Intl.NumberFormat('en-US').format(value || 0);
    }
}