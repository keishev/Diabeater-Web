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
import mealPlanViewModel from './ViewModels/MealPlanViewModel'; // Import the ViewModel

function App() {
    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null); // New state for userId
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
                    // const idTokenResult = await user.getIdTokenResult(true); // This line is not directly used for role/status check in the provided logic
                    const userDocRef = doc(db, 'user_accounts', user.uid);
                    console.log(user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (!userDocSnap.exists()) {
                        console.warn("User Firestore doc not found, signing out...");
                        await signOut(auth);
                        setUserRole(null);
                        setUserId(null); // Clear userId
                        setVerifiedLogin(false);
                    } else {
                        const userData = userDocSnap.data();
                        if (userData.role === 'admin') {
                            setUserRole('admin');
                            setUserId(user.uid); // Set userId
                            setVerifiedLogin(true);
                        } else if (userData.role === 'nutritionist' && userData.status === 'Active') {
                            setUserRole('nutritionist');
                            setUserId(user.uid); // Set userId
                            setVerifiedLogin(true);
                        } else {
                            console.warn("User not authorized for this dashboard");
                            await signOut(auth);
                            setUserRole(null);
                            setUserId(null); // Clear userId
                            setVerifiedLogin(false);
                        }
                    }
                    // After setting user role and ID, tell the ViewModel to initialize
                    mealPlanViewModel.initializeUser();

                } catch (err) {
                    console.error("Error during auth check:", err);
                    await signOut(auth);
                    setUserRole(null);
                    setUserId(null); // Clear userId
                    setVerifiedLogin(false);
                }
            } else {
                setUserRole(null);
                setUserId(null); // Clear userId
                setVerifiedLogin(false);
                mealPlanViewModel.initializeUser(); // Call to clear state in ViewModel if no user
            }

            setIsFirebaseLoading(false);
        });

        return () => {
            unsubscribe();
            // Optional: You might want to dispose of ViewModel listeners if App.js unmounts,
            // though for a root component, it's less critical. ViewModel itself handles listener disposal.
        };
    }, []);

    const handleLoginSuccess = (role) => {
        // ViewModel's initializeUser will be triggered by onAuthStateChanged after successful login
        // which will then pick up the new user and role.
        // We still update local state for immediate rendering.
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
        signOut(auth); // Ensure user is signed out properly
        mealPlanViewModel.initializeUser(); // Re-initialize ViewModel to clear state
    };

    const handleLogout = async () => {
        await AuthRepository.logout();
        setUserRole(null);
        setUserId(null); // Clear userId
        setVerifiedLogin(false);
        setShowCreateAccount(false);
        setShowResetPassword(false);
        mealPlanViewModel.initializeUser(); // Re-initialize ViewModel to clear state
    };

    if (isFirebaseLoading) return <div>Loading authentication...</div>;

    if (showCreateAccount) {
        return <CreateAccountPage onAccountCreated={handleBackToLogin} onBackToLogin={handleBackToLogin} />;
    }

    if (showResetPassword) {
        return <ResetPasswordPage onBackToLogin={handleBackToLogin} />;
    }

    if (verifiedLogin && userRole === 'nutritionist') {
        // Pass currentUserId and currentUserRole to NutritionistDashboard
        return <NutritionistDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} />;
    }

    if (verifiedLogin && userRole === 'admin') {
        // Pass currentUserId and currentUserRole to AdminDashboard
        return <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} />;
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