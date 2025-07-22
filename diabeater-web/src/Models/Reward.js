// src/models/Reward.js
class BasicReward {
    constructor(id, name, quantity, pointsNeeded, featureKey) {
        this.id = id;
        this.name = name;
        this.quantity = quantity;
        this.pointsNeeded = pointsNeeded;
        this.featureKey = featureKey;
        this.type = 'basic'; 
    }

    static fromFirestore(doc) {
        const data = doc.data();
        return new BasicReward(doc.id, data.name, data.quantity, data.pointsNeeded, data.featureKey);
    }

    toFirestore() {
        return {
            name: this.name,
            quantity: this.quantity,
            pointsNeeded: this.pointsNeeded,
            featureKey: this.featureKey, 
            type: this.type, 
        };
    }
}

class PremiumReward {
    constructor(id, reward, discount, pointsNeeded, featureKey) {
        this.id = id;
        this.reward = reward; 
        this.discount = discount;
        this.pointsNeeded = pointsNeeded;
        this.featureKey = featureKey;
        this.type = 'premium';
    }

    static fromFirestore(doc) {
        const data = doc.data();
        return new PremiumReward(doc.id, data.reward, data.discount, data.pointsNeeded, data.featureKey);
    }

    toFirestore() {
        return {
            reward: this.reward,
            discount: this.discount,
            pointsNeeded: this.pointsNeeded,
            featureKey: this.featureKey, 
            type: this.type,
        };
    }
}

class AvailableReward {
    // This model represents rewards fetched from 'reward_templates'
    // It maps 'title' from Firestore to its 'name' property for consistency in UI.
    constructor(id, name, type, description = null, featureKey = null) { 
        this.id = id;
        this.name = name; // Will hold the 'title' from Firebase reward_templates
        this.type = type; // 'basic' or 'premium'
        this.description = description; // Optional
        this.featureKey = featureKey; // Optional
    }

    static fromFirestore(doc) {
        const data = doc.data();
        return new AvailableReward(
            doc.id,
            data.title, // Maps 'title' from reward_templates to 'name'
            data.type,
            data.description,
            data.featureKey
        );
    }
}

export { BasicReward, PremiumReward, AvailableReward };