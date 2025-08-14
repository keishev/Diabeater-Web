// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
    };

    const handleBackToLogin = () => {
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
        mealPlanViewModel.initializeUser(); // Re-initialize ViewModel to clear state
    };

    // Auth guard component for protected routes
    const ProtectedRoute = ({ children, allowedRole }) => {
        if (isFirebaseLoading) {
            return <div>Loading authentication...</div>;
        }
        
        if (!verifiedLogin || userRole !== allowedRole) {
            return <Navigate to="/" replace />;
        }
        
        return children;
    };

    if (isFirebaseLoading) return <div>Loading authentication...</div>;

    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={
                    verifiedLogin ? (
                        userRole === 'admin' ? 
                            <Navigate to="/admin/dashboard" replace /> : 
                            <Navigate to="/nutritionist/dashboard" replace />
                    ) : (
                        <LoginPage
                            onLoginSuccess={handleLoginSuccess}
                            onResetPasswordRequest={() => window.location.href = '/reset-password'}
                            onCreateAccountRequest={() => window.location.href = '/create-account'}
                        />
                    )
                } />
                <Route path="/reset-password" element={<ResetPasswordPage onBackToLogin={handleBackToLogin} />} />
                <Route path="/create-account" element={<CreateAccountPage onAccountCreated={handleBackToLogin} onBackToLogin={handleBackToLogin} />} />
                
                {/* Protected routes - Admin */}
                <Route path="/admin/dashboard/*" element={
                    <ProtectedRoute allowedRole="admin">
                        <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} />
                    </ProtectedRoute>
                } />
                
                {/* Protected routes - Nutritionist */}
                <Route path="/nutritionist/dashboard/*" element={
                    <ProtectedRoute allowedRole="nutritionist">
                        <NutritionistDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} />
                    </ProtectedRoute>
                } />
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;