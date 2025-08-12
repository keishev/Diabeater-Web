// functions/index.js

// Import Firebase Functions using Gen 2 modular syntax
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineString, defineSecret } = require('firebase-functions/params');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { getAuth } = require('firebase-admin/auth');
const admin = require('firebase-admin');
const filter = require('leo-profanity'); // Updated to use leo-profanity
const nodemailer = require('nodemailer');

// Ensure Firebase Admin SDK is initialized only once
if (!admin.apps.length) {
    admin.initializeApp();
}

// Use the new modular SDK references
const db = getFirestore();
const storage = getStorage();
const auth = getAuth();

// Define parameters for email configuration
const gmailEmail = defineString('GMAIL_EMAIL');
const gmailPassword = defineSecret('GMAIL_PASSWORD');

let cachedTransporter;
function getTransporter() {
    if (!cachedTransporter) {
        cachedTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailEmail.value(),
                pass: gmailPassword.value()
            }
        });
    }
    return cachedTransporter;
}

// Configure nodemailer with your email service
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: gmailEmail.value(),
//         pass: gmailPassword.value()
//     }
// });

// Helper to check if a user has the 'admin' custom claim
const isAdmin = async (context) => {
    if (!context.auth) {
        console.warn("Attempt to call admin function by unauthenticated user.");
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const uid = context.auth.uid;
    try {
        const userRecord = await auth.getUser(uid);
        if (userRecord.customClaims && userRecord.customClaims.admin === true) {
            return true;
        }
        console.warn(`User ${uid} attempted to call admin function without admin claim.`);
        throw new HttpsError('permission-denied', 'You do not have permission to perform this action.');
    } catch (error) {
        console.error(`Error checking admin status for UID ${uid}:`, error);
        throw new HttpsError('permission-denied', 'Authentication failed or user not authorized.', error.message);
    }
};

/**
 * Cloud Function to process new user feedback.
 */
exports.processNewFeedback = onDocumentCreated({
    document: "user_feedbacks/{feedbackId}",
    region: "us-central1",
    memory: "256MiB"
}, async (event) => {
    const snap = event.data;
    if (!snap) {
        console.log("No data associated with the event");
        return;
    }
    
    const feedbackData = snap.data();
    const feedbackId = event.params.feedbackId;

    console.log(`Processing new feedback: ${feedbackId} with data:`, feedbackData);

    if (feedbackData.rating !== 5) {
        console.log(`Feedback ${feedbackId} is not 5-star (rating: ${feedbackData.rating}). Setting status to 'NotApprovedForMarketing'.`);
        await db.collection("user_feedbacks").doc(feedbackId).update({
            status: "NotApprovedForMarketing",
            displayOnMarketing: false
        });
        return;
    }

    let cleanedMessage = feedbackData.message;
    let containsProfanity = false;

    if (typeof feedbackData.message === 'string' && filter.check(feedbackData.message)) {
        containsProfanity = true;
        cleanedMessage = filter.clean(feedbackData.message);
        console.log(`Feedback ${feedbackId} contains profanity.`);
    }

    if (containsProfanity) {
        console.log(`Feedback ${feedbackId} flagged due to profanity. Setting status to 'FlaggedForReview'.`);
        await db.collection("user_feedbacks").doc(feedbackId).update({
            status: "FlaggedForReview",
            displayOnMarketing: false,
        });
        return;
    }

    try {
        await db.collection("feedbacks").doc(feedbackId).set({
            ...feedbackData,
            message: cleanedMessage,
            status: "Approved",
            displayOnMarketing: true,
            processedAt: FieldValue.serverTimestamp()
        });
        console.log(`Feedback ${feedbackId} (5-star, clean) copied to 'feedbacks' collection.`);
        await db.collection("user_feedbacks").doc(feedbackId).update({
            status: "ApprovedAutomated"
        });
    } catch (error) {
        console.error(`Error copying feedback ${feedbackId} to 'feedbacks' collection:`, error);
        await db.collection("user_feedbacks").doc(feedbackId).update({
            status: "ErrorProcessing"
        });
    }
});

/**
 * Callable Cloud Function to get a signed URL for a nutritionist's certificate.
 */
exports.getNutritionistCertificateUrl = onCall({
    memory: '256MiB',
    timeoutSeconds: 60,
    region: 'us-central1'
}, async (request) => {
    try {
        const { data, auth } = request;
        await isAdmin({ auth });
        const userId = data.userId;
        if (!userId) {
            throw new HttpsError('invalid-argument', 'User ID is required.');
        }

        const nutritionistDoc = await db.collection('nutritionists').doc(userId).get();
        if (!nutritionistDoc.exists) {
            throw new HttpsError('not-found', 'Nutritionist not found.');
        }

        const nutritionistData = nutritionistDoc.data();
        const certificateStoragePath = nutritionistData.certificateUrl;

        if (!certificateStoragePath) {
            throw new HttpsError('not-found', 'Certificate URL (storage path) not found for this nutritionist in Firestore. Please ensure the "certificateUrl" field exists and is populated.');
        }

        const fileRef = storage.bucket().file(certificateStoragePath);
        const [exists] = await fileRef.exists();
        if (!exists) {
            console.warn(`Certificate file not found in storage for path: ${certificateStoragePath} (User ID: ${userId})`);
            throw new HttpsError('not-found', 'Certificate file not found in storage. It might have been deleted or the path is incorrect.');
        }

        const [url] = await fileRef.getSignedUrl({
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000,
        });

        return { success: true, certificateUrl: url };

    } catch (error) {
        console.error(`Error in getNutritionistCertificateUrl function:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError(
            'internal',
            `An unexpected error occurred while processing your request: ${error.message}`,
            { originalError: error.message, stack: error.stack }
        );
    }
});

/**
 * Callable Cloud Function to approve a nutritionist account.
 */
exports.approveNutritionist = onCall({
    memory: '256MiB',
    timeoutSeconds: 60,
    region: 'us-central1'
}, async (request) => {
    try {
        const { data, auth: authContext } = request;
        await isAdmin({ auth: authContext });
        const userId = data.userId;
        if (!userId) {
            throw new HttpsError('invalid-argument', 'User ID is required for approval.');
        }

        const nutritionistRef = db.collection('nutritionists').doc(userId);
        const nutritionistDoc = await nutritionistRef.get();

        if (!nutritionistDoc.exists) {
            throw new HttpsError('not-found', 'Nutritionist account not found in Firestore.');
        }

        const currentData = nutritionistDoc.data();
        const existingClaims = currentData.customClaims || {};
        const updatedClaims = {
            ...existingClaims,
            nutritionist: true,
            approved: true,
            rejected: false
        };

        await nutritionistRef.update({
            status: 'approved',
            approvedAt: FieldValue.serverTimestamp(),
            customClaims: updatedClaims
        });

        await auth.setCustomUserClaims(userId, updatedClaims);
        await auth.revokeRefreshTokens(userId);
        console.log(`Successfully approved nutritionist ${userId} and set claims. Tokens revoked.`);

        return { success: true, message: `Nutritionist ${userId} has been approved. They will need to re-login to see changes.` };

    } catch (error) {
        console.error(`Error approving nutritionist:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError(
            'internal',
            `An unexpected error occurred during approval: ${error.message}`,
            { originalError: error.message, stack: error.stack }
        );
    }
});

/**
 * Callable Cloud Function to reject a nutritionist account.
 */
exports.rejectNutritionist = onCall({
    memory: '256MiB',
    timeoutSeconds: 60,
    region: 'us-central1'
}, async (request) => {
    try {
        const { data, auth: authContext } = request;
        await isAdmin({ auth: authContext });
        const userId = data.userId;
        const rejectionReason = data.rejectionReason || 'No reason provided.';
        if (!userId) {
            throw new HttpsError('invalid-argument', 'User ID is required for rejection.');
        }

        const nutritionistRef = db.collection('nutritionists').doc(userId);
        const nutritionistDoc = await nutritionistRef.get();

        if (!nutritionistDoc.exists) {
            throw new HttpsError('not-found', 'Nutritionist account not found in Firestore.');
        }

        const currentData = nutritionistDoc.data();
        const existingClaims = currentData.customClaims || {};
        const updatedClaims = { ...existingClaims };
        delete updatedClaims.nutritionist;
        delete updatedClaims.approved;
        updatedClaims.rejected = true;

        await nutritionistRef.update({
            status: 'rejected',
            rejectedAt: FieldValue.serverTimestamp(),
            rejectionReason: rejectionReason,
            customClaims: updatedClaims
        });

        await auth.setCustomUserClaims(userId, updatedClaims);
        await auth.revokeRefreshTokens(userId);
        console.log(`Successfully rejected nutritionist ${userId} and removed claims. Tokens revoked.`);

        return { success: true, message: `Nutritionist ${userId} has been rejected. They will need to re-login to see changes.` };

    } catch (error) {
        console.error(`Error rejecting nutritionist:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError(
            'internal',
            `An unexpected error occurred during rejection: ${error.message}`,
            { originalError: error.message, stack: error.stack }
        );
    }
});

/**
 * Callable Cloud Function to send an approval email.
 */
exports.sendApprovalEmail = onCall({
    memory: '256MiB',
    timeoutSeconds: 60,
    region: 'us-central1',
    secrets: [gmailPassword]
}, async (request) => {
    const { data, auth: authContext } = request;
    await isAdmin({ auth: authContext });

    const transporter = getTransporter();

    const { email, name } = data;
    if (!email || !name) {
        throw new HttpsError('invalid-argument', 'Email and name are required.');
    }

    const mailOptions = {
        from: gmailEmail.value(),
        to: email,
        subject: 'Nutritionist Application Approved - DiaBeater',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://your-domain.com/assets/blood_drop_logo.png" alt="DiaBeater Logo" style="width: 60px; height: 60px;">
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

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Approval email sent successfully to ${email}`);
        return { success: true, message: 'Approval email sent successfully' };
    } catch (error) {
        console.error('Error sending approval email:', error);
        throw new HttpsError('internal', 'Failed to send approval email');
    }
});

/**
 * Callable Cloud Function to send a rejection email.
 */
exports.sendRejectionEmail = onCall({
    memory: '256MiB',
    timeoutSeconds: 60,
    region: 'us-central1',
    secrets: [gmailPassword]
}, async (request) => {
    const { data, auth: authContext } = request;
    await isAdmin({ auth: authContext });

    const transporter = getTransporter();

    const { email, name, reason } = data;
    if (!email || !name) {
        throw new HttpsError('invalid-argument', 'Email and name are required.');
    }

    const mailOptions = {
        from: gmailEmail.value(),
        to: email,
        subject: 'Nutritionist Application Update - DiaBeater',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://your-domain.com/assets/blood_drop_logo.png" alt="DiaBeater Logo" style="width: 60px; height: 60px;">
            <h1 style="color: #d32f2f; margin: 10px 0;">DiaBeater</h1>
          </div>
          <h2 style="color: #f44336; text-align: center;">Application Status Update</h2>
          <p>Dear ${name},</p>
          <p>Thank you for your interest in becoming a nutritionist with DiaBeater.</p>
          <p>After careful review of your application, we regret to inform you that we are unable to approve your nutritionist application at this time.</p>
          ${reason ? `
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

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Rejection email sent successfully to ${email}`);
        return { success: true, message: 'Rejection email sent successfully' };
    } catch (error) {
        console.error('Error sending rejection email:', error);
        throw new HttpsError('internal', 'Failed to send rejection email');
    }
});

/**
 * Callable Cloud Function to suspend a user.
 */
exports.suspendUser = onCall({
    memory: '256MiB',
    timeoutSeconds: 60,
    region: 'us-central1'
}, async (request) => {
    try {
        const { data, auth: authContext } = request;
        await isAdmin({ auth: authContext });
        const userId = data.userId;
        if (!userId) {
            throw new HttpsError('invalid-argument', 'User ID is required to suspend a user.');
        }

        await auth.updateUser(userId, { disabled: true });
        console.log(`Firebase Auth user ${userId} disabled.`);

        const userAccountRef = db.collection('user_accounts').doc(userId);
        const userAccountDoc = await userAccountRef.get();

        if (userAccountDoc.exists) {
            await userAccountRef.update({ status: 'Inactive' });
            console.log(`Firestore status for user ${userId} updated to 'Inactive'.`);
        } else {
            console.warn(`User account document not found in Firestore for ID: ${userId}. Auth user still disabled.`);
        }

        await auth.revokeRefreshTokens(userId);
        console.log(`Refresh tokens revoked for user ${userId}.`);

        return { success: true, message: `User ${userId} has been suspended.` };

    } catch (error) {
        console.error(`Error suspending user:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError(
            'internal',
            `An unexpected error occurred during user suspension: ${error.message}`,
            { originalError: error.message, stack: error.stack }
        );
    }
});

/**
 * Callable Cloud Function to unsuspend a user.
 */
exports.unsuspendUser = onCall({
    memory: '256MiB',
    timeoutSeconds: 60,
    region: 'us-central1'
}, async (request) => {
    try {
        const { data, auth: authContext } = request;
        await isAdmin({ auth: authContext });
        const userId = data.userId;
        if (!userId) {
            throw new HttpsError('invalid-argument', 'User ID is required to unsuspend a user.');
        }

        await auth.updateUser(userId, { disabled: false });
        console.log(`Firebase Auth user ${userId} enabled.`);

        const userAccountRef = db.collection('user_accounts').doc(userId);
        const userAccountDoc = await userAccountRef.get();

        if (userAccountDoc.exists) {
            await userAccountRef.update({ status: 'Active' });
            console.log(`Firestore status for user ${userId} updated to 'Active'.`);
        } else {
            console.warn(`User account document not found in Firestore for ID: ${userId}. Auth user still enabled.`);
        }

        await auth.revokeRefreshTokens(userId);
        console.log(`Refresh tokens revoked for user ${userId}.`);

        return { success: true, message: `User ${userId} has been unsuspended.` };

    } catch (error) {
        console.error(`Error unsuspending user:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError(
            'internal',
            `An unexpected error occurred during user unsuspension: ${error.message}`,
            { originalError: error.message, stack: error.stack }
        );
    }
});

/**
 * Callable Cloud Function to add admin role.
 */
exports.addAdminRole = onCall({
    memory: '256MiB',
    timeoutSeconds: 60,
    region: 'us-central1'
}, async (request) => {
    const { data, auth: authContext } = request;
    
    if (!authContext || authContext.token.admin !== true) {
        throw new HttpsError(
            'permission-denied',
            'Only administrators can add new admin roles.'
        );
    }
    
    const email = data.email;
    if (!email) {
        throw new HttpsError(
            'invalid-argument',
            'The function must be called with an email.'
        );
    }
    
    try {
        const user = await auth.getUserByEmail(email);
        await auth.setCustomUserClaims(user.uid, { admin: true });
        await auth.revokeRefreshTokens(user.uid);
        console.log(`Successfully granted admin role and revoked tokens for ${email}`);
        return { success: true, message: `Admin role granted to ${email}. User needs to re-login.` };
    } catch (error) {
        console.error("Error in addAdminRole function:", error);
        if (error.code === 'auth/user-not-found') {
            throw new HttpsError(
                'not-found',
                `User with email ${email} not found.`
            );
        }
        throw new HttpsError(
            'internal',
            `An error occurred: ${error.message}`,
            error
        );
    }
});