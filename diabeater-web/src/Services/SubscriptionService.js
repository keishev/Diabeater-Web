// src/services/SubscriptionService.js
import { db } from '../firebase'; // Assuming your firebase config exports 'db'
import { doc, updateDoc, getDoc } from 'firebase/firestore'; // <--- Ensure getDoc is imported here

const SubscriptionService = {
    /**
     * Updates the price for a specific subscription plan.
     * @param {string} planId - The ID of the subscription plan (e.g., 'premium').
     * @param {number} newPrice - The new price to set for the plan.
     */
    async updateSubscriptionPrice(planId, newPrice) {
        try {
            console.log(`[SubscriptionService] Attempting to update price for plan '${planId}' to ${newPrice}`);
            // Construct the document reference: 'plans' collection -> specific planId document
            const planRef = doc(db, 'plans', planId);

            // Update the 'price' field
            await updateDoc(planRef, { price: newPrice });

            console.log(`[SubscriptionService] Successfully updated price for plan '${planId}' to ${newPrice}`);
            return { success: true, message: 'Subscription price updated successfully!' };
        } catch (error) {
            console.error(`[SubscriptionService] Error updating price for plan '${planId}':`, error);
            throw new Error(`Failed to update subscription price: ${error.message}`);
        }
    },

    /**
     * Fetches the current price for a specific subscription plan.
     * @param {string} planId - The ID of the subscription plan (e.g., 'premium').
     * @returns {Promise<number|null>} The price of the plan, or null if not found.
     */
    async getSubscriptionPrice(planId) {
        try {
            console.log(`[SubscriptionService] Attempting to fetch price for plan '${planId}'`);
            const planRef = doc(db, 'plans', planId);
            const docSnap = await getDoc(planRef); // getDoc is now correctly imported

            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log(`[SubscriptionService] Fetched price for '${planId}':`, data.price);
                return data.price;
            } else {
                console.warn(`[SubscriptionService] Plan '${planId}' not found.`);
                return null; // Or throw an error if the plan must exist
            }
        } catch (error) {
            console.error(`[SubscriptionService] Error fetching price for plan '${planId}':`, error);
            throw new Error(`Failed to fetch subscription price: ${error.message}`);
        }
    }
};

export default SubscriptionService;