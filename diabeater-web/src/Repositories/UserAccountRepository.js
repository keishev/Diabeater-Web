// src/Repositories/UserRepository.js
import { auth, db } from '../firebase'; 
import { collection, getDocs } from 'firebase/firestore'; 
import UserAccountService from '../Services/UserAccountService';

class UserAccountRepository {
    backendBaseUrl = 'http://localhost:5000'; 
    
    async getAdminIdToken() {
        const currentUser = auth.currentUser; 
        if (!currentUser) {
            throw new Error("No authenticated user. Administrator must be logged in.");
        }
        return await currentUser.getIdToken();
    }

    async getAllUsers() {
        try {
            // Use the 'db' object directly, which is imported from firebase.js
            const usersSnapshot = await getDocs(collection(db, 'user_accounts'));
            const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return users;
        } catch (error) {
            console.error("Error fetching all users from Firestore:", error);
            throw new Error("Failed to fetch user accounts. " + error.message);
        }
    }

    async suspendUser(userId) {
        try {
            const idToken = await this.getAdminIdToken();

            const response = await fetch(`${this.backendBaseUrl}/api/users/suspend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();

            if (!response.ok) {
                // Backend sent an error response 
                throw new Error(data.message || `Backend error: HTTP status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`Error in UserRepository.suspendUser for ID ${userId}:`, error);
            throw new Error(`Failed to suspend user: ${error.message}`);
        }
    }
    
    async unsuspendUser(userId) {
        try {
            const idToken = await this.getAdminIdToken();

            const response = await fetch(`${this.backendBaseUrl}/api/users/unsuspend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}` // Send the admin's ID token
                },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Backend error: HTTP status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`Error in UserRepository.unsuspendUser for ID ${userId}:`, error);
            throw new Error(`Failed to unsuspend user: ${error.message}`);
        }
    }

    getAdminProfile(uid) {
        return UserAccountService.fetchAdminProfile(uid);
    }

    updateAdminProfile(uid, profileData) {
        return UserAccountService.updateAdminProfile(uid, profileData);
    }

    getNutritionistProfile(uid) {
        return UserAccountService.fetchNutritionistProfile(uid);
    }

    updateNutritionistProfile(uid, profileData) {
        return UserAccountService.updateNutritionistProfile(uid, profileData);
    }

    uploadProfileImage(uid, file) {
        return UserAccountService.uploadProfileImage(uid, file);
    }
}

export default new UserAccountRepository();