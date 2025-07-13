// src/services/AdminReportService.js
import AdminReportRepository from '../Repositories/AdminReportRepository'; // Correct import
import ReportModel from '../Models/ReportModel';

const AdminReportService = {
    /**
     * Fetches and aggregates data to create the overall statistics report.
     * @returns {Promise<ReportModel>} A ReportModel instance with aggregated data.
     */
    async getOverallStatReport() {
        try {
            const [
                totalUsers,
                totalNutritionists,
                totalMealPlansCreated,
                activeSubscriptions,
                averageDailyLogins,
                // Add more specific calls if you have detailed logging for "meals added today" or "reports generated"
                // For now, let's include all the fields that can be derived from existing Firebase data
            ] = await Promise.all([
                // Fetch total users
                AdminReportRepository.getDocumentCount('user_accounts'),

                // Fetch total nutritionists (users with role 'nutritionist')
                AdminReportRepository.getDocumentCount('user_accounts', 'role', '==', 'nutritionist'),

                // Fetch total meal plans created
                AdminReportRepository.getDocumentCount('meal_plans'),

                // Fetch active subscriptions (assuming a 'status' field for subscriptions)
                AdminReportRepository.getDocumentCount('subscriptions', 'status', '==', 'active'),

                // Fetch approximate average daily logins (based on last 24hr activity)
                AdminReportRepository.getApproxAverageDailyLogins(),
            ]);

            // --- Metrics that require specific logging or more complex logic ---
            // These would require a Firebase collection specifically for these events (e.g., 'meal_add_logs', 'admin_action_logs')
            // For now, they remain placeholders as your current Firebase schema doesn't seem to support direct querying for them easily.
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today

            // Example: To get 'mealsAddedToday', you'd need a 'meals' collection with a 'createdAt' timestamp
            // or a way to count entries from user's meal logs that were created today.
            // For now, we'll keep it at 0, or you can implement a new repo method for it.
            // e.g., AdminReportRepository.getDocumentCount('meals_log', 'createdAt', '>=', Timestamp.fromDate(today))
            const mealsAddedToday = 0; // Placeholder until specific logging for this is implemented

            // Example: For 'reportsGeneratedLastMonth', you'd need a collection logging admin actions.
            // e.g., AdminReportRepository.getDocumentCount('admin_logs', 'action', '==', 'report_generated', 'timestamp', '>=', oneMonthAgo)
            const reportsGeneratedLastMonth = 0; // Placeholder until specific logging for this is implemented


            return new ReportModel({
                totalUsers,
                totalNutritionists,
                totalMealPlansCreated,
                averageDailyLogins, // This is an approximation
                reportsGeneratedLastMonth, // Currently a placeholder
                activeSubscriptions,
                mealsAddedToday // Currently a placeholder
            });

        } catch (error) {
            console.error('Service Error: Failed to generate overall stat report:', error);
            // Re-throw the error so the ViewModel can catch it and display
            throw error;
        }
    },
    // ... other service methods (getUserReportData, getMealPlanReportData, getSubscriptionReportData) are fine
};

export default AdminReportService;