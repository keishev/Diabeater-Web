// src/Services/EmailService.js
import { getFunctions, httpsCallable } from 'firebase/functions';

class EmailService {
    constructor() {
        this.functions = getFunctions();
    }

    async sendApprovalEmail(email, name) {
        try {
            console.log(`Sending approval email to: ${email} for: ${name}`);
            
            if (!email || !name) {
                throw new Error('Email and name are required for sending approval email');
            }

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
            
            // Don't throw the error - return error info instead
            // This allows the approval process to continue even if email fails
            return {
                success: false,
                message: `Failed to send approval email: ${error.message}`,
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
            
            // Don't throw the error - return error info instead
            // This allows the rejection process to continue even if email fails
            return {
                success: false,
                message: `Failed to send rejection email: ${error.message}`,
                error: error
            };
        }
    }

    // Helper method to validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Method to test email service connectivity
    async testConnection() {
        try {
            console.log('Testing email service connection...');
            const testFunction = httpsCallable(this.functions, 'testEmailService');
            const result = await testFunction();
            console.log('Email service connection test successful:', result.data);
            return { success: true, data: result.data };
        } catch (error) {
            console.error('Email service connection test failed:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new EmailService();