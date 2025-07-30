// src/ViewModels/AdminStatViewModel.js
import { makeAutoObservable, runInAction } from 'mobx';
import AdminStatService from '../Services/AdminStatService';
import SubscriptionRepository from '../Repositories/SubscriptionRepository';
import moment from 'moment';

class AdminStatViewModel {
    // Dashboard Stats
    totalUsers = 0;
    totalNutritionists = 0;
    totalApprovedMealPlans = 0;
    totalPendingMealPlans = 0;
    totalSubscriptions = 0;
    dailySignupsData = {}; // { 'YYYY-MM-DD': count }
    weeklyTopMealPlans = [];
    userAccounts = [];
    allSubscriptions = []; // Consider if this is strictly needed as observable state
    selectedUserForManagement = null;

    // Observable for Premium Subscription Price and Features
    // IMPORTANT: Initialize these *before* makeAutoObservable is called implicitly by the constructor
    premiumSubscriptionPrice = 0;
    premiumFeatures = []; // This remains an array of strings

    // For Nutritionist Application Modals
    showRejectionReasonModal = false;
    rejectionReason = '';

    // NEW: For User History Modal
    selectedUserForHistory = null;
    userSubscriptionHistory = [];
    loadingHistory = false;
    historyError = null;

    // Status messages
    loading = false;
    error = null;
    success = null;


    constructor() {
        // Initialize properties here if they depend on constructor arguments,
        // otherwise, direct class property initialization is fine.
        makeAutoObservable(this); // Make all defined properties observable

        // Now call methods that depend on observable properties being set up
        this.loadDashboardData();
    }

    // --- State Management Actions (UNCHANGED - these are already arrow-like or bound by makeAutoObservable) ---
    // Methods declared as class properties are automatically bound (arrow-like)
    setLoading = (status) => { // Changed to arrow function for consistency, though makeAutoObservable typically handles simple setters.
        runInAction(() => {
            this.loading = status;
        });
    }

    setError = (message) => { // Changed to arrow function
        runInAction(() => {
            this.error = message;
            if (message) {
                this.success = null;
                setTimeout(() => {
                    if (this.error === message) { // Only clear if it's the same message
                        this.error = null;
                    }
                }, 5000);
            }
        });
    }

    setSuccess = (message) => { // Changed to arrow function
        runInAction(() => {
            this.success = message;
            if (message) {
                this.error = null;
                setTimeout(() => {
                    if (this.success === message) { // Only clear if it's the same message
                        this.success = null;
                    }
                }, 5000);
            }
        });
    }

    setSelectedUserForManagement = (user) => {
        runInAction(() => {
            this.selectedUserForManagement = user;
        });
    }

    clearSelectedUserForManagement = () => {
        runInAction(() => {
            this.selectedUserForManagement = null;
        });
    }

    setShowRejectionReasonModal = (status) => {
        runInAction(() => {
            this.showRejectionReasonModal = status;
        });
    }

    setRejectionReason = (reason) => {
        runInAction(() => {
            this.rejectionReason = reason;
        });
    }

