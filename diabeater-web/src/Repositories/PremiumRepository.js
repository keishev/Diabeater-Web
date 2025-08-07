// src/Repositories/PremiumRepository.js
import SubscriptionService from '../Services/SubscriptionService';
import app from '../firebase';
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit
} from 'firebase/firestore';

const db = getFirestore(app);

class PremiumRepository {
    constructor() {
        this.subscriptionService = SubscriptionService;
        this.PLAN_ID = 'premium';
        this.FIRESTORE_SUBSCRIPTION_PLAN_VALUE = 'Premium Plan';
    }

    async getSubscriptionPrice() {
        try {
            const price = await this.subscriptionService.getSubscriptionPrice(this.PLAN_ID);
            return typeof price === 'number' ? price : 0;
        } catch (error) {
            console.error("[PremiumRepository] Error fetching subscription price:", error);
            return 0;
        }
    }

    async updateSubscriptionPrice(newPrice) {
        return this.subscriptionService.updateSubscriptionPrice(this.PLAN_ID, newPrice);
    }

    async getPremiumFeatures() {
        try {
            const features = await this.subscriptionService.getPremiumFeatures(this.PLAN_ID);
            return features || [];
        } catch (error) {
            console.error("[PremiumRepository] Error fetching premium features:", error);
            return [];
        }
    }

    async addPremiumFeature(featureName) {
        try {
            const currentFeatures = await this.getPremiumFeatures();
            if (currentFeatures.includes(featureName)) {
                throw new Error(`Feature "${featureName}" already exists.`);
            }
            const newFeatures = [...currentFeatures, featureName];
            const result = await this.subscriptionService.updatePremiumFeatures(this.PLAN_ID, newFeatures);
            if (result.success) {
                return { success: true, message: result.message, newFeature: featureName };
            }
            return result;
        } catch (error) {
            console.error("[PremiumRepository] Error adding premium feature:", error);
            throw error;
        }
    }

    async updatePremiumFeature(oldFeatureName, newFeatureName) {
        try {
            if (oldFeatureName === newFeatureName) {
                return { success: true, message: "Feature name is identical, no update needed." };
            }

            const currentFeatures = await this.getPremiumFeatures();
            const index = currentFeatures.indexOf(oldFeatureName);

            if (index === -1) {
                throw new Error(`Feature "${oldFeatureName}" not found.`);
            }
            if (currentFeatures.includes(newFeatureName) && newFeatureName !== oldFeatureName) {
                throw new Error(`Feature "${newFeatureName}" already exists.`);
            }

            const updatedFeatures = [...currentFeatures];
            updatedFeatures[index] = newFeatureName;

            const result = await this.subscriptionService.updatePremiumFeatures(this.PLAN_ID, updatedFeatures);
            if (result.success) {
                return { success: true, message: result.message };
            }
            return result;
        } catch (error) {
            console.error("[PremiumRepository] Error updating premium feature:", error);
            throw error;
        }
    }

    async deletePremiumFeature(featureName) {
        try {
            const currentFeatures = await this.getPremiumFeatures();
            const newFeatures = currentFeatures.filter(feature => feature !== featureName);

            if (newFeatures.length === currentFeatures.length) {
                throw new Error(`Feature "${featureName}" not found to delete.`);
            }

            const result = await this.subscriptionService.updatePremiumFeatures(this.PLAN_ID, newFeatures);
            if (result.success) {
                return { success: true, message: result.message };
            }
            return result;
        } catch (error) {
            console.error("[PremiumRepository] Error deleting premium feature:", error);
            throw error;
        }
    }

    async getPremiumUserAccounts() {
        try {
            console.log("[PremiumRepository] Fetching premium user accounts...");
            const usersQuery = query(
                collection(db, 'user_accounts'),
                where('isPremium', '==', true)
            );
            const userSnapshot = await getDocs(usersQuery);
            const premiumUsers = userSnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));

            const usersWithSubscriptions = await Promise.all(premiumUsers.map(async (user) => {
                const subscriptionsQuery = query(
                    collection(db, 'subscriptions'),
                    where('userId', '==', user._id),
                    where('plan', '==', this.FIRESTORE_SUBSCRIPTION_PLAN_VALUE),
                    orderBy('createdAt', 'desc'),
                    limit(1)
                );
                const subSnapshot = await getDocs(subscriptionsQuery);
                let currentSubscription = null;
                if (!subSnapshot.empty) {
                    currentSubscription = subSnapshot.docs[0].data();
                    currentSubscription.subscriptionId = subSnapshot.docs[0].id;
                }

                return {
                    ...user,
                    currentSubscription: currentSubscription
                };
            }));

            console.log(`[PremiumRepository] getPremiumUserAccounts: Found ${usersWithSubscriptions.length} premium users with subscription data.`);
            return usersWithSubscriptions;
        } catch (error) {
            console.error('[PremiumRepository] ERROR fetching premium user accounts with subscriptions:', error);
            throw new Error('Failed to fetch premium user accounts with subscription details.');
        }
    }

    /**
     * Fetches all subscriptions for a given user ID, ordered by creation date.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Array<object>>} An array of subscription objects.
     */
    async getUserSubscriptionHistory(userId) {
        try {
            console.log(`[PremiumRepository] Fetching subscription history for user: ${userId}`);
            const historyQuery = query(
                collection(db, 'subscriptions'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc') // Order to show most recent first
            );
            const historySnapshot = await getDocs(historyQuery);
            const history = historySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));
            console.log(`[PremiumRepository] Found ${history.length} history records for user ${userId}.`);
            return history;
        } catch (error) {
            console.error(`[PremiumRepository] ERROR fetching subscription history for user ${userId}:`, error);
            throw new Error('Failed to fetch user subscription history.');
        }
    }
}

export default new PremiumRepository();