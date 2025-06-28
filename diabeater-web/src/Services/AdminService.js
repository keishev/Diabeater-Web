// src/Services/AdminService.js
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase'; // Import the initialized app

const functions = getFunctions(app);

class AdminService {
    constructor() {
        this.approveNutritionistCallable = httpsCallable(functions, 'approveNutritionist');
        this.rejectNutritionistCallable = httpsCallable(functions, 'rejectNutritionist');
        this.getNutritionistCertificateUrlCallable = httpsCallable(functions, 'getNutritionistCertificateUrl');
        this.addAdminRoleCallable = httpsCallable(functions, 'addAdminRole'); // For dev only
    }

    async approveNutritionist(userId) {
        try {
            const result = await this.approveNutritionistCallable({ userId });
            return result.data;
        } catch (error) {
            console.error("Error calling approveNutritionist function:", error);
            throw error;
        }
    }

    async rejectNutritionist(userId, reason) {
        try {
            const result = await this.rejectNutritionistCallable({ userId, reason });
            return result.data;
        } catch (error) {
            console.error("Error calling rejectNutritionist function:", error);
            throw error;
        }
    }

    async getNutritionistCertificateUrl(userId) {
        try {
            const result = await this.getNutritionistCertificateUrlCallable({ userId });
            return result.data.certificateUrl; // Assuming the function returns { success: true, certificateUrl: '...' }
        } catch (error) {
            console.error("Error calling getNutritionistCertificateUrl function:", error);
            throw error;
        }
    }

    // --- FOR DEVELOPMENT ONLY: Function to set admin role ---
    async addAdminRole(email) {
        try {
            const result = await this.addAdminRoleCallable({ email });
            return result.data;
        } catch (error) {
            console.error("Error calling addAdminRole function:", error);
            throw error;
        }
    }
}

export default new AdminService();