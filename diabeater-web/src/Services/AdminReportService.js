
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
            
            
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            
            const thisMonthStart = new Date(currentYear, currentMonth, 1);
            const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0);
            
            
            const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
            const lastMonthEnd = new Date(currentYear, currentMonth, 0);
            
            
            const [
                totalUsers,
                totalNutritionists,
                totalMealPlansCreated,
                approvedMealPlans,
                pendingMealPlans,
                
                
                allPremiumUsers, 
                activeSubscriptionsData, 
                
                
                allSubscriptions,
                thisMonthSubscriptions,
                lastMonthSubscriptions,
                
                
                thisMonthUsers,
                lastMonthUsers,
                thisMonthPremiumUsers,
                lastMonthPremiumUsers,
                
                
                thisMonthMealPlans,
                lastMonthMealPlans,
                
                
                mealPlansWithSaves
            ] = await Promise.all([
                
                AdminReportRepository.getDocumentCount('user_accounts'),
                AdminReportRepository.getDocumentCount('user_accounts', 'role', '==', 'nutritionist'),
                AdminReportRepository.getDocumentCount('meal_plans'),
                AdminReportRepository.getDocumentCount('meal_plans', 'status', '==', 'APPROVED'),
                AdminReportRepository.getDocumentCount('meal_plans', 'status', '==', 'PENDING_APPROVAL'),
                
                
                AdminReportRepository.getPremiumUsers(), 
                AdminReportRepository.getActiveSubscriptions(), 
                
                
                AdminReportRepository.getAllSubscriptions(),
                AdminReportRepository.getSubscriptionsByMonth(currentYear, currentMonth + 1),
                AdminReportRepository.getSubscriptionsByMonth(currentYear, currentMonth),
                
                
                AdminReportRepository.getUserSignupsByPeriod(thisMonthStart, thisMonthEnd),
                AdminReportRepository.getUserSignupsByPeriod(lastMonthStart, lastMonthEnd),
                AdminReportRepository.getPremiumUsersByPeriod(thisMonthStart, thisMonthEnd),
                AdminReportRepository.getPremiumUsersByPeriod(lastMonthStart, lastMonthEnd),
                
                
                AdminReportRepository.getMealPlansByPeriod(thisMonthStart, thisMonthEnd),
                AdminReportRepository.getMealPlansByPeriod(lastMonthStart, lastMonthEnd),
                
                
                AdminReportRepository.getAllMealPlansWithSaveCounts()
            ]);

            console.log('[AdminReportService] Raw data fetched, processing metrics...');

            
            const totalSubscriptions = allPremiumUsers.length; 
            const activeSubscriptions = activeSubscriptionsData.length; 
            
            
            const cancelledSubscriptions = allSubscriptions.filter(sub => 
                sub.status && (sub.status.toLowerCase() === 'canceled' || sub.status.toLowerCase() === 'cancelled')
            ).length;

            console.log('[AdminReportService] Subscription metrics:');
            console.log('- Total premium users:', totalSubscriptions);
            console.log('- Active subscriptions (from subscriptions collection):', activeSubscriptions);
            console.log('- Cancelled subscriptions:', cancelledSubscriptions);

            
            const currentMonthRevenue = thisMonthSubscriptions
                .filter(sub => sub.price && typeof sub.price === 'number')
                .reduce((total, sub) => total + sub.price, 0);

            const lastMonthRevenue = lastMonthSubscriptions
                .filter(sub => sub.price && typeof sub.price === 'number')
                .reduce((total, sub) => total + sub.price, 0);

            const totalRevenue = allSubscriptions
                .filter(sub => sub.price && typeof sub.price === 'number')
                .reduce((total, sub) => total + sub.price, 0);

            
            const cancelledThisMonth = thisMonthSubscriptions.filter(sub => 
                sub.status && (sub.status.toLowerCase() === 'canceled' || sub.status.toLowerCase() === 'cancelled')
            ).length;

            const cancelledLastMonth = lastMonthSubscriptions.filter(sub => 
                sub.status && (sub.status.toLowerCase() === 'canceled' || sub.status.toLowerCase() === 'cancelled')
            ).length;

            
            const revenueGrowthRate = lastMonthRevenue > 0 
                ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
                : 0;

            const userGrowthRate = lastMonthUsers.length > 0 
                ? ((thisMonthUsers.length - lastMonthUsers.length) / lastMonthUsers.length) * 100 
                : 0;

            
            const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;
            const conversionRate = totalUsers > 0 ? (totalSubscriptions / totalUsers) * 100 : 0;
            const churnRate = activeSubscriptions > 0 ? (cancelledThisMonth / activeSubscriptions) * 100 : 0;

            const averageSubscriptionValue = allSubscriptions.length > 0 
                ? allSubscriptions
                    .filter(sub => sub.price && typeof sub.price === 'number')
                    .reduce((total, sub, _, arr) => total + sub.price / arr.length, 0)
                : 0;

            
            const totalMealPlanSaves = mealPlansWithSaves.totalSaves;
            const mealPlanEngagementRate = totalMealPlansCreated > 0 
                ? (totalMealPlanSaves / totalMealPlansCreated) * 100 
                : 0;

            
            const lifetimeValue = averageSubscriptionValue * 12; 

            console.log('[AdminReportService] All metrics calculated successfully');
            console.log('Debug - Active subscriptions:', activeSubscriptions);
            console.log('Debug - Total subscriptions:', totalSubscriptions);
            console.log('Debug - Total meal plan saves:', totalMealPlanSaves);

            return new ReportModel({
                
                totalUsers,
                totalNutritionists,
                newUsersThisMonth: thisMonthUsers.length,
                newUsersLastMonth: lastMonthUsers.length,
                userGrowthRate,
                
                
                totalSubscriptions, 
                activeSubscriptions, 
                cancelledSubscriptions, 
                cancelledThisMonth,
                cancelledLastMonth,
                currentMonthRevenue,
                lastMonthRevenue,
                revenueGrowthRate,
                averageRevenuePerUser,
                churnRate,
                
                
                totalMealPlansCreated,
                approvedMealPlans,
                pendingMealPlans,
                mealPlansCreatedThisMonth: thisMonthMealPlans.length,
                mealPlansCreatedLastMonth: lastMonthMealPlans.length,
                totalMealPlanSaves, 
                mealPlanEngagementRate,
                
                
                conversionRate,
                averageSubscriptionValue,
                lifetimeValue,
                
                
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