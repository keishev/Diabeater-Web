// src/Services/FirestoreService.js
import { db } from '../firebase';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Nutritionist from '../Models/Nutritionist'; // Import the Nutritionist model

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

    async getPendingNutritionists() {
        try {
            const q = query(collection(db, "nutritionists"), where("status", "==", "pending"));
            const querySnapshot = await getDocs(q);
            const pendingNutritionists = querySnapshot.docs.map(doc => Nutritionist.fromFirestore(doc));
            return pendingNutritionists;
        } catch (error) {
            console.error("Error fetching pending nutritionists:", error);
            throw error;
        }
    }

    async getAllNutritionists() {
        try {
            const q = query(collection(db, "nutritionists"));
            const querySnapshot = await getDocs(q);
            const allNutritionists = querySnapshot.docs.map(doc => Nutritionist.fromFirestore(doc));
            return allNutritionists;
        } catch (error) {
            console.error("Error fetching all nutritionists:", error);
            throw error;
        }
    }

    // You might also need methods to fetch regular users if they are in a different collection
    // For now, assuming your `initialUserAccounts` handles them.
}

export default new FirestoreService();