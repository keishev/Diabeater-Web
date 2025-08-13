// src/viewmodels/AdminReportViewModel.js
import { makeAutoObservable, runInAction } from 'mobx';
import AdminReportService from '../Services/AdminReportService';
import ReportModel from '../Models/ReportModel';

class AdminReportViewModel {
    overallStats = new ReportModel({});
    loading = false;
    error = '';
    success = '';

    constructor() {
        makeAutoObservable(this);
        this.loadOverallStats();
    }

    setLoading = (isLoading) => {
        runInAction(() => {
            this.loading = isLoading;
        });
    };

    setError = (message) => {
        runInAction(() => {
            this.error = message;
            if (message) {
                setTimeout(() => runInAction(() => this.error = ''), 5000);
            }
        });
    };

    setSuccess = (message) => {
        runInAction(() => {
            this.success = message;
            if (message) {
                setTimeout(() => runInAction(() => this.success = ''), 5000);
            }
        });
    };

    /**
     * Loads comprehensive business statistics
     */
    loadOverallStats = async () => {
        this.setLoading(true);
        this.setError('');
        try {
            console.log('[AdminReportViewModel] Loading comprehensive business analytics...');
            const stats = await AdminReportService.getOverallStatReport();
            runInAction(() => {
                this.overallStats = stats;
            });
            this.setSuccess('Business analytics loaded successfully.');
            console.log('[AdminReportViewModel] Analytics loaded:', stats);
        } catch (err) {
            console.error('[AdminReportViewModel] Error loading analytics:', err);
            this.setError('Failed to load business analytics: ' + err.message);
        } finally {
            this.setLoading(false);
        }
    };

