// src/repositories/AuthRepository.js
import AuthService from '../Services/AuthService';

const AuthRepository = {
    async login(email, password, selectedRole) {
        try {
            const result = await AuthService.loginWithEmail(email, password, selectedRole);
            return {
                success: true,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    async logout() {
        try {
            await AuthService.logout();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Requests a password reset and handles the response.
     * @param {string} email The email address to send the reset link to.
     * @returns {Promise<object>} A result object with success status and a message or error.
     */
    async requestPasswordReset(email) {
        try {
            await AuthService.sendPasswordResetLink(email);
           
            return { 
                success: true, 
                message: "If an account with that email exists, a password reset link has been sent to your email."
            };
        } catch (error) {
         
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
                return {
                    success: true,
                    message: "If an account with that email exists, a password reset link has been sent to your email."
                };
            }
          
            return { 
                success: false, 
                error: error.message 
            };
        }
    }
};

export default AuthRepository;