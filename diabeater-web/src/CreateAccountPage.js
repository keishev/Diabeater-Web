// src/CreateAccountPage.js
import React, { useRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import NutritionistApplicationViewModel from './ViewModels/NutritionistApplicationViewModel';
import TermsAndConditionsModal from './Nutritionist/TermsAndConditionsModal';
import bloodDropLogo from './assets/blood_drop_logo.png';
import './CreateAccountPage.css';

// Instantiate the ViewModel outside the component to persist its state
const viewModel = new NutritionistApplicationViewModel();

function CreateAccountPage({ onBackToLogin }) {
    const fileInputRef = useRef(null);
    const [showTermsModal, setShowTermsModal] = useState(false);

    useEffect(() => {
    }, []);

    const handleFileChange = (e) => {
        viewModel.setDocument(e.target.files[0]);
    };

    const handleBackToLoginFromModal = () => {
        viewModel.setShowPendingApprovalModal(false);
        if (onBackToLogin) {
            onBackToLogin();
        }
    };

    const handleSendVerification = (e) => {
        e.preventDefault();
        viewModel.sendEmailVerification();
    };

    const handleSubmitApplication = (e) => {
        e.preventDefault();
        // Application is now submitted automatically after email verification
        // This handler is only used for the initial email verification
        viewModel.sendEmailVerification();
    };

    const handleTermsClick = (e) => {
        e.preventDefault();
        setShowTermsModal(true);
    };

    const handleAcceptTerms = () => {
        viewModel.setAgreedToTerms(true);
        setShowTermsModal(false);
    };

    return (
        <div className="create-account-container">
            <button
                className="create-account-back-button"
                onClick={onBackToLogin}
            >
                &larr; Back to Login
            </button>

            <div className="create-account-card">
                <div className="create-account-logo-container">
                    <img src={bloodDropLogo} alt="DiaBeater Logo" className="create-account-blood-drop-logo-img" />
                    <h1 className="create-account-logo-text">DiaBeater</h1>
                </div>

                <h2 className="create-account-title">Create Nutritionist Account</h2>

                <form onSubmit={handleSubmitApplication} className="create-account-form">
                    <div className="create-account-form-grid">
                        {/* Left Column Inputs */}
                        <div className="create-account-form-column">
                            <label htmlFor="first-name-input" className="create-account-input-label">First Name</label>
                            <input
                                id="first-name-input"
                                type="text"
                                placeholder=""
                                value={viewModel.application.firstName}
                                onChange={(e) => viewModel.setFirstName(e.target.value)}
                                className="create-account-input-field"
                                required
                                disabled={viewModel.isEmailVerified}
                            />

                            <label htmlFor="email-input" className="create-account-input-label">Email</label>
                            <input
                                id="email-input"
                                type="email"
                                placeholder=""
                                value={viewModel.application.email}
                                onChange={(e) => viewModel.setEmail(e.target.value)}
                                className="create-account-input-field"
                                required
                                disabled={viewModel.isEmailVerified}
                            />

                            <label htmlFor="password-input" className="create-account-input-label">Password</label>
                            <div className="create-account-password-input-container">
                                <input
                                    id="password-input"
                                    type="password"
                                    placeholder=""
                                    value={viewModel.application.password}
                                    onChange={(e) => viewModel.setPassword(e.target.value)}
                                    className="create-account-input-field"
                                    required
                                    disabled={viewModel.isEmailVerified}
                                />
                            </div>

                            <label htmlFor="confirm-password-input" className="create-account-input-label">Confirm Password</label>
                            <div className="create-account-password-input-container">
                                <input
                                    id="confirm-password-input"
                                    type="password"
                                    placeholder=""
                                    value={viewModel.application.confirmPassword}
                                    onChange={(e) => viewModel.setConfirmPassword(e.target.value)}
                                    className="create-account-input-field"
                                    required
                                    disabled={viewModel.isEmailVerified}
                                />
                            </div>
                        </div>

                        {/* Right Column Inputs */}
                        <div className="create-account-form-column">
                            <label htmlFor="last-name-input" className="create-account-input-label">Last Name</label>
                            <input
                                id="last-name-input"
                                type="text"
                                placeholder=""
                                value={viewModel.application.lastName}
                                onChange={(e) => viewModel.setLastName(e.target.value)}
                                className="create-account-input-field"
                                required
                                disabled={viewModel.isEmailVerified}
                            />

                            {/* Date of Birth Input */}
                            <label htmlFor="dob-input" className="create-account-input-label">Date of Birth</label>
                            <input
                                id="dob-input"
                                type="date"
                                value={viewModel.application.dob}
                                onChange={(e) => viewModel.setDob(e.target.value)}
                                className="create-account-input-field"
                                required
                                disabled={viewModel.isEmailVerified}
                            />

                            <label htmlFor="certificate-upload" className="create-account-input-label">Upload Certificate (pdf)</label>
                            <div className="create-account-upload-section">
                                <input
                                    id="certificate-upload"
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    disabled={viewModel.isEmailVerified}
                                />
                                <button
                                    type="button"
                                    className="create-account-upload-button"
                                    onClick={() => fileInputRef.current.click()}
                                    disabled={viewModel.isEmailVerified}
                                >
                                    Upload
                                </button>
                                <span className="create-account-file-name">
                                    {viewModel.document ? viewModel.document.name : ''}
                                </span>
                                <button
                                    type="button"
                                    className="create-account-info-button"
                                    onClick={() => viewModel.setShowInfoModal(true)}
                                >
                                    &#9432;
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="create-account-terms-checkbox">
                        <input
                            type="checkbox"
                            id="terms-checkbox"
                            checked={viewModel.agreedToTerms}
                            onChange={(e) => viewModel.setAgreedToTerms(e.target.checked)}
                            disabled={viewModel.isEmailVerified}
                        />
                        <label htmlFor="terms-checkbox">
                            I agree to the{' '}
                            <span 
                                className="create-account-terms-link"
                                onClick={handleTermsClick}
                                style={{ cursor: 'pointer' }}
                            >
                                Terms and Conditions
                            </span>
                        </label>
                    </div>

                    {viewModel.isEmailVerified && (
                        <div className="create-account-verification-success">
                            <i className="fas fa-check-circle"></i>
                            Email verified successfully! Your application is being submitted...
                        </div>
                    )}

                    {viewModel.error && <p className="create-account-error-message">{viewModel.error}</p>}

                    <button 
                        type="submit" 
                        className="create-account-submit-button" 
                        disabled={viewModel.isLoading || viewModel.isEmailVerified}
                    >
                        {viewModel.isLoading ? 
                            'PROCESSING...' : 
                            viewModel.isEmailVerified ? 
                                'APPLICATION SUBMITTED' : 
                                'SEND EMAIL VERIFICATION'
                        }
                    </button>
                </form>

                {/* Certificate Requirements Modal */}
                {viewModel.showInfoModal && (
                    <div className="create-account-modal-overlay">
                        <div className="create-account-modal-content">
                            <h3>Certificate Requirements</h3>
                            <p>Please upload a valid PDF document of your nutritionist certification or degree.</p>
                            <p>File size should not exceed 5MB.</p>
                            <button className="create-account-modal-button" onClick={() => viewModel.setShowInfoModal(false)}>
                                Got It
                            </button>
                        </div>
                    </div>
                )}

                {/* Email Verification Modal */}
                {viewModel.showEmailVerificationModal && (
                    <div className="create-account-modal-overlay">
                        <div className="create-account-modal-content">
                            <h3>Verify Your Email</h3>
                            <p>We've sent a verification email to <strong>{viewModel.application.email}</strong></p>
                            <p>Please check your email and click the verification link, then click "Check Verification" below.</p>
                            <p><small>After verification, your application will be submitted automatically.</small></p>
                            
                            {viewModel.error && <p className="create-account-error-message">{viewModel.error}</p>}
                            
                            <div className="create-account-modal-actions">
                                <button 
                                    className="create-account-modal-button"
                                    onClick={() => viewModel.checkEmailVerification()}
                                    disabled={viewModel.isLoading}
                                >
                                    {viewModel.isLoading ? 'CHECKING...' : 'CHECK VERIFICATION'}
                                </button>
                                <button 
                                    className="create-account-modal-button-secondary"
                                    onClick={() => viewModel.resendVerificationEmail()}
                                    disabled={viewModel.isLoading}
                                >
                                    RESEND EMAIL
                                </button>
                                <button 
                                    className="create-account-modal-button-secondary"
                                    onClick={() => {
                                        viewModel.setShowEmailVerificationModal(false);
                                        viewModel.setError('');
                                    }}
                                >
                                    CANCEL
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Application Success Modal */}
                {viewModel.showPendingApprovalModal && (
                    <div className="create-account-modal-overlay">
                        <div className="create-account-modal-content">
                            <h3>Application Submitted Successfully</h3>
                            <p>Your nutritionist application has been submitted for admin review.</p>
                            <p>You will receive an email notification once your application has been approved or if more information is needed.</p>
                            <button className="create-account-modal-button" onClick={handleBackToLoginFromModal}>
                                OK
                            </button>
                        </div>
                    </div>
                )}

                {/* Terms and Conditions Modal */}
                <TermsAndConditionsModal
                    isOpen={showTermsModal}
                    onClose={() => setShowTermsModal(false)}
                    onAccept={handleAcceptTerms}
                />
            </div>
        </div>
    );
}

// Wrap the component with observer to enable MobX reactivity
export default observer(CreateAccountPage);