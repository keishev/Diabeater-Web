// src/models/Reward.js
class BasicReward {
    constructor(id, name, quantity, pointsNeeded) {
        this.id = id;
        this.name = name;
        this.quantity = quantity;
        this.pointsNeeded = pointsNeeded;
        this.type = 'basic'; // Explicitly set type for storage
    }

    static fromFirestore(doc) {
        const data = doc.data();
        return new BasicReward(doc.id, data.name, data.quantity, data.pointsNeeded);
    }

    toFirestore() {
        return {
            name: this.name,
            quantity: this.quantity,
            pointsNeeded: this.pointsNeeded,
            type: this.type, // Include type in Firestore document
        };
    }
}

class PremiumReward {
    constructor(id, reward, discount, pointsNeeded) {
        this.id = id;
        this.reward = reward; // This is the reward name (e.g., "Subscription Discount")
        this.discount = discount;
        this.pointsNeeded = pointsNeeded;
        this.type = 'premium'; // Explicitly set type for storage
    }

    static fromFirestore(doc) {
        const data = doc.data();
        return new PremiumReward(doc.id, data.reward, data.discount, data.pointsNeeded);
    }

    toFirestore() {
        return {
            reward: this.reward,
            discount: this.discount,
            pointsNeeded: this.pointsNeeded,
            type: this.type, // Include type in Firestore document
        };
    }
}

class AvailableReward {
    // This model represents rewards fetched from 'reward_templates'
    // It maps 'title' from Firestore to its 'name' property for consistency in UI.
    constructor(id, name, type, description = null, featureKey = null) { // Added description and featureKey
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