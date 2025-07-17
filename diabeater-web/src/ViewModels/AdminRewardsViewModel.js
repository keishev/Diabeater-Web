// src/viewmodels/AdminRewardsViewModel.js
import rewardRepository from '../Repositories/RewardRepository';

class AdminRewardsViewModel {

    constructor() {
        // No MobX auto-observable as the React component will manage its own state with useState
    }

    async getAvailableBasicRewards() {
        return await rewardRepository.getAvailableBasicRewards();
    }

    async getAvailablePremiumRewards() {
        return await rewardRepository.getAvailablePremiumRewards();
    }

    async getConfiguredBasicRewards() {
        return await rewardRepository.getConfiguredBasicRewards();
    }

    async getConfiguredPremiumRewards() {
        return await rewardRepository.getConfiguredPremiumRewards();
    }

    async addReward(rewardData, type) {
        try {
            // Fetch current configured rewards to check for duplicates (business logic)
            const configuredList = type === 'basic'
                ? await this.getConfiguredBasicRewards()
                : await this.getConfiguredPremiumRewards();

            if (type === 'basic') {
                const isAlreadyAdded = configuredList.some(r => r.name === rewardData.name);
                if (isAlreadyAdded) {
                    throw new Error(`Basic Reward "${rewardData.name}" is already configured.`);
                }
                // Call repository with the data structure expected by BasicReward model (name, quantity, pointsNeeded)
                await rewardRepository.addBasicReward(rewardData);
            } else if (type === 'premium') {
                const isAlreadyAdded = configuredList.some(r => r.reward === rewardData.reward);
                if (isAlreadyAdded) {
                    throw new Error(`Premium Reward "${rewardData.reward}" is already configured.`);
                }
                // Call repository with the data structure expected by PremiumReward model (reward, discount, pointsNeeded)
                await rewardRepository.addPremiumReward(rewardData);
            }
        } catch (e) {
            console.error("Error in ViewModel adding reward:", e);
            throw e; // Re-throw to be caught by the React component
        }
    }

    async updateReward(rewardId, type, updateFields) {
        try {
            if (type === 'basic') {
                await rewardRepository.updateBasicReward(rewardId, updateFields.quantity, updateFields.pointsNeeded);
            } else if (type === 'premium') {
                await rewardRepository.updatePremiumReward(rewardId, updateFields.discount, updateFields.pointsNeeded);
            }
        } catch (e) {
            console.error("Error in ViewModel updating reward:", e);
            throw e;
        }
    }

    async deleteReward(rewardId, type) {
        try {
            if (type === 'basic') {
                await rewardRepository.deleteBasicReward(rewardId);
            } else if (type === 'premium') {
                await rewardRepository.deletePremiumReward(rewardId);
            }
        } catch (e) {
            console.error("Error in ViewModel deleting reward:", e);
            throw e;
        }
    }
}

export default new AdminRewardsViewModel(); // Export an instance