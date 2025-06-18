// src/CreateAccountPage.js
import React, { useState, useRef } from 'react';
import bloodDropLogo from './assets/blood_drop_logo.png';
import './CreateAccountPage.css'; // Link to the CSS file

function CreateAccountPage({ onBackToLogin }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [certificateFile, setCertificateFile] = useState(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const [error, setError] = useState('');
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showPendingApprovalModal, setShowPendingApprovalModal] = useState(false);

    const fileInputRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!firstName || !lastName || !email || !dob || !password || !confirmPassword) {
            setError('All fields are required.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (!certificateFile) {
            setError('Please upload your certificate.');
            return;
        }
        if (!agreedToTerms) {
            setError('You must agree to the terms and conditions.');
            return;
        }

        console.log('Create Account Attempt:', { firstName, lastName, email, dob, certificateFile: certificateFile.name });

        setTimeout(() => {
            setShowPendingApprovalModal(true);
        }, 1000);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setCertificateFile(file);
            setError('');
        } else {
            setCertificateFile(null);
            setError('Please upload a valid PDF file for your certificate.');
        }
    };

    const handleBackToLoginFromModal = () => {
        setShowPendingApprovalModal(false);
        if (onBackToLogin) {
            onBackToLogin();
        }
    };

    return (
        <div className="create-account-container">
            {/* NEW: Back Button */}
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

                <form onSubmit={handleSubmit} className="create-account-form">
                    <div className="create-account-form-grid">
                        {/* Left Column Inputs */}
                        <div className="create-account-form-column">
                            <label htmlFor="first-name-input" className="create-account-input-label">First Name</label>
                            <input
                                id="first-name-input"
                                type="text"
                                placeholder=""
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="create-account-input-field"
                                required
                            />

                            <label htmlFor="email-input" className="create-account-input-label">Email</label>
                            <input
                                id="email-input"
                                type="email"
                                placeholder=""
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="create-account-input-field"
                                required
                            />

                            <label htmlFor="password-input" className="create-account-input-label">Password</label>
                            <div className="create-account-password-input-container">
                                <input
                                    id="password-input"
                                    type="password"
                                    placeholder=""
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="create-account-input-field"
                                    required
                                />
                            </div>

                            <label htmlFor="confirm-password-input" className="create-account-input-label">Confirm Password</label>
                            <div className="create-account-password-input-container">
                                <input
                                    id="confirm-password-input"
                                    type="password"
                                    placeholder=""
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="create-account-input-field"
                                    required
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
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="create-account-input-field"
                                required
                            />

                            {/* Date of Birth Input */}
                            <label htmlFor="dob-input" className="create-account-input-label">Date of Birth</label>
                            <input
                                id="dob-input"
                                type="date"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="create-account-input-field"
                                required
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
                                />
                                <button
                                    type="button"
                                    className="create-account-upload-button"
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    Upload
                                </button>
                                <span className="create-account-file-name">
                                    {certificateFile ? certificateFile.name : ''}
                                </span>
                                <button
                                    type="button"
                                    className="create-account-info-button"
                                    onClick={() => setShowInfoModal(true)}
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
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                        />
                        <label htmlFor="terms-checkbox">I agree to the <span className="create-account-terms-link">Terms and Conditions</span></label>
                    </div>

                    {error && <p className="create-account-error-message">{error}</p>}

                    <button type="submit" className="create-account-submit-button">
                        SUBMIT
                    </button>
                </form>

                {showInfoModal && (
                    <div className="create-account-modal-overlay">
                        <div className="create-account-modal-content">
                            <h3>Certificate Requirements</h3>
                            <p>Please upload a valid PDF document of your nutritionist certification or degree.</p>
                            <p>File size should not exceed 5MB.</p>
                            <button className="create-account-modal-button" onClick={() => setShowInfoModal(false)}>
                                Got It
                            </button>
                        </div>
                    </div>
                )}

                {showPendingApprovalModal && (
                    <div className="create-account-modal-overlay">
                        <div className="create-account-modal-content">
                            <h3>Account Pending Approval</h3>
                            <p>Your account has been submitted for review. You will receive an email notification once your application has been approved.</p>
                            <button className="create-account-modal-button" onClick={handleBackToLoginFromModal}>
                                OK
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CreateAccountPage;