    /**
     * Exports comprehensive business report as CSV
     */
    exportOverallReport = async () => {
        this.setLoading(true);
        this.setError('');
        this.setSuccess('');
        try {
            console.log('[AdminReportViewModel] Generating comprehensive CSV report...');
            
            // Ensure fresh data
            await this.loadOverallStats();
            const stats = this.overallStats;

            // Create comprehensive CSV content
            const csvContent = "data:text/csv;charset=utf-8,"
                + "DiaBeater Business Analytics Report\n"
                + `Generated on: ${new Date().toLocaleString()}\n`
                + "===========================================\n\n"
                
                // Executive Summary
                + "EXECUTIVE SUMMARY\n"
                + "Metric,Value\n"
                + `Monthly Revenue,${this.formatCurrency(stats.currentMonthRevenue)}\n`
                + `Total Users,${stats.totalUsers}\n`
                + `Active Subscriptions,${stats.activeSubscriptions}\n`
                + `Conversion Rate,${stats.conversionRate.toFixed(2)}%\n\n`
                
                // Revenue & Financial Performance
                + "REVENUE & FINANCIAL PERFORMANCE\n"
                + "Metric,Value,Growth/Change\n"
                + `Current Month Revenue,${this.formatCurrency(stats.currentMonthRevenue)},${stats.revenueGrowthRate.toFixed(2)}%\n`
                + `Last Month Revenue,${this.formatCurrency(stats.lastMonthRevenue)},-\n`
                + `Revenue Growth Rate,${stats.revenueGrowthRate.toFixed(2)}%,-\n`
                + `Average Revenue Per User (ARPU),${this.formatCurrency(stats.averageRevenuePerUser)},-\n`
                + `Average Subscription Value,${this.formatCurrency(stats.averageSubscriptionValue)},-\n`
                + `Estimated Customer Lifetime Value,${this.formatCurrency(stats.lifetimeValue)},-\n\n`
                
                // User Growth & Acquisition
                + "USER GROWTH & ACQUISITION\n"
                + "Metric,Value,Growth/Change\n"
                + `Total Users,${stats.totalUsers.toLocaleString()},-\n`
                + `New Users This Month,${stats.newUsersThisMonth.toLocaleString()},${stats.userGrowthRate.toFixed(2)}%\n`
                + `New Users Last Month,${stats.newUsersLastMonth.toLocaleString()},-\n`
                + `User Growth Rate,${stats.userGrowthRate.toFixed(2)}%,-\n`
                + `Total Nutritionists,${stats.totalNutritionists.toLocaleString()},-\n`
                + `Conversion Rate (Users to Subscribers),${stats.conversionRate.toFixed(2)}%,-\n\n`
                
                // Subscription & Retention Analytics
                + "SUBSCRIPTION & RETENTION ANALYTICS\n"
                + "Metric,Value,Performance Indicator\n"
                + `Total Subscriptions,${stats.totalSubscriptions.toLocaleString()},-\n`
                + `Active Subscriptions,${stats.activeSubscriptions.toLocaleString()},-\n`
                + `Cancelled This Month,${stats.cancelledThisMonth.toLocaleString()},-\n`
                + `Cancelled Last Month,${stats.cancelledLastMonth.toLocaleString()},-\n`
                + `Total Cancelled,${stats.cancelledSubscriptions.toLocaleString()},-\n`
                + `Churn Rate,${stats.churnRate.toFixed(2)}%,${stats.churnRate > 5 ? 'High' : 'Normal'}\n\n`
                
                // Content & User Engagement
                + "CONTENT & USER ENGAGEMENT\n"
                + "Metric,Value,Performance\n"
                + `Total Meal Plans Created,${stats.totalMealPlansCreated.toLocaleString()},-\n`
                + `Approved Meal Plans,${stats.approvedMealPlans.toLocaleString()},-\n`
                + `Pending Approval,${stats.pendingMealPlans.toLocaleString()},-\n`
                + `Meal Plans Created This Month,${stats.mealPlansCreatedThisMonth.toLocaleString()},-\n`
                + `Meal Plans Created Last Month,${stats.mealPlansCreatedLastMonth.toLocaleString()},-\n`
                + `Total Meal Plan Saves,${stats.totalMealPlanSaves.toLocaleString()},-\n`
                + `Engagement Rate (Saves/Plans),${stats.mealPlanEngagementRate.toFixed(2)}%,-\n\n`
                
                // Key Performance Indicators (KPIs)
                + "KEY PERFORMANCE INDICATORS (KPIs)\n"
                + "KPI,Current Value,Target/Benchmark,Status\n"
                + `Monthly Recurring Revenue (MRR),${this.formatCurrency(stats.currentMonthRevenue)},Growing,${stats.revenueGrowthRate > 0 ? 'On Track' : 'Needs Attention'}\n`
                + `Customer Acquisition Cost (CAC),Calculated based on marketing spend,-,Data needed\n`
                + `Churn Rate,${stats.churnRate.toFixed(2)}%,<5%,${stats.churnRate < 5 ? 'Good' : 'High'}\n`
                + `User Engagement,${stats.mealPlanEngagementRate.toFixed(2)}%,>20%,${stats.mealPlanEngagementRate > 20 ? 'Good' : 'Needs Improvement'}\n`
                + `Conversion Rate,${stats.conversionRate.toFixed(2)}%,>2%,${stats.conversionRate > 2 ? 'Good' : 'Needs Improvement'}\n\n`
                
                // Business Insights
                + "BUSINESS INSIGHTS & RECOMMENDATIONS\n"
                + "Area,Insight,Recommendation\n"
                + `Revenue,${stats.revenueGrowthRate > 0 ? 'Revenue is growing' : 'Revenue needs attention'},${stats.revenueGrowthRate > 0 ? 'Continue current strategies' : 'Review pricing and retention strategies'}\n`
                + `User Growth,${stats.userGrowthRate > 0 ? 'User base is expanding' : 'User growth is stagnant'},${stats.userGrowthRate > 0 ? 'Scale marketing efforts' : 'Improve acquisition channels'}\n`
                + `Retention,${stats.churnRate < 5 ? 'Good retention rates' : 'High churn detected'},${stats.churnRate < 5 ? 'Maintain service quality' : 'Implement retention programs'}\n`
                + `Content,${stats.mealPlanEngagementRate > 20 ? 'High content engagement' : 'Low content engagement'},${stats.mealPlanEngagementRate > 20 ? 'Continue content strategy' : 'Improve content quality and variety'}\n\n`
                
                + "===========================================\n"
                + "Report generated by DiaBeater Admin Dashboard\n"
                + `Timestamp: ${new Date().toISOString()}\n`;

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const fileName = `DiaBeater_Business_Analytics_Report_${timestamp}.csv`;

            this.downloadCsv(csvContent, fileName);
            this.setSuccess('Comprehensive business report exported successfully!');
            
            console.log('[AdminReportViewModel] CSV report generated successfully');
            
        } catch (err) {
            console.error('[AdminReportViewModel] Error exporting report:', err);
            this.setError('Failed to export business report: ' + err.message);
        } finally {
            this.setLoading(false);
        }
    };

    /**
     * Helper function to format currency values
     */
    formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    /**
     * Helper function to trigger CSV download
     */
    downloadCsv = (csvContent, fileName) => {
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

const adminReportViewModel = new AdminReportViewModel();
export default adminReportViewModel;