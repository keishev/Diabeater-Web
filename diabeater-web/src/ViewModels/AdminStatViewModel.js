// src/ViewModels/AdminStatViewModel.js
import { makeAutoObservable, runInAction } from 'mobx';
import AdminStatService from '../Services/AdminStatService'; // Adjust path if needed

class AdminStatViewModel {
    loading = false;
    error = null;
    success = null;

    // Dashboard Stats
    totalUsers = 0;
    totalNutritionists = 0;
    totalApprovedMealPlans = 0;
    totalPendingMealPlans = 0;
    totalSubscriptions = 0;
    dailySignupsData = {};
    weeklyTopMealPlans = [];
    userAccounts = []; // For management table
    allSubscriptions = []; // For subscriptions table
    selectedUserForManagement = null; // For modal

    constructor() {
        makeAutoObservable(this);
    }

    setLoading(status) {
        runInAction(() => {
            this.loading = status;
        });
    }

    setError(message) {
        runInAction(() => {
            this.error = message;
            // Optionally clear error after some time
            // setTimeout(() => this.error = null, 5000);
        });
    }

    setSuccess(message) {
        runInAction(() => {
            this.success = message;
            // Optionally clear success after some time
            // setTimeout(() => this.success = null, 3000);
        });
    }

    async loadDashboardData() {
        console.log("[ViewModel] Starting loadDashboardData..."); // <--- ADDED LOG
        this.setLoading(true);
        this.setError(null);
        try {
            const [
                totalUsers,
                totalNutritionists,
                totalApprovedMealPlans,
                totalPendingMealPlans,
                totalSubscriptions,
                dailySignupsRawData, // Renamed to avoid confusion before processing
                weeklyTopMealPlans,
                allSubscriptions
            ] = await Promise.all([
                AdminStatService.getDocumentCount('user_accounts'),
                AdminStatService.getDocumentCount('user_accounts', 'role', '==', 'nutritionist'),
                AdminStatService.getDocumentCount('meal_plans', 'status', '==', 'APPROVED'),
                AdminStatService.getDocumentCount('meal_plans', 'status', '==', 'PENDING'),
                AdminStatService.getDocumentCount('subscriptions'),
                AdminStatService.getDailySignups(7),
                AdminStatService.getWeeklyTopMealPlans(5),
                AdminStatService.getAllSubscriptions()
            ]);

            // Process dailySignupsRawData into desired format (e.g., date: count)
            // Assuming dailySignupsRawData is an array of user objects with 'createdAt'
            const processedDailySignups = dailySignupsRawData.reduce((acc, user) => {
                // Ensure createdAt is a Date object (if it's a Firestore Timestamp, convert it)
                const createdAtDate = user.createdAt instanceof Date ? user.createdAt : user.createdAt?.toDate ? user.createdAt.toDate() : null;

                if (createdAtDate) {
                    const dateString = createdAtDate.toISOString().split('T')[0]; // YYYY-MM-DD
                    acc[dateString] = (acc[dateString] || 0) + 1;
                }
                return acc;
            }, {});


            runInAction(() => {
                this.totalUsers = totalUsers;
                this.totalNutritionists = totalNutritionists;
                this.totalApprovedMealPlans = totalApprovedMealPlans;
                this.totalPendingMealPlans = totalPendingMealPlans;
                this.totalSubscriptions = totalSubscriptions;
                this.dailySignupsData = processedDailySignups; // Set processed data
                this.weeklyTopMealPlans = weeklyTopMealPlans;
                this.allSubscriptions = allSubscriptions;
            });
            console.log("[ViewModel] Dashboard data loaded successfully."); // <--- ADDED LOG
            console.log("[ViewModel] Fetched Stats:", {
                totalUsers: this.totalUsers,
                totalNutritionists: this.totalNutritionists,
                totalApprovedMealPlans: this.totalApprovedMealPlans,
                totalPendingMealPlans: this.totalPendingMealPlans,
                totalSubscriptions: this.totalSubscriptions,
            }); // <--- ADDED LOG
            console.log("[ViewModel] Processed Daily Signups:", this.dailySignupsData); // <--- ADDED LOG
            console.log("[ViewModel] Weekly Top Meal Plans:", this.weeklyTopMealPlans); // <--- ADDED LOG
            console.log("[ViewModel] All Subscriptions:", this.allSubscriptions); // <--- ADDED LOG

            this.setSuccess('Dashboard data refreshed.');

        } catch (error) {
            console.error("[ViewModel] Error in loadDashboardData:", error); // <--- ADDED LOG
            this.setError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async updateUserRole(userId, newRole) {
        this.setLoading(true);
        this.setError(null);
        try {
            await AdminStatService.updateUserRole(userId, newRole);
            this.setSuccess(`User role updated to ${newRole}.`);
            await this.loadDashboardData(); // Refresh all data to reflect changes
        } catch (error) {
            this.setError(`Failed to update user role: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    async deleteUserAccount(userId) {
        this.setLoading(true);
        this.setError(null);
        try {
            await AdminStatService.deleteUserAccount(userId);
            this.setSuccess('User account deleted.');
            await this.loadDashboardData(); // Refresh all data
        } catch (error) {
            this.setError(`Failed to delete user account: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    async updateNutritionistStatus(userId, newStatus) {
        this.setLoading(true);
        this.setError(null);
        try {
            await AdminStatService.updateNutritionistStatus(userId, newStatus);
            this.setSuccess(`Nutritionist status updated to ${newStatus}.`);
            await this.loadDashboardData(); // Refresh all data
        } catch (error) {
            this.setError(`Failed to update nutritionist status: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    setSelectedUserForManagement(user) {
        runInAction(() => {
            this.selectedUserForManagement = user;
        });
    }

    clearSelectedUserForManagement() {
        runInAction(() => {
            this.selectedUserForManagement = null;
        });
    }

    // Add other methods for user management or subscription management here
    // e.g., async fetchAllUsersForTable() { ... }
}

const adminStatViewModel = new AdminStatViewModel();
export default adminStatViewModel;