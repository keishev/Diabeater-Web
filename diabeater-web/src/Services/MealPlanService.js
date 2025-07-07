// src/Services/MealPlanService.js
import { getFirestore, collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import app from '../firebase'; // Assuming 'app' is your Firebase app instance
import AuthService from './AuthService'; // Assuming AuthService provides getCurrentUser

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

class MealPlanService {
    constructor() {
        this.db = db;
        this.storage = storage;
        this.auth = auth;
    }

    async createMealPlan(mealPlanData, uploadPhoto) {
        const user = this.auth.currentUser;
        const nutritionistInfo = AuthService.getCurrentUser();

        if (!user || !nutritionistInfo || nutritionistInfo.role !== 'nutritionist') {
            throw new Error('You must be logged in as an approved nutritionist to create a meal plan.');
        }

        let imageUrl = '';
        let imageFileName = '';

        if (uploadPhoto) {
            imageFileName = `${Date.now()}_${uploadPhoto.name}`;
            const storageRef = ref(this.storage, `meal_plan_images/${imageFileName}`);
            const snapshot = await uploadBytes(storageRef, uploadPhoto);
            imageUrl = await getDownloadURL(snapshot.ref);
        } else {
            throw new Error('Please upload a meal plan image.');
        }

        // Get the nutritionist's actual name from Firestore user_accounts (more reliable)
        const userDocRef = doc(this.db, 'user_accounts', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.exists() ? userDocSnap.data() : {};
        const actualNutritionistName = userData.name || userData.username || user.email;

        const newMealPlan = {
            ...mealPlanData,
            imageUrl: imageUrl,
            imageFileName: imageFileName,
            author: actualNutritionistName,
            authorId: user.uid,
            status: 'PENDING_APPROVAL',
            likes: 0,
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(this.db, 'meal_plans'), newMealPlan);
        return { id: docRef.id, ...newMealPlan };
    }

    async getPendingMealPlans() {
        const q = query(
            collection(this.db, 'meal_plans'),
            where('status', '==', 'PENDING_APPROVAL')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data()
        }));
    }

    async updateMealPlanStatus(mealPlanId, status, rejectionReason = null) {
        const mealPlanRef = doc(this.db, 'meal_plans', mealPlanId);
        const updateData = { status: status };
        if (rejectionReason) {
            updateData.rejectionReason = rejectionReason;
        }
        await updateDoc(mealPlanRef, updateData);
        return true;
    }

    async getMealPlanById(mealPlanId) {
        const mealPlanRef = doc(this.db, 'meal_plans', mealPlanId);
        const docSnap = await getDoc(mealPlanRef);
        if (docSnap.exists()) {
            return { _id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    }

    async createNotification(recipientId, type, message, mealPlanId, rejectionReason = null) {
        const notificationData = {
            recipientId,
            type,
            message,
            mealPlanId,
            isRead: false,
            timestamp: serverTimestamp()
        };
        if (rejectionReason) {
            notificationData.rejectionReason = rejectionReason;
        }
        await addDoc(collection(this.db, 'notifications'), notificationData);
        return true;
    }
}

export default new MealPlanService();