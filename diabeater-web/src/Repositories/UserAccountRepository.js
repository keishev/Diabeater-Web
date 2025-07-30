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
            const usersSnapshot = await getDocs(collection(db, 'user_accounts'));
            const users = usersSnapshot.docs.map(doc => {
                const data = doc.data();
                let userSince = 'N/A';
                if (data.createdAt && data.createdAt.toDate) {
                    // Convert Firebase Timestamp to a Date object, then format it
                    const date = data.createdAt.toDate();
                    userSince = date.toLocaleDateString('en-SG', { // 'en-SG' for Singapore date format, adjust as needed
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                }
                return {
                    id: doc.id,
                    ...data,
                    userSince: userSince // Add the formatted userSince field
                };
            });
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
                throw new Error(data.message || `Backend error: HTTP status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`Error in UserAccountRepository.suspendUser for ID ${userId}:`, error);
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
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Backend error: HTTP status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`Error in UserAccountRepository.unsuspendUser for ID ${userId}:`, error);
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