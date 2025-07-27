// AdminStatViewModel.js
import { makeAutoObservable, runInAction } from 'mobx';
import AdminStatService from '../Services/AdminStatService';
import SubscriptionService from '../Services/SubscriptionService'; // Ensure this is imported
import moment from 'moment';

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
    dailySignupsData = {}; // { 'YYYY-MM-DD': count }
    weeklyTopMealPlans = [];
    userAccounts = []; // For management table
    allSubscriptions = []; // For subscriptions table
    selectedUserForManagement = null;

    // Observable for Premium Subscription Price and Features
    premiumSubscriptionPrice = 0; // Initialize with a default value
    premiumFeatures = []; // ⭐ NEW: Initialize for premium features

    // For Nutritionist Application Modals
    showRejectionReasonModal = false;
    rejectionReason = '';

    constructor() {
        makeAutoObservable(this); // This makes all properties observable and all methods actions
        this.loadDashboardData(); // Initial data load when ViewModel is instantiated
    }

    // --- State Management Actions (automatically bound by makeAutoObservable) ---
    setLoading(status) {
        runInAction(() => {
            this.loading = status;
        });
    }

    setError(message) {
        runInAction(() => {
            this.error = message;
            if (message) {
                this.success = null; // Clear success message when an error occurs
                setTimeout(() => {
                    if (this.error === message) { // Only clear if it's the same message
                        this.error = null;
                    }
                }, 5000);
            }
        });
    }

    setSuccess(message) {
        runInAction(() => {
            this.success = message;
            if (message) {
                this.error = null; // Clear error message when a success occurs
                setTimeout(() => {
                    if (this.success === message) { // Only clear if it's the same message
                        this.success = null;
                    }
                }, 5000);
            }
        });
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

    setShowRejectionReasonModal(status) {
        runInAction(() => {
            this.showRejectionReasonModal = status;
        });
    }

    setRejectionReason(reason) {
        runInAction(() => {
            this.rejectionReason = reason;
        });
    }

    // --- Data Loading Action ---
    async loadDashboardData() {
        console.log("[ViewModel] Starting loadDashboardData...");
        this.setLoading(true);
        this.setError(null);
        this.setSuccess(null);

        try {
            const [
                totalUsers,
                totalNutritionists,
                totalApprovedMealPlans,
                totalPendingMealPlans,
                totalSubscriptions,
                dailySignupsRawData,
                weeklyTopMealPlans,
                allSubscriptions,
                allUserAccounts // Fetch all user accounts
            ] = await Promise.all([
                AdminStatService.getDocumentCount('user_accounts'),
                AdminStatService.getDocumentCount('user_accounts', 'role', '==', 'nutritionist'),
                AdminStatService.getDocumentCount('meal_plans', 'status', '==', 'APPROVED'),
                AdminStatService.getDocumentCount('meal_plans', 'status', '==', 'PENDING_APPROVAL'),
                AdminStatService.getDocumentCount('subscriptions'),
                AdminStatService.getDailySignups(7),
                AdminStatService.getWeeklyTopMealPlans(5),
                AdminStatService.getAllSubscriptions(),
                AdminStatService.getAllUserAccounts() // Fetch all user accounts
            ]);

            let fetchedPremiumPrice = 0;
            try {
                const price = await SubscriptionService.getSubscriptionPrice('premium');
                fetchedPremiumPrice = price !== null ? price : 0;
            } catch (priceError) {
                console.error("[ViewModel] Error fetching premium subscription price:", priceError);
                // Don't throw, allow other data to load
            }

            // ⭐ NEW: Fetch premium features
            let fetchedPremiumFeatures = [];
            try {
                const features = await SubscriptionService.getPremiumFeatures('premium');
                fetchedPremiumFeatures = features !== null ? features : [];
            } catch (featuresError) {
                console.error("[ViewModel] Error fetching premium features:", featuresError);
                // Don't throw, allow other data to load
            }

            const processedDailySignups = {};
            const today = moment().startOf('day');
            for (let i = 6; i >= 0; i--) {
                const date = moment(today).subtract(i, 'days');
                processedDailySignups[date.format('YYYY-MM-DD')] = 0;
            }

            dailySignupsRawData.forEach(user => {
                const createdAtDate = user.createdAt?.toDate ? moment(user.createdAt.toDate()) : null;
                if (createdAtDate && moment(createdAtDate).isBetween(moment(today).subtract(7, 'days'), moment(today).add(1, 'day'), null, '[]')) {
                    const dateString = createdAtDate.format('YYYY-MM-DD');
                    processedDailySignups[dateString] = (processedDailySignups[dateString] || 0) + 1;
                }
            });

            runInAction(() => {
                this.totalUsers = totalUsers;
                this.totalNutritionists = totalNutritionists;
                this.totalApprovedMealPlans = totalApprovedMealPlans;
                this.totalPendingMealPlans = totalPendingMealPlans;
                this.totalSubscriptions = totalSubscriptions;
                this.dailySignupsData = processedDailySignups;
                this.weeklyTopMealPlans = weeklyTopMealPlans;
                this.allSubscriptions = allSubscriptions;
                this.userAccounts = allUserAccounts;
                this.premiumSubscriptionPrice = fetchedPremiumPrice;
                this.premiumFeatures = fetchedPremiumFeatures; // ⭐ NEW: Set premium features
            });

            console.log("[ViewModel] Dashboard data loaded successfully.");
            this.setSuccess('Dashboard data refreshed.');

        } catch (error) {
            console.error("[ViewModel] Error in loadDashboardData:", error);
            this.setError(`Failed to load dashboard data: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    // --- User Management Actions ---

    async updatePremiumSubscriptionPrice(newPrice) {
        console.log(`[ViewModel] Attempting to update premium subscription price to: ${newPrice}`);
        this.setLoading(true);
        this.setError(null);
        this.setSuccess(null);
        try {
            const response = await SubscriptionService.updateSubscriptionPrice('premium', newPrice);

            if (response.success) {
                runInAction(() => {
                    this.premiumSubscriptionPrice = newPrice;
                    this.setSuccess(`Premium subscription price updated to $${newPrice.toFixed(2)}.`);
                });
                console.log(`[ViewModel] Premium subscription price successfully updated to: ${newPrice}`);
                return { success: true };
            } else {
                this.setError(response.message || 'Failed to update subscription price.');
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error("[ViewModel] Error updating premium subscription price:", error);
            this.setError(`Failed to update premium subscription price: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    // ⭐ NEW: Action to update premium features
    async updatePremiumFeatures(newFeatures) {
        console.log(`[ViewModel] Attempting to update premium features to:`, newFeatures);
        this.setLoading(true);
        this.setError(null);
        this.setSuccess(null);
        try {
            const response = await SubscriptionService.updatePremiumFeatures('premium', newFeatures);

            if (response.success) {
                runInAction(() => {
                    this.premiumFeatures = newFeatures; // Update local state
                    this.setSuccess(`Premium features updated successfully.`);
                });
                console.log(`[ViewModel] Premium features successfully updated.`);
                return { success: true };
            } else {
                this.setError(response.message || 'Failed to update premium features.');
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error("[ViewModel] Error updating premium features:", error);
            this.setError(`Failed to update premium features: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }


    async suspendUserAccount(userId, suspend) {
        this.setLoading(true);
        this.setError(null);
        this.setSuccess(null);
        try {
            const newStatus = suspend ? 'suspended' : 'active';
            const response = await AdminStatService.updateUserStatus(userId, newStatus);

            if (response.success) {
                runInAction(() => {
                    const userIndex = this.userAccounts.findIndex(u => u._id === userId);
                    if (userIndex > -1) {
                        this.userAccounts[userIndex].status = newStatus;
                    }
                    this.setSuccess(response.message || `User ${userId} ${suspend ? 'suspended' : 'unsuspended'} successfully.`);
                });
                return { success: true };
            } else {
                throw new Error(response.message || 'Operation failed.');
            }
        } catch (error) {
            console.error(`[ViewModel] Error ${suspend ? 'suspending' : 'unsuspending'} user:`, error);
            this.setError(`Failed to ${suspend ? 'suspend' : 'unsuspend'} user: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }


    async updateUserRole(userId, newRole) {
        this.setLoading(true);
        this.setError(null);
        this.setSuccess(null);
        try {
            const response = await AdminStatService.updateUserRole(userId, newRole);
            if (response.success) {
                runInAction(() => {
                    const userIndex = this.userAccounts.findIndex(u => u._id === userId);
                    if (userIndex > -1) {
                        this.userAccounts[userIndex].role = newRole;
                    }
                    this.setSuccess(response.message);
                });
                return { success: true };
            } else {
                throw new Error(response.message || 'Failed to update user role.');
            }
        } catch (error) {
            console.error("[ViewModel] Error updating user role:", error);
            this.setError(`Failed to update user role: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    async deleteUserAccount(userId) {
        this.setLoading(true);
        this.setError(null);
        this.setSuccess(null);
        try {
            const response = await AdminStatService.deleteUserAccount(userId);
            if (response.success) {
                runInAction(() => {
                    this.userAccounts = this.userAccounts.filter(u => u._id !== userId);
                    this.setSuccess(response.message);
                });
                return { success: true };
            } else {
                throw new Error(response.message || 'Failed to delete user account.');
            }
        } catch (error) {
            console.error("[ViewModel] Error deleting user account:", error);
            this.setError(`Failed to delete user account: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    async updateNutritionistStatus(userId, newStatus) {
        this.setLoading(true);
        this.setError(null);
        this.setSuccess(null);
        try {
            const response = await AdminStatService.updateNutritionistStatus(userId, newStatus);
            if (response.success) {
                runInAction(() => {
                    const userIndex = this.userAccounts.findIndex(u => u._id === userId);
                    if (userIndex > -1) {
                        this.userAccounts[userIndex].nutritionistStatus = newStatus;
                    }
                    this.setSuccess(response.message);
                });
                return { success: true };
            } else {
                throw new Error(response.message || 'Failed to update nutritionist status.');
            }
        } catch (error) {
            console.error("[ViewModel] Error updating nutritionist status:", error);
            this.setError(`Failed to update nutritionist status: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    async approveNutritionist(userId) {
        this.setLoading(true);
        this.setError(null);
        this.setSuccess(null);
        try {
            const response = await AdminStatService.updateUserStatus(userId, 'Active');
            if (response.success) {
                runInAction(() => {
                    const userIndex = this.userAccounts.findIndex(u => u._id === userId);
                    if (userIndex > -1) {
                        this.userAccounts[userIndex].status = 'Active';
                        this.userAccounts[userIndex].role = 'nutritionist';
                    }
                    this.setSuccess(`Nutritionist ${userId} approved successfully.`);
                });
                this.clearSelectedUserForManagement();
                this.setShowRejectionReasonModal(false);
                return { success: true };
            } else {
                throw new Error(response.message || 'Failed to approve nutritionist.');
            }
        } catch (error) {
            console.error("[ViewModel] Error approving nutritionist:", error);
            this.setError(`Failed to approve nutritionist: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    async rejectNutritionist(userId) {
        this.setLoading(true);
        this.setError(null);
        this.setSuccess(null);
        try {
            const response = await AdminStatService.updateUserStatus(userId, 'rejected', this.rejectionReason);
            if (response.success) {
                runInAction(() => {
                    const userIndex = this.userAccounts.findIndex(u => u._id === userId);
                    if (userIndex > -1) {
                        this.userAccounts[userIndex].status = 'rejected';
                    }
                    this.setSuccess(`Nutritionist ${userId} rejected.`);
                });
                this.clearSelectedUserForManagement();
                this.setShowRejectionReasonModal(false);
                this.setRejectionReason('');
                return { success: true };
            } else {
                throw new Error(response.message || 'Failed to reject nutritionist.');
            }
        } catch (error) {
            console.error("[ViewModel] Error rejecting nutritionist:", error);
            this.setError(`Failed to reject nutritionist: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    async viewCertificate(userId) {
        this.setLoading(true);
        this.setError(null);
        try {
            const user = this.userAccounts.find(u => u._id === userId);
            if (user && user.certificateUrl) {
                window.open(user.certificateUrl, '_blank');
                this.setSuccess('Certificate opened in a new tab.');
            } else {
                this.setError('No certificate URL found for this nutritionist.');
            }
        } catch (error) {
            console.error("[ViewModel] Error viewing certificate:", error);
            this.setError(`Failed to view certificate: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }
}

const adminStatViewModel = new AdminStatViewModel();
export default adminStatViewModel;