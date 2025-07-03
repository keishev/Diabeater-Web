// src/App.js
import React, { useState, useEffect } from 'react';
import LoginPage from './Nutritionist/LoginPage';
import NutritionistDashboard from './Nutritionist/NutritionistDashboard';
import AdminDashboard from './Admin/AdminDashboard';
import ResetPasswordPage from './ResetPasswordPage';
import CreateAccountPage from './CreateAccountPage';

import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from './firebase';

import AuthRepository from './Repositories/AuthRepository'; 

function App() {
    const [userRole, setUserRole] = useState(null);
    const [verifiedLogin, setVerifiedLogin] = useState(false);
    const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showCreateAccount, setShowCreateAccount] = useState(false);

    useEffect(() => {
        const auth = getAuth(app);
        const db = getFirestore(app);

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const idTokenResult = await user.getIdTokenResult(true);
                    const userDocRef = doc(db, 'user_accounts', user.uid); 
                    console.log (user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (!userDocSnap.exists()) {
                        console.warn("User Firestore doc not found, signing out...");
                        await signOut(auth);
                        setUserRole(null);
                        setVerifiedLogin(false);
                    } else {
                        const userData = userDocSnap.data();
                        if (userData.role === 'admin') {
                            setUserRole('admin');
                            setVerifiedLogin(true);
                        } else if (userData.role === 'nutritionist' && userData.status === 'Active') {
                            setUserRole('nutritionist');
                            setVerifiedLogin(true);
                        } else {
                            console.warn("User not authorized for this dashboard");
                            await signOut(auth);
                            setUserRole(null);
                            setVerifiedLogin(false);
                        }
                    }
                } catch (err) {
                    console.error("Error during auth check:", err);
                    await signOut(auth);
                    setUserRole(null);
                    setVerifiedLogin(false);
                }
            } else {
                setUserRole(null);
                setVerifiedLogin(false);
            }

            setIsFirebaseLoading(false); 
        });

        return () => unsubscribe();
    }, []);

    const handleLoginSuccess = (role) => {
        setUserRole(role);
        setVerifiedLogin(true);
        setShowResetPassword(false);
        setShowCreateAccount(false);
    };

    const handleResetPasswordRequest = () => {
        setShowResetPassword(true);
        setShowCreateAccount(false);
    };

    const handleCreateAccountRequest = () => {
        setShowCreateAccount(true);
        setShowResetPassword(false);
    };

    const handleBackToLogin = () => {
        setShowResetPassword(false);
        setShowCreateAccount(false);
        setUserRole(null);
        setVerifiedLogin(false);
        const auth = getAuth(app);
        signOut(auth);
    };

    const handleLogout = async () => {
        await AuthRepository.logout(); 
        setUserRole(null);
        setVerifiedLogin(false);
        setShowCreateAccount(false);
        setShowResetPassword(false);
    };

    if (isFirebaseLoading) return <div>Loading authentication...</div>;

    if (showCreateAccount) {
        return <CreateAccountPage onAccountCreated={handleBackToLogin} onBackToLogin={handleBackToLogin} />;
    }

    if (showResetPassword) {
        return <ResetPasswordPage onBackToLogin={handleBackToLogin} />;
    }

    if (verifiedLogin && userRole === 'nutritionist') {
        return <NutritionistDashboard />;
    }

    if (verifiedLogin && userRole === 'admin') {
        return <AdminDashboard onLogout={handleLogout} />; 
    }

    return (
        <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onResetPasswordRequest={handleResetPasswordRequest}
            onCreateAccountRequest={handleCreateAccountRequest}
        />
    );
}

export default App;
