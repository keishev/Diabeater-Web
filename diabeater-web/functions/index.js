// functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Ensure Firebase Admin SDK is initialized only once
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();

// Helper to check if a user has the 'admin' custom claim
// This is critical for security: Only admins should be able to get these URLs.
const isAdmin = async (context) => {
    if (!context.auth) {
        // Log for debugging, but throw HttpsError for client
        console.warn("Attempt to call admin function by unauthenticated user.");
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const uid = context.auth.uid;
    try {
        const userRecord = await admin.auth().getUser(uid);
        if (userRecord.customClaims && userRecord.customClaims.admin === true) {
            return true;
        }
        // Log specific reason for permission denial
        console.warn(`User ${uid} attempted to call admin function without admin claim.`);
        throw new functions.https.HttpsError('permission-denied', 'You do not have permission to perform this action.');
    } catch (error) {
        console.error(`Error checking admin status for UID ${uid}:`, error);
        // If getUser fails (e.g., user deleted), treat as permission denied
        throw new functions.https.HttpsError('permission-denied', 'Authentication failed or user not authorized.', error.message);
    }
};

/**
 * Callable Cloud Function to get a signed URL for a nutritionist's certificate.
 * This URL allows temporary access to the file for viewing.
 */
exports.getNutritionistCertificateUrl = functions.https.onCall(async (data, context) => {
    try {
        // 1. Security Check: Ensure the caller is an authenticated administrator
        await isAdmin(context);

        const userId = data.userId;
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required.');
        }

        // 2. Fetch the nutritionist document from Firestore
        const nutritionistDoc = await db.collection('nutritionists').doc(userId).get();

        if (!nutritionistDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Nutritionist not found.');
        }

        const nutritionistData = nutritionistDoc.data();
        const certificateStoragePath = nutritionistData.certificateUrl; // This should be the path in Storage, e.g., 'certificates/user123_cert.pdf'

        if (!certificateStoragePath) {
            throw new functions.https.HttpsError('not-found', 'Certificate URL (storage path) not found for this nutritionist in Firestore. Please ensure the "certificateUrl" field exists and is populated.');
        }

        // 3. Get a reference to the file in Firebase Storage
        const fileRef = storage.bucket().file(certificateStoragePath);

        // 4. Verify that the file actually exists in Storage
        const [exists] = await fileRef.exists();
        if (!exists) {
            console.warn(`Certificate file not found in storage for path: ${certificateStoragePath} (User ID: ${userId})`);
            throw new functions.https.HttpsError('not-found', 'Certificate file not found in storage. It might have been deleted or the path is incorrect.');
        }

        // 5. Generate a signed URL for temporary public access
        // This URL allows anyone with the URL to view the file for a limited time.
        // Adjust the expiration time as appropriate for your security needs.
        const [url] = await fileRef.getSignedUrl({
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // URL valid for 15 minutes from now
            // For longer durations, use a date string: '03-15-2026'
        });

        // 6. Return the generated URL to the frontend
        return { success: true, certificateUrl: url };

    } catch (error) {
        console.error(`Error in getNutritionistCertificateUrl function for userId ${data?.userId || 'unknown'}:`, error);

        // Re-throw HttpsErrors which are safe for client consumption
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        // Catch any other unexpected errors and return a generic internal error
        throw new functions.https.HttpsError(
            'internal',
            `An unexpected error occurred while processing your request: ${error.message}`,
            { originalError: error.message, stack: error.stack } // Include original error details for server logs
        );
    }
});

/**
 * Callable Cloud Function to approve a nutritionist account.
 * Sets custom claims and updates Firestore status.
 */
