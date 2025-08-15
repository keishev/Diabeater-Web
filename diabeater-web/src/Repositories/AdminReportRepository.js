
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

   
    async getAllMealPlansWithSaveCounts() {
        try {
            const q = collection(db, 'meal_plans');
            const querySnapshot = await getDocs(q);
            const mealPlans = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            
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
            
            try {
                const allUsers = await this.getUserSignupsByPeriod(startDate, endDate);
                return allUsers.filter(user => user.role === 'premium');
            } catch (fallbackError) {
                console.error('Repo Error: Fallback failed:', fallbackError);
                return [];
            }
        }
    },

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