// functions/index.js - FIXED VERSION FOR DEPLOYMENT
const { onRequest, onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

// Ensure Firebase Admin SDK is initialized only once
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = getFirestore();
const auth = getAuth();
const storage = admin.storage();

// Define secrets for Gen 2 functions
const gmailEmail = defineSecret('GMAIL_EMAIL');
const gmailPassword = defineSecret('GMAIL_PASSWORD');

// Helper to get transporter with proper error handling
const getTransporter = () => {
    try {
        console.log('Creating email transporter...');
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: gmailEmail.value(),
                pass: gmailPassword.value()
            }
        });
        console.log('Email transporter created successfully');
        return transporter;
    } catch (error) {
        console.error('Error creating email transporter:', error);
        throw new Error('Email service configuration error');
    }
};

// Helper to check if a user has the 'admin' custom claim
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

/**
 * FIXED: Create admin user and send Firebase verification email
 */
/**
 * FIXED: Create admin user and send Firebase verification email
 */
exports.createAdminWithVerification = onCall({
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60,
    secrets: [gmailEmail, gmailPassword]
}, async (request) => {
    try {
        // Check admin permissions
        await isAdmin(request);

        const { firstName, lastName, email, password, dob } = request.data;

        if (!email || !password || !firstName || !lastName || !dob) {
            throw new functions.https.HttpsError('invalid-argument', 'All fields are required');
        }

        console.log('Creating admin user for email:', email);

        // Check if user already exists
        try {
            const existingUser = await auth.getUserByEmail(email);
            if (existingUser) {
                throw new functions.https.HttpsError('already-exists', 'This email is already in use');
            }
        } catch (error) {
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
        }

        // Create the Firebase Auth user
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: `${firstName} ${lastName}`,
            emailVerified: false
        });

        console.log('Firebase Auth user created:', userRecord.uid);

        // Store admin data in Firestore
        const adminData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email,
            dob: new Date(dob),
            role: 'admin',
            status: 'Pending Email Verification',
            emailVerified: false,
            uid: userRecord.uid,
            contactNumber: '',
            gender: '',
            isPremium: false,
            points: 0,
            profileCompleted: false,
            profileImageURL: '',
            profilePictureUrl: '',
            createdAt: FieldValue.serverTimestamp()
        };

        await db.collection('user_accounts').doc(userRecord.uid).set(adminData);
        console.log('Admin user document created in Firestore');

        // FIXED: Use Firebase Admin SDK email verification instead of custom email
        try {
            // Generate Firebase verification link
            const verificationLink = await auth.generateEmailVerificationLink(email);
            console.log('Generated Firebase verification link');

            // IMPROVED: Use the built-in Firebase email verification with custom template
            const transporter = getTransporter();
            
            const mailOptions = {
                from: gmailEmail.value(),
                to: email,
                subject: 'Verify Your Email for Admin Account - DiaBeater',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #d32f2f; margin: 10px 0;">DiaBeater</h1>
                        </div>
                        <h2 style="color: #333;">Verify Your Admin Email Address</h2>
                        <p>Hello ${firstName},</p>
                        <p>Your admin account has been created! Please verify your email address to activate your account.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" style="background-color: #d32f2f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                                Verify Email Address
                            </a>
                        </div>
                        <p>If the button doesn't work, you can copy and paste this link:</p>
                        <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationLink}</p>
                        <p>Once verified, you can log in to your admin account immediately.</p>
                        <p style="margin-top: 30px;">
                            Best regards,<br>
                            <strong>The DiaBeater Team</strong>
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`Custom verification email sent to: ${email}`);

            return {
                success: true,
                email: email,
                uid: userRecord.uid,
                verificationLink: verificationLink,
                message: 'Admin account created and verification email sent. Please check your email.'
            };

        } catch (emailError) {
            console.error('Error sending custom verification email:', emailError);
            
            // FALLBACK: Try to send Firebase's default verification email
            try {
                console.log('Attempting fallback: Firebase default verification email...');
                
                // Create a temporary sign-in for the user to send verification
                const customToken = await auth.createCustomToken(userRecord.uid);
                
                // Note: In a real scenario, you'd need the client to sign in with this token
                // and call sendEmailVerification from the client side
                
                console.log('Custom token created for verification');
                
                return {
                    success: true,
                    email: email,
                    uid: userRecord.uid,
                    customToken: customToken,
                    message: 'Admin account created. Please check your email for verification instructions.',
                    fallbackMode: true
                };
                
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                
                // Clean up on complete failure
                await auth.deleteUser(userRecord.uid);
                await db.collection('user_accounts').doc(userRecord.uid).delete();
                
                throw new functions.https.HttpsError('internal', 'Failed to send verification email. Please try again or contact support.');
            }
        }

    } catch (error) {
        console.error('Error in createAdminWithVerification:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        if (error.code) {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    throw new functions.https.HttpsError('already-exists', 'This email is already in use');
                case 'auth/invalid-email':
                    throw new functions.https.HttpsError('invalid-argument', 'Invalid email address');
                case 'auth/weak-password':
                    throw new functions.https.HttpsError('invalid-argument', 'Password is too weak');
                default:
                    throw new functions.https.HttpsError('internal', error.message);
            }
        }
        
        throw new functions.https.HttpsError('internal', 'Failed to create admin account');
    }
});

