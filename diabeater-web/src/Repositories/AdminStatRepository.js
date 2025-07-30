// src/Repositories/AdminStatRepository.js
import AdminStatService from '../Services/AdminStatService';
import SubscriptionService from '../Services/SubscriptionService'; // Keeping this as per your instruction, though its direct methods might not be used anymore by the repository
import moment from 'moment';

class AdminStatRepository {
    constructor() {
        this.adminStatService = AdminStatService;
        this.subscriptionService = SubscriptionService; // Keeping this as per your instruction.
                                                       // Note: Its methods are now routed via adminStatService in this repository.
    }

    /**
     * Fetches all users and enriches premium users with their latest subscription details.
     * @returns {Promise<Array<Object>>} An array of user objects, with premium users having
     * 'currentSubscription', 'subscriptionStatus', and 'renewalDate' properties.
     */
    async getAllUsersWithSubscriptionInfo() {
        const allUsers = await this.adminStatService.getAllUserAccounts();

        const usersWithSubscriptionInfo = await Promise.all(
            allUsers.map(async (user) => {
                // Determine if user is 'premium' based on role or a specific field
                const isPremiumUser = user.role === 'premium' || user.isPremium; // Adjust logic as per your user schema

                if (isPremiumUser) {
                    try {
                        // ADJUSTED: Now using AdminStatService for getUserSubscriptions
                        const userSubscriptions = await this.adminStatService.getUserSubscriptions(user._id);

                        // Find the latest active, or latest overall if no active
                        const activeSubscriptions = userSubscriptions.filter(sub => sub.status === 'active');

                        let latestRelevantSubscription = null;

                        if (activeSubscriptions.length > 0) {
                            // Sort active subscriptions by creation/start date descending to get the most recent
                            latestRelevantSubscription = activeSubscriptions.sort((a, b) => {
                                const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                                const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                                return dateB - dateA;
                            })[0];
                        } else if (userSubscriptions.length > 0) {
                            // If no active, get the most recent non-active subscription (e.g., cancelled, expired)
                            latestRelevantSubscription = userSubscriptions.sort((a, b) => {
                                const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                                const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                                return dateB - dateA;
                            })[0];
                        }

                        // Ensure date objects are correctly handled (Firestore Timestamp to JS Date)
                        const renewalDate = latestRelevantSubscription?.endDate?.toDate ? latestRelevantSubscription.endDate.toDate() : null;
                        const subscriptionStatus = latestRelevantSubscription?.status || 'no_subscription';

                        return {
                            ...user, // Full user object
                            isPremium: true, // Mark them as premium for easy filtering
                            currentSubscription: latestRelevantSubscription, // The raw subscription object
                            subscriptionStatus: subscriptionStatus,
                            renewalDate: renewalDate,
                        };
                    } catch (subError) {
                        console.error(`Error fetching subscription for user ${user._id}:`, subError);
                        return {
                            ...user,
                            isPremium: true, // Still a premium user
                            currentSubscription: null,
                            subscriptionStatus: 'error_fetching_subscription',
                            renewalDate: null
                        };
                    }
                } else {
                    return { ...user, isPremium: false }; // Non-premium users
                }
            })
        );
        return usersWithSubscriptionInfo;
    }

    async getDashboardStats() {
        const [
            allUsers, // Used for total users count
            mealPlans,
            dailySignupsData,
            weeklyTopMealPlans,
            premiumSubscriptionPrice,
            premiumFeatures
        ] = await Promise.all([
            this.adminStatService.getAllUserAccounts(),
            this.adminStatService.getMealPlans(),
            this.adminStatService.getDailySignups(),
            this.adminStatService.getWeeklyTopMealPlans(),
            // ADJUSTED: Now using AdminStatService for subscription price
            this.adminStatService.getSubscriptionPrice(),
            // ADJUSTED: Now using AdminStatService for premium features
            this.adminStatService.getPremiumFeatures()
        ]);

        const totalUsers = allUsers.length;
        const totalNutritionists = allUsers.filter(user => user.role === 'nutritionist').length;

        // Fetch all subscriptions to calculate totalSubscriptions
        // ADJUSTED: Now using AdminStatService for all subscriptions
        const allSubscriptions = await this.adminStatService.getAllSubscriptions();
        const totalSubscriptions = allSubscriptions.filter(sub => sub.status === 'active').length;

        const totalApprovedMealPlans = mealPlans.filter(plan => plan.status === 'approved').length;
        const totalPendingMealPlans = mealPlans.filter(plan => plan.status === 'pending').length;


        return {
            totalUsers,
            totalNutritionists,
            totalApprovedMealPlans,
            totalPendingMealPlans,
            totalSubscriptions,
            dailySignupsData,
            weeklyTopMealPlans,
            premiumSubscriptionPrice,
            premiumFeatures,
            allUsers // Return all users to allow ViewModel to filter for premium later
        };
    }

    // Pass-through methods for user actions and settings
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
        return this.adminStatService.suspendUserAccount(userId, suspend);
    }

    async updatePremiumSubscriptionPrice(newPrice) {
        // ADJUSTED: Now using AdminStatService for updating price
        return this.adminStatService.updateSubscriptionPrice(newPrice);
    }

    async updatePremiumFeatures(features) {
        // ADJUSTED: Now using AdminStatService for updating features
        return this.adminStatService.updatePremiumFeatures(features);
    }
}

export default new AdminStatRepository();