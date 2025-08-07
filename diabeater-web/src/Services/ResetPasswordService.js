// src/services/ResetPasswordService.js
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

class ResetPasswordService {
    constructor() {
        this.auth = getAuth();
    }

    /**
     * Sends a password reset email to the specified email address.
     * @param {string} email - The user's email address.
     * @returns {Promise<void>} A promise that resolves if the email is sent successfully, or rejects with an error.
     */
    async sendPasswordResetLink(email) {
        try {
            await sendPasswordResetEmail(this.auth, email);
            console.log('Password reset email sent successfully.');
            return Promise.resolve();
        } catch (error) {
            console.error('Error sending password reset email:', error);
            // Re-throw the error to be handled by the repository and view model
            return Promise.reject(error);
        }
    }
}

export default new ResetPasswordService();