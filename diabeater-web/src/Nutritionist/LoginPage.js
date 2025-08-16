import React from 'react';
import useAuthViewModel from '../ViewModels/AuthViewModel';
import loginImage from '../assets/login-image.jpg';
import bloodDropLogo from '../assets/blood_drop_logo.png';
import './LoginPage.css';

function LoginPage({ onLoginSuccess, onResetPasswordRequest, onCreateAccountRequest }) {
    const {
        email, setEmail,
        password, setPassword,
        role, setRole,
        showPassword, setShowPassword,
        isLoading, error,
        login
    } = useAuthViewModel(onLoginSuccess);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await login();
    };

    const profileOptions = [
        { label: 'Select Profile', value: '' },
        { label: 'Nutritionist', value: 'nutritionist' },
        { label: 'Admin', value: 'admin' },
    ];

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

                <form onSubmit={handleSubmit} className="form">
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
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
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
                    onClick={onResetPasswordRequest}
                    style={{ cursor: 'pointer' }}
                >
                    Reset Password
                </span>
                <span
                    className="create-account-link"
                    onClick={onCreateAccountRequest}
                    style={{ cursor: 'pointer' }}
                >
                    Create Account (For Nutritionist)
                </span>
            </div>
        </div>
    );
}

export default LoginPage;
