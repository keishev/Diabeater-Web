import React, { useState } from 'react';
import LoginPage from './Nutritionist/LoginPage';
import NutritionistDashboard from './Nutritionist/NutritionistDashboard';
import AdminDashboard from './Admin/AdminDashboard'; // This will now manage its own sub-views
import ResetPasswordPage from './ResetPasswordPage';
import CreateAccountPage from './CreateAccountPage';

import '@fortawesome/fontawesome-free/css/all.min.css';


function App() {
    const [userRole, setUserRole] = useState(null);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showCreateAccount, setShowCreateAccount] = useState(false);

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

    // Conditional Rendering Logic
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
        // AdminDashboard will now manage which specific admin page is shown internally
        return <AdminDashboard onLogout={handleBackToLogin} />; // Pass onLogout to AdminDashboard
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