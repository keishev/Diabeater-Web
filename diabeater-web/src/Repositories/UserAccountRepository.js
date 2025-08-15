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


    formatDate(timestamp, format = 'long') {
        if (!timestamp) return 'N/A';
        
        let date;
        if (timestamp && typeof timestamp.toDate === 'function') {
         
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else {
            return 'N/A';
        }

        if (isNaN(date.getTime())) {
            return 'N/A';
        }

        if (format === 'short') {
            return date.toLocaleDateString('en-SG', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } else if (format === 'long') {
            return date.toLocaleDateString('en-SG', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
        
        return date.toLocaleDateString('en-SG');
    }

    async getAllUsers() {
        try {
            const usersSnapshot = await getDocs(collection(db, 'user_accounts'));
            const users = usersSnapshot.docs.map(doc => {
                const data = doc.data();
                
                
                const userSince = this.formatDate(data.createdAt, 'long');
                
                return {
                    id: doc.id,
                    ...data,
                    userSince: userSince
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