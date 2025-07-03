// src/services/AuthService.js
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '../firebase';

const auth = getAuth(app);
const db = getFirestore(app);

// Keys for localStorage
const USER_UID_KEY = 'currentUserUid';
const USER_ROLE_KEY = 'currentUserRole';
const USER_NAME_KEY = 'currentUserName'; // Assuming 'name' will be part of userDocSnap.data()

const AuthService = {
    async loginWithEmail(email, password, selectedRole) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch Firestore doc for additional user data
        const userDocRef = doc(db, 'user_accounts', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            // Immediately sign out if no corresponding user_accounts document is found
            await signOut(auth);
            throw new Error('User account not found in database. Please contact support.');
        }

        const userData = userDocSnap.data();

        // 1. Check if the role from Firestore matches the role the user is trying to log in as
        if (userData.role !== selectedRole) {
            await signOut(auth); // Sign out if role mismatch
            throw new Error(`This account is not registered as a ${selectedRole}. It is registered as a ${userData.role || 'unknown role'}.`);
        }

        // 2. Specific check for 'nutritionist' status
        if (selectedRole === 'nutritionist') {
            // ⭐⭐⭐ CRITICAL FIX HERE: Check against the string 'Active', not boolean true ⭐⭐⭐
            if (userData.status !== 'Active') {
                await signOut(auth); // Sign out if status is not 'Active'
                throw new Error('Nutritionist account is not active. Please wait for admin approval.');
            }
        }
        // Add similar checks for 'admin' if needed, e.g., if admins also have a status

        // Store relevant user data in localStorage upon successful login
        localStorage.setItem(USER_UID_KEY, user.uid);
        localStorage.setItem(USER_ROLE_KEY, userData.role);
        localStorage.setItem(USER_NAME_KEY, userData.name || userData.username || user.email || 'Unknown User'); // Fallback to email

        // Success
        return {
            uid: user.uid,
            role: userData.role,
            // Ensure status is correctly returned, consistent with Firestore string value
            status: userData.status,
            name: userData.name || userData.username || user.email || 'Unknown User'
        };
    },

    async logout() {
        await signOut(auth);
        // Clear user data from localStorage on logout
        localStorage.removeItem(USER_UID_KEY);
        localStorage.removeItem(USER_ROLE_KEY);
        localStorage.removeItem(USER_NAME_KEY);
        console.log("AuthService: Local storage cleared on logout.");
    },

    // New method to get current user data from localStorage
    getCurrentUser() {
        const uid = localStorage.getItem(USER_UID_KEY);
        const role = localStorage.getItem(USER_ROLE_KEY);
        const name = localStorage.getItem(USER_NAME_KEY);

        if (uid && role) {
            return { uid, role, name };
        }
        return null;
    }
};

export default AuthService;