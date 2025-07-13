// src/repositories/AdminReportRepository.js
import app from '../firebase'; // Your Firebase app initialization
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs, // Not used in current overall report, but good to have
    getCountFromServer,
    Timestamp
} from 'firebase/firestore';

const db = getFirestore(app);

const AdminReportRepository = {
    /**
     * Get count of documents in a collection, with optional filtering.
     * @param {string} collectionName
     * @param {string} [field=null]
     * @param {string} [operator=null]
     * @param {*} [value=null]
     * @returns {Promise<number>}
     */
    async getDocumentCount(collectionName, field = null, operator = null, value = null) {
        try {
            let collRef = collection(db, collectionName);
            let q = collRef;
            if (field && operator && value !== null) {
                q = query(collRef, where(field, operator, value));
            }
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
        } catch (error) {
            console.error(`Repo Error: Failed to get document count for ${collectionName}:`, error);
            throw new Error(`Failed to fetch count for ${collectionName}.`);
        }
    },

    /**
     * Get count of daily logins for the last 24 hours.
     * This counts unique users who have a 'lastLogin' timestamp within the past 24 hours.
     * This is an approximation for "average daily logins".
     * @returns {Promise<number>}
     */
    async getApproxAverageDailyLogins() {
        try {
            // Get Timestamp for 24 hours ago
            const twentyFourHoursAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
            const q = query(
                collection(db, 'user_accounts'), // Assumes 'user_accounts' collection
                where('lastLogin', '>=', twentyFourHoursAgo) // Assumes 'lastLogin' field exists and is a Timestamp
            );
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
        } catch (error) {
            console.error('Repo Error: Failed to get approximate daily logins:', error);
            return 0; // Return 0 if there's an error or no data
        }
    },

    // getAllUsers, getAllMealPlans, getAllSubscriptionsData are not directly used by the single overall report
    // but are fine to keep if other parts of your app use them or for future expansion.
};

export default AdminReportRepository;