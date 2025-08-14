// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './Nutritionist/LoginPage';
import NutritionistDashboard from './Nutritionist/NutritionistDashboard';
import AdminDashboard from './Admin/AdminDashboard';
import ResetPasswordPage from './ResetPasswordPage';
import CreateAccountPage from './CreateAccountPage';
import NutritionistProfile from './Nutritionist/NutritionistProfile'; // Import the NutritionistProfile component

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
                mealPlanViewModel.initializeUser();
            }

            setIsFirebaseLoading(false);
        });

        return () => {
            unsubscribe()
        };
    }, []);

    const handleLoginSuccess = (role) => {
        setUserRole(role);
        setVerifiedLogin(true);
    };

    const handleBackToLogin = () => {
        setUserRole(null);
        setVerifiedLogin(false);
        const auth = getAuth(app);
        signOut(auth);
        mealPlanViewModel.initializeUser();
    };

    const handleLogout = async () => {
        await AuthRepository.logout();
        setUserRole(null);
        setUserId(null);
        setVerifiedLogin(false);
        mealPlanViewModel.initializeUser();
    };

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
                
                <Route path="/admin/*" element={
                    <ProtectedRoute allowedRole="admin">
                        <Routes>
                            <Route path="profile" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="myProfile" />
                            } />
                            <Route path="dashboard" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="dashboard" />
                            } />
                            <Route path="user-accounts" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="userAccounts" />
                            } />
                            <Route path="user-accounts/all" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="userAccounts" activeUserAccountTab="all" />
                            } />
                            <Route path="user-accounts/pending" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="userAccounts" activeUserAccountTab="pending" />
                            } />
                            <Route path="user-accounts/create-admin" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="userAccounts" activeUserAccountTab="createAdmin" />
                            } />
                            <Route path="premium-accounts" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="premiumAccounts" />
                            } />
                            <Route path="meal-plans" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="mealPlans" />
                            } />
                            <Route path="meal-plans/popular" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="mealPlans" activeMealPlanTab="popular" />
                            } />
                            <Route path="meal-plans/pending" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="mealPlans" activeMealPlanTab="pending" />
                            } />
                            <Route path="meal-plans/approved" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="mealPlans" activeMealPlanTab="approved" />
                            } />
                            <Route path="meal-plans/rejected" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="mealPlans" activeMealPlanTab="rejected" />
                            } />
                            <Route path="meal-plan-detail/:mealPlanId" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="mealPlanDetail" />
                            } />
                            <Route path="export-report" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="exportReport" />
                            } />
                            <Route path="rewards" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="rewards" />
                            } />
                            <Route path="edit-website" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="editWebsite" />
                            } />
                            <Route path="user-feedbacks" element={
                                <AdminDashboard onLogout={handleLogout} currentUserId={userId} currentUserRole={userRole} activeSection="userFeedbacks" />
                            } />
                            {/* Default redirect to dashboard */}
                            <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
                        </Routes>
                    </ProtectedRoute>
                } />
                
                <Route path="/nutritionist/*" element={
                    <ProtectedRoute allowedRole="nutritionist">
                        <Routes>
                            <Route path="profile" element={
                                <NutritionistDashboard
                                    onLogout={handleLogout}
                                    currentUserId={userId}
                                    currentUserRole={userRole}
                                    activeTab="profile"
                                />
                            } />

                            {/* Meal Plans routes with specific tabs */}
                            <Route path="meal-plans/published" element={
                                <NutritionistDashboard
                                    onLogout={handleLogout}
                                    currentUserId={userId}
                                    currentUserRole={userRole}
                                    activeTab="published"
                                />
                            } />
                            <Route path="meal-plans/pending" element={
                                <NutritionistDashboard
                                    onLogout={handleLogout}
                                    currentUserId={userId}
                                    currentUserRole={userRole}
                                    activeTab="pending"
                                />
                            } />
                            <Route path="meal-plans/rejected" element={
                                <NutritionistDashboard
                                    onLogout={handleLogout}
                                    currentUserId={userId}
                                    currentUserRole={userRole}
                                    activeTab="rejected"
                                />
                            } />
                            <Route path="meal-plans/draft" element={
                                <NutritionistDashboard
                                    onLogout={handleLogout}
                                    currentUserId={userId}
                                    currentUserRole={userRole}
                                    activeTab="draft"
                                />
                            } />

                            <Route path="create-meal-plan" element={
                                <NutritionistDashboard
                                    onLogout={handleLogout}
                                    currentUserId={userId}
                                    currentUserRole={userRole}
                                    activeTab="create"
                                />
                            } />
                            <Route path="notifications" element={
                                <NutritionistDashboard
                                    onLogout={handleLogout}
                                    currentUserId={userId}
                                    currentUserRole={userRole}
                                    activeTab="notifications"
                                />
                            } />

                            <Route path="meal-plan-detail/:mealPlanId" element={
                                <NutritionistDashboard
                                    onLogout={handleLogout}
                                    currentUserId={userId}
                                    currentUserRole={userRole}
                                    activeTab="detail"
                                />
                            } />
                            <Route path="update-meal-plan/:mealPlanId" element={
                                <NutritionistDashboard
                                    onLogout={handleLogout}
                                    currentUserId={userId}
                                    currentUserRole={userRole}
                                    activeTab="update"
                                />
                            } />

                            <Route path="*" element={<Navigate to="/nutritionist/meal-plans/published" replace />} />
                        </Routes>
                    </ProtectedRoute>
                } />
                
                <Route path="/nutritionist/dashboard/*" element={
                    <Navigate to="/nutritionist/meal-plans/published" replace />
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
