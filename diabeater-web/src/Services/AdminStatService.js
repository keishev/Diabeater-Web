// src/Services/AdminStatService.js
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
    doc,     // Import doc for single document reference
    getDoc,  // Import getDoc for fetching single documents
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
                _id: doc.id, // Ensure this maps to the document ID in Firestore
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

    // --- NEW FUNCTION: Get all subscriptions grouped by user ID ---
    async getAllSubscriptionsGroupedByUser() {
        try {
            console.log("[Service] Fetching all subscriptions grouped by user...");
            const snapshot = await getDocs(collection(db, 'subscriptions'));

            const grouped = {}; // Using a plain object for grouping in JS

            for (const doc of snapshot.docs) {
                const data = doc.data();
                const userId = data['userId'];
                if (userId) { // Ensure userId exists
                    if (!grouped[userId]) {
                        grouped[userId] = [];
                    }
                    grouped[userId].push({
                        ...data,
                        id: doc.id, // Use 'id' as per the Dart example for doc ID
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

    // --- NEW FUNCTION: Get user account by ID ---
    async getUserAccountById(userId) {
        try {
            console.log(`[Service] Fetching user account for ID: ${userId}`);
            const docRef = doc(db, 'user_accounts', userId);
            const docSnap = await getDoc(docRef); // Use getDoc for a single document

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

    // --- NEW FUNCTION: Get subscriptions for a specific user ID ---
    async getUserSubscriptions(userId) {
        try {
            console.log(`[Service] Fetching subscriptions for user ID: ${userId}`);
            const q = query(
                collection(db, 'subscriptions'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc') // Assuming you want to sort by creation date
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

    // --- EXISTING FUNCTIONS BELOW (with minor fixes for getDocs -> getDoc) ---

    async getPremiumUserAccounts() {
        try {
            console.log("[Service] Fetching premium user accounts...");
            const q = query(
                collection(db, 'user_accounts'),
                where('isPremium', '==', true) // Query for accounts where isPremium is true
            );
            const querySnapshot = await getDocs(q);
            const premiumUsers = querySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));
            console.log(`[Service] getPremiumUserAccounts: Found ${premiumUsers.length} premium users.`);
            return premiumUsers;
        } catch (error) {
            console.error('[Service] ERROR fetching premium user accounts:', error);
            throw new Error('Failed to fetch premium user accounts.');
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

            // Ensure the data is returned in the order of most saves
            const orderedData = topMealPlanIds.map(id => data.find(plan => plan._id === id)).filter(Boolean);

            console.log(`[Service] getWeeklyTopMealPlans (top ${count}): Found ${orderedData.length} plans. Sample:`, orderedData.slice(0, 2));
            return orderedData;
        } catch (error) {
            console.error('[Service] ERROR fetching weekly top meal plans:', error);
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
            await updateDoc(userRef, { status: newStatus }); // Update the 'status' field
            console.log(`[Service] User ${userId} status updated to ${newStatus}`);
            return { success: true, message: `User status updated to ${newStatus}.` };
        } catch (error) {
            console.error("[AdminStatService] Error updating user status:", error);
            throw new Error(`Failed to update user status in Firebase: ${error.message}`);
        }
    },

    // Methods for premium plan configuration
    async getSubscriptionPrice() {
        try {
            const docRef = doc(db, 'config', 'premiumPlan'); // Assuming path 'config/premiumPlan'
            const docSnap = await getDoc(docRef); // Use getDoc for single document
            if (docSnap.exists()) {
                return docSnap.data().price || 0;
            }
            return 0;
        } catch (error) {
            console.error('[Service] ERROR fetching subscription price:', error);
            throw new Error('Failed to fetch subscription price.');
        }
    },

    async updateSubscriptionPrice(newPrice) {
        try {
            const docRef = doc(db, 'config', 'premiumPlan');
            await updateDoc(docRef, { price: newPrice });
            return { success: true, message: 'Subscription price updated.' };
        } catch (error) {
            console.error('[Service] ERROR updating subscription price:', error);
            throw new Error('Failed to update subscription price.');
        }
    },

    async getPremiumFeatures() {
        try {
            const docRef = doc(db, 'config', 'premiumPlan');
            const docSnap = await getDoc(docRef); // Use getDoc for single document
            if (docSnap.exists()) {
                return docSnap.data().features || [];
            }
            return [];
        } catch (error) {
            console.error('[Service] ERROR fetching premium features:', error);
            throw new Error('Failed to fetch premium features.');
        }
    },

    async updatePremiumFeatures(newFeatures) {
        try {
            const docRef = doc(db, 'config', 'premiumPlan');
            await updateDoc(docRef, { features: newFeatures });
            return { success: true, message: 'Premium features updated.' };
        } catch (error) {
            console.error('[Service] ERROR updating premium features:', error);
            throw new Error('Failed to update premium features.');
        }
    },
};

export default AdminStatService;