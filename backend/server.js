// backend/server.js

require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin'); // Firebase Admin SDK

// --- Firebase Admin SDK Initialization ---
const serviceAccount = require(process.env.SERVICE_ACCOUNT_KEY_PATH);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
// Allow requests from your Firebase hosting domain and local hosted
const allowlist = [
    'https://diabeaters-4cf9e.web.app',
    'https://diabeaters-4cf9e.firebaseapp.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

app.use(cors({
    origin(origin, callback) {
        // allow REST clients / server-to-server with no origin
        if (!origin || allowlist.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

app.use(express.json());

// --- Authentication and Authorization Middleware ---
const isAuthenticatedAdmin = async (req, res, next) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        console.warn("Authorization header missing or malformed.");
        return res.status(401).json({ message: 'Unauthorized: No token provided or malformed.' });
    }

    const idToken = req.headers.authorization.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(idToken);

        if (!decodedToken.admin) {
            console.warn(`User ${decodedToken.uid} attempted admin action without admin claim.`);
            return res.status(403).json({ message: 'Forbidden: You are not authorized to perform this action.' });
        }

        req.user = decodedToken;
        next();
    } catch (error) {
        console.error("Error verifying Firebase ID token:", error.message);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ message: 'Unauthorized: Session expired. Please re-login.' });
        }
        return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
    }
};

// --- Routes ---

app.get('/', (req, res) => {
    res.send('Firebase Admin Backend is running!');
});

app.post('/api/users/suspend', isAuthenticatedAdmin, async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
    }

    try {
        await auth.updateUser(userId, { disabled: true });
        console.log(`Backend: Firebase Auth user ${userId} disabled by admin ${req.user.uid}.`);

        const userAccountRef = db.collection('user_accounts').doc(userId);
        const userAccountDoc = await userAccountRef.get();

        if (userAccountDoc.exists) {
            await userAccountRef.update({ status: 'Inactive' });
            console.log(`Backend: Firestore status for user ${userId} updated to 'Inactive'.`);
        } else {
            console.warn(`Backend: User account document not found in Firestore for ID: ${userId}. Auth user still disabled.`);
        }

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
        await auth.updateUser(userId, { disabled: false });
        console.log(`Backend: Firebase Auth user ${userId} enabled by admin ${req.user.uid}.`);

        const userAccountRef = db.collection('user_accounts').doc(userId);
        const userAccountDoc = await userAccountRef.get();

        if (userAccountDoc.exists) {
            await userAccountRef.update({ status: 'Active' });
            console.log(`Backend: Firestore status for user ${userId} updated to 'Active'.`);
        } else {
            console.warn(`Backend: User account document not found in Firestore for ID: ${userId}. Auth user still enabled.`);
        }

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