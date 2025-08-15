


import app from '../firebase'; 
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

const db = getFirestore(app);

const SubscriptionService = {
    /**
     * Fetches the price for a given subscription plan.
     * @param {string} planId - The ID of the subscription plan (e.g., 'premium', 'basic').
     * @returns {Promise<number|null>} The price of the subscription, or null if not found.
     */
    async getSubscriptionPrice(planId) {
        try {
            const docRef = doc(db, 'plans', planId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const price = data.price !== undefined ? parseFloat(data.price) : null;
                console.log(`[SubscriptionService] Fetched price for ${planId}: $${price}`);
                return price;
            } else {
                console.log(`[SubscriptionService] No such document for planId: ${planId}`);
                return null;
            }
        } catch (error) {
            console.error(`[SubscriptionService] Error getting subscription price for ${planId}:`, error);
            throw new Error(`Failed to fetch subscription price: ${error.message}`);
        }
    },

    /**
     * Updates the price for a given subscription plan.
     * @param {string} planId - The ID of the subscription plan.
     * @param {number} newPrice - The new price to set.
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async updateSubscriptionPrice(planId, newPrice) {
        try {
            const docRef = doc(db, 'plans', planId);
            await updateDoc(docRef, { price: newPrice });
            console.log(`[SubscriptionService] Updated price for ${planId} to $${newPrice}`);
            return { success: true, message: `Price for ${planId} updated successfully.` };
        } catch (error) {
            console.error(`[SubscriptionService] Error updating subscription price for ${planId}:`, error);
            return { success: false, message: `Failed to update price: ${error.message}` };
        }
    },

    /**
     * Fetches the features for a given subscription plan.
     * @param {string} planId - The ID of the subscription plan (e.g., 'premium').
     * @returns {Promise<string[]|null>} An array of feature strings, or null if not found.
     */
    async getPremiumFeatures(planId = 'premium') { 
        try {
            const docRef = doc(db, 'plans', planId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const features = data.features || []; 
                console.log(`[SubscriptionService] Fetched features for ${planId}:`, features);
                return features;
            } else {
                console.log(`[SubscriptionService] No such document for planId: ${planId}`);
                return null;
            }
        } catch (error) {
            console.error(`[SubscriptionService] Error getting premium features for ${planId}:`, error);
            throw new Error(`Failed to fetch premium features: ${error.message}`);
        }
    },

    /**
     * Updates the features array for a given subscription plan.
     * @param {string} planId - The ID of the subscription plan.
     * @param {string[]} newFeatures - The new array of feature strings to set.
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async updatePremiumFeatures(planId, newFeatures) {
        try {
            const docRef = doc(db, 'plans', planId);
            await updateDoc(docRef, { features: newFeatures });
            console.log(`[SubscriptionService] Updated features for ${planId}:`, newFeatures);
            return { success: true, message: `Features for ${planId} updated successfully.` };
        } catch (error) {
            console.error(`[SubscriptionService] Error updating premium features for ${planId}:`, error);
            return { success: false, message: `Failed to update features: ${error.message}` };
        }
    }
};

export default SubscriptionService;