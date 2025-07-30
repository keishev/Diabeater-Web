// src/ViewModels/AdminStatViewModel.js
import { makeAutoObservable, runInAction } from 'mobx';
import AdminStatService from '../Services/AdminStatService';
import SubscriptionService from '../Services/SubscriptionService';
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
    userAccounts = [];
    allSubscriptions = [];
    selectedUserForManagement = null;

    // Observable for Premium Subscription Price and Features
    premiumSubscriptionPrice = 0;
    premiumFeatures = [];

    // For Nutritionist Application Modals
    showRejectionReasonModal = false;
    rejectionReason = '';

    // NEW: For User History Modal
    selectedUserForHistory = null;
    userSubscriptionHistory = [];
    loadingHistory = false;
    historyError = null;


    constructor() {
        makeAutoObservable(this);
        this.loadDashboardData();
    }

    // --- State Management Actions (unchanged) ---
    setLoading(status) {
        runInAction(() => {
            this.loading = status;
        });
    }

    setError(message) {
        runInAction(() => {
            this.error = message;
            if (message) {
                this.success = null;
                setTimeout(() => {
                    if (this.error === message) {
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
                this.error = null;
                setTimeout(() => {
                    if (this.success === message) {
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

    // Change to arrow function
    clearSelectedUserForManagement = () => { // <--- CHANGE IS HERE
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

    // NEW: User History Modal Actions
    setSelectedUserForHistory = (user) => { // <--- ALSO CHANGE THIS TO ARROW FUNCTION FOR CONSISTENCY
        runInAction(() => {
            this.selectedUserForHistory = user;
            if (user) {
                this.loadUserSubscriptionHistory(user._id);
            } else {
                this.userSubscriptionHistory = [];
                this.loadingHistory = false;
                this.historyError = null;
            }
        });
    }

    // Change to arrow function
    clearSelectedUserForHistory = () => { // <--- CHANGE IS HERE (already done in your code, but re-confirm)
        runInAction(() => {
            this.selectedUserForHistory = null;
            this.userSubscriptionHistory = [];
            this.loadingHistory = false;
            this.historyError = null;
        });
    }

    // This was already an arrow function, which is good.
    loadUserSubscriptionHistory = async (userId) => {
        runInAction(() => {
            this.loadingHistory = true;
            this.historyError = null;
            this.userSubscriptionHistory = []; // Clear previous history
        });
        try {
            const history = await AdminStatService.getUserSubscriptions(userId);
            const sortedHistory = history.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                return dateB - dateA; // Sort descending
            });
            runInAction(() => {
                this.userSubscriptionHistory = sortedHistory;
            });
        } catch (err) {
            console.error("Error fetching user history:", err);
            runInAction(() => {
                this.historyError = "Failed to load user's subscription history.";
            });
        } finally {
            runInAction(() => {
                this.loadingHistory = false;
            });
        }
    }

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
                allSubscriptionsData,
                premiumPrice,
                premiumFeatures
            ] = await Promise.all([
                AdminStatService.getDocumentCount('user_accounts'),
                AdminStatService.getDocumentCount('user_accounts', 'role', '==', 'nutritionist'),
                AdminStatService.getDocumentCount('meal_plans', 'status', '==', 'APPROVED'),
                AdminStatService.getDocumentCount('meal_plans', 'status', '==', 'PENDING_APPROVAL'),
                AdminStatService.getDocumentCount('subscriptions'),
                AdminStatService.getDailySignups(7),
                AdminStatService.getWeeklyTopMealPlans(3),
                AdminStatService.getAllSubscriptions(),
                SubscriptionService.getSubscriptionPrice('premium'),
                SubscriptionService.getPremiumFeatures('premium')
            ]);

            // Format signups
            const processedDailySignups = {};
            const today = moment().startOf('day');
            for (let i = 6; i >= 0; i--) {
                const date = moment(today).subtract(i, 'days');
                processedDailySignups[date.format('YYYY-MM-DD')] = 0;
            }

            dailySignupsRawData.forEach(user => {
                const createdAt = user.createdAt?.toDate ? moment(user.createdAt.toDate()) : null;
                if (createdAt && createdAt.isBetween(moment(today).subtract(7, 'days'), moment(today).add(1, 'day'), null, '[]')) {
                    const key = createdAt.format('YYYY-MM-DD');
                    processedDailySignups[key] = (processedDailySignups[key] || 0) + 1;
                }
            });

            // Group subscriptions by user
            const subsByUser = {};
            for (const sub of allSubscriptionsData) {
                const userId = sub.userId;
                if (!subsByUser[userId]) subsByUser[userId] = [];
                subsByUser[userId].push(sub);
            }

            // Fetch user accounts for those subscriptions
            const userIds = Object.keys(subsByUser);
            const userFetches = await Promise.all(userIds.map(uid => AdminStatService.getUserAccountById(uid)));
            const users = userFetches.filter(Boolean); // remove nulls if any

            // Merge user + latest subscription
            const enrichedUsers = users.map(user => {
                const userSubs = subsByUser[user._id] || [];
                userSubs.sort((a, b) => {
                    const dateA = a.endDate?.toDate?.() || new Date(0);
                    const dateB = b.endDate?.toDate?.() || new Date(0);
                    return dateB - dateA;
                });
                const latestSub = userSubs[0];

                return {
                    ...user,
                    subscriptionStatus: latestSub?.status || 'unknown',
                    subscriptionEndDate: latestSub?.endDate?.toDate?.() || null,
                    currentSubscription: latestSub,
                };
            });

            runInAction(() => {
                this.totalUsers = totalUsers;
                this.totalNutritionists = totalNutritionists;
                this.totalApprovedMealPlans = totalApprovedMealPlans;
                this.totalPendingMealPlans = totalPendingMealPlans;
                this.totalSubscriptions = totalSubscriptions;
                this.dailySignupsData = processedDailySignups;
                this.weeklyTopMealPlans = weeklyTopMealPlans;
                this.allSubscriptions = allSubscriptionsData;
                this.userAccounts = enrichedUsers;
                this.premiumSubscriptionPrice = premiumPrice || 0;
                this.premiumFeatures = premiumFeatures || [];
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


    // ... rest of your AdminStatViewModel methods (updatePremiumSubscriptionPrice, updatePremiumFeatures, suspendUserAccount, etc.)
    // Ensure any methods that are passed as callbacks or event handlers are also arrow functions.
    // For instance, consider making `setLoading`, `setError`, `setSuccess` also arrow functions
    // if they are used as callbacks to other components, although `runInAction` itself provides some binding.
    // Making all methods that mutate state arrow functions is a safe and common MobX practice.

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

    async updatePremiumFeatures(newFeatures) {
        console.log(`[ViewModel] Attempting to update premium features to:`, newFeatures);
        this.setLoading(true);
        this.setError(null);
        this.setSuccess(null);
        try {
            const response = await SubscriptionService.updatePremiumFeatures('premium', newFeatures);

            if (response.success) {
                runInAction(() => {
                    this.premiumFeatures = newFeatures;
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
                this.setRejectionReason('');
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