

import RewardService from '../Services/RewardService';
import { BasicReward, PremiumReward } from '../Models/Reward';

class RewardRepository {
    constructor(rewardService) {
        this.rewardService = rewardService;
    }

    async getAvailableBasicRewards() {
        return this.rewardService.getAvailableBasicRewards();
    }

    async getAvailablePremiumRewards() {
        return this.rewardService.getAvailablePremiumRewards();
    }

    async getConfiguredBasicRewards() {
        const data = await this.rewardService.getConfiguredBasicRewards();
        
        return data.map(item => new BasicReward(item.id, item.name, item.quantity, item.pointsNeeded));
    }

    async addBasicReward(rewardData) {
        const newReward = new BasicReward(null, rewardData.name, rewardData.quantity, rewardData.pointsNeeded, rewardData.featureKey, rewardData.description);
        const addedReward = await this.rewardService.addBasicReward(newReward);
        
        return new BasicReward(addedReward.id, addedReward.name, addedReward.quantity, addedReward.pointsNeeded, addedReward.featureKey, addedReward.description);
    }

    async updateBasicReward(rewardId, quantity, pointsNeeded) {
        await this.rewardService.updateBasicReward(rewardId, { quantity, pointsNeeded });
    }

    async deleteBasicReward(rewardId) {
        await this.rewardService.deleteBasicReward(rewardId);
    }

    async getConfiguredPremiumRewards() {
        const data = await this.rewardService.getConfiguredPremiumRewards();
        
        return data.map(item => new PremiumReward(item.id, item.reward, item.discount, item.pointsNeeded));
    }

    async addPremiumReward(rewardData) {
        const newReward = new PremiumReward(null, rewardData.reward, rewardData.discount, rewardData.pointsNeeded, rewardData.featureKey, rewardData.description);
        const addedReward = await this.rewardService.addPremiumReward(newReward);
        return new PremiumReward(addedReward.id, addedReward.reward, addedReward.discount, addedReward.pointsNeeded, addedReward.featureKey, addedReward.description);
    }

    /**
     * Updates a configured PremiumReward with new values for discount and pointsNeeded
     * @param {string} rewardId - The ID of the reward to update
     * @param {number} discount - The new discount value for the reward
     * @param {number} pointsNeeded - The new pointsNeeded value for the reward
     * @returns {Promise<void>}
     */
    async updatePremiumReward(rewardId, discount, pointsNeeded) {
        await this.rewardService.updatePremiumReward(rewardId, { discount, pointsNeeded });
    }

    async deletePremiumReward(rewardId) {
        await this.rewardService.deletePremiumReward(rewardId);
    }
}

export default new RewardRepository(RewardService);