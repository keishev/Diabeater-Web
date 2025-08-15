
import SubscriptionService from '../Services/SubscriptionService';

class SubscriptionRepository {
    constructor() {
        this.subscriptionService = SubscriptionService;
        this.PLAN_ID = 'premium'; 
    }

    async getSubscriptionPrice() {
        return this.subscriptionService.getSubscriptionPrice(this.PLAN_ID);
    }

    async updateSubscriptionPrice(newPrice) {
        return this.subscriptionService.updateSubscriptionPrice(this.PLAN_ID, newPrice);
    }

    async getPremiumFeatures() {
        
        return this.subscriptionService.getPremiumFeatures(this.PLAN_ID);
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
            console.error("[SubscriptionRepository] Error adding premium feature:", error);
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
            console.error("[SubscriptionRepository] Error updating premium feature:", error);
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
            console.error("[SubscriptionRepository] Error deleting premium feature:", error);
            throw error;
        }
    }
}

export default new SubscriptionRepository();