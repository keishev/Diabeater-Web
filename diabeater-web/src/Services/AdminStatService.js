// src/services/AdminStatService.js
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
    // startAt, // Not used in provided snippet, but keeping for reference if needed
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
            console.log(`[Service] getDocumentCount for '${collectionName}' (Field: ${field || 'N/A'}, Value: ${value || 'N/A'}): ${count}`); // <--- ADDED LOG
            return count;
        } catch (error) {
            console.error(`[Service] ERROR getting document count for '${collectionName}':`, error); // <--- IMPROVED ERROR LOG
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
            console.log(`[Service] getAllUserAccounts (role: ${role || 'all'}): Found ${data.length} users. Sample:`, data.slice(0,2)); // <--- ADDED LOG (showing sample to avoid massive logs)
            return data;
        } catch (error) {
            console.error('[Service] ERROR fetching all user accounts:', error); // <--- IMPROVED ERROR LOG
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
            console.log(`[Service] getAllSubscriptions: Found ${data.length} subscriptions. Sample:`, data.slice(0,2)); // <--- ADDED LOG
            return data;
        } catch (error) {
            console.error('[Service] ERROR fetching subscriptions:', error); // <--- IMPROVED ERROR LOG
            throw new Error('Failed to fetch subscriptions.');
        }
    },

    async getDailySignups(days = 7) {
        try {
            const now = new Date();
            const startDate = new Date();
            startDate.setDate(now.getDate() - days);
            startDate.setHours(0, 0, 0, 0);

            // Using Timestamp.fromDate for accurate Firestore comparisons
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
            console.log(`[Service] getDailySignups for last ${days} days: Found ${data.length} signups. Sample:`, data.slice(0,2)); // <--- ADDED LOG
            return data;
        } catch (error) {
            console.error('[Service] ERROR fetching daily signups:', error); // <--- IMPROVED ERROR LOG
            throw new Error('Failed to fetch daily signups.');
        }
    },

    async getWeeklyTopMealPlans(count = 5) {
        try {
            const q = query(
                collection(db, 'meal_plans'), // <--- This is the collection being queried
                where('status', '==', 'APPROVED'),
                orderBy('viewsCount', 'desc'),
                limit(count)
            );
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));
            console.log(`[Service] getWeeklyTopMealPlans (top ${count}): Found ${data.length} plans. Sample:`, data.slice(0,2));
            return data;
        } catch (error) {
            console.error('[Service] ERROR fetching weekly top meal plans:', error); // This is the error point
            throw new Error('Failed to fetch top meal plans.');
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