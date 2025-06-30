// src/App.js
import React, { useState, useEffect } from 'react';
import LoginPage from './Nutritionist/LoginPage';
import NutritionistDashboard from './Nutritionist/NutritionistDashboard';
import AdminDashboard from './Admin/AdminDashboard';
import ResetPasswordPage from './ResetPasswordPage';
import CreateAccountPage from './CreateAccountPage';

import '@fortawesome/fontawesome-free/css/all.min.css';

// Import getAuth and onAuthStateChanged
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import app from './firebase'; // Import your initialized firebase app instance

// REMOVE: import { runInAction } from 'mobx'; // <--- REMOVE THIS LINE


function App() {
    const [userRole, setUserRole] = useState(null);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showCreateAccount, setShowCreateAccount] = useState(false);
    const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);

    // Global Auth State Listener
    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("APP.JS: Auth State Changed - User is logged in:", user.uid, user.email);
                try {
                    const idTokenResult = await user.getIdTokenResult(true);
                    console.log("APP.JS: Global Auth State - Claims:", idTokenResult.claims);

                    // No need for runInAction here, setUserRole updates React state directly
                    if (idTokenResult.claims.admin) {
                        setUserRole('admin');
                    } else if (idTokenResult.claims.nutritionist) {
                        setUserRole('nutritionist');
                    } else {
                        setUserRole('user');
                    }
                } catch (error) {
                    console.error("APP.JS: Error getting ID token result during auth state change:", error);
                    // No need for runInAction here
                    setUserRole(null);
                }
            } else {
                console.log("APP.JS: Auth State Changed - User is logged out.");
                // No need for runInAction here
                setUserRole(null);
            }
            // No need for runInAction here
            setIsFirebaseLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLoginSuccess = (role) => {
        setUserRole(role);
        setShowResetPassword(false);
        setShowCreateAccount(false);
    };

    const handleResetPasswordRequest = () => {
        setUserRole(null);
        setShowCreateAccount(false);
        setShowResetPassword(true);
    };

    const handleBackToLogin = () => {
        setShowResetPassword(false);
        setShowCreateAccount(false);
        setUserRole(null);
        getAuth(app).signOut();
    };

    const handleCreateAccountRequest = () => {
        setUserRole(null);
        setShowResetPassword(false);
        setShowCreateAccount(true);
    };

    const handleAccountCreatedAndReturnToLogin = () => {
        setShowCreateAccount(false);
        setUserRole(null);
    };

    if (isFirebaseLoading) {
        return <div>Loading authentication...</div>;
    }

    if (showCreateAccount) {
        return (
            <CreateAccountPage
                onAccountCreated={handleAccountCreatedAndReturnToLogin}
                onBackToLogin={handleAccountCreatedAndReturnToLogin}
            />
        );
    } else if (showResetPassword) {
        return <ResetPasswordPage onBackToLogin={handleBackToLogin} />;
    } else if (userRole === 'nutritionist') {
        return <NutritionistDashboard />;
    } else if (userRole === 'admin') {
        return <AdminDashboard onLogout={handleBackToLogin} />;
    } else {
        return (
            <LoginPage
                onLoginSuccess={handleLoginSuccess}
                onResetPasswordRequest={handleResetPasswordRequest}
                onCreateAccountRequest={handleCreateAccountRequest}
            />
        );
    }
}

export default App;