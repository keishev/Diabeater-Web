
const { onRequest, onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');


if (!admin.apps.length) {
    admin.initializeApp();
}

const db = getFirestore();
const auth = getAuth();
const storage = admin.storage();


const gmailEmail = defineSecret('GMAIL_EMAIL');
const gmailPassword = defineSecret('GMAIL_PASSWORD');



const getTransporter = () => {
    try {
        console.log('=== Creating email transporter ===');
        
        
        const emailValue = gmailEmail.value();
        const passwordValue = gmailPassword.value();
        
        console.log('Gmail email secret exists:', !!emailValue);
        console.log('Gmail email preview:', emailValue ? `${emailValue.substring(0, 3)}***@${emailValue.split('@')[1]}` : 'NULL');
        console.log('Gmail password secret exists:', !!passwordValue);
        console.log('Gmail password length:', passwordValue ? passwordValue.length : 0);
        
        if (!emailValue) {
            throw new Error('GMAIL_EMAIL secret is not set or is empty');
        }
        
        if (!passwordValue) {
            throw new Error('GMAIL_PASSWORD secret is not set or is empty');
        }
        
        if (passwordValue.length !== 16) {
            throw new Error(`Gmail password should be 16 characters (App Password), got ${passwordValue.length} characters`);
        }
        
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailValue,
                pass: passwordValue
            },
            debug: true,
            logger: true
        });
        
        console.log('Email transporter created successfully');
        return transporter;
    } catch (error) {
        console.error('Error creating email transporter:', error);
        throw new Error(`Email service configuration error: ${error.message}`);
    }
};


