// src/Services/FirestoreService.js
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

class FirestoreService {
    async saveNutritionistData(userId, data) {
        try {
            await setDoc(doc(db, "nutritionists", userId), data);
            console.log("Nutritionist data saved successfully for user:", userId);
        } catch (error) {
            console.error("Error saving nutritionist data:", error);
            throw error;
        }
    }
}

export default new FirestoreService();