    setSelectedUserForHistory = (user) => {
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

    clearSelectedUserForHistory = () => {
        runInAction(() => {
            this.selectedUserForHistory = null;
            this.userSubscriptionHistory = [];
            this.loadingHistory = false;
            this.historyError = null;
        });
    }

    loadUserSubscriptionHistory = async (userId) => { // Converted to arrow function
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

    // THE KEY CHANGE: Convert this method to an arrow function
    loadDashboardData = async () => {
        console.log("[ViewModel] Starting loadDashboardData...");
        this.setLoading(true);
        // this.setError(null); // REMOVED: Let setError/setSuccess manage clearing
        // this.setSuccess(null); // REMOVED: Let setError/setSuccess manage clearing

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
                premiumFeaturesData
            ] = await Promise.all([
                AdminStatService.getDocumentCount('user_accounts'),
                AdminStatService.getDocumentCount('user_accounts', 'role', '==', 'nutritionist'),
                AdminStatService.getDocumentCount('meal_plans', 'status', '==', 'APPROVED'),
                AdminStatService.getDocumentCount('meal_plans', 'status', '==', 'PENDING_APPROVAL'),
                AdminStatService.getDocumentCount('subscriptions'),
                AdminStatService.getDailySignups(7),
                AdminStatService.getWeeklyTopMealPlans(3),
                AdminStatService.getAllSubscriptions(),
                SubscriptionRepository.getSubscriptionPrice(),
                SubscriptionRepository.getPremiumFeatures()
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
                this.allSubscriptions = allSubscriptionsData; // Kept for now, consider if needed as state
                this.userAccounts = enrichedUsers;
                this.premiumSubscriptionPrice = premiumPrice || 0;
                this.premiumFeatures = premiumFeaturesData || [];
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


    updatePremiumSubscriptionPrice = async (newPrice) => { // Converted to arrow function
        console.log(`[ViewModel] Attempting to update premium subscription price to: ${newPrice}`);
        this.setLoading(true);
        try {
            const response = await SubscriptionRepository.updateSubscriptionPrice(newPrice);

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

    // NEW: CRUD functions for individual premium features (array-based)
    createPremiumFeature = async (featureName) => { // Converted to arrow function
        this.setLoading(true);
        try {
            const result = await SubscriptionRepository.addPremiumFeature(featureName);
            if (result.success) {
                runInAction(() => {
                    this.setSuccess(`Feature "${featureName}" added successfully.`);
                });
                await this.loadDashboardData(); // REFRESH ALL DATA AFTER SUCCESSFUL ADD
                return { success: true };
            } else {
                throw new Error(result.message || "Failed to add feature.");
            }
        } catch (error) {
            console.error("[ViewModel] Error creating premium feature:", error);
            this.setError(`Failed to add feature: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    editPremiumFeature = async (oldFeatureName, newFeatureName) => { // Converted to arrow function
        this.setLoading(true);
        try {
            const result = await SubscriptionRepository.updatePremiumFeature(oldFeatureName, newFeatureName);
            if (result.success) {
                runInAction(() => {
                    this.setSuccess(`Feature updated to "${newFeatureName}" successfully.`);
                });
                await this.loadDashboardData(); // REFRESH ALL DATA AFTER SUCCESSFUL EDIT
                return { success: true };
            } else {
                throw new Error(result.message || 'Failed to update feature.');
            }
        } catch (error) {
            console.error("[ViewModel] Error updating premium feature:", error);
            this.setError(`Failed to update feature: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    removePremiumFeature = async (featureName) => { // Converted to arrow function
        this.setLoading(true);
        try {
            const result = await SubscriptionRepository.deletePremiumFeature(featureName);
            if (result.success) {
                runInAction(() => {
                    this.setSuccess('Feature deleted successfully.');
                });
                await this.loadDashboardData(); // REFRESH ALL DATA AFTER SUCCESSFUL DELETE
                return { success: true };
            } else {
                throw new Error(result.message || 'Failed to delete feature.');
            }
        } catch (error) {
            console.error("[ViewModel] Error deleting premium feature:", error);
            this.setError(`Failed to delete feature: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }


    suspendUserAccount = async (userId, suspend) => { // Converted to arrow function
        this.setLoading(true);
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

    updateUserRole = async (userId, newRole) => { // Converted to arrow function
        this.setLoading(true);
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

    deleteUserAccount = async (userId) => { // Converted to arrow function
        this.setLoading(true);
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

    updateNutritionistStatus = async (userId, newStatus) => { // Converted to arrow function
        this.setLoading(true);
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

    approveNutritionist = async (userId) => { // Converted to arrow function
        this.setLoading(true);
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

    rejectNutritionist = async (userId) => { // Converted to arrow function
        this.setLoading(true);
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

    viewCertificate = async (userId) => { // Converted to arrow function
        this.setLoading(true);
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