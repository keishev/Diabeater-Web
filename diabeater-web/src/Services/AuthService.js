// src/services/AuthService.js
import { getAuth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '../firebase';

const auth = getAuth(app);
const db = getFirestore(app);

// Keys for localStorage
const USER_UID_KEY = 'currentUserUid';
const USER_ROLE_KEY = 'currentUserRole';
const USER_NAME_KEY = 'currentUserName';

const AuthService = {
    async loginWithEmail(email, password, selectedRole) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDocRef = doc(db, 'user_accounts', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            await signOut(auth);
            throw new Error('User account not found in database. Please contact support.');
        }

        const userData = userDocSnap.data();

        if (userData.role !== selectedRole) {
            await signOut(auth);
            throw new Error(`This account is not registered as a ${selectedRole}. It is registered as a ${userData.role || 'unknown role'}.`);
        }

        if (selectedRole === 'nutritionist') {
            if (userData.status !== 'Active') {
                await signOut(auth);
                throw new Error('Nutritionist account is not active. Please wait for admin approval.');
            }
        }

        localStorage.setItem(USER_UID_KEY, user.uid);
        localStorage.setItem(USER_ROLE_KEY, userData.role);
        localStorage.setItem(USER_NAME_KEY, userData.name || userData.username || user.email || 'Unknown User');

        return {
            uid: user.uid,
            role: userData.role,
            status: userData.status,
            name: userData.name || userData.username || user.email || 'Unknown User'
        };
    },

    async logout() {
        await signOut(auth);
        localStorage.removeItem(USER_UID_KEY);
        localStorage.removeItem(USER_ROLE_KEY);
        localStorage.removeItem(USER_NAME_KEY);
        console.log("AuthService: Local storage cleared on logout.");
    },

    getCurrentUser() {
        const uid = localStorage.getItem(USER_UID_KEY);
        const role = localStorage.getItem(USER_ROLE_KEY);
        const name = localStorage.getItem(USER_NAME_KEY);

        if (uid && role) {
            return { uid, role, name };
        }
        return null;
    },

    /**
     * Sends a password reset email using Firebase Authentication.
     * @param {string} email The email of the user to send the reset link to.
     * @returns {Promise<void>} A promise that resolves on success or rejects on failure.
     */
    async sendPasswordResetLink(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            console.log("Password reset email sent to:", email);
        } catch (error) {
            console.error("AuthService Error sending password reset email:", error);
            throw error;
        }
    }
};

export default AuthService;