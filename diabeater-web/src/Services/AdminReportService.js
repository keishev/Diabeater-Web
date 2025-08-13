// src/services/AdminReportService.js
import AdminReportRepository from '../Repositories/AdminReportRepository';
import ReportModel from '../Models/ReportModel';

const AdminReportService = {
    /**
     * Fetches and aggregates data to create a comprehensive business report.
     * @returns {Promise<ReportModel>} A ReportModel instance with all business metrics.
     */
    async getOverallStatReport() {
        try {
            console.log('[AdminReportService] Starting comprehensive report generation...');
            
            // Get current date boundaries
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            // This month boundaries
            const thisMonthStart = new Date(currentYear, currentMonth, 1);
            const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0);
            
            // Last month boundaries
            const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
            const lastMonthEnd = new Date(currentYear, currentMonth, 0);
            
            // Fetch all necessary data
            const [
                totalUsers,
                totalNutritionists,
                totalMealPlansCreated,
                approvedMealPlans,
                pendingMealPlans,
                
                // Subscription data
                allPremiumUsers, // Total subscriptions = users with role 'premium'
                activeSubscriptionsData, // Active subscriptions from subscriptions collection
                
                // Revenue data from subscriptions collection
                allSubscriptions,
                thisMonthSubscriptions,
                lastMonthSubscriptions,
                
                // User signup data
                thisMonthUsers,
                lastMonthUsers,
                thisMonthPremiumUsers,
                lastMonthPremiumUsers,
                
                // Meal plan data
                thisMonthMealPlans,
                lastMonthMealPlans,
                
                // Meal plans with save counts
                mealPlansWithSaves
            ] = await Promise.all([
                // Basic counts
                AdminReportRepository.getDocumentCount('user_accounts'),
                AdminReportRepository.getDocumentCount('user_accounts', 'role', '==', 'nutritionist'),
                AdminReportRepository.getDocumentCount('meal_plans'),
                AdminReportRepository.getDocumentCount('meal_plans', 'status', '==', 'APPROVED'),
                AdminReportRepository.getDocumentCount('meal_plans', 'status', '==', 'PENDING_APPROVAL'),
                
                // Subscription data
                AdminReportRepository.getPremiumUsers(), // Total subscriptions = users with role 'premium'
                AdminReportRepository.getActiveSubscriptions(), // Active subscriptions from subscriptions collection
                
                // Revenue data from subscriptions collection
                AdminReportRepository.getAllSubscriptions(),
                AdminReportRepository.getSubscriptionsByMonth(currentYear, currentMonth + 1),
                AdminReportRepository.getSubscriptionsByMonth(currentYear, currentMonth),
                
                // User signup data
                AdminReportRepository.getUserSignupsByPeriod(thisMonthStart, thisMonthEnd),
                AdminReportRepository.getUserSignupsByPeriod(lastMonthStart, lastMonthEnd),
                AdminReportRepository.getPremiumUsersByPeriod(thisMonthStart, thisMonthEnd),
                AdminReportRepository.getPremiumUsersByPeriod(lastMonthStart, lastMonthEnd),
                
                // Meal plan creation data
                AdminReportRepository.getMealPlansByPeriod(thisMonthStart, thisMonthEnd),
                AdminReportRepository.getMealPlansByPeriod(lastMonthStart, lastMonthEnd),
                
                // Meal plans with their save counts
                AdminReportRepository.getAllMealPlansWithSaveCounts()
            ]);

            console.log('[AdminReportService] Raw data fetched, processing metrics...');

            // Process subscription data
            const totalSubscriptions = allPremiumUsers.length; // Users with role 'premium'
            const activeSubscriptions = activeSubscriptionsData.length; // From subscriptions with status 'active'
            
            // Calculate cancelled subscriptions from all subscriptions collection
            const cancelledSubscriptions = allSubscriptions.filter(sub => 
                sub.status && (sub.status.toLowerCase() === 'canceled' || sub.status.toLowerCase() === 'cancelled')
            ).length;

            console.log('[AdminReportService] Subscription metrics:');
            console.log('- Total premium users:', totalSubscriptions);
            console.log('- Active subscriptions (from subscriptions collection):', activeSubscriptions);
            console.log('- Cancelled subscriptions:', cancelledSubscriptions);

            // Calculate revenue metrics from subscriptions collection
            const currentMonthRevenue = thisMonthSubscriptions
                .filter(sub => sub.price && typeof sub.price === 'number')
                .reduce((total, sub) => total + sub.price, 0);

            const lastMonthRevenue = lastMonthSubscriptions
                .filter(sub => sub.price && typeof sub.price === 'number')
                .reduce((total, sub) => total + sub.price, 0);

            const totalRevenue = allSubscriptions
                .filter(sub => sub.price && typeof sub.price === 'number')
                .reduce((total, sub) => total + sub.price, 0);

            // Calculate monthly subscription changes
            const cancelledThisMonth = thisMonthSubscriptions.filter(sub => 
                sub.status && (sub.status.toLowerCase() === 'canceled' || sub.status.toLowerCase() === 'cancelled')
            ).length;

            const cancelledLastMonth = lastMonthSubscriptions.filter(sub => 
                sub.status && (sub.status.toLowerCase() === 'canceled' || sub.status.toLowerCase() === 'cancelled')
            ).length;

            // Calculate growth rates
            const revenueGrowthRate = lastMonthRevenue > 0 
                ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
                : 0;

            const userGrowthRate = lastMonthUsers.length > 0 
                ? ((thisMonthUsers.length - lastMonthUsers.length) / lastMonthUsers.length) * 100 
                : 0;

            // Calculate business metrics
            const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;
            const conversionRate = totalUsers > 0 ? (totalSubscriptions / totalUsers) * 100 : 0;
            const churnRate = activeSubscriptions > 0 ? (cancelledThisMonth / activeSubscriptions) * 100 : 0;

            const averageSubscriptionValue = allSubscriptions.length > 0 
                ? allSubscriptions
                    .filter(sub => sub.price && typeof sub.price === 'number')
                    .reduce((total, sub, _, arr) => total + sub.price / arr.length, 0)
                : 0;

            // Calculate engagement metrics from meal plans saveCount
            const totalMealPlanSaves = mealPlansWithSaves.totalSaves;
            const mealPlanEngagementRate = totalMealPlansCreated > 0 
                ? (totalMealPlanSaves / totalMealPlansCreated) * 100 
                : 0;

            // Estimate lifetime value (simplified calculation)
            const lifetimeValue = averageSubscriptionValue * 12; // Assume 12 month average lifetime

            console.log('[AdminReportService] All metrics calculated successfully');
            console.log('Debug - Active subscriptions:', activeSubscriptions);
            console.log('Debug - Total subscriptions:', totalSubscriptions);
            console.log('Debug - Total meal plan saves:', totalMealPlanSaves);

            return new ReportModel({
                // User Metrics
                totalUsers,
                totalNutritionists,
                newUsersThisMonth: thisMonthUsers.length,
                newUsersLastMonth: lastMonthUsers.length,
                userGrowthRate,
                
                // Subscription & Revenue Metrics
                totalSubscriptions, // Users with role 'premium'
                activeSubscriptions, // From subscriptions collection with status 'active'
                cancelledSubscriptions, // From subscriptions collection with cancelled status
                cancelledThisMonth,
                cancelledLastMonth,
                currentMonthRevenue,
                lastMonthRevenue,
                revenueGrowthRate,
                averageRevenuePerUser,
                churnRate,
                
                // Content Metrics
                totalMealPlansCreated,
                approvedMealPlans,
                pendingMealPlans,
                mealPlansCreatedThisMonth: thisMonthMealPlans.length,
                mealPlansCreatedLastMonth: lastMonthMealPlans.length,
                totalMealPlanSaves, // Sum of all saveCount from meal_plans
                mealPlanEngagementRate,
                
                // Business Performance
                conversionRate,
                averageSubscriptionValue,
                lifetimeValue,
                
                // Meta data
                reportGeneratedAt: new Date(),
                reportPeriod: 'Monthly'
            });

        } catch (error) {
            console.error('[AdminReportService] Error generating comprehensive report:', error);
            throw new Error(`Failed to generate report: ${error.message}`);
        }
    }
};

export default AdminReportService;