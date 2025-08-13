// src/repositories/AdminReportRepository.js
import app from '../firebase';
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    getCountFromServer,
    Timestamp,
    orderBy,
    limit
} from 'firebase/firestore';

const db = getFirestore(app);

const AdminReportRepository = {
    /**
     * Get count of documents in a collection, with optional filtering.
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
     * Get all users with role 'premium' - this gives us total subscriptions
     */
    async getPremiumUsers() {
        try {
            const q = query(
                collection(db, 'user_accounts'),
                where('role', '==', 'premium')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Repo Error: Failed to get premium users:', error);
            throw new Error('Failed to fetch premium users data.');
        }
    },

    /**
     * FIXED: Get active subscriptions from subscriptions collection with status "active"
     */
    async getActiveSubscriptions() {
        try {
            const q = query(
                collection(db, 'subscriptions'),
                where('status', '==', 'active')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Repo Error: Failed to get active subscriptions:', error);
            throw new Error('Failed to fetch active subscriptions data.');
        }
    },

    /**
     * Get all subscriptions data for revenue calculations
     */
    async getAllSubscriptions() {
        try {
            const q = collection(db, 'subscriptions');
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Repo Error: Failed to get all subscriptions:', error);
            throw new Error('Failed to fetch subscriptions data.');
        }
    },

    /**
     * Get all meal plans and calculate total save count
     */
    async getAllMealPlansWithSaveCounts() {
        try {
            const q = collection(db, 'meal_plans');
            const querySnapshot = await getDocs(q);
            const mealPlans = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Calculate total saves from all meal plans
            const totalSaves = mealPlans.reduce((total, mealPlan) => {
                const saveCount = mealPlan.saveCount || 0;
                return total + (typeof saveCount === 'number' ? saveCount : 0);
            }, 0);

            console.log('[AdminReportRepository] Calculated total saves from meal plans:', totalSaves);
            console.log('[AdminReportRepository] Sample meal plans with saves:', 
                mealPlans.slice(0, 3).map(mp => ({ name: mp.name, saveCount: mp.saveCount }))
            );

            return {
                mealPlans,
                totalSaves
            };
        } catch (error) {
            console.error('Repo Error: Failed to get meal plans with save counts:', error);
            throw new Error('Failed to fetch meal plans data.');
        }
    },

    /**
     * Get subscriptions for a specific month
     */
    async getSubscriptionsByMonth(year, month) {
        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            
            const q = query(
                collection(db, 'subscriptions'),
                where('createdAt', '>=', Timestamp.fromDate(startDate)),
                where('createdAt', '<=', Timestamp.fromDate(endDate))
            );
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Repo Error: Failed to get subscriptions by month:', error);
            return [];
        }
    },

    /**
     * Get user signups for a specific time period
     */
    async getUserSignupsByPeriod(startDate, endDate) {
        try {
            const q = query(
                collection(db, 'user_accounts'),
                where('createdAt', '>=', Timestamp.fromDate(startDate)),
                where('createdAt', '<=', Timestamp.fromDate(endDate))
            );
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Repo Error: Failed to get user signups by period:', error);
            return [];
        }
    },

    /**
     * Get premium users who signed up in a specific period
     */
    async getPremiumUsersByPeriod(startDate, endDate) {
        try {
            const q = query(
                collection(db, 'user_accounts'),
                where('role', '==', 'premium'),
                where('createdAt', '>=', Timestamp.fromDate(startDate)),
                where('createdAt', '<=', Timestamp.fromDate(endDate))
            );
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Repo Error: Failed to get premium users by period:', error);
            // Fallback: get all users in period and filter for premium
            try {
                const allUsers = await this.getUserSignupsByPeriod(startDate, endDate);
                return allUsers.filter(user => user.role === 'premium');
            } catch (fallbackError) {
                console.error('Repo Error: Fallback failed:', fallbackError);
                return [];
            }
        }
    },

    /**
     * Get meal plans created in a specific time period
     */
    async getMealPlansByPeriod(startDate, endDate) {
        try {
            const q = query(
                collection(db, 'meal_plans'),
                where('createdAt', '>=', Timestamp.fromDate(startDate)),
                where('createdAt', '<=', Timestamp.fromDate(endDate))
            );
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Repo Error: Failed to get meal plans by period:', error);
            return [];
        }
    },

    /**
     * Get all user accounts data
     */
    async getAllUserAccounts() {
        try {
            const q = collection(db, 'user_accounts');
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Repo Error: Failed to get all user accounts:', error);
            throw new Error('Failed to fetch user accounts data.');
        }
    }
};

export default AdminReportRepository;