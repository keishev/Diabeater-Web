// src/viewmodels/AdminStatViewModel.js
import { makeAutoObservable, runInAction } from 'mobx';
import AdminStatService from '../Services/AdminStatService'; // Import the new service

class AdminStatViewModel {
    // Dashboard Stats
    totalUsers = 0;
    totalNutritionists = 0;
    totalApprovedMealPlans = 0;
    totalPendingMealPlans = 0;
    totalSubscriptions = 0;

    // Chart Data
    dailySignupsData = {}; // { 'YYYY-MM-DD': count }
    weeklyTopMealPlans = []; // Array of meal plan objects

    // User Management
    userAccounts = [];
    selectedUserForManagement = null; // For potential modal/detail view

    // Subscription Management
    allSubscriptions = []; // <--- NEW: To hold the array of all subscription documents

    // General State
    loading = false;
    error = '';
    success = '';

    constructor() {
        makeAutoObservable(this);
        this.loadDashboardData(); // Load data when ViewModel is instantiated
    }

    // --- State Management Helpers ---
    setLoading = (isLoading) => {
        runInAction(() => {
            this.loading = isLoading;
        });
    };

    setError = (message) => {
        runInAction(() => {
            this.error = message;
            if (message) {
                setTimeout(() => runInAction(() => this.error = ''), 5000); // Clear error after 5 seconds
            }
        });
    };

    setSuccess = (message) => {
        runInAction(() => {
            this.success = message;
            if (message) {
                setTimeout(() => runInAction(() => this.success = ''), 5000); // Clear success after 5 seconds
            }
        });
    };

    // --- Data Loading Functions ---

    /**
     * Loads all dashboard statistics.
     */
    loadDashboardData = async () => {
        this.setLoading(true);
        this.setError('');
        try {
            const [
                totalUsers,
                totalNutritionists,
                totalApprovedMealPlans,
                totalPendingMealPlans,
                totalSubscriptionsCount, // Renamed to avoid confusion with `allSubscriptions` array
                dailySignupsData,
                weeklyTopMealPlans,
                userAccounts, // All users for the user management table
                allSubscriptionDocs // <--- NEW: Fetch all subscription documents
            ] = await Promise.all([
                AdminStatService.getDocumentCount('user_accounts'),
                AdminStatService.getAllUserAccounts('nutritionist').then(users => users.length),
                AdminStatService.getDocumentCount('meal_plans', 'status', '==', 'APPROVED'), // <--- Now using filter
                AdminStatService.getDocumentCount('meal_plans', 'status', '==', 'PENDING_APPROVAL'), // <--- Now using filter
                AdminStatService.getDocumentCount('subscriptions'), // Assuming subscriptions collection
                AdminStatService.getDailySignups(7), // Last 7 days
                AdminStatService.getWeeklyTopMealPlans(5), // Top 5 meal plans
                AdminStatService.getAllUsersForManagement(), // For the user accounts table
                AdminStatService.getAllSubscriptions() // <--- NEW: Call service to get all subscriptions
            ]);

            runInAction(() => {
                this.totalUsers = totalUsers;
                this.totalNutritionists = totalNutritionists;
                this.totalApprovedMealPlans = totalApprovedMealPlans;
                this.totalPendingMealPlans = totalPendingMealPlans;
                this.totalSubscriptions = totalSubscriptionsCount; // Use the count
                this.dailySignupsData = dailySignupsData;
                this.weeklyTopMealPlans = weeklyTopMealPlans;
                this.userAccounts = userAccounts;
                this.allSubscriptions = allSubscriptionDocs; // <--- NEW: Store the fetched documents
            });
            this.setSuccess('Dashboard data loaded successfully!');
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            this.setError('Failed to load dashboard data: ' + err.message);
        } finally {
            this.setLoading(false);
        }
    };

    /**
     * Refreshes the user accounts list.
     */
    refreshUserAccounts = async () => {
        this.setLoading(true);
        this.setError('');
        try {
            const users = await AdminStatService.getAllUsersForManagement();
            runInAction(() => {
                this.userAccounts = users;
            });
            this.setSuccess('User accounts refreshed.');
        } catch (err) {
            console.error('Error refreshing user accounts:', err);
            this.setError('Failed to refresh user accounts: ' + err.message);
        } finally {
            this.setLoading(false);
        }
    };

    // --- User Management Actions ---

    /**
     * Updates a user's role.
     * @param {string} userId
     * @param {string} newRole
     */
    updateUserRole = async (userId, newRole) => {
        this.setLoading(true);
        this.setError('');
        this.setSuccess('');
        try {
            await AdminStatService.updateUserRole(userId, newRole);
            this.setSuccess(`User role updated to ${newRole} successfully.`);
            await this.refreshUserAccounts(); // Refresh the list after update
        } catch (err) {
            console.error('Error updating user role:', err);
            this.setError('Failed to update user role: ' + err.message);
        } finally {
            this.setLoading(false);
        }
    };

    /**
     * Deletes a user account.
     * @param {string} userId
     */
    deleteUserAccount = async (userId) => {
        this.setLoading(true);
        this.setError('');
        this.setSuccess('');
        try {
            await AdminStatService.deleteUserAccount(userId);
            this.setSuccess('User account deleted successfully.');
            await this.refreshUserAccounts(); // Refresh the list after deletion
        } catch (err) {
            console.error('Error deleting user account:', err);
            this.setError('Failed to delete user account: ' + err.message);
        } finally {
            this.setLoading(false);
        }
    };

    /**
     * Updates a nutritionist's status.
     * @param {string} nutritionistId
     * @param {string} newStatus
     */
    updateNutritionistStatus = async (nutritionistId, newStatus) => {
        this.setLoading(true);
        this.setError('');
        this.setSuccess('');
        try {
            await AdminStatService.updateNutritionistStatus(nutritionistId, newStatus);
            this.setSuccess(`Nutritionist status updated to ${newStatus} successfully.`);
            await this.refreshUserAccounts(); // Refresh the list after update
        } catch (err) {
            console.error('Error updating nutritionist status:', err);
            this.setError('Failed to update nutritionist status: ' + err.message);
        } finally {
            this.setLoading(false);
        }
    };

    // --- Selection for detail/edit in UI (if needed) ---
    setSelectedUserForManagement = (user) => {
        runInAction(() => {
            this.selectedUserForManagement = user;
        });
    };

    clearSelectedUserForManagement = () => {
        runInAction(() => {
            this.selectedUserForManagement = null;
        });
    };
}

const adminStatViewModel = new AdminStatViewModel();
export default adminStatViewModel;