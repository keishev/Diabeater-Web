// backend/server.js

require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin'); // Firebase Admin SDK

// --- Firebase Admin SDK Initialization ---
// Ensure the path to your service account key is correct
const serviceAccount = require(process.env.SERVICE_ACCOUNT_KEY_PATH);

// Initialize Firebase Admin SDK ONLY ONCE
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore(); // Admin Firestore instance
const auth = admin.auth();   // Admin Auth instance

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors({
    // THIS MUST MATCH YOUR REACT APP'S URL
    // For local development:
    origin: 'http://localhost:3000',
    // In production, change this to your deployed React app's URL (e.g., 'https://your-react-app.com')
}));
app.use(express.json()); // For parsing application/json bodies

// --- Authentication and Authorization Middleware ---
// This middleware will run before any admin-protected routes
const isAuthenticatedAdmin = async (req, res, next) => {
    // Check if the Authorization header with a Bearer token is present
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        console.warn("Authorization header missing or malformed.");
        return res.status(401).json({ message: 'Unauthorized: No token provided or malformed.' });
    }

    const idToken = req.headers.authorization.split('Bearer ')[1];

    try {
        // Verify the ID token using the Firebase Admin SDK
        const decodedToken = await auth.verifyIdToken(idToken);
        
        // Check if the user has the 'admin: true' custom claim
        // This is how you ensure only actual administrators can use these endpoints
        if (!decodedToken.admin) { 
            console.warn(`User ${decodedToken.uid} attempted admin action without admin claim.`);
            return res.status(403).json({ message: 'Forbidden: You are not authorized to perform this action.' });
        }

        // Attach the decoded token to the request for logging or further checks
        req.user = decodedToken;
        next(); // Proceed to the route handler
    } catch (error) {
        console.error("Error verifying Firebase ID token:", error.message);
        // Handle token expiration, invalid token, etc.
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ message: 'Unauthorized: Session expired. Please re-login.' });
        }
        return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
    }
};

// --- Routes ---

// Simple test route to check if the backend is running
app.get('/', (req, res) => {
    res.send('Firebase Admin Backend is running!');
});

// Admin-protected routes for user management
app.post('/api/users/suspend', isAuthenticatedAdmin, async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
    }

    try {
        // Disable the user in Firebase Authentication
        await auth.updateUser(userId, { disabled: true });
        console.log(`Backend: Firebase Auth user ${userId} disabled by admin ${req.user.uid}.`);

        // Update the user's status in Firestore (assuming 'user_accounts' collection)
        const userAccountRef = db.collection('user_accounts').doc(userId);
        const userAccountDoc = await userAccountRef.get();

        if (userAccountDoc.exists) {
            await userAccountRef.update({ status: 'Inactive' }); // Or 'suspended' based on your specific status
            console.log(`Backend: Firestore status for user ${userId} updated to 'Inactive'.`);
        } else {
            console.warn(`Backend: User account document not found in Firestore for ID: ${userId}. Auth user still disabled.`);
        }

        // Revoke refresh tokens to force immediate logout on all devices
        await auth.revokeRefreshTokens(userId);
        console.log(`Backend: Refresh tokens revoked for user ${userId}.`);

        res.status(200).json({ success: true, message: `User ${userId} has been suspended.` });

    } catch (error) {
        console.error(`Backend: Error suspending user ${userId}:`, error);
        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(500).json({ message: 'An internal server error occurred during suspension.', error: error.message });
    }
});

app.post('/api/users/unsuspend', isAuthenticatedAdmin, async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
    }

    try {
        // Enable the user in Firebase Authentication
        await auth.updateUser(userId, { disabled: false });
        console.log(`Backend: Firebase Auth user ${userId} enabled by admin ${req.user.uid}.`);

        // Update the user's status in Firestore (assuming 'user_accounts' collection)
        const userAccountRef = db.collection('user_accounts').doc(userId);
        const userAccountDoc = await userAccountRef.get();

        if (userAccountDoc.exists) {
            await userAccountRef.update({ status: 'Active' }); // Or 'active'
            console.log(`Backend: Firestore status for user ${userId} updated to 'Active'.`);
        } else {
            console.warn(`Backend: User account document not found in Firestore for ID: ${userId}. Auth user still enabled.`);
        }

        // Revoke refresh tokens (optional, but good for immediate claim propagation if claims change)
        await auth.revokeRefreshTokens(userId);
        console.log(`Backend: Refresh tokens revoked for user ${userId}.`);

        res.status(200).json({ success: true, message: `User ${userId} has been unsuspended.` });

    } catch (error) {
        console.error(`Backend: Error unsuspending user ${userId}:`, error);
        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(500).json({ message: 'An internal server error occurred during unsuspension.', error: error.message });
    }
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log(`Access at http://localhost:${PORT}`);
});