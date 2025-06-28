// src/LoginPage.js
import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import app from '../firebase'; 
import loginImage from '../assets/login_image.jpg'; 
import bloodDropLogo from '../assets/blood_drop_logo.png';
import './LoginPage.css';

// Initialize Firebase Auth
const auth = getAuth(app);

function LoginPage({ onLoginSuccess, onResetPasswordRequest, onCreateAccountRequest }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [profile, setProfile] = useState('nutritionist');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const profileOptions = [
        { label: 'Select Profile', value: '' },
        { label: 'Nutritionist', value: 'nutritionist' },
        { label: 'Admin', value: 'admin' },
    ];

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Get user's custom claims to determine role
            const idTokenResult = await user.getIdTokenResult(true); // Force refresh token
            const claims = idTokenResult.claims;

            let loginSuccess = false;

            if (profile === 'admin' && claims.admin) {
                // Admin login: Check for 'admin' custom claim
                console.log('Admin login successful!');
                loginSuccess = true;
                onLoginSuccess('admin');
            } else if (profile === 'nutritionist' && claims.role === 'nutritionist' && claims.status === 'approved') {
                // Nutritionist login: Check for 'role: nutritionist' and 'status: approved' claims
                console.log('Approved Nutritionist login successful!');
                loginSuccess = true;
                onLoginSuccess('nutritionist');
            } else if (profile === 'nutritionist' && claims.role === 'nutritionist' && claims.status === 'pending') {
                // Nutritionist account pending approval
                setError('Your nutritionist account is pending approval. Please wait for an email notification.');
            } else if (profile === 'nutritionist' && claims.role === 'nutritionist' && claims.status === 'rejected') {
                // Nutritionist account rejected
                setError('Your nutritionist account has been rejected. Please contact support for more details.');
            } else {
                setError('Invalid profile selection or insufficient permissions for this account type.');
                // Sign out the user if they tried to log in with the wrong profile type
                await auth.signOut();
            }

            if (!loginSuccess) {
                 // If login was not successful based on profile/claims, signOut
                 await auth.signOut();
            }


        } catch (error) {
            console.error('Firebase Login Error:', error);
            // Handle specific Firebase authentication errors
            if (error.code === 'auth/invalid-email') {
                setError('Invalid email address.');
            } else if (error.code === 'auth/user-disabled') {
                setError('Your account has been disabled.');
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                setError('Invalid email or password.');
            } else {
                setError(`Login failed: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPasswordClick = () => {
        if (onResetPasswordRequest) {
            onResetPasswordRequest();
        }
    };

    const handleCreateAccountClick = (e) => {
        e.preventDefault();
        if (onCreateAccountRequest) {
            onCreateAccountRequest();
        }
    };

    return (
        <div className="login-page-container">
            <div className="left-section">
                <img src={loginImage} alt="Person checking blood sugar" className="login-image" />
            </div>

            <div className="right-section">
                <div className="logo-container">
                    <img src={bloodDropLogo} alt="DiaBeater Logo" className="blood-drop-logo-img" />
                    <h1 className="logo-text">DiaBeater</h1>
                </div>

                <form onSubmit={handleLogin} className="form">
                    <label htmlFor="email-input" className="email-input-label">Email Address</label>
                    <input
                        id="email-input"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="email-input-field"
                        required
                    />

                    <label htmlFor="password-input" className="input-label">Password</label>
                    <div className="password-input-container">
                        <input
                            id="password-input"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            required
                        />
                        <span
                            className="password-toggle-icon"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.78 9.97 0 0 0 1.3-.15"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>
                            )}
                        </span>
                    </div>

                    <label htmlFor="profile-select" className="input-label">Profile</label>
                    <div className="select-container">
                        <select
                            id="profile-select"
                            value={profile}
                            onChange={(e) => setProfile(e.target.value)}
                            className="select-field"
                            required
                        >
                            {profileOptions.map((option) => (
                                <option key={option.value} value={option.value} disabled={option.value === ''}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <span className="select-icon">▼</span>
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? 'LOGGING IN...' : 'LOG IN'}
                    </button>
                </form>

                <span
                    className="reset-password-link"
                    onClick={handleResetPasswordClick}
                    style={{ cursor: 'pointer' }}
                >
                    Reset Password
                </span>
                <span
                    className="create-account-link"
                    onClick={handleCreateAccountClick}
                    style={{ cursor: 'pointer' }}
                >
                    Create Account (Nutritionist)
                </span>
            </div>
        </div>
    );
}

export default LoginPage;