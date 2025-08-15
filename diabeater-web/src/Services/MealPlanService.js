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
    deleteDoc,
    orderBy,
    limit
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';
import app from '../firebase'; 
import AuthService from './AuthService'; 

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

class MealPlanService {
    constructor() {
        this.db = db;
        this.storage = storage;
        this.auth = auth;
    }

    
    async getUserDisplayName(uid) {
        try {
            const userDocRef = doc(this.db, 'user_accounts', uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                
                
                if (userData.firstName || userData.lastName) {
                    const firstName = userData.firstName || '';
                    const lastName = userData.lastName || '';
                    return `${firstName} ${lastName}`.trim();
                }
                
                
                if (userData.name && !userData.name.includes('@')) {
                    return userData.name;
                }
                
                
                if (userData.username && !userData.username.includes('@')) {
                    return userData.username;
                }
                
                
                if (userData.email) {
                    return this.formatEmailAsName(userData.email);
                }
            }
            
            
            const user = this.auth.currentUser;
            if (user && user.email) {
                return this.formatEmailAsName(user.email);
            }
            
            return 'Unknown Author';
        } catch (error) {
            console.error('Error getting user display name:', error);
            return 'Unknown Author';
        }
    }

    
    formatEmailAsName(email) {
        if (!email) return 'Unknown Author';
        
        
        const namePart = email.split('@')[0];
        return namePart
            .split(/[._-]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
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
            const storageRef = ref(this.storage, `meal_plan_images/${user.uid}/${imageFileName}`);
            const snapshot = await uploadBytes(storageRef, uploadPhoto);
            imageUrl = await getDownloadURL(snapshot.ref);
        } else {
            throw new Error('Please upload a meal plan image.');
        }

        
        const authorDisplayName = await this.getUserDisplayName(user.uid);

        const newMealPlan = {
            ...mealPlanData,
            imageUrl: imageUrl,
            imageFileName: imageFileName,
            author: authorDisplayName,
            authorId: user.uid,
            status: 'PENDING_APPROVAL',
            likes: 0,
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(this.db, 'meal_plans'), newMealPlan);
        return { id: docRef.id, ...newMealPlan };
    }

    
    async enhanceMealPlansWithAuthorNames(mealPlans) {
        const enhanced = [];
        
        for (const plan of mealPlans) {
            let enhancedPlan = { ...plan };
            
            
            if (plan.author && (plan.author.includes('@') || plan.author === 'Unknown Author')) {
                const betterName = await this.getUserDisplayName(plan.authorId);
                enhancedPlan.author = betterName;
            }
            
            enhanced.push(enhancedPlan);
        }
        
        return enhanced;
    }

