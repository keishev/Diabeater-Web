// AdminStatService.js
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
// import UserAccountRepository from '../Repositories/UserAccountRepository'; // Only needed if you explicitly use it here directly

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
                _id: doc.id, // Ensure this maps to the document ID in Firestore
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

    async getWeeklyTopMealPlans(count = 5) {
        try {
            const savedMealPlansSnapshot = await getDocs(collection(db, 'saved_meal_plans'));
            const mealPlanSaves = {};

            savedMealPlansSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.mealPlanId) {
                    mealPlanSaves[data.mealPlanId] = (mealPlanSaves[data.mealPlanId] || 0) + 1;
                }
            });

            const sortedMealPlans = Object.entries(mealPlanSaves)
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, count);

            const topMealPlanIds = sortedMealPlans.map(([mealPlanId]) => mealPlanId);

            console.log(`[Service] getWeeklyTopMealPlans: Top ${count} Meal Plan IDs by saves:`, topMealPlanIds);

            if (topMealPlanIds.length === 0) {
                console.log(`[Service] getWeeklyTopMealPlans: No top meal plans found after counting saves.`);
                return [];
            }

            const q = query(
                collection(db, 'meal_plans'),
                where('__name__', 'in', topMealPlanIds), // '__name__' refers to the document ID
                where('status', '==', 'APPROVED')
            );

            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));

            const orderedData = topMealPlanIds.map(id => data.find(plan => plan._id === id)).filter(Boolean);

            console.log(`[Service] getWeeklyTopMealPlans (top ${count}): Found ${orderedData.length} plans. Sample:`, orderedData.slice(0,2));
            return orderedData;
        } catch (error) {
            console.error('[Service] ERROR fetching weekly top meal plans:', error);
            return [];
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

    // ⭐ NEW/MODIFIED: Direct method to update user 'status' field in Firestore
    async updateUserStatus(userId, newStatus) {
        try {
            const userRef = doc(db, 'user_accounts', userId);
            await updateDoc(userRef, { status: newStatus }); // Update the 'status' field
            console.log(`[Service] User ${userId} status updated to ${newStatus}`);
            return { success: true, message: `User status updated to ${newStatus}.` };
        } catch (error) {
            console.error("[AdminStatService] Error updating user status:", error);
            throw new Error(`Failed to update user status in Firebase: ${error.message}`);
        }
    },

    // You had these from your previous snippet, but if updateUserStatus covers it,
    // you might not need to call a separate 'UserAccountRepository' here.
    // If UserAccountRepository does more (e.g., Firebase Auth user disabling),
    // then keep these and ensure ViewModel calls them.
    // For now, I'm commenting them out to avoid confusion if updateUserStatus is sufficient.
    /*
    async suspendUser(userId) {
        try {
            // Assuming UserAccountRepository.suspendUser does more than just update a Firestore field
            const result = await UserAccountRepository.suspendUser(userId);
            console.log(`[Service] User ${userId} suspended via backend (UserAccountRepository).`);
            return result;
        } catch (error) {
            console.error(`[Service] ERROR suspending user ${userId} via backend:`, error);
            throw error;
        }
    },

    async unsuspendUser(userId) {
        try {
            // Assuming UserAccountRepository.unsuspendUser does more than just update a Firestore field
            const result = await UserAccountRepository.unsuspendUser(userId);
            console.log(`[Service] User ${userId} unsuspended via backend (UserAccountRepository).`);
            return result;
        } catch (error) {
            console.error(`[Service] ERROR unsuspending user ${userId} via backend:`, error);
            throw error;
        }
    },
    */
};

export default AdminStatService;