const isAdmin = async (context) => {
    if (!context.auth) {
        console.warn("Attempt to call admin function by unauthenticated user.");
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const uid = context.auth.uid;
    try {
        const userRecord = await auth.getUser(uid);
        if (userRecord.customClaims && userRecord.customClaims.admin === true) {
            return true;
        }
        console.warn(`User ${uid} attempted to call admin function without admin claim.`);
        throw new functions.https.HttpsError('permission-denied', 'You do not have permission to perform this action.');
    } catch (error) {
        console.error(`Error checking admin status for UID ${uid}:`, error);
        throw new functions.https.HttpsError('permission-denied', 'Authentication failed or user not authorized.', error.message);
    }
};


exports.debugEmailConfig = onCall({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
    secrets: [gmailEmail, gmailPassword]
}, async (request) => {
    try {
        await isAdmin(request);
        
        console.log('=== EMAIL CONFIG DEBUG ===');
        
        
        const emailValue = gmailEmail.value();
        const passwordValue = gmailPassword.value();
        
        console.log('Gmail email secret exists:', !!emailValue);
        console.log('Gmail email value:', emailValue ? `${emailValue.substring(0, 3)}***@${emailValue.split('@')[1]}` : 'NULL');
        console.log('Gmail password secret exists:', !!passwordValue);
        console.log('Gmail password length:', passwordValue ? passwordValue.length : 0);
        
        
        let transporterError = null;
        try {
            const transporter = getTransporter();
            
            
            console.log('Testing SMTP connection...');
            await transporter.verify();
            console.log('Transporter verification: SUCCESS');
            
        } catch (error) {
            console.error('Transporter error:', error);
            transporterError = error.message;
        }
        
        return {
            success: !transporterError,
            emailExists: !!emailValue,
            passwordExists: !!passwordValue,
            emailPreview: emailValue ? `${emailValue.substring(0, 3)}***@${emailValue.split('@')[1]}` : null,
            passwordLength: passwordValue ? passwordValue.length : 0,
            transporterError: transporterError,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Debug function error:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
});


exports.testEmailService = onCall({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [gmailEmail, gmailPassword]
}, async (request) => {
    try {
        await isAdmin(request);
        
        console.log('=== TESTING EMAIL SERVICE ===');
        
        const transporter = getTransporter();
        
        
        console.log('Verifying SMTP connection...');
        await transporter.verify();
        console.log('SMTP connection verified successfully');
        
        
        const testEmail = {
            from: `"DiaBeater Team" <${gmailEmail.value()}>`,
            to: gmailEmail.value(), 
            subject: 'Email Service Test - DiaBeater',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Email Service Test</h2>
                    <p>This is a test email sent at ${new Date().toISOString()}</p>
                    <p>If you receive this, your email configuration is working perfectly!</p>
                    <hr>
                    <p><small>Sent from Firebase Functions</small></p>
                </div>
            `
        };
        
        console.log('Sending test email...');
        const info = await transporter.sendMail(testEmail);
        console.log('Test email sent successfully:', info.messageId);
        
        return { 
            success: true, 
            message: 'Email service is working perfectly! Check your inbox.',
            messageId: info.messageId,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Email service test failed:', error);
        return {
            success: false,
            error: error.message,
            code: error.code,
            timestamp: new Date().toISOString()
        };
    }
});


exports.sendApprovalEmail = onCall({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [gmailEmail, gmailPassword]
}, async (request) => {
    try {
        console.log('=== SEND APPROVAL EMAIL FUNCTION CALLED ===');
        console.log('Request data:', request.data);
        
        await isAdmin(request);
        
        const { email, name } = request.data;
        if (!email || !name) {
            throw new functions.https.HttpsError('invalid-argument', 'Email and name are required');
        }

        console.log(`Sending approval email to: ${email} for: ${name}`);

        const transporter = getTransporter();
        
        
        try {
            console.log('Verifying SMTP connection...');
            await transporter.verify();
            console.log('SMTP connection verified successfully');
        } catch (verifyError) {
            console.error('SMTP connection verification failed:', verifyError);
            throw new functions.https.HttpsError('internal', `SMTP connection failed: ${verifyError.message}`);
        }
        
        const mailOptions = {
            from: `"DiaBeater Team" <${gmailEmail.value()}>`,
            to: email,
            subject: 'Nutritionist Application Approved - DiaBeater',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #d32f2f; margin: 10px 0;">DiaBeater</h1>
                    </div>
                    <h2 style="color: #4CAF50; text-align: center;">🎉 Congratulations! Your Application Has Been Approved</h2>
                    <p>Dear ${name},</p>
                    <p>We are pleased to inform you that your nutritionist application has been <strong>approved</strong>!</p>
                    <p>You can now log in to your DiaBeater nutritionist account using your registered email and password.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333;">What's Next?</h3>
                        <ul style="margin-bottom: 0;">
                            <li>Log in to your account</li>
                            <li>Complete your profile setup</li>
                            <li>Start helping users with their nutritional goals</li>
                        </ul>
                    </div>
                    
                    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                    <p>Welcome to the DiaBeater community!</p>
                    
                    <p style="margin-top: 30px;">
                        Best regards,<br>
                        <strong>The DiaBeater Team</strong>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            `
        };

        console.log('Attempting to send email...');
        const info = await transporter.sendMail(mailOptions);
        console.log(`Approval email sent successfully to ${email}. MessageId: ${info.messageId}`);
        
        return { 
            success: true, 
            message: 'Approval email sent successfully',
            messageId: info.messageId
        };

    } catch (error) {
        console.error('=== SEND APPROVAL EMAIL ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        
        let errorMessage = error.message;
        if (error.code === 'EAUTH') {
            errorMessage = 'Gmail authentication failed. Please check your app password.';
        } else if (error.code === 'ECONNECTION') {
            errorMessage = 'Failed to connect to Gmail SMTP server.';
        } else if (error.code === 'EMESSAGE') {
            errorMessage = 'Invalid email message format.';
        }
        
        throw new functions.https.HttpsError('internal', `Failed to send approval email: ${errorMessage}`);
    }
});


exports.sendRejectionEmail = onCall({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [gmailEmail, gmailPassword]
}, async (request) => {
    try {
        console.log('=== SEND REJECTION EMAIL FUNCTION CALLED ===');
        console.log('Request data:', request.data);
        
        await isAdmin(request);
        
        const { email, name, reason } = request.data;
        if (!email || !name) {
            throw new functions.https.HttpsError('invalid-argument', 'Email and name are required');
        }

        console.log(`Sending rejection email to: ${email} for: ${name} with reason: ${reason || 'No reason provided'}`);

        const transporter = getTransporter();
        
        
        try {
            console.log('Verifying SMTP connection...');
            await transporter.verify();
            console.log('SMTP connection verified successfully');
        } catch (verifyError) {
            console.error('SMTP connection verification failed:', verifyError);
            throw new functions.https.HttpsError('internal', `SMTP connection failed: ${verifyError.message}`);
        }
        
        const mailOptions = {
            from: `"DiaBeater Team" <${gmailEmail.value()}>`,
            to: email,
            subject: 'Nutritionist Application Update - DiaBeater',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #d32f2f; margin: 10px 0;">DiaBeater</h1>
                    </div>
                    <h2 style="color: #f44336; text-align: center;">Application Status Update</h2>
                    <p>Dear ${name},</p>
                    <p>Thank you for your interest in becoming a nutritionist with DiaBeater.</p>
                    <p>After careful review of your application, we regret to inform you that we are unable to approve your nutritionist application at this time.</p>
                    
                    ${reason && reason.trim() && reason !== 'No reason provided.' ? `
                        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                            <h3 style="margin-top: 0; color: #856404;">Reason for Rejection:</h3>
                            <p style="margin-bottom: 0; color: #856404;">${reason}</p>
                        </div>
                    ` : ''}
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333;">What can you do?</h3>
                        <ul style="margin-bottom: 0;">
                            <li>Review the reason for rejection above</li>
                            <li>Address any issues with your credentials or application</li>
                            <li>You may reapply in the future once you meet all requirements</li>
                        </ul>
                    </div>
                    
                    <p>If you believe this decision was made in error or have questions about the review process, please contact our support team.</p>
                    <p>Thank you for your understanding.</p>
                    
                    <p style="margin-top: 30px;">
                        Best regards,<br>
                        <strong>The DiaBeater Team</strong>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            `
        };

        console.log('Attempting to send email...');
        const info = await transporter.sendMail(mailOptions);
        console.log(`Rejection email sent successfully to ${email}. MessageId: ${info.messageId}`);
        
        return { 
            success: true, 
            message: 'Rejection email sent successfully',
            messageId: info.messageId
        };

    } catch (error) {
        console.error('=== SEND REJECTION EMAIL ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        
        let errorMessage = error.message;
        if (error.code === 'EAUTH') {
            errorMessage = 'Gmail authentication failed. Please check your app password.';
        } else if (error.code === 'ECONNECTION') {
            errorMessage = 'Failed to connect to Gmail SMTP server.';
        } else if (error.code === 'EMESSAGE') {
            errorMessage = 'Invalid email message format.';
        }
        
        throw new functions.https.HttpsError('internal', `Failed to send rejection email: ${errorMessage}`);
    }
});


exports.approveNutritionist = onCall({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 120,
    secrets: [gmailEmail, gmailPassword]
}, async (request) => {
    try {
        await isAdmin(request);
        const { userId } = request.data;
        
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
        }

        console.log(`Approving nutritionist: ${userId}`);

        
        const nutritionistRef = db.collection('nutritionists').doc(userId);
        const nutritionistDoc = await nutritionistRef.get();

        if (!nutritionistDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Nutritionist not found');
        }

        const nutritionistData = nutritionistDoc.data();

        
        await nutritionistRef.update({
            status: 'approved',
            approvedAt: FieldValue.serverTimestamp()
        });

        
        await auth.setCustomUserClaims(userId, {
            nutritionist: true,
            approved: true,
            rejected: false
        });
        await auth.revokeRefreshTokens(userId);

        console.log(`Nutritionist ${userId} approved successfully`);

        
        try {
            const email = nutritionistData.email;
            const name = nutritionistData.firstName && nutritionistData.lastName 
                ? `${nutritionistData.firstName} ${nutritionistData.lastName}`
                : nutritionistData.name || 'Nutritionist';

            if (email) {
                const transporter = getTransporter();
                
                const mailOptions = {
                    from: gmailEmail.value(),
                    to: email,
                    subject: 'Nutritionist Application Approved - DiaBeater',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <h1 style="color: #d32f2f; margin: 10px 0;">DiaBeater</h1>
                            </div>
                            <h2 style="color: #4CAF50; text-align: center;">🎉 Congratulations! Your Application Has Been Approved</h2>
                            <p>Dear ${name},</p>
                            <p>We are pleased to inform you that your nutritionist application has been <strong>approved</strong>!</p>
                            <p>You can now log in to your DiaBeater nutritionist account using your registered email and password.</p>
                            <p>Welcome to the DiaBeater community!</p>
                            <p style="margin-top: 30px;">
                                Best regards,<br>
                                <strong>The DiaBeater Team</strong>
                            </p>
                        </div>
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log(`Auto-sent approval email to ${email}`);
            }

        } catch (emailError) {
            console.error('Error sending auto-approval email:', emailError);
            
        }
        
        return { 
            success: true, 
            message: `Nutritionist ${userId} has been approved and notification email sent` 
        };

    } catch (error) {
        console.error('Error approving nutritionist:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        throw new functions.https.HttpsError('internal', `Failed to approve nutritionist: ${error.message}`);
    }
});

exports.rejectNutritionist = onCall({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 120,
    secrets: [gmailEmail, gmailPassword]
}, async (request) => {
    try {
        await isAdmin(request);
        const { userId, rejectionReason } = request.data;
        
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
        }

        console.log(`Rejecting nutritionist: ${userId} with reason: ${rejectionReason}`);

        
        const nutritionistRef = db.collection('nutritionists').doc(userId);
        const nutritionistDoc = await nutritionistRef.get();

        if (!nutritionistDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Nutritionist not found');
        }

        const nutritionistData = nutritionistDoc.data();

        
        await nutritionistRef.update({
            status: 'rejected',
            rejectedAt: FieldValue.serverTimestamp(),
            rejectionReason: rejectionReason || 'No reason provided'
        });

        
        await auth.setCustomUserClaims(userId, {
            nutritionist: false,
            approved: false,
            rejected: true
        });
        await auth.revokeRefreshTokens(userId);

        console.log(`Nutritionist ${userId} rejected successfully`);

        
        try {
            const email = nutritionistData.email;
            const name = nutritionistData.firstName && nutritionistData.lastName 
                ? `${nutritionistData.firstName} ${nutritionistData.lastName}`
                : nutritionistData.name || 'Nutritionist';

            if (email) {
                const transporter = getTransporter();
                
                const mailOptions = {
                    from: gmailEmail.value(),
                    to: email,
                    subject: 'Nutritionist Application Update - DiaBeater',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <h1 style="color: #d32f2f; margin: 10px 0;">DiaBeater</h1>
                            </div>
                            <h2 style="color: #f44336; text-align: center;">Application Status Update</h2>
                            <p>Dear ${name},</p>
                            <p>Thank you for your interest in becoming a nutritionist with DiaBeater.</p>
                            <p>After careful review, we are unable to approve your application at this time.</p>
                            ${rejectionReason && rejectionReason.trim() ? `
                                <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                                    <h3 style="margin-top: 0; color: #856404;">Reason:</h3>
                                    <p style="margin-bottom: 0; color: #856404;">${rejectionReason}</p>
                                </div>
                            ` : ''}
                            <p>You may reapply in the future once you meet all requirements.</p>
                            <p style="margin-top: 30px;">
                                Best regards,<br>
                                <strong>The DiaBeater Team</strong>
                            </p>
                        </div>
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log(`Auto-sent rejection email to ${email}`);
            }

        } catch (emailError) {
            console.error('Error sending auto-rejection email:', emailError);
            
        }
        
        return { 
            success: true, 
            message: `Nutritionist ${userId} has been rejected and notification email sent` 
        };

    } catch (error) {
        console.error('Error rejecting nutritionist:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        throw new functions.https.HttpsError('internal', `Failed to reject nutritionist: ${error.message}`);
    }
});
exports.suspendUser = onCall({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30
}, async (request) => {
    try {
        await isAdmin(request);
        const userId = request.data.userId;
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required.');
        }

        await auth.updateUser(userId, { disabled: true });
        
        const userAccountRef = db.collection('user_accounts').doc(userId);
        const userAccountDoc = await userAccountRef.get();

        if (userAccountDoc.exists) {
            await userAccountRef.update({ status: 'Inactive' });
        }

        await auth.revokeRefreshTokens(userId);

        return { success: true, message: `User ${userId} suspended.` };

    } catch (error) {
        console.error('Error suspending user:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.unsuspendUser = onCall({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30
}, async (request) => {
    try {
        await isAdmin(request);
        const userId = request.data.userId;
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required.');
        }

        await auth.updateUser(userId, { disabled: false });
        
        const userAccountRef = db.collection('user_accounts').doc(userId);
        const userAccountDoc = await userAccountRef.get();

        if (userAccountDoc.exists) {
            await userAccountRef.update({ status: 'Active' });
        }

        await auth.revokeRefreshTokens(userId);

        return { success: true, message: `User ${userId} unsuspended.` };

    } catch (error) {
        console.error('Error unsuspending user:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message);
    }
});



exports.addAdminRole = onCall({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30
}, async (request) => {
    try {
        if (!request.auth || !request.auth.token || request.auth.token.admin !== true) {
            throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
        }
        
        const email = request.data.email;
        if (!email) {
            throw new functions.https.HttpsError('invalid-argument', 'Email required.');
        }
        
        const user = await auth.getUserByEmail(email);
        await auth.setCustomUserClaims(user.uid, { admin: true });
        await auth.revokeRefreshTokens(user.uid);
        
        return { success: true, message: `Admin role granted to ${email}` };
        
    } catch (error) {
        console.error('Error in addAdminRole:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        if (error.code === 'auth/user-not-found') {
            throw new functions.https.HttpsError('not-found', `User ${email} not found`);
        }
        throw new functions.https.HttpsError('internal', error.message);
    }
});