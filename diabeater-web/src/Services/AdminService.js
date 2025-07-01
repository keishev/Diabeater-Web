// // src/Services/AdminService.js
// import { getFunctions, httpsCallable } from 'firebase/functions';
// import app from '../firebase'; // Import the initialized app

// const functions = getFunctions(app);

// class AdminService {
//     constructor() {
//         this.approveNutritionistCallable = httpsCallable(functions, 'approveNutritionist');
//         this.rejectNutritionistCallable = httpsCallable(functions, 'rejectNutritionist');
//         this.getNutritionistCertificateUrlCallable = httpsCallable(functions, 'getNutritionistCertificateUrl');
//         this.addAdminRoleCallable = httpsCallable(functions, 'addAdminRole'); // For dev only
//     }

//     async approveNutritionist(userId) {
//         try {
//             const result = await this.approveNutritionistCallable({ userId });
//             return result.data;
//         } catch (error) {
//             console.error("Error calling approveNutritionist function:", error);
//             throw error;
//         }
//     }

//     async rejectNutritionist(userId, reason) {
//         try {
//             // *** MODIFICATION HERE: Change 'reason' to 'rejectionReason' to match Cloud Function ***
//             const result = await this.rejectNutritionistCallable({ userId, rejectionReason: reason });
//             return result.data;
//         } catch (error) {
//             console.error("Error calling rejectNutritionist function:", error);
//             throw error;
//         }
//     }

//     async getNutritionistCertificateUrl(userId) {
//         try {
//             const result = await this.getNutritionistCertificateUrlCallable({ userId });
//             // The Cloud Function returns { success: true, certificateUrl: '...' }
//             // Ensure you're returning just the URL, as expected by the ViewModel
//             return result.data.certificateUrl; 
//         } catch (error) {
//             console.error("Error calling getNutritionistCertificateUrl function:", error);
//             throw error;
//         }
//     }

//     // --- FOR DEVELOPMENT ONLY: Function to set admin role ---
//     async addAdminRole(email) {
//         try {
//             const result = await this.addAdminRoleCallable({ email });
//             return result.data;
//         } catch (error) {
//             console.error("Error calling addAdminRole function:", error);
//             throw error;
//         }
//     }
// }

// export default new AdminService();

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
