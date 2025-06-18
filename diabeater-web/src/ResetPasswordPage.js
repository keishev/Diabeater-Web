import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom'; // REMOVE THIS LINE
import bloodDropLogo from './assets/blood_drop_logo.png';
import './ResetPasswordPage.css';

function ResetPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    // const navigate = useNavigate(); // REMOVE THIS LINE

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!email) {
            setError('Please enter your email address.');
            return;
        }

        console.log('Sending password reset request for:', email);

        setTimeout(() => {
            if (email.includes('@')) {
                setMessage('If an account with that email exists, a password reset link has been sent to your email.');
                setEmail('');
                // To go back to login, use window.location.href, which causes a full refresh
                // window.location.href = '/login';
            } else {
                setError('Please enter a valid email address.');
            }
        }, 1000);
    };

    const handleBackToLoginClick = () => {
        window.location.href = '/login'; // Direct browser navigation
    };

    return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                <div className="logo-container">
                    <img src={bloodDropLogo} alt="DiaBeater Logo" className="blood-drop-logo-img" />
                    <h1 className="logo-text">DiaBeater</h1>
                </div>

                <h2 className="reset-password-title">Reset Your Password</h2>
                <p className="reset-password-instruction">
                    Enter your email address below and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="reset-password-form">
                    <label htmlFor="email-reset-input" className="input-label">Email Address</label>
                    <input
                        id="email-reset-input"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field"
                        required
                    />

                    {message && <p className="success-message">{message}</p>}
                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="reset-button">
                        Send Reset Link
                    </button>
                </form>

                <button className="back-to-login-link" onClick={handleBackToLoginClick}>
                    Back to Login
                </button>
            </div>
        </div>
    );
}

export default ResetPasswordPage;