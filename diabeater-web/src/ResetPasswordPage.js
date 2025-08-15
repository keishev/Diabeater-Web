
import React from 'react';
import { observer } from 'mobx-react-lite';
import ResetPasswordViewModel from './ViewModels/ResetPasswordViewModel';
import bloodDropLogo from './assets/blood_drop_logo.png';
import './ResetPasswordPage.css';


const ResetPasswordPage = observer(() => {
    const viewModel = ResetPasswordViewModel;

    const handleSubmit = async (e) => {
        e.preventDefault();
        await viewModel.handleSubmit();
    };

    const handleBackToLoginClick = () => {
        window.location.href = '/';
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
                        value={viewModel.email}
                        onChange={(e) => viewModel.setEmail(e.target.value)}
                        className="input-field"
                        required
                        disabled={viewModel.isLoading} 
                    />

                    {viewModel.message && <p className="success-message">{viewModel.message}</p>}
                    {viewModel.error && <p className="error-message">{viewModel.error}</p>}

                    <button type="submit" className="reset-button" disabled={viewModel.isLoading}>
                        {viewModel.isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <button 
                    className="back-to-login-link" 
                    onClick={handleBackToLoginClick} 
                    disabled={viewModel.isLoading}>
                    Back to Login
                </button>
            </div>
        </div>
    );
});

export default ResetPasswordPage;