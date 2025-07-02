// src/Repositories/UserRepository.js
// Import initialized auth and db directly from your firebase.js
import { auth, db } from '../firebase'; // <--- This line is the key correction
// Still need these specific Firestore functions for operations like getDocs
import { collection, getDocs } from 'firebase/firestore'; 

class UserRepository {
    // IMPORTANT: Set this to the URL of your deployed custom backend server
    // For local development, it will be 'http://localhost:5000'
    // For production, change this to 'https://your-deployed-backend.com'
    backendBaseUrl = 'http://localhost:5000'; // Make sure this matches your backend server's address

    /**
     * Helper to get the current admin user's ID token.
     * This token is sent to your custom backend for authentication.
     * @returns {Promise<string>} The Firebase ID token.
     * @throws {Error} If no user is authenticated.
     */
    async getAdminIdToken() {
        // Use the 'auth' object directly, which is imported from firebase.js
        const currentUser = auth.currentUser; 
        if (!currentUser) {
            throw new Error("No authenticated user. Administrator must be logged in.");
        }
        return await currentUser.getIdToken();
    }

    /**
     * Fetches all user accounts directly from Firestore using the 'db' object from firebase.js.
     * Assuming this is a client-side read allowed by your Firestore Security Rules for admins.
     * If this needs server-side processing or more strict access, you'd add a backend endpoint for it.
     */
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

    /**
     * Calls the custom backend server to suspend a user.
     * @param {string} userId - The UID of the user to suspend.
     * @returns {Promise<object>} A promise that resolves with success message from backend.
     */
    async suspendUser(userId) {
        try {
            const idToken = await this.getAdminIdToken();

            const response = await fetch(`${this.backendBaseUrl}/api/users/suspend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}` // Send the admin's ID token
                },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();

            if (!response.ok) {
                // Backend sent an error response (e.g., 401, 403, 400, 404, 500)
                throw new Error(data.message || `Backend error: HTTP status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`Error in UserRepository.suspendUser for ID ${userId}:`, error);
            throw new Error(`Failed to suspend user: ${error.message}`);
        }
    }

    /**
     * Calls the custom backend server to unsuspend a user.
     * @param {string} userId - The UID of the user to unsuspend.
     * @returns {Promise<object>} A promise that resolves with success message from backend.
     */
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
}

export default new UserRepository();