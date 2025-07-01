// src/services/AuthService.js
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '../firebase';

const auth = getAuth(app);
const db = getFirestore(app);

const AuthService = {
    async loginWithEmail(email, password, selectedRole) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch Firestore doc
        const userDocRef = doc(db, 'user_accounts', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            throw new Error('User account not found in database.');
        }

        const userData = userDocSnap.data();

        // Check role + approval status
        if (userData.role !== selectedRole) {
            throw new Error(`This account is not registered as ${selectedRole}.`);
        }

        if (selectedRole === 'nutritionist' && userData.status !== true) {
            throw new Error('Nutritionist account is not approved.');
        }

        // Success
        return {
            uid: user.uid,
            role: userData.role,
            status: userData.status ?? null
        };
    },

    async logout() {
        await signOut(auth);
    }
};

export default AuthService;