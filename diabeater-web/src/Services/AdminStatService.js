import app from '../firebase'; 
import moment from 'moment';
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    Timestamp,
    orderBy,
    limit,
    getCountFromServer,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
} from 'firebase/firestore';

const db = getFirestore(app);

const AdminStatService = {
    async getDocumentCount(collectionName, field = null, operator = null, value = null) {
        try {
            let collRef = collection(db, collectionName);
            let q = collRef;
            if (field && operator && value !== null) {
                q = query(collRef, where(field, operator, value));
            }
            const snapshot = await getCountFromServer(q);
            const count = snapshot.data().count;
            console.log(`[Service] getDocumentCount for '${collectionName}' (Field: ${field || 'N/A'}, Value: ${value || 'N/A'}): ${count}`);
            return count;
        } catch (error) {
            console.error(`[Service] ERROR getting document count for '${collectionName}':`, error);
            throw new Error(`Failed to fetch count for ${collectionName}.`);
        }
    },


/**
 * Get current month's revenue from subscriptions
 * @param {number} year - Year (default: current year)
 * @param {number} month - Month 1-12 (default: current month)
 * @returns {Promise<{revenue: number, subscriptions: Array}>}
 */
async getCurrentMonthRevenue(year = null, month = null) {
    try {
        const now = new Date();
        const targetYear = year || now.getFullYear();
        const targetMonth = month || (now.getMonth() + 1); 
        
        console.log(`[Service] Calculating revenue for ${targetMonth}/${targetYear}`);
        
        
        const startDate = new Date(targetYear, targetMonth - 1, 1); 
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999); 
        
        console.log(`[Service] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        
        const subscriptionsRef = collection(db, 'subscriptions');
        const q = query(
            subscriptionsRef,
            where('createdAt', '>=', Timestamp.fromDate(startDate)),
            where('createdAt', '<=', Timestamp.fromDate(endDate))
        );

        const querySnapshot = await getDocs(q);
        const subscriptions = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`[Service] Found ${subscriptions.length} subscriptions for ${targetMonth}/${targetYear}`);

        
        let totalRevenue = 0;
        let processedCount = 0;
        
        subscriptions.forEach(sub => {
            console.log(`[Service] Processing subscription ${sub.id}:`, {
                status: sub.status,
                type: sub.type,
                price: sub.price,
                priceType: typeof sub.price
            });
            
            
            if (typeof sub.price === 'number' && !isNaN(sub.price) && sub.price > 0) {
                totalRevenue += sub.price;
                processedCount++;
                console.log(`[Service] Added ${sub.price} to revenue. Total: ${totalRevenue}`);
            } else {
                console.log(`[Service] Skipping subscription ${sub.id} - invalid price:`, sub.price);
            }
        });

        console.log(`[Service] Final revenue calculation: ${totalRevenue} from ${processedCount}/${subscriptions.length} subscriptions`);

        return {
            revenue: totalRevenue,
            subscriptions: subscriptions,
            processedCount: processedCount,
            month: targetMonth,
            year: targetYear
        };

    } catch (error) {
        console.error("[Service] Error calculating current month revenue:", error);
        throw new Error(`Failed to calculate monthly revenue: ${error.message}`);
    }
},

/**
 * Get cancelled subscriptions count for current month
 * @param {number} year - Year (default: current year)
 * @param {number} month - Month 1-12 (default: current month)
 * @returns {Promise<{count: number, subscriptions: Array}>}
 */
async getCurrentMonthCancelledSubscriptions(year = null, month = null) {
    try {
        const now = new Date();
        const targetYear = year || now.getFullYear();
        const targetMonth = month || (now.getMonth() + 1);
        
        console.log(`[Service] Calculating cancelled subscriptions for ${targetMonth}/${targetYear}`);
        const subscriptionsRef = collection(db, 'subscriptions');
        const q = query(
            subscriptionsRef,
            where('status', '==', 'canceled') 
        );

        const querySnapshot = await getDocs(q);
        const allCancelledSubs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`[Service] Found ${allCancelledSubs.length} total cancelled subscriptions`);

        
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
        
        const currentMonthCancelled = allCancelledSubs.filter(sub => {
            
            const cancelDate = sub.updatedAt?.toDate() || sub.createdAt?.toDate();
            
            if (!cancelDate) {
                console.log(`[Service] No date found for cancelled subscription ${sub.id}`);
                return false;
            }
            
            const isInRange = cancelDate >= startDate && cancelDate <= endDate;
            if (isInRange) {
                console.log(`[Service] Cancelled subscription ${sub.id} cancelled on ${cancelDate.toISOString()}`);
            }
            
            return isInRange;
        });

        console.log(`[Service] ${currentMonthCancelled.length} subscriptions cancelled in ${targetMonth}/${targetYear}`);

        return {
            count: currentMonthCancelled.length,
            subscriptions: currentMonthCancelled,
            month: targetMonth,
            year: targetYear
        };

    } catch (error) {
        console.error("[Service] Error calculating cancelled subscriptions:", error);
        throw new Error(`Failed to calculate cancelled subscriptions: ${error.message}`);
    }
},
    async getAllUserAccounts(role = null) {
        try {
            let q = collection(db, 'user_accounts');
            if (role) {
                q = query(q, where('role', '==', role));
            }
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));
            console.log(`[Service] getAllUserAccounts (role: ${role || 'all'}): Found ${data.length} users. Sample:`, data.slice(0, 2));
            return data;
        } catch (error) {
            console.error('[Service] ERROR fetching all user accounts:', error);
            throw new Error('Failed to fetch user accounts.');
        }
    },

    async getAllSubscriptions() {
        try {
            const q = collection(db, 'subscriptions');
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));
            console.log(`[Service] getAllSubscriptions: Found ${data.length} subscriptions. Sample:`, data.slice(0, 2));
            return data;
        } catch (error) {
            console.error('[Service] ERROR fetching subscriptions:', error);
            throw new Error('Failed to fetch subscriptions.');
        }
    },

    async getAllSubscriptionsGroupedByUser() {
        try {
            console.log("[Service] Fetching all subscriptions grouped by user...");
            const snapshot = await getDocs(collection(db, 'subscriptions'));

            const grouped = {}; 

            for (const doc of snapshot.docs) {
                const data = doc.data();
                const userId = data['userId'];
                if (userId) { 
                    if (!grouped[userId]) {
                        grouped[userId] = [];
                    }
                    grouped[userId].push({
                        ...data,
                        id: doc.id, 
                    });
                }
            }
            console.log(`[Service] getAllSubscriptionsGroupedByUser: Grouped subscriptions for ${Object.keys(grouped).length} users.`);
            return grouped;
        } catch (error) {
            console.error('[Service] ERROR fetching and grouping subscriptions:', error);
            throw new Error('Failed to fetch and group subscriptions.');
        }
    },

    async getUserAccountById(userId) {
        try {
            console.log(`[Service] Fetching user account for ID: ${userId}`);
            const docRef = doc(db, 'user_accounts', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log(`[Service] Found user account for ID: ${userId}`);
                return {
                    _id: docSnap.id,
                    ...docSnap.data()
                };
            } else {
                console.log(`[Service] No user account found for ID: ${userId}`);
                return null;
            }
        } catch (error) {
            console.error(`[Service] ERROR fetching user account by ID ${userId}:`, error);
            throw new Error(`Failed to fetch user account by ID: ${error.message}`);
        }
    },

    async getUserSubscriptions(userId) {
        try {
            console.log(`[Service] Fetching subscriptions for user ID: ${userId}`);
            const q = query(
                collection(db, 'subscriptions'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));
            console.log(`[Service] getUserSubscriptions for ${userId}: Found ${data.length} subscriptions.`);
            return data;
        } catch (error) {
            console.error(`[Service] ERROR fetching subscriptions for user ID ${userId}:`, error);
            throw new Error(`Failed to fetch user subscriptions: ${error.message}`);
        }
    },

    
    
    async getSubscriptionsByMonth(year, month) {
        try {
            
            const startDate = new Date(year, month - 1, 1); 
            const endDate = new Date(year, month, 0); 

            const subscriptionsRef = collection(db, 'subscriptions');
            const q = query(
                subscriptionsRef,
                where('createdAt', '>=', Timestamp.fromDate(startDate)),
                where('createdAt', '<=', Timestamp.fromDate(endDate))
            );

            const querySnapshot = await getDocs(q);
            const subscriptions = querySnapshot.docs.map(doc => ({
                id: doc.id, 
                ...doc.data()
            }));

            console.log(`[AdminStatService] Fetched ${subscriptions.length} subscriptions for ${month}/${year}`);
            return { success: true, subscriptions: subscriptions };
        } catch (error) {
            console.error("[AdminStatService] Error fetching subscriptions by month:", error);
            return { success: false, error: error.message, subscriptions: [] };
        }
    },

    async getDailySignups(days = 7) {
        try {
            const now = new Date();
            const startDate = new Date();
            startDate.setDate(now.getDate() - days);
            startDate.setHours(0, 0, 0, 0);

            const q = query(
                collection(db, 'user_accounts'),
                where('createdAt', '>=', Timestamp.fromDate(startDate)),
                orderBy('createdAt', 'asc')
            );
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));
            console.log(`[Service] getDailySignups for last ${days} days: Found ${data.length} signups. Sample:`, data.slice(0, 2));
            return data;
        } catch (error) {
            console.error('[Service] ERROR fetching daily signups:', error);
            throw new Error('Failed to fetch daily signups.');
        }
    },

async getWeeklyTopMealPlans(count = 3) {
    try {
        console.log("=== Starting getWeeklyTopMealPlans (No Index Version) ===");
        
        
        console.log("Step 1: Fetching all saved_meal_plans...");
        const allSavedPlansSnapshot = await getDocs(collection(db, 'saved_meal_plans'));
        console.log("Total saved_meal_plans documents:", allSavedPlansSnapshot.size);
        
        if (allSavedPlansSnapshot.size === 0) {
            console.log("No saved_meal_plans found - using fallback to top meal plans by saveCount");
            return await this.getFallbackTopMealPlans(count);
        }

        
        const sevenDaysAgo = moment().subtract(7, 'days').toDate();
        console.log("Filtering saves from:", sevenDaysAgo);
        
        
        const recentMealPlanSaves = {};
        let totalRecentSaves = 0;
        
        allSavedPlansSnapshot.docs.forEach(doc => {
            const data = doc.data();
            
            
            if (!data.mealPlanId) {
                console.log("Missing mealPlanId in document:", doc.id);
                return;
            }
            
            if (!data.createdAt) {
                console.log("Missing createdAt in document:", doc.id);
                return;
            }
            
            
            const createdAt = data.createdAt.toDate();
            if (createdAt >= sevenDaysAgo) {
                recentMealPlanSaves[data.mealPlanId] = (recentMealPlanSaves[data.mealPlanId] || 0) + 1;
                totalRecentSaves++;
            }
        });

        console.log(`Found ${totalRecentSaves} saves in last 7 days for ${Object.keys(recentMealPlanSaves).length} meal plans`);
        console.log("Recent meal plan saves:", recentMealPlanSaves);

        
        if (Object.keys(recentMealPlanSaves).length === 0) {
            console.log("No recent saves found - using fallback to top meal plans by saveCount");
            return await this.getFallbackTopMealPlans(count);
        }

        
        const sortedMealPlans = Object.entries(recentMealPlanSaves)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, count);

        console.log("Top meal plans by recent saves:", sortedMealPlans);

        
        const mealPlanPromises = sortedMealPlans.map(async ([mealPlanId, recentSaveCount]) => {
            try {
                const docRef = doc(db, 'meal_plans', mealPlanId);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    console.log(`Meal plan ${mealPlanId}:`, {
                        name: data.name,
                        status: data.status,
                        recentSaves: recentSaveCount,
                        totalSaves: data.saveCount
                    });
                    
                    
                    if (data.status === 'APPROVED') {
                        return {
                            _id: docSnap.id,
                            ...data,
                            saveCount: recentSaveCount, 
                            totalSaveCount: data.saveCount || 0 
                        };
                    } else {
                        console.log(`Meal plan ${mealPlanId} not approved (status: ${data.status})`);
                    }
                } else {
                    console.log(`Meal plan ${mealPlanId} does not exist`);
                }
                return null;
            } catch (error) {
                console.error("Error fetching meal plan:", mealPlanId, error);
                return null;
            }
        });

        const validMealPlans = (await Promise.all(mealPlanPromises)).filter(Boolean);
        
        console.log(`Returning ${validMealPlans.length} approved meal plans with recent saves`);
        
        
        if (validMealPlans.length === 0) {
            console.log("No approved meal plans from recent saves - using fallback");
            return await this.getFallbackTopMealPlans(count);
        }
        
        return validMealPlans;
        
    } catch (error) {
        console.error('[Service] ERROR fetching weekly top meal plans:', error);
        
        return await this.getFallbackTopMealPlans(count);
    }
},


async getFallbackTopMealPlans(count = 3) {
    try {
        console.log("=== Using Fallback: Top Meal Plans by Overall SaveCount ===");
        
        
        try {
            const topMealPlansQuery = query(
                collection(db, 'meal_plans'),
                where('status', '==', 'APPROVED'),
                orderBy('saveCount', 'desc'),
                limit(count)
            );
            
            const topMealPlansSnapshot = await getDocs(topMealPlansQuery);
            
            if (!topMealPlansSnapshot.empty) {
                const topMealPlans = topMealPlansSnapshot.docs.map(doc => ({
                    _id: doc.id,
                    ...doc.data()
                }));
                
                console.log(`Fallback: Found ${topMealPlans.length} approved meal plans with highest saveCount`);
                return topMealPlans;
            }
        } catch (indexError) {
            console.log("OrderBy query failed (missing index), trying manual sort...");
        }
        
        
        const allApprovedQuery = query(
            collection(db, 'meal_plans'),
            where('status', '==', 'APPROVED')
        );
        
        const allApprovedSnapshot = await getDocs(allApprovedQuery);
        
        if (allApprovedSnapshot.empty) {
            console.log("No approved meal plans found at all");
            return [];
        }
        
        const allApproved = allApprovedSnapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data()
        }));
        
        
        const sortedByTotalSaves = allApproved
            .sort((a, b) => (b.saveCount || 0) - (a.saveCount || 0))
            .slice(0, count);
        
        console.log(`Fallback: Returning ${sortedByTotalSaves.length} meal plans sorted by total saveCount`);
        return sortedByTotalSaves;
        
    } catch (error) {
        console.error("Fallback also failed:", error);
        return [];
    }
},
    async getMealPlans() {
        try {
            const q = collection(db, 'meal_plans');
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));
            console.log(`[Service] getMealPlans: Found ${data.length} meal plans.`);
            return data;
        } catch (error) {
            console.error('[Service] ERROR fetching meal plans:', error);
            throw new Error('Failed to fetch meal plans.');
        }
    },

    async updateUserRole(userId, newRole) {
        try {
            const userRef = doc(db, 'user_accounts', userId);
            await updateDoc(userRef, { role: newRole });
            console.log(`[Service] User ${userId} role updated to ${newRole}`);
            return { success: true, message: `User role updated to ${newRole}.` };
        } catch (error) {
            console.error(`[Service] ERROR updating user role for ${userId}:`, error);
            throw new Error(`Failed to update user role: ${error.message}`);
        }
    },

    async deleteUserAccount(userId) {
        try {
            await deleteDoc(doc(db, 'user_accounts', userId));
            console.log(`[Service] User account ${userId} deleted.`);
            return { success: true, message: `User account ${userId} deleted.` };
        } catch (error) {
            console.error(`[Service] ERROR deleting user account ${userId}:`, error);
            throw new Error(`Failed to delete user account: ${error.message}`);
        }
    },

    async updateNutritionistStatus(userId, newStatus) {
        try {
            const nutritionistRef = doc(db, 'user_accounts', userId);
            await updateDoc(nutritionistRef, { nutritionistStatus: newStatus });
            console.log(`[Service] Nutritionist ${userId} status updated to ${newStatus}`);
            return { success: true, message: `Nutritionist status updated to ${newStatus}.` };
        } catch (error) {
            console.error(`[Service] ERROR updating nutritionist status for ${userId}:`, error);
            throw new Error(`Failed to update nutritionist status: ${error.message}`);
        }
    },

    async updateUserStatus(userId, newStatus) {
        try {
            const userRef = doc(db, 'user_accounts', userId);
            await updateDoc(userRef, { status: newStatus });
            console.log(`[Service] User ${userId} status updated to ${newStatus}`);
            return { success: true, message: `User status updated to ${newStatus}.` };
        } catch (error) {
            console.error("[AdminStatService] Error updating user status:", error);
            throw new Error(`Failed to update user status in Firebase: ${error.message}`);
        }
    },
};

export default AdminStatService;