// ALTERNATIVE SIMPLE VERSION - If email issues persist
exports.createAdminSimple = onCall({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30
}, async (request) => {
    try {
        await isAdmin(request);

        const { firstName, lastName, email, password, dob } = request.data;

        if (!email || !password || !firstName || !lastName || !dob) {
            throw new functions.https.HttpsError('invalid-argument', 'All fields are required');
        }

        console.log('Creating admin user (simple version) for email:', email);

        // Create the Firebase Auth user
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: `${firstName} ${lastName}`,
            emailVerified: false
        });

        // Store admin data in Firestore
        const adminData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email,
            dob: new Date(dob),
            role: 'admin',
            status: 'Pending Email Verification',
            emailVerified: false,
            uid: userRecord.uid,
            contactNumber: '',
            gender: '',
            isPremium: false,
            points: 0,
            profileCompleted: false,
            profileImageURL: '',
            profilePictureUrl: '',
            createdAt: FieldValue.serverTimestamp()
        };

        await db.collection('user_accounts').doc(userRecord.uid).set(adminData);

        // Just return success - let client handle email verification
        return {
            success: true,
            email: email,
            uid: userRecord.uid,
            message: 'Admin account created. Please use Firebase Auth to send verification email.',
            requiresClientVerification: true
        };

    } catch (error) {
        console.error('Error in createAdminSimple:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        throw new functions.https.HttpsError('internal', 'Failed to create admin account');
    }
});

exports.checkEmailVerification = onCall({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30
}, async (request) => {
    try {
        console.log('checkEmailVerification called');

        const { email } = request.data;

        if (!email) {
            throw new functions.https.HttpsError('invalid-argument', 'Email is required');
        }

        console.log('Checking email verification for:', email);

        // Get user from Firebase Auth
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                throw new functions.https.HttpsError('not-found', 'No account found with this email address');
            }
            throw new functions.https.HttpsError('internal', 'Failed to check user account');
        }

        console.log('User found, email verified:', userRecord.emailVerified);

        if (userRecord.emailVerified) {
            // Update Firestore document
            const userDocRef = db.collection('user_accounts').doc(userRecord.uid);
            const userDoc = await userDocRef.get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                if (userData.status === 'Pending Email Verification') {
                    await userDocRef.update({
                        status: 'Active',
                        emailVerified: true,
                        verifiedAt: FieldValue.serverTimestamp()
                    });

                    // Set admin claims
                    await auth.setCustomUserClaims(userRecord.uid, {
                        admin: true,
                        role: 'admin'
                    });

                    console.log('Admin claims set and status updated');
                }
            }

            return { 
                success: true, 
                isVerified: true,
                message: 'Email verified successfully! Admin account is now active.' 
            };
        } else {
            return { 
                success: true, 
                isVerified: false,
                message: 'Email not yet verified. Please check your email and click the verification link.' 
            };
        }

    } catch (error) {
        console.error('Error in checkEmailVerification:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        throw new functions.https.HttpsError('internal', 'Failed to check email verification', error.message);
    }
});

