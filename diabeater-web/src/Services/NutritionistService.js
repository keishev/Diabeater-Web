
import { db } from '../firebase';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Nutritionist from '../Models/Nutritionist'; 

class NutritionistService {
    async getPendingNutritionists() {
        try {
            const q = query(collection(db, "nutritionist_application"), where("status", "==", "pending"));
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
            const q = query(collection(db, "nutritionist_application"));
            const querySnapshot = await getDocs(q);
            const allNutritionists = querySnapshot.docs.map(doc => Nutritionist.fromFirestore(doc));
            return allNutritionists;
        } catch (error) {
            console.error("Error fetching all nutritionists:", error);
            throw error;
        }
    }

}

export default new NutritionistService();