import app from '../firebase'; // Assuming your firebase config is here
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
    updateDoc,
    deleteDoc
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
            console.log(`[Service] getAllUserAccounts (role: ${role || 'all'}): Found ${data.length} users. Sample:`, data.slice(0,2));
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
            console.log(`[Service] getAllSubscriptions: Found ${data.length} subscriptions. Sample:`, data.slice(0,2));
            return data;
        } catch (error) {
            console.error('[Service] ERROR fetching subscriptions:', error);
            throw new Error('Failed to fetch subscriptions.');
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
            console.log(`[Service] getDailySignups for last ${days} days: Found ${data.length} signups. Sample:`, data.slice(0,2));
            return data;
        } catch (error) {
            console.error('[Service] ERROR fetching daily signups:', error);
            throw new Error('Failed to fetch daily signups.');
        }
    },

    // ⭐ NEW IMPLEMENTATION FOR GETTING TOP MEAL PLANS BY SAVES
    async getWeeklyTopMealPlans(count = 5) {
        try {
            // Step 1: Fetch all 'saved_meal_plans' to count occurrences
            // WARNING: This can be very inefficient for large 'saved_meal_plans' collections.
            const savedMealPlansSnapshot = await getDocs(collection(db, 'saved_meal_plans'));
            const mealPlanSaves = {};

            // Count saves for each mealPlanId
            savedMealPlansSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.mealPlanId) {
                    mealPlanSaves[data.mealPlanId] = (mealPlanSaves[data.mealPlanId] || 0) + 1;
                }
            });

            // Convert to array and sort by save count
            const sortedMealPlans = Object.entries(mealPlanSaves)
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, count); // Get top 'count' mealPlanIds

            const topMealPlanIds = sortedMealPlans.map(([mealPlanId]) => mealPlanId);

            console.log(`[Service] getWeeklyTopMealPlans: Top ${count} Meal Plan IDs by saves:`, topMealPlanIds);

            if (topMealPlanIds.length === 0) {
                console.log(`[Service] getWeeklyTopMealPlans: No top meal plans found after counting saves.`);
                return [];
            }

            // Step 2: Fetch details of these top meal plans from the 'meal_plans' collection
            // ⭐ IMPORTANT: This assumes your actual meal plan details are in a collection named 'meal_plans'
            // and that these documents have a 'status' field.
            const q = query(
                collection(db, 'meal_plans'), // Querying the collection with actual meal plan details
                where('__name__', 'in', topMealPlanIds), // Query by document ID
                where('status', '==', 'APPROVED') // Filter for approved status
            );

            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));

            // Re-sort the fetched data based on the original sorted order of topMealPlanIds
            // This ensures the order reflects the 'most saved' count correctly
            const orderedData = topMealPlanIds.map(id => data.find(plan => plan._id === id)).filter(Boolean);

            console.log(`[Service] getWeeklyTopMealPlans (top ${count}): Found ${orderedData.length} plans. Sample:`, orderedData.slice(0,2));
            return orderedData;
        } catch (error) {
            console.error('[Service] ERROR fetching weekly top meal plans:', error);
            // It's crucial to return an empty array or handle gracefully here
            // so Promise.all in ViewModel doesn't fail and block other dashboard stats.
            return [];
        }
    },

    async updateUserRole(userId, newRole) {
        try {
            const userRef = doc(db, 'user_accounts', userId);
            await updateDoc(userRef, { role: newRole });
            console.log(`[Service] User ${userId} role updated to ${newRole}`);
            return { success: true };
        } catch (error) {
            console.error(`[Service] ERROR updating user role for ${userId}:`, error);
            throw new Error(`Failed to update user role.`);
        }
    },

    async deleteUserAccount(userId) {
        try {
            await deleteDoc(doc(db, 'user_accounts', userId));
            console.log(`[Service] User account ${userId} deleted.`);
            return { success: true };
        } catch (error) {
            console.error(`[Service] ERROR deleting user account ${userId}:`, error);
            throw new Error(`Failed to delete user account.`);
        }
    },

    async updateNutritionistStatus(userId, newStatus) {
        try {
            const nutritionistRef = doc(db, 'user_accounts', userId);
            await updateDoc(nutritionistRef, { nutritionistStatus: newStatus });
            console.log(`[Service] Nutritionist ${userId} status updated to ${newStatus}`);
            return { success: true };
        } catch (error) {
            console.error(`[Service] ERROR updating nutritionist status for ${userId}:`, error);
            throw new Error(`Failed to update nutritionist status.`);
        }
    },
};

export default AdminStatService;