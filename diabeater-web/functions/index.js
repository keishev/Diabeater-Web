// functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Filter = require('bad-words'); // Import the bad-words library

// Ensure Firebase Admin SDK is initialized only once
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();
const filter = new Filter(); // Initialize the profanity filter

// Helper to check if a user has the 'admin' custom claim
const isAdmin = async (context) => {
    if (!context.auth) {
        console.warn("Attempt to call admin function by unauthenticated user.");
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const uid = context.auth.uid;
    try {
        const userRecord = await admin.auth().getUser(uid);
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
 * NEW: Cloud Function to process new user feedback.
 * It checks if the feedback is 5-star and free of profanity.
 * If so, it copies the feedback to the 'feedbacks' collection for marketing display.
 * Otherwise, it updates the status in the 'user_feedbacks' collection.
 * This function listens to the 'user_feedbacks' collection, where users initially submit their feedback.
 */
exports.processNewFeedback = functions.firestore
    .document("user_feedbacks/{feedbackId}") // Listen to creation of new documents in 'user_feedbacks'
    .onCreate(async (snap, context) => {
        const feedbackData = snap.data();
        const feedbackId = context.params.feedbackId; // Get the ID of the new document

        console.log(`Processing new feedback: ${feedbackId} with data:`, feedbackData);

        // 1. Check if it's a 5-star review
        if (feedbackData.rating !== 5) {
            console.log(`Feedback ${feedbackId} is not 5-star (rating: ${feedbackData.rating}). Setting status to 'NotApprovedForMarketing'.`);
            // Update the original document in user_feedbacks to reflect it won't be displayed
            await db.collection("user_feedbacks").doc(feedbackId).update({
                status: "NotApprovedForMarketing",
                displayOnMarketing: false // Explicitly mark as not for marketing
            });
            return null; // Stop processing this feedback for marketing display
        }

        // 2. Perform profanity filtering on the message
        let cleanedMessage = feedbackData.message;
        let containsProfanity = false;

        if (typeof feedbackData.message === 'string' && filter.isProfane(feedbackData.message)) {
            containsProfanity = true;
            // Optionally clean the message for storage, or just flag it
            cleanedMessage = filter.clean(feedbackData.message);
            console.log(`Feedback ${feedbackId} contains profanity.`);
        }

        if (containsProfanity) {
            // Mark as flagged for manual review if profanity is found
            console.log(`Feedback ${feedbackId} flagged due to profanity. Setting status to 'FlaggedForReview'.`);
            await db.collection("user_feedbacks").doc(feedbackId).update({
                status: "FlaggedForReview", // Indicate it needs admin review
                displayOnMarketing: false, // Do not display on marketing site
                // You might store the original message and cleaned message here if needed
                // originalMessage: feedbackData.message,
                // cleanedMessage: cleanedMessage, // If you decide to store cleaned version
            });
            return null; // Stop processing this feedback for marketing display
        }

        // 3. If it's 5-star AND clean, copy to the 'feedbacks' collection
        // This is the collection your marketing website will read from
        try {
            await db.collection("feedbacks").doc(feedbackId).set({
                ...feedbackData, // Copy all original data
                message: cleanedMessage, // Use cleaned message (in case it was cleaned, otherwise it's original)
                status: "Approved", // Mark as approved by the automated system
                displayOnMarketing: true, // Mark for marketing display
                processedAt: admin.firestore.FieldValue.serverTimestamp() // Add a timestamp for processing
            });
            console.log(`Feedback ${feedbackId} (5-star, clean) copied to 'feedbacks' collection.`);

            // Optionally, update the original user_feedbacks document to 'ApprovedAutomated'
            await db.collection("user_feedbacks").doc(feedbackId).update({
                status: "ApprovedAutomated"
            });

            return null;
        } catch (error) {
            console.error(`Error copying feedback ${feedbackId} to 'feedbacks' collection:`, error);
            // Optionally, mark original user_feedbacks as 'ErrorProcessing'
            await db.collection("user_feedbacks").doc(feedbackId).update({
                status: "ErrorProcessing"
            });
            return null;
        }
    });

/**
 * Callable Cloud Function to get a signed URL for a nutritionist's certificate.
 * This URL allows temporary access to the file for viewing.
 */
exports.getNutritionistCertificateUrl = functions.https.onCall(async (data, context) => {
    try {
        await isAdmin(context); // Security Check

        const userId = data.userId;
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
            expires: Date.now() + 15 * 60 * 1000, // URL valid for 15 minutes
        });

        return { success: true, certificateUrl: url };

    } catch (error) {
        console.error(`Error in getNutritionistCertificateUrl function for userId ${data?.userId || 'unknown'}:`, error);
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

/**
 * Callable Cloud Function to approve a nutritionist account.
 * Sets custom claims and updates Firestore status.
 */
exports.approveNutritionist = functions.https.onCall(async (data, context) => {
    try {
        await isAdmin(context); // Security Check

        const userId = data.userId;
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required for approval.');
        }

        const nutritionistRef = db.collection('nutritionists').doc(userId);
        const nutritionistDoc = await nutritionistRef.get();

        if (!nutritionistDoc.exists) {
            throw new new functions.https.HttpsError('not-found', 'Nutritionist account not found in Firestore.'); // Corrected instance creation
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
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            customClaims: updatedClaims
        });

        await admin.auth().setCustomUserClaims(userId, updatedClaims);
        await admin.auth().revokeRefreshTokens(userId);
        console.log(`Successfully approved nutritionist ${userId} and set claims. Tokens revoked.`);

        return { success: true, message: `Nutritionist ${userId} has been approved. They will need to re-login to see changes.` };

    } catch (error) {
        console.error(`Error approving nutritionist ${data?.userId || 'unknown'}:`, error);
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

/**
 * Callable Cloud Function to reject a nutritionist account.
 * Updates Firestore status and modifies custom claims.
 */
exports.rejectNutritionist = functions.https.onCall(async (data, context) => {
    try {
        await isAdmin(context); // Security Check

        const userId = data.userId;
        const rejectionReason = data.rejectionReason || 'No reason provided.';
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required for rejection.');
        }

        const nutritionistRef = db.collection('nutritionists').doc(userId);
        const nutritionistDoc = await nutritionistRef.get();

        if (!nutritionistDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Nutritionist account not found in Firestore.');
        }

        const currentData = nutritionistDoc.data();
        const existingClaims = currentData.customClaims || {};

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

        return { success: true, message: `Nutritionist ${userId} has been rejected. They will need to re-login to see changes.` };

    } catch (error) {
        console.error(`Error rejecting nutritionist ${data?.userId || 'unknown'}:`, error);
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


/**
 * NEW: Callable Cloud Function to suspend a user.
 * Disables the user in Firebase Authentication and updates Firestore status.
 */
exports.suspendUser = functions.https.onCall(async (data, context) => {
    try {
        await isAdmin(context); // Security Check

        const userId = data.userId;
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
        console.error(`Error suspending user ${data?.userId || 'unknown'}:`, error);
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

/**
 * NEW: Callable Cloud Function to unsuspend a user.
 * Enables the user in Firebase Authentication and updates Firestore status.
 */
exports.unsuspendUser = functions.https.onCall(async (data, context) => {
    try {
        await isAdmin(context); // Security Check

        const userId = data.userId;
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
        console.error(`Error unsuspending user ${data?.userId || 'unknown'}:`, error);
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


// Your existing addAdminRole function
exports.addAdminRole = functions.https.onCall(async (data, context) => {
    // For consistency and robustness, it's recommended to use the `isAdmin` helper here too.
    // The current `context.auth.token.admin !== true` check is also valid if you're sure claims are set.
    if (!context.auth || context.auth.token.admin !== true) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only administrators can add new admin roles.'
        );
    }
    const email = data.email;
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