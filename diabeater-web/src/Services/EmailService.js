
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebase'; 

class EmailService {
    constructor() {
        this.functions = getFunctions();
    }

    
    async ensureAuthenticated() {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated to send emails');
        }

        
        try {
            await currentUser.getIdToken(true);
            console.log('User authentication verified');
            return currentUser;
        } catch (error) {
            console.error('Error refreshing authentication token:', error);
            throw new Error('Authentication token refresh failed');
        }
    }

    async sendApprovalEmail(email, name) {
        try {
            console.log(`Sending approval email to: ${email} for: ${name}`);
            
            if (!email || !name) {
                throw new Error('Email and name are required for sending approval email');
            }

            
            await this.ensureAuthenticated();

            const sendApprovalEmail = httpsCallable(this.functions, 'sendApprovalEmail');
            const result = await sendApprovalEmail({
                email: email.trim(),
                name: name.trim()
            });
            
            console.log('Approval email sent successfully:', result.data);
            return {
                success: true,
                message: 'Approval email sent successfully',
                data: result.data
            };
        } catch (error) {
            console.error('Error sending approval email:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                details: error.details
            });
            
            
            let errorMessage = error.message;
            if (error.code === 'unauthenticated') {
                errorMessage = 'You must be logged in as an admin to send approval emails';
            } else if (error.code === 'permission-denied') {
                errorMessage = 'You do not have permission to send approval emails. Admin privileges required.';
            }
            
            
            
            return {
                success: false,
                message: `Failed to send approval email: ${errorMessage}`,
                error: error
            };
        }
    }

    async sendRejectionEmail(email, name, reason) {
        try {
            console.log(`Sending rejection email to: ${email} for: ${name} with reason: ${reason}`);
            
            if (!email || !name) {
                throw new Error('Email and name are required for sending rejection email');
            }

            
            await this.ensureAuthenticated();

            const sendRejectionEmail = httpsCallable(this.functions, 'sendRejectionEmail');
            const result = await sendRejectionEmail({
                email: email.trim(),
                name: name.trim(),
                reason: (reason || 'No specific reason provided').trim()
            });
            
            console.log('Rejection email sent successfully:', result.data);
            return {
                success: true,
                message: 'Rejection email sent successfully',
                data: result.data
            };
        } catch (error) {
            console.error('Error sending rejection email:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                details: error.details
            });
            
            
            let errorMessage = error.message;
            if (error.code === 'unauthenticated') {
                errorMessage = 'You must be logged in as an admin to send rejection emails';
            } else if (error.code === 'permission-denied') {
                errorMessage = 'You do not have permission to send rejection emails. Admin privileges required.';
            }
            
            
            
            return {
                success: false,
                message: `Failed to send rejection email: ${errorMessage}`,
                error: error
            };
        }
    }

    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    
    async testConnection() {
        try {
            console.log('Testing email service connection...');
            
            
            await this.ensureAuthenticated();
            
            const testFunction = httpsCallable(this.functions, 'testEmailService');
            const result = await testFunction();
            console.log('Email service connection test successful:', result.data);
            return { success: true, data: result.data };
        } catch (error) {
            console.error('Email service connection test failed:', error);
            
            let errorMessage = error.message;
            if (error.code === 'unauthenticated') {
                errorMessage = 'You must be logged in as an admin to test email service';
            } else if (error.code === 'permission-denied') {
                errorMessage = 'You do not have permission to test email service. Admin privileges required.';
            }
            
            return { success: false, error: errorMessage };
        }
    }

    
    async checkAdminStatus() {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                return { isAuthenticated: false, isAdmin: false };
            }

            const idTokenResult = await currentUser.getIdTokenResult(true);
            const claims = idTokenResult.claims;
            
            return {
                isAuthenticated: true,
                isAdmin: claims.admin === true,
                userEmail: currentUser.email,
                userId: currentUser.uid
            };
        } catch (error) {
            console.error('Error checking admin status:', error);
            return { isAuthenticated: false, isAdmin: false, error: error.message };
        }
    }
}

export default new EmailService();