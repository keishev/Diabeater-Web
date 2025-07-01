// src/CreateAccountPage.js
import React, { useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import NutritionistApplicationViewModel from './ViewModels/NutritionistApplicationViewModel';
import bloodDropLogo from './assets/blood_drop_logo.png';
import './CreateAccountPage.css'; // Link to the CSS file

// Instantiate the ViewModel outside the component to persist its state
// or within a React Context if you need to pass it down the component tree.
// For this single page, a direct import is fine.
const viewModel = new NutritionistApplicationViewModel();

function CreateAccountPage({ onBackToLogin }) {
    const fileInputRef = useRef(null);

    // Use useEffect to react to changes in viewModel's state for modal visibility
    useEffect(() => {
        // This effect can be used for any side effects based on viewModel state
        // The direct use of viewModel.showInfoModal and viewModel.showPendingApprovalModal
        // in JSX via `observer` handles rendering updates.
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

                <form onSubmit={(e) => {
                    e.preventDefault();
                    viewModel.submitApplication();
                }} className="create-account-form">
                    <div className="create-account-form-grid">
                        {/* Left Column Inputs */}
                        <div className="create-account-form-column">
                            <label htmlFor="first-name-input" className="create-account-input-label">First Name</label>
                            <input
                                id="first-name-input"
                                type="text"
                                placeholder=""
                                value={viewModel.firstName}
                                onChange={(e) => viewModel.setFirstName(e.target.value)}
                                className="create-account-input-field"
                                required
                            />

                            <label htmlFor="email-input" className="create-account-input-label">Email</label>
                            <input
                                id="email-input"
                                type="email"
                                placeholder=""
                                value={viewModel.email}
                                onChange={(e) => viewModel.setEmail(e.target.value)}
                                className="create-account-input-field"
                                required
                            />

                            <label htmlFor="password-input" className="create-account-input-label">Password</label>
                            <div className="create-account-password-input-container">
                                <input
                                    id="password-input"
                                    type="password"
                                    placeholder=""
                                    value={viewModel.password}
                                    onChange={(e) => viewModel.setPassword(e.target.value)}
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
                                    value={viewModel.confirmPassword}
                                    onChange={(e) => viewModel.setConfirmPassword(e.target.value)}
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
                                value={viewModel.lastName}
                                onChange={(e) => viewModel.setLastName(e.target.value)}
                                className="create-account-input-field"
                                required
                            />

                            {/* Date of Birth Input */}
                            <label htmlFor="dob-input" className="create-account-input-label">Date of Birth</label>
                            <input
                                id="dob-input"
                                type="date"
                                value={viewModel.dob}
                                onChange={(e) => viewModel.setDob(e.target.value)}
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
                        />
                        <label htmlFor="terms-checkbox">I agree to the <span className="create-account-terms-link">Terms and Conditions</span></label>
                    </div>

                    {viewModel.error && <p className="create-account-error-message">{viewModel.error}</p>}

                    <button type="submit" className="create-account-submit-button" disabled={viewModel.isLoading}>
                        {viewModel.isLoading ? 'SUBMITTING...' : 'SUBMIT'}
                    </button>
                </form>

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

                {viewModel.showPendingApprovalModal && (
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

// Wrap the component with observer to enable MobX reactivity
export default observer(CreateAccountPage);