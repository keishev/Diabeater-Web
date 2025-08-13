const { onRequest, onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const Filter = require('bad-words');
const nodemailer = require('nodemailer');

// Ensure Firebase Admin SDK is initialized only once
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = getFirestore();
const auth = getAuth();
const storage = admin.storage();
const filter = new Filter();

// Define secrets for Gen 2 functions with proper configuration
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
 * HTTP Function to verify email token
 */
exports.verifyEmailToken = onRequest({
    cors: {
        origin: ['http://localhost:3000', 'https://your-domain.com'],
        methods: ['GET'],
        allowedHeaders: ['Content-Type'],
        credentials: true
    },
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30
}, async (req, res) => {
    try {
        // Handle preflight OPTIONS request
        if (req.method === 'OPTIONS') {
            res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
            res.set('Access-Control-Allow-Methods', 'GET');
            res.set('Access-Control-Allow-Headers', 'Content-Type');
            res.set('Access-Control-Max-Age', '3600');
            return res.status(204).send('');
        }

        // Set CORS headers for main request
        res.set('Access-Control-Allow-Origin', req.headers.origin || '*');

        const token = req.query.token;
        const email = req.query.email;

        if (!token || !email) {
            return res.status(400).send(`
                <html>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1 style="color: #f44336;">Invalid Verification Link</h1>
                        <p>The verification link is missing required parameters.</p>
                        <p>Please request a new verification email.</p>
                    </body>
                </html>
            `);
        }

        try {
            // Update the verification status in Firestore
            const verificationRef = db.collection('email_verifications').doc(token);
            const verificationDoc = await verificationRef.get();

            if (!verificationDoc.exists) {
                return res.status(404).send(`
                    <html>
                        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                            <h1 style="color: #f44336;">Invalid Token</h1>
                            <p>The verification token is invalid or has expired.</p>
                            <p>Please request a new verification email.</p>
                        </body>
                    </html>
                `);
            }

            const verificationData = verificationDoc.data();
            
            if (verificationData.email !== email) {
                return res.status(400).send(`
                    <html>
                        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                            <h1 style="color: #f44336;">Email Mismatch</h1>
                            <p>The email in the verification link doesn't match the token.</p>
                            <p>Please request a new verification email.</p>
                        </body>
                    </html>
                `);
            }

            if (verificationData.verified) {
                return res.status(200).send(`
                    <html>
                        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                            <div style="color: #4CAF50; font-size: 60px; margin-bottom: 20px;">✓</div>
                            <h1 style="color: #4CAF50;">Email Already Verified</h1>
                            <p>Your email <strong>${email}</strong> has already been verified.</p>
                            <p>You can now return to the admin creation page and complete the account setup.</p>
                            <button onclick="window.close()" style="background-color: #d32f2f; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">
                                Close This Tab
                            </button>
                        </body>
                    </html>
                `);
            }

            // Mark as verified
            await verificationRef.update({
                verified: true,
                verifiedAt: FieldValue.serverTimestamp()
            });

            console.log(`Email verified successfully for: ${email}`);

            return res.status(200).send(`
                <html>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <div style="color: #4CAF50; font-size: 60px; margin-bottom: 20px;">✓</div>
                        <h1 style="color: #4CAF50;">Email Verified Successfully!</h1>
                        <p>Your email <strong>${email}</strong> has been verified.</p>
                        <p>You can now return to the admin creation page and click "Check Email Verification" to proceed with creating your admin account.</p>
                        <button onclick="window.close()" style="background-color: #d32f2f; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">
                            Close This Tab
                        </button>
                    </body>
                </html>
            `);

        } catch (error) {
            console.error('Error verifying email:', error);
            return res.status(500).send(`
                <html>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1 style="color: #f44336;">Verification Failed</h1>
                        <p>An error occurred while verifying your email.</p>
                        <p>Please try again or request a new verification email.</p>
                    </body>
                </html>
            `);
        }

    } catch (error) {
        console.error('Error in verifyEmailToken:', error);
        return res.status(500).send(`
            <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #f44336;">Server Error</h1>
                    <p>An unexpected error occurred.</p>
                    <p>Please try again later.</p>
                </body>
            </html>
        `);
    }
});

/**
 * Callable Cloud Function to check email verification
 */
exports.checkEmailVerification = onCall({
    region: 'us-central1'
}, async (request) => {
    try {
        console.log('checkEmailVerification called with data:', request.data);

        const { email } = request.data;

        if (!email) {
            throw new functions.https.HttpsError('invalid-argument', 'Email is required');
        }

        console.log('Checking verification status for email:', email);

        // Check for verification record
        const verificationQuery = await db.collection('email_verifications')
            .where('email', '==', email)
            .where('type', '==', 'admin_creation')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (verificationQuery.empty) {
            throw new functions.https.HttpsError('not-found', 'No verification request found for this email');
        }

        const verificationDoc = verificationQuery.docs[0];
        const verificationData = verificationDoc.data();

        if (verificationData.verified) {
            // Check if user already exists in auth (in case they already completed the process)
            try {
                const existingUser = await auth.getUserByEmail(email);
                if (existingUser) {
                    console.log('User already exists in auth:', existingUser.uid);
                    return { 
                        success: true, 
                        isVerified: true,
                        alreadyCreated: true,
                        message: 'Email verified and admin account already exists' 
                    };
                }
            } catch (authError) {
                // User doesn't exist yet, which is expected
                console.log('User not found in auth, proceeding normally');
            }

            console.log('Email verification confirmed for:', email);
            return { 
                success: true, 
                isVerified: true,
                message: 'Email verification confirmed' 
            };
        } else {
            console.log('Email not yet verified for:', email);
            return { 
                success: true, 
                isVerified: false,
                message: 'Email not yet verified' 
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

/**
 * Callable Cloud Function to resend verification email
 */
exports.resendVerificationEmail = onCall({
    region: 'us-central1',
    secrets: [gmailEmail, gmailPassword]
}, async (request) => {
    try {
        console.log('resendVerificationEmail called with data:', request.data);

        const { email } = request.data;

        if (!email) {
            throw new functions.https.HttpsError('invalid-argument', 'Email is required');
        }

        console.log('Resending verification email for:', email);

        // Check for existing verification record
        const verificationQuery = await db.collection('email_verifications')
            .where('email', '==', email)
            .where('type', '==', 'admin_creation')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (verificationQuery.empty) {
            throw new functions.https.HttpsError('not-found', 'No verification request found for this email');
        }

        const verificationDoc = verificationQuery.docs[0];
        const verificationData = verificationDoc.data();

        if (verificationData.verified) {
            throw new functions.https.HttpsError('failed-precondition', 'Email is already verified');
        }

        // Update the resent timestamp
        await verificationDoc.ref.update({
            resentAt: FieldValue.serverTimestamp()
        });

        // Generate new verification link
        const functionsUrl = process.env.FUNCTIONS_EMULATOR === 'true' 
            ? 'http://localhost:5001/diabeaters-4cf9e/us-central1' 
            : 'https://us-central1-diabeaters-4cf9e.cloudfunctions.net';
        const verificationLink = `${functionsUrl}/verifyEmailToken?token=${verificationDoc.id}&email=${encodeURIComponent(email)}`;

        const transporter = getTransporter();

        // Send verification email
        const mailOptions = {
            from: gmailEmail.value(),
            to: email,
            subject: 'Verify Your Email for Admin Account Creation - DiaBeater (Resent)',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #d32f2f; margin: 10px 0;">DiaBeater</h1>
                    </div>
                    <h2 style="color: #333;">Verify Your Email Address (Resent)</h2>
                    <p>Hello,</p>
                    <p>This is a resent verification email for your admin account creation request. Please verify your email address to continue.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" style="background-color: #d32f2f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationLink}</p>
                    <p>This link will expire in 24 hours.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Resent verification email to: ${email}`);

        return { 
            success: true, 
            message: 'Verification email resent successfully'
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
 * Callable Cloud Function to create admin user
 */
exports.createAdminUser = onCall({
    region: 'us-central1'
}, async (request) => {
    try {
        console.log('createAdminUser called with data:', { ...request.data, password: '[HIDDEN]' });

        const { email, password, firstName, lastName, dob } = request.data;

        if (!email || !password || !firstName || !lastName || !dob) {
            throw new functions.https.HttpsError('invalid-argument', 'All fields are required');
        }

        console.log('Creating admin user for email:', email);

        // Verify that the email was actually verified
        const verificationQuery = await db.collection('email_verifications')
            .where('email', '==', email)
            .where('type', '==', 'admin_creation')
            .where('verified', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (verificationQuery.empty) {
            throw new functions.https.HttpsError('failed-precondition', 'Email not verified or verification record not found');
        }

        console.log('Email verification confirmed, creating Firebase Auth user...');

        // Create the Firebase Auth user
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            emailVerified: true, // Set as verified since we already checked
            displayName: `${firstName} ${lastName}`
        });

        console.log('Firebase Auth user created:', userRecord.uid);

        // Set admin claims
        await auth.setCustomUserClaims(userRecord.uid, { 
            admin: true,
            role: 'admin'
        });

        console.log('Admin claims set for user:', userRecord.uid);

        // Create user document in Firestore
        const userData = {
            firstName,
            lastName,
            email,
            dob: new Date(dob),
            role: 'admin',
            status: 'Active', // Set to Active immediately since email is verified
            contactNumber: '',
            gender: '',
            isPremium: false,
            points: 0,
            profileCompleted: false,
            profileImageURL: '',
            profilePictureUrl: '',
            createdAt: FieldValue.serverTimestamp(),
            emailVerified: true
        };

        await db.collection('user_accounts').doc(userRecord.uid).set(userData);
        console.log('Admin user document created in Firestore:', userRecord.uid);

        // Clean up verification records
        const verificationDoc = verificationQuery.docs[0];
        await verificationDoc.ref.delete();
        console.log('Verification record cleaned up');

        return { 
            success: true, 
            userId: userRecord.uid,
            message: 'Admin account created successfully'
        };

    } catch (error) {
        console.error('Error in createAdminUser:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        let errorMessage = 'Failed to create admin user';
        if (error.code === 'auth/email-already-exists') {
            errorMessage = 'An account with this email already exists.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password should be at least 6 characters long.';
        }
        
        throw new functions.https.HttpsError('internal', errorMessage, error.message);
    }
});

/**
 * Callable Cloud Function to send verification email
 */
exports.sendVerificationEmail = onCall({
    region: 'us-central1',
    secrets: [gmailEmail, gmailPassword]
}, async (request) => {
    try {
        console.log('sendVerificationEmail called with data:', request.data);

        const { email } = request.data;

        if (!email) {
            throw new functions.https.HttpsError('invalid-argument', 'Email is required');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
        }

        console.log('Checking for existing user with email:', email);

        // Check if user already exists in user_accounts collection
        const existingUserQuery = await db.collection('user_accounts')
            .where('email', '==', email)
            .get();
        
        if (!existingUserQuery.empty) {
            throw new functions.https.HttpsError('already-exists', 'User with this email already exists');
        }

        // Check if user exists in Firebase Auth
        try {
            const userRecord = await auth.getUserByEmail(email);
            if (userRecord) {
                throw new functions.https.HttpsError('already-exists', 'User with this email already exists in authentication system');
            }
        } catch (error) {
            // User doesn't exist in Auth, which is what we want
            if (error.code !== 'auth/user-not-found') {
                console.error('Error checking user in Auth:', error);
                throw new functions.https.HttpsError('internal', 'Error checking existing user');
            }
        }

        console.log('Creating verification record for email:', email);

        // Create a temporary user record for verification tracking
        const verificationId = db.collection('email_verifications').doc().id;
        
        // Store verification request
        await db.collection('email_verifications').doc(verificationId).set({
            email: email,
            createdAt: FieldValue.serverTimestamp(),
            verified: false,
            type: 'admin_creation'
        });

        console.log('Verification record created with ID:', verificationId);

        // Generate verification link
        const functionsUrl = process.env.FUNCTIONS_EMULATOR === 'true' 
            ? 'http://localhost:5001/diabeaters-4cf9e/us-central1' 
            : 'https://us-central1-diabeaters-4cf9e.cloudfunctions.net';
        const verificationLink = `${functionsUrl}/verifyEmailToken?token=${verificationId}&email=${encodeURIComponent(email)}`;

        console.log('Generated verification link:', verificationLink);
        console.log('Attempting to send email...');

        const transporter = getTransporter();

        // Send verification email
        const mailOptions = {
            from: gmailEmail.value(),
            to: email,
            subject: 'Verify Your Email for Admin Account Creation - DiaBeater',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #d32f2f; margin: 10px 0;">DiaBeater</h1>
                    </div>
                    <h2 style="color: #333;">Verify Your Email Address</h2>
                    <p>Hello,</p>
                    <p>You have requested to create an admin account for DiaBeater. Please verify your email address to continue with the account creation process.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" style="background-color: #d32f2f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationLink}</p>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you didn't request this verification, please ignore this email.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent successfully to: ${email}`);

        return { 
            success: true, 
            message: 'Verification email sent successfully'
        };

    } catch (error) {
        console.error('Error in sendVerificationEmail:', error);
        
        // If it's already a HttpsError, re-throw it
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        // Otherwise, wrap it in a generic HttpsError
        throw new functions.https.HttpsError('internal', 'Failed to send verification email', error.message);
    }
});

/**
 * FIXED: Gen 2 Callable Cloud Function to send approval email
 */
exports.sendApprovalEmail = onCall({
    secrets: [gmailEmail, gmailPassword],
    region: 'us-central1'
}, async (request) => {
    try {
        // Check admin authentication
        if (!request.auth) {
            console.warn("Attempt to call sendApprovalEmail by unauthenticated user.");
            throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
        }

        const uid = request.auth.uid;
        try {
            const userRecord = await auth.getUser(uid);
            if (!userRecord.customClaims || userRecord.customClaims.admin !== true) {
                console.warn(`User ${uid} attempted to call sendApprovalEmail without admin claim.`);
                throw new functions.https.HttpsError('permission-denied', 'You do not have permission to perform this action.');
            }
        } catch (error) {
            console.error(`Error checking admin status for UID ${uid}:`, error);
            throw new functions.https.HttpsError('permission-denied', 'Authentication failed or user not authorized.');
        }

        const { email, name } = request.data;
        if (!email || !name) {
            throw new functions.https.HttpsError('invalid-argument', 'Email and name are required.');
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
              <h2 style="color: #4CAF50; text-align: center;">Congratulations! Your Application Has Been Approved</h2>
              <p>Dear ${name},</p>
              <p>We are pleased to inform you that your nutritionist application has been <strong>approved</strong>!</p>
              <p>You can now log in to your DiaBeater nutritionist account using your registered email and password.</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">What's Next?</h3>
                <ul style="margin-bottom: 0;">
                  <li>Log in to your account at <a href="https://your-domain.com/login">DiaBeater Login</a></li>
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
        return { success: true, message: 'Approval email sent successfully' };

    } catch (error) {
        console.error('Error sending approval email:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        throw new functions.https.HttpsError('internal', 'Failed to send approval email', error.message);
    }
});
/**
 * NEW: Callable Cloud Function to create admin user and send verification email
 * This prevents signing out the current admin session
 */
exports.createAdminWithVerification = onCall({
    region: 'us-central1'
}, async (request) => {
    try {
        // Check admin permissions
        await isAdmin(request);

        const { firstName, lastName, email, password, dob } = request.data;

        if (!email || !password || !firstName || !lastName || !dob) {
            throw new functions.https.HttpsError('invalid-argument', 'All fields are required');
        }

        console.log('Creating admin user for email:', email);

        // Create the Firebase Auth user using Admin SDK
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: `${firstName} ${lastName}`,
            emailVerified: false // Will need verification
        });

        console.log('Firebase Auth user created:', userRecord.uid);

        // Store temporary admin data in Firestore
        const tempAdminData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email,
            dob: new Date(dob),
            role: 'admin',
            status: 'Pending Email Verification',
            emailVerified: false,
            uid: userRecord.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('temp_admin_accounts').doc(email).set(tempAdminData);
        console.log('Temporary admin data stored');

        // Generate Firebase's built-in email verification link
        const verificationLink = await auth.generateEmailVerificationLink(email);
        console.log('Generated Firebase verification link');

        return {
            success: true,
            email: email,
            uid: userRecord.uid,
            verificationLink: verificationLink, // Return this so frontend can handle it
            message: 'Admin account created. Use the verification link to verify email.'
        };

    } catch (error) {
        console.error('Error in createAdminWithVerification:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        // Handle Firebase Auth errors
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

/**
 * FIXED: Gen 2 Callable Cloud Function to send rejection email
 */
exports.sendRejectionEmail = onCall({
    secrets: [gmailEmail, gmailPassword],
    region: 'us-central1'
}, async (request) => {
    try {
        // Check admin authentication
        if (!request.auth) {
            console.warn("Attempt to call sendRejectionEmail by unauthenticated user.");
            throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
        }

        const uid = request.auth.uid;
        try {
            const userRecord = await auth.getUser(uid);
            if (!userRecord.customClaims || userRecord.customClaims.admin !== true) {
                console.warn(`User ${uid} attempted to call sendRejectionEmail without admin claim.`);
                throw new functions.https.HttpsError('permission-denied', 'You do not have permission to perform this action.');
            }
        } catch (error) {
            console.error(`Error checking admin status for UID ${uid}:`, error);
            throw new functions.https.HttpsError('permission-denied', 'Authentication failed or user not authorized.');
        }

        const { email, name, reason } = request.data;
        if (!email || !name) {
            throw new functions.https.HttpsError('invalid-argument', 'Email and name are required.');
        }

        console.log(`Sending rejection email to: ${email} for: ${name} with reason: ${reason}`);

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
              ${reason && reason !== 'No reason provided.' ? `
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                  <h3 style="margin-top: 0; color: #856404;">Reason:</h3>
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
        return { success: true, message: 'Rejection email sent successfully' };

    } catch (error) {
        console.error('Error sending rejection email:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        throw new functions.https.HttpsError('internal', 'Failed to send rejection email', error.message);
    }
});

/**
 * Other existing functions converted to Gen 2 format
 */
exports.getNutritionistCertificateUrl = onCall({
    region: 'us-central1'
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
            throw new functions.https.HttpsError('not-found', 'Certificate URL (storage path) not found for this nutritionist in Firestore. Please ensure the "certificateUrl" field exists and is populated.');
        }

        const fileRef = storage.bucket().file(certificateStoragePath);
        const [exists] = await fileRef.exists();
        if (!exists) {
            console.warn(`Certificate file not found in storage for path: ${certificateStoragePath} (User ID: ${userId})`);
            throw new functions.https.HttpsError('not-found', 'Certificate file not found in storage. It might have been deleted or the path is incorrect.');
        }

        const [url] = await fileRef.getSignedUrl({
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000,
        });

        return { success: true, certificateUrl: url };

    } catch (error) {
        console.error(`Error in getNutritionistCertificateUrl function for userId ${request.data?.userId || 'unknown'}:`, error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError(
            'internal',
            `An unexpected error occurred while processing your request: ${error.message}`,
            { originalError: error.message, stack: error.stack }
        );
    }
});

exports.approveNutritionist = onCall({
    region: 'us-central1',
    secrets: [gmailEmail, gmailPassword]
}, async (request) => {
    try {
        await isAdmin(request);
        const userId = request.data.userId;
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required for approval.');
        }

        const nutritionistRef = db.collection('nutritionists').doc(userId);
        const nutritionistDoc = await nutritionistRef.get();

        if (!nutritionistDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Nutritionist account not found in Firestore.');
        }

        const nutritionistData = nutritionistDoc.data();
        const existingClaims = nutritionistData.customClaims || {};
        const updatedClaims = {
            ...existingClaims,
            nutritionist: true,
            approved: true,
            rejected: false
        };

        await nutritionistRef.update({
            status: 'approved',
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            customClaims: updatedClaims
        });

        await admin.auth().setCustomUserClaims(userId, updatedClaims);
        await admin.auth().revokeRefreshTokens(userId);
        console.log(`Successfully approved nutritionist ${userId} and set claims. Tokens revoked.`);

        // Automatically send approval email
        try {
            const transporter = getTransporter();
            const email = nutritionistData.email;
            const name = nutritionistData.firstName && nutritionistData.lastName 
                ? `${nutritionistData.firstName} ${nutritionistData.lastName}`
                : nutritionistData.name || 'Nutritionist';

            const mailOptions = {
                from: gmailEmail.value(),
                to: email,
                subject: 'Nutritionist Application Approved - DiaBeater',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #d32f2f; margin: 10px 0;">DiaBeater</h1>
                  </div>
                  <h2 style="color: #4CAF50; text-align: center;">Congratulations! Your Application Has Been Approved</h2>
                  <p>Dear ${name},</p>
                  <p>We are pleased to inform you that your nutritionist application has been <strong>approved</strong>!</p>
                  <p>You can now log in to your DiaBeater nutritionist account using your registered email and password.</p>
                  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">What's Next?</h3>
                    <ul style="margin-bottom: 0;">
                      <li>Log in to your account at <a href="https://your-domain.com/login">DiaBeater Login</a></li>
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

        } catch (emailError) {
            console.error('Error sending approval email:', emailError);
            // Don't fail the whole approval process if email fails
            console.log('Nutritionist approved successfully but approval email failed to send');
        }

        return { 
            success: true, 
            message: `Nutritionist ${userId} has been approved. They will need to re-login to see changes.` 
        };

    } catch (error) {
        console.error(`Error approving nutritionist ${request.data?.userId || 'unknown'}:`, error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError(
            'internal',
            `An unexpected error occurred during approval: ${error.message}`,
            { originalError: error.message, stack: error.stack }
        );
    }
});

exports.rejectNutritionist = onCall({
    region: 'us-central1',
    secrets: [gmailEmail, gmailPassword]
}, async (request) => {
    try {
        await isAdmin(request);
        const userId = request.data.userId;
        const rejectionReason = request.data.rejectionReason || 'No reason provided.';
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required for rejection.');
        }

        const nutritionistRef = db.collection('nutritionists').doc(userId);
        const nutritionistDoc = await nutritionistRef.get();

        if (!nutritionistDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Nutritionist account not found in Firestore.');
        }

        const nutritionistData = nutritionistDoc.data();
        const existingClaims = nutritionistData.customClaims || {};
        const updatedClaims = { ...existingClaims };
        delete updatedClaims.nutritionist;
        delete updatedClaims.approved;
        updatedClaims.rejected = true;

        await nutritionistRef.update({
            status: 'rejected',
            rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
            rejectionReason: rejectionReason,
            customClaims: updatedClaims
        });

        await admin.auth().setCustomUserClaims(userId, updatedClaims);
        await admin.auth().revokeRefreshTokens(userId);
        console.log(`Successfully rejected nutritionist ${userId} and removed claims. Tokens revoked.`);

        // Automatically send rejection email
        try {
            const transporter = getTransporter();
            const email = nutritionistData.email;
            const name = nutritionistData.firstName && nutritionistData.lastName 
                ? `${nutritionistData.firstName} ${nutritionistData.lastName}`
                : nutritionistData.name || 'Nutritionist';

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
                  ${rejectionReason && rejectionReason !== 'No reason provided.' ? `
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                      <h3 style="margin-top: 0; color: #856404;">Reason:</h3>
                      <p style="margin-bottom: 0; color: #856404;">${rejectionReason}</p>
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

        } catch (emailError) {
            console.error('Error sending rejection email:', emailError);
            // Don't fail the whole rejection process if email fails
            console.log('Nutritionist rejected successfully but rejection email failed to send');
        }

        return { 
            success: true, 
            message: `Nutritionist ${userId} has been rejected. They will need to re-login to see changes.` 
        };

    } catch (error) {
        console.error(`Error rejecting nutritionist ${request.data?.userId || 'unknown'}:`, error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError(
            'internal',
            `An unexpected error occurred during rejection: ${error.message}`,
            { originalError: error.message, stack: error.stack }
        );
    }
});

exports.suspendUser = onCall({
    region: 'us-central1'
}, async (request) => {
    try {
        await isAdmin(request);
        const userId = request.data.userId;
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required to suspend a user.');
        }

        await admin.auth().updateUser(userId, { disabled: true });
        console.log(`Firebase Auth user ${userId} disabled.`);

        const userAccountRef = db.collection('user_accounts').doc(userId);
        const userAccountDoc = await userAccountRef.get();

        if (userAccountDoc.exists) {
            await userAccountRef.update({ status: 'Inactive' });
            console.log(`Firestore status for user ${userId} updated to 'Inactive'.`);
        } else {
            console.warn(`User account document not found in Firestore for ID: ${userId}. Auth user still disabled.`);
        }

        await admin.auth().revokeRefreshTokens(userId);
        console.log(`Refresh tokens revoked for user ${userId}.`);

        return { success: true, message: `User ${userId} has been suspended.` };

    } catch (error) {
        console.error(`Error suspending user ${request.data?.userId || 'unknown'}:`, error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError(
            'internal',
            `An unexpected error occurred during user suspension: ${error.message}`,
            { originalError: error.message, stack: error.stack }
        );
    }
});

exports.unsuspendUser = onCall({
    region: 'us-central1'
}, async (request) => {
    try {
        await isAdmin(request);
        const userId = request.data.userId;
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required to unsuspend a user.');
        }

        await admin.auth().updateUser(userId, { disabled: false });
        console.log(`Firebase Auth user ${userId} enabled.`);

        const userAccountRef = db.collection('user_accounts').doc(userId);
        const userAccountDoc = await userAccountRef.get();

        if (userAccountDoc.exists) {
            await userAccountRef.update({ status: 'Active' });
            console.log(`Firestore status for user ${userId} updated to 'Active'.`);
        } else {
            console.warn(`User account document not found in Firestore for ID: ${userId}. Auth user still enabled.`);
        }

        await admin.auth().revokeRefreshTokens(userId);
        console.log(`Refresh tokens revoked for user ${userId}.`);

        return { success: true, message: `User ${userId} has been unsuspended.` };

    } catch (error) {
        console.error(`Error unsuspending user ${request.data?.userId || 'unknown'}:`, error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError(
            'internal',
            `An unexpected error occurred during user unsuspension: ${error.message}`,
            { originalError: error.message, stack: error.stack }
        );
    }
});

exports.addAdminRole = onCall({
    region: 'us-central1'
}, async (request) => {
    if (!request.auth || request.auth.token.admin !== true) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only administrators can add new admin roles.'
        );
    }
    const email = request.data.email;
    if (!email) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'The function must be called with an email.'
        );
    }
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        await admin.auth().revokeRefreshTokens(user.uid);
        console.log(`Successfully granted admin role and revoked tokens for ${email}`);
        return { success: true, message: `Admin role granted to ${email}. User needs to re-login.` };
    } catch (error) {
        console.error("Error in addAdminRole function:", error);
        if (error.code === 'auth/user-not-found') {
            throw new functions.https.HttpsError(
                'not-found',
                `User with email ${email} not found.`
            );
        }
        throw new functions.https.HttpsError(
            'internal',
            `An error occurred: ${error.message}`,
            error
        );
    }
});