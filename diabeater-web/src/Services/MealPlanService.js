// src/Services/MealPlanService.js
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    getDoc,
    query,
    where,
    getDocs,
    deleteDoc, // Import deleteDoc
    orderBy // Import orderBy for notifications
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Import deleteObject
import { getAuth } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore'; // Import onSnapshot for real-time listeners
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
            status: 'PENDING_APPROVAL', // Initial status
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

    /**
     * Fetches meal plans with 'APPROVED' status.
     * Renamed from getUploadedMealPlans for consistency with ViewModel's expectation.
     */
    async getApprovedMealPlans() { // Changed method name
        const q = query(
            collection(this.db, 'meal_plans'),
            where('status', '==', 'APPROVED') // Explicitly query for 'APPROVED'
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data()
        }));
    }

    async getRejectedMealPlans() {
        const q = query(
            collection(this.db, 'meal_plans'),
            where('status', '==', 'REJECTED')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data()
        }));
    }

    async getMealPlansByAuthor(authorId) {
        const q = query(
            collection(this.db, 'meal_plans'),
            where('authorId', '==', authorId)
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
            isRead: false, // Use 'isRead' in Firestore
            timestamp: serverTimestamp()
        };
        if (rejectionReason) {
            notificationData.rejectionReason = rejectionReason;
        }
        await addDoc(collection(this.db, 'notifications'), notificationData);
        return true;
    }

    onNotificationsSnapshot(userId, callback) {
        if (!userId) {
            console.warn("Attempted to set up notification listener without a user ID.");
            return () => {}; // Return a no-op unsubscribe function
        }

        const q = query(
            collection(this.db, 'notifications'),
            where('recipientId', '==', userId),
            orderBy('timestamp', 'desc') // Added orderBy for consistent order
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data(),
                read: doc.data().isRead // Map 'isRead' from Firestore to 'read' for ViewModel consistency
            }));
            callback(notifications);
        }, (error) => {
            console.error("Error listening to notifications:", error);
        });

        return unsubscribe;
    }

    async getNotifications(userId) {
        if (!userId) {
            console.warn("Attempted to fetch notifications without a user ID.");
            return [];
        }
        const q = query(
            collection(this.db, 'notifications'),
            where('recipientId', '==', userId),
            orderBy('timestamp', 'desc') // Added orderBy for consistent order
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data(),
            read: doc.data().isRead // Map 'isRead' from Firestore to 'read'
        }));
    }

    async markNotificationAsRead(notificationId) {
        const notificationRef = doc(this.db, 'notifications', notificationId);
        await updateDoc(notificationRef, { isRead: true }); // Update 'isRead' in Firestore
        return true;
    }

    async deleteMealPlan(mealPlanId, imageFileName) {
        // 1. Delete the Firestore document
        const mealPlanDocRef = doc(this.db, 'meal_plans', mealPlanId);
        await deleteDoc(mealPlanDocRef);

        // 2. Delete the image from Firebase Storage (if imageFileName is provided)
        if (imageFileName) {
            const imageRef = ref(this.storage, `meal_plan_images/${imageFileName}`);
            try {
                await deleteObject(imageRef);
                console.log(`Image ${imageFileName} deleted from storage.`);
            } catch (error) {
                // If the file doesn't exist (e.g., already deleted or wrong path),
                // deleteObject will throw an error. We log it but proceed.
                if (error.code === 'storage/object-not-found') {
                    console.warn(`Image ${imageFileName} not found in storage. Skipping deletion.`);
                } else {
                    console.error(`Error deleting image ${imageFileName} from storage:`, error);
                }
            }
        }
        return true;
    }
}

export default new MealPlanService();