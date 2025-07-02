// src/Repositories/NutritionistRepository.js
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebase';
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

    async approveNutritionist(userId) {
        try {
            // Get the application document
            const applicationRef = doc(db, "nutritionist_application", userId);
            const applicationSnap = await getDoc(applicationRef);

            if (!applicationSnap.exists()) {
                throw new Error("Nutritionist application not found.");
            }

            const applicationData = applicationSnap.data();

            // Create Firebase Auth user

            const secondaryApp = initializeApp(firebaseConfig, "Secondary");
            const secondaryAuth = getAuth(secondaryApp);

            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                applicationData.email,
                applicationData.password
            );

            const newUser = userCredential.user;

            // Save to `nutritionists` collection
            const nutritionistRef = doc(db, "user_accounts", newUser.uid);
            console.log(nutritionistRef);
            await setDoc(nutritionistRef, {
                userId: newUser.uid,
                email: applicationData.email,
                firstName: applicationData.firstName,
                lastName: applicationData.lastName,
                dob: applicationData.dob,
                gender: "",
                profilePictureUrl: "",
                role: "nutritionist",
                isPremium: false,
                points: 0,
                profileCompleted: false,
                status: true,
                username: "",
                createdAt: new Date().toISOString()
            });

            await updateDoc(applicationRef, {
                status: "approved",
                approvedAt: new Date().toISOString(), 
            });

            return { uid: newUser.uid, email: newUser.email };
        } catch (error) {
            console.error("Service: Error approving nutritionist:", error);
            throw error;
        }
    }

    async rejectNutritionist(userId, reason) {
        try {
            const applicationRef = doc(db, "nutritionist_application", userId);
            const applicationSnap = await getDoc(applicationRef);

            if (!applicationSnap.exists()) {
                throw new Error("Nutritionist application not found.");
            }

            await updateDoc(applicationRef, {
                status: "rejected",
                rejectionReason: reason || "", 
                rejectedAt: new Date().toISOString(), 
            });

            console.log(`Application for ${userId} marked as rejected.`);
            return true;
        } catch (error) {
            console.error("Service: Error rejecting nutritionist:", error);
            throw error;
        }
    }
}

export default new NutritionistApplicationService();