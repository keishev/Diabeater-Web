// src/services/AdminStatService.js
import app from '../firebase'; // Assuming you have your Firebase app initialized here
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    Timestamp,
    orderBy,
    limit,
    startAt,
    getCountFromServer,
    doc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';

const db = getFirestore(app);

const AdminStatService = {
    /**
     * Fetches the total count of documents in a given collection, with optional filtering.
     * @param {string} collectionName - The name of the Firestore collection.
     * @param {string} [field=null] - Optional field name to filter by.
     * @param {string} [operator=null] - Optional operator (e.g., '==', '>', '<').
     * @param {*} [value=null] - Optional value for the filter.
     * @returns {Promise<number>} The total count of documents.
     */
    async getDocumentCount(collectionName, field = null, operator = null, value = null) {
        try {
            let collRef = collection(db, collectionName);
            let q = collRef;
            if (field && operator && value !== null) {
                q = query(collRef, where(field, operator, value));
            }
            const snapshot = await getCountFromServer(q); // Use the potentially filtered query
            return snapshot.data().count;
        } catch (error) {
            console.error(`Error getting document count for ${collectionName}:`, error);
            throw new Error(`Failed to fetch count for ${collectionName}.`);
        }
    },

    /**
     * Fetches user accounts, optionally filtered by role.
     * @param {string} [role=null] - Optional role to filter users by (e.g., 'nutritionist', 'admin', 'user').
     * @returns {Promise<Array<Object>>} An array of user account documents.
     */
    async getAllUserAccounts(role = null) {
        try {
            let q = collection(db, 'user_accounts');
            if (role) {
                q = query(q, where('role', '==', role));
            }
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching all user accounts:', error);
            throw new Error('Failed to fetch user accounts.');
        }
    },

    /**
     * Fetches all subscription data (assuming a 'subscriptions' collection exists).
     * @returns {Promise<Array<Object>>} An array of subscription documents.
     */
    async getAllSubscriptions() {
        try {
            const q = collection(db, 'subscriptions'); // Adjust collection name if different
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            throw new Error('Failed to fetch subscriptions.');
        }
    },

    /**
     * Fetches daily sign-up data for a chart.
     * Assumes user documents have a `createdAt` field (Timestamp or ISO string).
     * @param {number} days - Number of past days to fetch sign-ups for.
     * @returns {Promise<Object>} An object with dates as keys and signup counts as values.
     */
    async getDailySignups(days = 7) {
        try {
            const now = new Date();
            const dates = [];
            for (let i = 0; i < days; i++) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                dates.unshift(d.toISOString().split('T')[0]); // YYYY-MM-DD
            }

            const startDate = new Date();
            startDate.setDate(now.getDate() - days);
            startDate.setHours(0, 0, 0, 0); // Start of the day

            const q = query(
                collection(db, 'user_accounts'),
                where('createdAt', '>=', Timestamp.fromDate(startDate)),
                orderBy('createdAt', 'asc')
            );
            const querySnapshot = await getDocs(q);

            const signupData = dates.reduce((acc, date) => {
                acc[date] = 0;
                return acc;
            }, {});

            querySnapshot.docs.forEach(doc => {
                const userData = doc.data();
                let createdAtDate;
                if (userData.createdAt instanceof Timestamp) {
                    createdAtDate = userData.createdAt.toDate().toISOString().split('T')[0];
                } else if (typeof userData.createdAt === 'string') {
                    createdAtDate = new Date(userData.createdAt).toISOString().split('T')[0];
                }

                if (signupData[createdAtDate] !== undefined) {
                    signupData[createdAtDate]++;
                }
            });

            return signupData;
        } catch (error) {
            console.error('Error fetching daily signups:', error);
            throw new Error('Failed to fetch daily signups.');
        }
    },

    /**
     * Fetches the weekly top meal plans based on a 'views' or 'favorites' count.
     * This assumes meal plans have a `viewsCount` or `favoritesCount` field.
     * Adjust the orderBy field based on your actual data model.
     * @param {number} count - Number of top meal plans to retrieve.
     * @returns {Promise<Array<Object>>} An array of top meal plan documents.
     */
    async getWeeklyTopMealPlans(count = 5) {
        try {
            const q = query(
                collection(db, 'meal_plans'), // Assuming your meal plans are in 'meal_plans'
                where('status', '==', 'APPROVED'), // Only consider approved meal plans
                orderBy('viewsCount', 'desc'), // Or 'favoritesCount' or whatever metric you use
                limit(count)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching weekly top meal plans:', error);
            throw new Error('Failed to fetch top meal plans.');
        }
    },

    /**
     * Fetches all documents from a specified collection.
     * Useful for general "insights" if you have a separate collection for admin insights.
     * @param {string} collectionName - The name of the Firestore collection.
     * @returns {Promise<Array<Object>>} An array of documents from the collection.
     */
    async getInsightsData(collectionName = 'admin_insights') {
        try {
            const q = collection(db, collectionName);
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching insights data:', error);
            throw new Error('Failed to fetch insights data.');
        }
    },

    /**
     * Fetches a list of all user accounts for display and management.
     * @returns {Promise<Array<Object>>} An array of user account documents.
     */
    async getAllUsersForManagement() {
        try {
            const q = collection(db, 'user_accounts');
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching all users for management:', error);
            throw new Error('Failed to fetch users for management.');
        }
    },

    /**
     * Updates a user's role in the 'user_accounts' collection.
     * @param {string} userId - The ID of the user to update.
     * @param {string} newRole - The new role to assign (e.g., 'user', 'nutritionist', 'admin').
     * @returns {Promise<void>}
     */
    async updateUserRole(userId, newRole) {
        try {
            const userDocRef = doc(db, 'user_accounts', userId);
            await updateDoc(userDocRef, { role: newRole });
        } catch (error) {
            console.error(`Error updating role for user ${userId}:`, error);
            throw new Error(`Failed to update user role.`);
        }
    },

    /**
     * Deletes a user's account from the 'user_accounts' collection.
     * IMPORTANT: This only deletes the Firestore document. You might also need to delete the Firebase Authentication user.
     * Deleting Firebase Auth users usually requires a server-side Admin SDK call (e.g., Cloud Function).
     * @param {string} userId - The ID of the user to delete.
     * @returns {Promise<void>}
     */
    async deleteUserAccount(userId) {
        try {
            const userDocRef = doc(db, 'user_accounts', userId);
            await deleteDoc(userDocRef);
            // Consider adding Firebase Auth user deletion here via a Cloud Function call if implemented
        } catch (error) {
            console.error(`Error deleting user ${userId}:`, error);
            throw new Error(`Failed to delete user account.`);
        }
    },

    /**
     * Updates a nutritionist's status.
     * @param {string} nutritionistId - The ID of the nutritionist to update.
     * @param {string} newStatus - The new status (e.g., 'Active', 'Pending', 'Suspended').
     * @returns {Promise<void>}
     */
    async updateNutritionistStatus(nutritionistId, newStatus) {
        try {
            const userDocRef = doc(db, 'user_accounts', nutritionistId);
            await updateDoc(userDocRef, { status: newStatus });
        } catch (error) {
            console.error(`Error updating nutritionist status for ${nutritionistId}:`, error);
            throw new Error(`Failed to update nutritionist status.`);
        }
    }
};

export default AdminStatService;