exports.approveNutritionist = functions.https.onCall(async (data, context) => {
    try {
        // 1. Security Check: Ensure the caller is an authenticated administrator
        await isAdmin(context);

        const userId = data.userId;
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required for approval.');
        }

        // 2. Update Firestore document status
        const nutritionistRef = db.collection('nutritionists').doc(userId);
        const nutritionistDoc = await nutritionistRef.get();

        if (!nutritionistDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Nutritionist account not found in Firestore.');
        }

        const currentData = nutritionistDoc.data();
        // Ensure we don't accidentally overwrite existing claims if they exist
        const existingClaims = currentData.customClaims || {};

        const updatedClaims = {
            ...existingClaims, // Keep existing claims
            nutritionist: true, // Mark as a nutritionist
            approved: true,     // Mark as approved
            rejected: false     // Ensure rejected is false
        };

        await nutritionistRef.update({
            status: 'approved',
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            customClaims: updatedClaims // Store custom claims in Firestore for reference
        });

        // 3. Set custom claims on the Firebase Authentication user
        await admin.auth().setCustomUserClaims(userId, updatedClaims);

        // 4. Revoke refresh tokens to force the user's ID token to refresh
        // This makes the new custom claims effective immediately upon next login/token refresh
        await admin.auth().revokeRefreshTokens(userId);
        console.log(`Successfully approved nutritionist ${userId} and set claims. Tokens revoked.`);

        return { success: true, message: `Nutritionist ${userId} has been approved. They will need to re-login to see changes.` };

    } catch (error) {
        console.error(`Error approving nutritionist ${data?.userId || 'unknown'}:`, error);

        if (error instanceof functions.https.HttpsError) {
            throw error; // Re-throw Firebase HttpsError
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
        // 1. Security Check: Ensure the caller is an authenticated administrator
        await isAdmin(context);

        const userId = data.userId;
        const rejectionReason = data.rejectionReason || 'No reason provided.'; // Optional rejection reason
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required for rejection.');
        }

        // 2. Update Firestore document status
        const nutritionistRef = db.collection('nutritionists').doc(userId);
        const nutritionistDoc = await nutritionistRef.get();

        if (!nutritionistDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Nutritionist account not found in Firestore.');
        }

        const currentData = nutritionistDoc.data();
        const existingClaims = currentData.customClaims || {};

        // Prepare updated claims: remove nutritionist/approved claims, add rejected claim
        const updatedClaims = { ...existingClaims };
        delete updatedClaims.nutritionist; // Remove nutritionist claim
        delete updatedClaims.approved;     // Remove approved claim
        updatedClaims.rejected = true;    // Explicitly mark as rejected

        await nutritionistRef.update({
            status: 'rejected',
            rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
            rejectionReason: rejectionReason,
            customClaims: updatedClaims // Store updated claims in Firestore
        });

        // 3. Set custom claims on the Firebase Authentication user
        await admin.auth().setCustomUserClaims(userId, updatedClaims);

        // 4. Revoke refresh tokens to force the user's ID token to refresh
        await admin.auth().revokeRefreshTokens(userId);
        console.log(`Successfully rejected nutritionist ${userId} and removed claims. Tokens revoked.`);

        return { success: true, message: `Nutritionist ${userId} has been rejected. They will need to re-login to see changes.` };

    } catch (error) {
        console.error(`Error rejecting nutritionist ${data?.userId || 'unknown'}:`, error);

        if (error instanceof functions.https.HttpsError) {
            throw error; // Re-throw Firebase HttpsError
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
        // 1. Security Check: Ensure the caller is an authenticated administrator
        await isAdmin(context);

        const userId = data.userId;
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required to suspend a user.');
        }

        // 2. Disable the user in Firebase Authentication
        await admin.auth().updateUser(userId, { disabled: true });
        console.log(`Firebase Auth user ${userId} disabled.`);

        // 3. Update the user's status in Firestore
        // Assuming your general user accounts are in a collection named 'user_accounts'
        const userAccountRef = db.collection('user_accounts').doc(userId);
        const userAccountDoc = await userAccountRef.get();

        if (userAccountDoc.exists) {
            await userAccountRef.update({ status: 'Inactive' }); // Or 'suspended'
            console.log(`Firestore status for user ${userId} updated to 'Inactive'.`);
        } else {
            console.warn(`User account document not found in Firestore for ID: ${userId}. Auth user still disabled.`);
        }

        // 4. Revoke refresh tokens to force the user's ID token to refresh
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
        // 1. Security Check: Ensure the caller is an authenticated administrator
        await isAdmin(context);

        const userId = data.userId;
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required to unsuspend a user.');
        }

        // 2. Enable the user in Firebase Authentication
        await admin.auth().updateUser(userId, { disabled: false });
        console.log(`Firebase Auth user ${userId} enabled.`);

        // 3. Update the user's status in Firestore
        const userAccountRef = db.collection('user_accounts').doc(userId);
        const userAccountDoc = await userAccountRef.get();

        if (userAccountDoc.exists) {
            await userAccountRef.update({ status: 'Active' }); // Or 'active'
            console.log(`Firestore status for user ${userId} updated to 'Active'.`);
        } else {
            console.warn(`User account document not found in Firestore for ID: ${userId}. Auth user still enabled.`);
        }

        // 4. Revoke refresh tokens to force the user's ID token to refresh
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
    // Note: It's good practice to use the isAdmin helper here for consistency.
    // However, your current implementation also checks context.auth.token.admin which is fine if it's consistently set.
    // For robust security, `await isAdmin(context)` is recommended.
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