// functions/index.js (This file is NOT in your React project, it's in your Firebase project's functions folder)

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Callable Cloud Function to add an 'admin' custom claim to a user
exports.addAdminRole = functions.https.onCall(async (data, context) => {
    // Optional: Add security checks here if you want to restrict who can call this function.
    // For initial setup, you might temporarily remove context.auth check or use a trusted environment.
    if (!context.auth || context.auth.token.admin !== true) { // Only allow existing admins to add new admins
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
        // Set the custom claim 'admin' to true
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });

        // Revoke all refresh tokens for the user to force them to get a new ID token on next login.
        // This ensures their client-side token immediately reflects the new admin claim.
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