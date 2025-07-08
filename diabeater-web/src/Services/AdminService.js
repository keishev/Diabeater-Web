// src/services/AdminService.js
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '../firebase';

const db = getFirestore(app);
const auth = getAuth(app);

const AdminService = {
    async checkIfCurrentUserIsAdmin() {
        const user = auth.currentUser;
        if (!user) throw new Error("No user logged in.");
        console.log ('uid', user.uid);

        const userRef = doc(db, 'user_accounts', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error("User account not found in Firestore.");
        }

        const data = userSnap.data();
        return data.role === 'admin';
    }
};

export default AdminService;
