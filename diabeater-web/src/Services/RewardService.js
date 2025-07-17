// src/services/RewardService.js
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { BasicReward, PremiumReward, AvailableReward } from '../Models/Reward';

class RewardService {
    constructor() {
        // Consolidated into a single 'rewards' collection
        this.rewardsCollection = collection(db, 'rewards');
        // Collection for available reward templates (remains separate)
        this.rewardTemplatesCollection = collection(db, 'reward_templates');
    }

    async getAvailableBasicRewards() {
        const q = query(this.rewardTemplatesCollection, where("type", "==", "basic"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => AvailableReward.fromFirestore(doc));
    }

    async getAvailablePremiumRewards() {
        const q = query(this.rewardTemplatesCollection, where("type", "==", "premium"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => AvailableReward.fromFirestore(doc));
    }

    async getConfiguredBasicRewards() {
        const q = query(this.rewardsCollection, where("type", "==", "basic"));
        const snapshot = await getDocs(q);
        // Ensure correct model is used for conversion
        return snapshot.docs.map(doc => BasicReward.fromFirestore(doc));
    }

    async addBasicReward(rewardData) {
        // rewardData is an instance of BasicReward
        const docRef = await addDoc(this.rewardsCollection, rewardData.toFirestore());
        return { ...rewardData, id: docRef.id };
    }

    async updateBasicReward(rewardId, newData) {
        const docRef = doc(this.rewardsCollection, rewardId); // Update in the consolidated collection
        await updateDoc(docRef, newData);
    }

    async deleteBasicReward(rewardId) {
        const docRef = doc(this.rewardsCollection, rewardId); // Delete from the consolidated collection
        await deleteDoc(docRef);
    }

    async getConfiguredPremiumRewards() {
        const q = query(this.rewardsCollection, where("type", "==", "premium"));
        const snapshot = await getDocs(q);
        // Ensure correct model is used for conversion
        return snapshot.docs.map(doc => PremiumReward.fromFirestore(doc));
    }

    async addPremiumReward(rewardData) {
        // rewardData is an instance of PremiumReward
        const docRef = await addDoc(this.rewardsCollection, rewardData.toFirestore());
        return { ...rewardData, id: docRef.id };
    }

    async updatePremiumReward(rewardId, newData) {
        const docRef = doc(this.rewardsCollection, rewardId); // Update in the consolidated collection
        await updateDoc(docRef, newData);
    }

    async deletePremiumReward(rewardId) {
        const docRef = doc(this.rewardsCollection, rewardId); // Delete from the consolidated collection
        await deleteDoc(docRef);
    }
}

export default new RewardService();