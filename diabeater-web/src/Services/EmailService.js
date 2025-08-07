// src/Services/EmailService.js
import { getFunctions, httpsCallable } from 'firebase/functions';

class EmailService {
    constructor() {
        this.functions = getFunctions();
    }

    async sendApprovalEmail(email, name) {
        try {
            const sendApprovalEmail = httpsCallable(this.functions, 'sendApprovalEmail');
            const result = await sendApprovalEmail({
                email: email,
                name: name
            });
            
            console.log('Approval email sent successfully:', result.data);
            return result.data;
        } catch (error) {
            console.error('Error sending approval email:', error);
            throw error;
        }
    }

    async sendRejectionEmail(email, name, reason) {
        try {
            const sendRejectionEmail = httpsCallable(this.functions, 'sendRejectionEmail');
            const result = await sendRejectionEmail({
                email: email,
                name: name,
                reason: reason
            });
            
            console.log('Rejection email sent successfully:', result.data);
            return result.data;
        } catch (error) {
            console.error('Error sending rejection email:', error);
            throw error;
        }
    }
}

export default new EmailService();