// src/ViewModels/AdminStatViewModel.js
import { makeAutoObservable, runInAction } from 'mobx';
import AdminStatService from '../Services/AdminStatService';
import AdminStatRepository from '../Repositories/AdminStatRepository';
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
    allSubscriptions = [];
    selectedUserForManagement = null;

    // Corrected: New states for Monthly Revenue and Cancelled Subscriptions
    monthlyRevenue = 0;
    cancelledSubscriptionsCount = 0;

    // For Nutritionist Application Modals
    showRejectionReasonModal = false;
    rejectionReason = '';

    // For User History Modal
    selectedUserForHistory = null;
    userSubscriptionHistory = [];
    loadingHistory = false;
    historyError = null;

    // Status messages
    loading = false;
    error = null;
    success = null;


    constructor() {
        makeAutoObservable(this);
        this.loadDashboardData();
    }

    // --- State Management Actions ---
    setLoading = (status) => {
        runInAction(() => {
            this.loading = status;
        });
    }

    setError = (message) => {
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

    setSuccess = (message) => {
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

    loadUserSubscriptionHistory = async (userId) => {
        runInAction(() => {
            this.loadingHistory = true;
            this.historyError = null;
            this.userSubscriptionHistory = [];
        });
        try {
            const history = await AdminStatService.getUserSubscriptions(userId);
            const sortedHistory = history.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                return dateB - dateA; // Sort descending (latest first)
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
// Add this method to your AdminStatViewModel.js for flexibility

/**
 * Get revenue for a specific month/year
 * @param {number} month - Month (1-12), default current month
 * @param {number} year - Year, default current year
 */
getMonthlyRevenue = async (month = null, year = null) => {
    this.setLoading(true);
    try {
        const now = new Date();
        const targetMonth = month || (now.getMonth() + 1);
        const targetYear = year || now.getFullYear();
        
        console.log(`[AdminStatViewModel] Getting revenue for ${targetMonth}/${targetYear}`);
        
        const revenueData = await AdminStatService.getCurrentMonthRevenue(targetYear, targetMonth);
        const cancelledData = await AdminStatService.getCurrentMonthCancelledSubscriptions(targetYear, targetMonth);
        
        runInAction(() => {
            this.monthlyRevenue = revenueData.revenue || 0;
            this.cancelledSubscriptionsCount = cancelledData.count || 0;
        });
        
        this.setSuccess(`Revenue data loaded for ${moment(`${targetYear}-${targetMonth}`, 'YYYY-M').format('MMMM YYYY')}`);
        
        return {
            revenue: revenueData.revenue,
            cancelledCount: cancelledData.count,
            month: targetMonth,
            year: targetYear,
            subscriptionsProcessed: revenueData.processedCount,
            totalSubscriptions: revenueData.subscriptions.length
        };
        
    } catch (error) {
        console.error("[AdminStatViewModel] Error getting monthly revenue:", error);
        this.setError(`Failed to get monthly revenue: ${error.message}`);
        return null;
    } finally {
        this.setLoading(false);
    }
}

/**
 * Get revenue comparison between months
 * @param {Array} months - Array of {month, year} objects
 */
getRevenueComparison = async (months) => {
    this.setLoading(true);
    try {
        const results = await Promise.all(
            months.map(({month, year}) => 
                AdminStatService.getCurrentMonthRevenue(year, month)
            )
        );
        
        const comparison = results.map((result, index) => ({
            month: months[index].month,
            year: months[index].year,
            revenue: result.revenue,
            subscriptions: result.subscriptions.length,
            label: moment(`${months[index].year}-${months[index].month}`, 'YYYY-M').format('MMM YYYY')
        }));
        
        console.log("[AdminStatViewModel] Revenue comparison:", comparison);
        return comparison;
        
    } catch (error) {
        console.error("[AdminStatViewModel] Error getting revenue comparison:", error);
        this.setError(`Failed to get revenue comparison: ${error.message}`);
        return [];
    } finally {
        this.setLoading(false);
    }
}

   // Update the loadDashboardData method in your AdminStatViewModel.js

loadDashboardData = async () => {
    console.log("[AdminStatViewModel] Starting loadDashboardData...");
    this.setLoading(true);

    try {
        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();
        
        console.log(`[AdminStatViewModel] Calculating stats for ${currentMonth}/${currentYear}`);

        const [
            totalUsers,
            totalNutritionists,
            totalApprovedMealPlans,
            totalPendingMealPlans,
            totalSubscriptions,
            dailySignupsRawData,
            weeklyTopMealPlans,
            monthlyRevenueData,
            cancelledSubscriptionsData,
        ] = await Promise.all([
            AdminStatService.getDocumentCount('user_accounts'),
            AdminStatService.getDocumentCount('user_accounts', 'role', '==', 'nutritionist'),
            AdminStatService.getDocumentCount('meal_plans', 'status', '==', 'APPROVED'),
            AdminStatService.getDocumentCount('meal_plans', 'status', '==', 'PENDING_APPROVAL'),
            AdminStatService.getDocumentCount('subscriptions'),
            AdminStatService.getDailySignups(7),
            AdminStatService.getWeeklyTopMealPlans(3),
            AdminStatService.getCurrentMonthRevenue(currentYear, currentMonth), // NEW: Get current month revenue
            AdminStatService.getCurrentMonthCancelledSubscriptions(currentYear, currentMonth), // NEW: Get current month cancellations
        ]);

        console.log("=== MONTHLY REVENUE DATA ===");
        console.log("monthlyRevenueData:", monthlyRevenueData);
        console.log("Monthly revenue amount:", monthlyRevenueData.revenue);
        console.log("Subscriptions processed:", monthlyRevenueData.processedCount);
        console.log("Total subscriptions found:", monthlyRevenueData.subscriptions?.length);

        console.log("=== CANCELLED SUBSCRIPTIONS DATA ===");
        console.log("cancelledSubscriptionsData:", cancelledSubscriptionsData);
        console.log("Cancelled count:", cancelledSubscriptionsData.count);

        console.log("[AdminStatViewModel] Raw data fetched successfully.");

        // Process daily signups (keep existing logic)
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

        // Get all subscriptions for user account enrichment (keep existing logic)
        const allSubscriptionsData = await AdminStatService.getAllSubscriptions();
        
        // Group subscriptions by user for `userAccounts` enrichment
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
                return dateB - dateA; // Latest end date first
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

            // FIXED: Use the properly calculated current month values
            this.monthlyRevenue = monthlyRevenueData.revenue || 0;
            this.cancelledSubscriptionsCount = cancelledSubscriptionsData.count || 0;
            
            console.log(`[AdminStatViewModel] State updated for ${currentMonth}/${currentYear}:`);
            console.log("- Monthly revenue:", this.monthlyRevenue);
            console.log("- Cancelled subscriptions:", this.cancelledSubscriptionsCount);
        });

        console.log("=== VIEWMODEL FINAL STATE ===");
        console.log("this.totalUsers:", this.totalUsers);
        console.log("this.totalNutritionists:", this.totalNutritionists);
        console.log("this.totalApprovedMealPlans:", this.totalApprovedMealPlans);
        console.log("this.totalPendingMealPlans:", this.totalPendingMealPlans);
        console.log("this.totalSubscriptions:", this.totalSubscriptions);
        console.log("this.monthlyRevenue:", this.monthlyRevenue);
        console.log("this.cancelledSubscriptionsCount:", this.cancelledSubscriptionsCount);

        console.log("[AdminStatViewModel] Dashboard data loaded successfully.");
        this.setSuccess(`Dashboard data refreshed for ${moment().format('MMMM YYYY')}.`);

    } catch (error) {
        console.error("[AdminStatViewModel] Error in loadDashboardData:", error);
        this.setError(`Failed to load dashboard data: ${error.message}`);
        // Reset calculated values on error
        runInAction(() => {
            this.monthlyRevenue = 0;
            this.cancelledSubscriptionsCount = 0;
        });
    } finally {
        this.setLoading(false);
    }
}

    // ... (rest of your methods unchanged)
    suspendUserAccount = async (userId, suspend) => {
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
            console.error(`[AdminStatViewModel] Error ${suspend ? 'suspending' : 'unsuspending'} user:`, error);
            this.setError(`Failed to ${suspend ? 'suspend' : 'unsuspend'} user: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    updateUserRole = async (userId, newRole) => {
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
            console.error("[AdminStatViewModel] Error updating user role:", error);
            this.setError(`Failed to update user role: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    deleteUserAccount = async (userId) => {
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
            console.error("[AdminStatViewModel] Error deleting user account:", error);
            this.setError(`Failed to delete user account: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    updateNutritionistStatus = async (userId, newStatus) => {
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
            console.error("[AdminStatViewModel] Error updating nutritionist status:", error);
            this.setError(`Failed to update nutritionist status: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    approveNutritionist = async (userId) => {
        this.setLoading(true);
        try {
            const response = await AdminStatService.updateUserStatus(userId, 'Active');
            if (response.success) {
                runInAction(() => {
                    const userIndex = this.userAccounts.findIndex(u => u._id === userId);
                    if (userIndex > -1) {
                        this.userAccounts[userIndex].status = 'Active';
                        this.userAccounts[userIndex].role = 'nutritionist'; // Assuming approval sets role to nutritionist
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
            console.error("[AdminStatViewModel] Error approving nutritionist:", error);
            this.setError(`Failed to approve nutritionist: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    rejectNutritionist = async (userId) => {
        this.setLoading(true);
        try {
            const response = await AdminStatService.updateUserStatus(userId, 'rejected'); // Reason not passed here
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
            console.error("[AdminStatViewModel] Error rejecting nutritionist:", error);
            this.setError(`Failed to reject nutritionist: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    viewCertificate = async (userId) => {
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
            console.error("[AdminStatViewModel] Error viewing certificate:", error);
            this.setError(`Failed to view certificate: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }
}

const adminStatViewModel = new AdminStatViewModel();
export default adminStatViewModel;