// src/viewmodels/AdminRewardsViewModel.js
import rewardRepository from '../Repositories/RewardRepository';

class AdminRewardsViewModel {

    constructor() {
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
            if (type === 'basic') {
                await rewardRepository.addBasicReward(rewardData);
            } else if (type === 'premium') {
                await rewardRepository.addPremiumReward(rewardData);
            }
        } catch (e) {
            console.error("Error in ViewModel adding reward:", e);
            throw e; 
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

export default new AdminRewardsViewModel();