// src/repositories/RewardRepository.js
// No changes needed for this file. It correctly interfaces with the service.
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
        // Ensure that the data returned from service is converted back to model instances if needed
        return data.map(item => new BasicReward(item.id, item.name, item.quantity, item.pointsNeeded));
    }

    async addBasicReward(rewardData) {
        // rewardData comes as a plain object from ViewModel, convert to BasicReward model
        const newReward = new BasicReward(null, rewardData.name, rewardData.quantity, rewardData.pointsNeeded);
        const addedReward = await this.rewardService.addBasicReward(newReward);
        // The service returns the data with an ID, convert back to a model instance
        return new BasicReward(addedReward.id, addedReward.name, addedReward.quantity, addedReward.pointsNeeded);
    }

    async updateBasicReward(rewardId, quantity, pointsNeeded) {
        await this.rewardService.updateBasicReward(rewardId, { quantity, pointsNeeded });
    }

    async deleteBasicReward(rewardId) {
        await this.rewardService.deleteBasicReward(rewardId);
    }

    async getConfiguredPremiumRewards() {
        const data = await this.rewardService.getConfiguredPremiumRewards();
        // Ensure that the data returned from service is converted back to model instances if needed
        return data.map(item => new PremiumReward(item.id, item.reward, item.discount, item.pointsNeeded));
    }

    async addPremiumReward(rewardData) {
        // rewardData comes as a plain object from ViewModel, convert to PremiumReward model
        const newReward = new PremiumReward(null, rewardData.reward, rewardData.discount, rewardData.pointsNeeded);
        const addedReward = await this.rewardService.addPremiumReward(newReward);
        // The service returns the data with an ID, convert back to a model instance
        return new PremiumReward(addedReward.id, addedReward.reward, addedReward.discount, addedReward.pointsNeeded);
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