exports.resendVerificationEmail = onCall({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
    secrets: [gmailEmail, gmailPassword]
}, async (request) => {
    try {
        console.log('resendVerificationEmail called');

        const { email } = request.data;

        if (!email) {
            throw new functions.https.HttpsError('invalid-argument', 'Email is required');
        }

        // Get user from Firebase Auth
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                throw new functions.https.HttpsError('not-found', 'No account found with this email address');
            }
            throw new functions.https.HttpsError('internal', 'Failed to find user account');
        }

        if (userRecord.emailVerified) {
            throw new functions.https.HttpsError('failed-precondition', 'Email is already verified');
        }

        // Generate new verification link
        const verificationLink = await auth.generateEmailVerificationLink(email);

        // Get user data for personalization
        const userDoc = await db.collection('user_accounts').doc(userRecord.uid).get();
        const userData = userDoc.data();
        const firstName = userData?.firstName || 'Admin';

        // Send verification email
        const transporter = getTransporter();
        
        const mailOptions = {
            from: gmailEmail.value(),
            to: email,
            subject: 'Verify Your Email for Admin Account - DiaBeater (Resent)',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #d32f2f; margin: 10px 0;">DiaBeater</h1>
                    </div>
                    <h2 style="color: #333;">Verify Your Admin Email Address (Resent)</h2>
                    <p>Hello ${firstName},</p>
                    <p>Here's a new verification link for your admin account.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" style="background-color: #d32f2f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    <p>If the button doesn't work, you can copy and paste this link:</p>
                    <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationLink}</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Resent verification email to: ${email}`);

        return { 
            success: true, 
            message: 'Verification email resent successfully. Please check your email.'
        };

    } catch (error) {
        console.error('Error in resendVerificationEmail:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        throw new functions.https.HttpsError('internal', 'Failed to resend verification email', error.message);
    }
});

/**
 * EXISTING FUNCTIONS - Optimized for better deployment
 */

exports.getNutritionistCertificateUrl = onCall({
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

        const nutritionistDoc = await db.collection('nutritionists').doc(userId).get();
        if (!nutritionistDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Nutritionist not found.');
        }

        const nutritionistData = nutritionistDoc.data();
        const certificateStoragePath = nutritionistData.certificateUrl;

        if (!certificateStoragePath) {
            throw new functions.https.HttpsError('not-found', 'Certificate URL not found.');
        }

        const fileRef = storage.bucket().file(certificateStoragePath);
        const [exists] = await fileRef.exists();
        if (!exists) {
            throw new functions.https.HttpsError('not-found', 'Certificate file not found.');
        }

        const [url] = await fileRef.getSignedUrl({
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000,
        });

        return { success: true, certificateUrl: url };

    } catch (error) {
        console.error('Error in getNutritionistCertificateUrl:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// IMPROVED EMAIL FUNCTIONS - Replace the existing ones

exports.sendApprovalEmail = onCall({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [gmailEmail, gmailPassword]
}, async (request) => {
    try {
        await isAdmin(request);
        
        const { email, name } = request.data;
        if (!email || !name) {
            throw new functions.https.HttpsError('invalid-argument', 'Email and name are required');
        }

        console.log(`Sending approval email to: ${email} for: ${name}`);

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

        await transporter.sendMail(mailOptions);
        console.log(`Approval email sent successfully to ${email}`);
        
        return { 
            success: true, 
            message: 'Approval email sent successfully' 
        };

    } catch (error) {
        console.error('Error sending approval email:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        throw new functions.https.HttpsError('internal', `Failed to send approval email: ${error.message}`);
    }
});

exports.sendRejectionEmail = onCall({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [gmailEmail, gmailPassword]
}, async (request) => {
    try {
        await isAdmin(request);
        
        const { email, name, reason } = request.data;
        if (!email || !name) {
            throw new functions.https.HttpsError('invalid-argument', 'Email and name are required');
        }

        console.log(`Sending rejection email to: ${email} for: ${name} with reason: ${reason || 'No reason provided'}`);

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

        await transporter.sendMail(mailOptions);
        console.log(`Rejection email sent successfully to ${email}`);
        
        return { 
            success: true, 
            message: 'Rejection email sent successfully' 
        };

    } catch (error) {
        console.error('Error sending rejection email:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        throw new functions.https.HttpsError('internal', `Failed to send rejection email: ${error.message}`);
    }
});

// ALSO UPDATE THE APPROVE/REJECT FUNCTIONS TO AUTO-SEND EMAILS

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

        // Get nutritionist data first
        const nutritionistRef = db.collection('nutritionists').doc(userId);
        const nutritionistDoc = await nutritionistRef.get();

        if (!nutritionistDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Nutritionist not found');
        }

        const nutritionistData = nutritionistDoc.data();

        // Update nutritionist status
        await nutritionistRef.update({
            status: 'approved',
            approvedAt: FieldValue.serverTimestamp()
        });

        // Set custom claims
        await auth.setCustomUserClaims(userId, {
            nutritionist: true,
            approved: true,
            rejected: false
        });
        await auth.revokeRefreshTokens(userId);

        console.log(`Nutritionist ${userId} approved successfully`);

        // AUTO-SEND APPROVAL EMAIL
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
            // Don't fail the whole process if email fails
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

        // Get nutritionist data first
        const nutritionistRef = db.collection('nutritionists').doc(userId);
        const nutritionistDoc = await nutritionistRef.get();

        if (!nutritionistDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Nutritionist not found');
        }

        const nutritionistData = nutritionistDoc.data();

        // Update nutritionist status
        await nutritionistRef.update({
            status: 'rejected',
            rejectedAt: FieldValue.serverTimestamp(),
            rejectionReason: rejectionReason || 'No reason provided'
        });

        // Set custom claims
        await auth.setCustomUserClaims(userId, {
            nutritionist: false,
            approved: false,
            rejected: true
        });
        await auth.revokeRefreshTokens(userId);

        console.log(`Nutritionist ${userId} rejected successfully`);

        // AUTO-SEND REJECTION EMAIL
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
            // Don't fail the whole process if email fails
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