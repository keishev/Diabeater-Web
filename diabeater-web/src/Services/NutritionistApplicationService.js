// src/Repositories/NutritionistRepository.js
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from "../firebase";

class NutritionistApplicationService {
    async saveNutritionistData(userId, data) {
        try {
            await setDoc(doc(db, "nutritionist_application", userId), data);
            console.log("Nutritionist data saved successfully for user:", userId);
        } catch (error) {
            console.error("Error saving nutritionist data:", error);
            throw error;
        }
    }

     async getNutritionistCertificateUrl(userId) {
        try {
            const docRef = doc(db, "nutritionist_application", userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                return data.certificateUrl || null;
            } else {
                throw new Error("Nutritionist application not found.");
            }
        } catch (error) {
            console.error("NutritionistApplicationService: Error fetching certificate URL:", error);
            throw error;
        }
    }
}

export default new NutritionistApplicationService();