    async getPendingMealPlans() {
        const q = query(
            collection(this.db, 'meal_plans'),
            where('status', '==', 'PENDING_APPROVAL')
        );
        const querySnapshot = await getDocs(q);
        const mealPlans = querySnapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data()
        }));
        
        return await this.enhanceMealPlansWithAuthorNames(mealPlans);
    }

    async getApprovedMealPlans() {
        const q = query(
            collection(this.db, 'meal_plans'),
            where('status', '==', 'APPROVED')
        );
        const querySnapshot = await getDocs(q);
        const mealPlans = querySnapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data()
        }));
        
        return await this.enhanceMealPlansWithAuthorNames(mealPlans);
    }

    async getRejectedMealPlans() {
        const q = query(
            collection(this.db, 'meal_plans'),
            where('status', '==', 'REJECTED')
        );
        const querySnapshot = await getDocs(q);
        const mealPlans = querySnapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data()
        }));
        
        return await this.enhanceMealPlansWithAuthorNames(mealPlans);
    }

    async getMealPlansByAuthor(authorId) {
        const q = query(
            collection(this.db, 'meal_plans'),
            where('authorId', '==', authorId)
        );
        const querySnapshot = await getDocs(q);
        const mealPlans = querySnapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data()
        }));
        
        return await this.enhanceMealPlansWithAuthorNames(mealPlans);
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
            const mealPlan = { _id: docSnap.id, ...docSnap.data() };
            
            
            if (mealPlan.author && (mealPlan.author.includes('@') || mealPlan.author === 'Unknown Author')) {
                mealPlan.author = await this.getUserDisplayName(mealPlan.authorId);
            }
            
            return mealPlan;
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

    onNotificationsSnapshot(userId, callback) {
        if (!userId) {
            console.warn("Attempted to set up notification listener without a user ID.");
            return () => {};
        }

        const q = query(
            collection(this.db, 'notifications'),
            where('recipientId', '==', userId),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data(),
                read: doc.data().isRead
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
            orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data(),
            read: doc.data().isRead
        }));
    }

    async markNotificationAsRead(notificationId) {
        const notificationRef = doc(this.db, 'notifications', notificationId);
        await updateDoc(notificationRef, { isRead: true });
        return true;
    }

    async deleteMealPlan(mealPlanId, imageFileName) {
        const user = this.auth.currentUser;

        
        const mealPlanDocRef = doc(this.db, 'meal_plans', mealPlanId);
        await deleteDoc(mealPlanDocRef);

        
        if (imageFileName) {
            const imageRef = ref(this.storage, `meal_plan_images/${user.uid}/${imageFileName}`);
            try {
                await deleteObject(imageRef);
                console.log(`Image ${imageFileName} deleted from storage.`);
            } catch (error) {
                if (error.code === 'storage/object-not-found') {
                    console.warn(`Image ${imageFileName} not found in storage. Skipping deletion.`);
                } else {
                    console.error(`Error deleting image ${imageFileName} from storage:`, error);
                }
            }
        }
        return true;
    }

    async updateMealPlan(mealPlanId, mealPlanData, newImageFile = null, originalImageFileName = null) {
        const user = this.auth.currentUser;
        const nutritionistInfo = AuthService.getCurrentUser();
        if (!user || !nutritionistInfo || nutritionistInfo.role !== 'nutritionist') {
            throw new Error('You must be logged in as an an approved nutritionist to update a meal plan.');
        }

        const mealPlanRef = doc(this.db, 'meal_plans', mealPlanId);
        const updatePayload = { ...mealPlanData };

        if (newImageFile) {
            
            if (originalImageFileName) {
                const oldImageRef = ref(this.storage, `meal_plan_images/${user.uid}/${originalImageFileName}`);
                try {
                    await deleteObject(oldImageRef);
                    console.log(`Old image ${originalImageFileName} deleted from storage.`);
                } catch (error) {
                    if (error.code === 'storage/object-not-found') {
                        console.warn(`Old image ${originalImageFileName} not found in storage. Skipping deletion.`);
                    } else {
                        console.error(`Error deleting old image ${originalImageFileName} from storage:`, error);
                    }
                }
            }

            
            const newImageFileName = `${Date.now()}_${newImageFile.name}`;
            const storageRef = ref(this.storage, `meal_plan_images/${user.uid}/${newImageFileName}`);
            const snapshot = await uploadBytes(storageRef, newImageFile);
            const newImageUrl = await getDownloadURL(snapshot.ref);

            updatePayload.imageUrl = newImageUrl;
            updatePayload.imageFileName = newImageFileName;
        } else if (originalImageFileName && !mealPlanData.imageUrl) {
            
            
            const oldImageRef = ref(this.storage,  `meal_plan_images/${user.uid}/${originalImageFileName}`);
            try {
                await deleteObject(oldImageRef);
                console.log(`Image ${originalImageFileName} deleted from storage (user removed).`);
            } catch (error) {
                if (error.code === 'storage/object-not-found') {
                    console.warn(`Image ${originalImageFileName} not found in storage. Skipping deletion.`);
                } else {
                    console.error(`Error deleting image ${originalImageFileName} from storage:`, error);
                }
            }
            updatePayload.imageUrl = '';
            updatePayload.imageFileName = '';
        }

        delete updatePayload.imageFile;
        delete updatePayload.originalImageFileName;

        await updateDoc(mealPlanRef, updatePayload);
        return { _id: mealPlanId, ...updatePayload };
    }
    
    async getPopularMealPlans() {
        const q = query(
            collection(this.db, 'meal_plans'),
            orderBy('likes', 'desc'),
            limit(20) 
        );
        const querySnapshot = await getDocs(q);
        const mealPlans = querySnapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data()
        }));
        
        return await this.enhanceMealPlansWithAuthorNames(mealPlans);
    }
}

export default new MealPlanService();