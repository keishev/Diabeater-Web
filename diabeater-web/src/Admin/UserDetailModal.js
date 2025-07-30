// src/UserDetailModal.js
import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import './UserDetailModal.css';
import moment from 'moment'; // For date formatting

// Destructure all expected props
const UserDetailModal = observer(({
    user, // <-- Now received as a prop
    onClose,
    onApprove, // <-- Action callback props
    onReject,
    onViewDocument,
    // Removed: onSuspend,
    // Removed: onUnsuspend,
    // Removed: onChangeRole,
    // Removed: onDeleteAccount,
    loading, // <-- Loading state for actions
    error,   // <-- Error state for actions
    success, // <-- Success state for actions
    showRejectionReasonModal, // Rejection modal state for the nested modal
    rejectionReason,          // Rejection reason state for the nested modal
    setRejectionReason,       // Setter for rejection reason
    onConfirmReject           // Callback for confirming rejection from the nested modal
}) => {
    // Line 13: Log the received user prop for debugging
    // This will now correctly show the 'user' prop that was passed.
    console.log("[UserDetailModal] Received user prop:", user);

    // Defensive check: If user is null or undefined, return null to prevent rendering errors.
    // This is crucial to avoid attempting to access properties on a non-existent object.
    if (!user) {
        // Line 15: Adjusted log to be a warning as it's a valid early exit
        console.warn("[UserDetailModal] User prop is null or undefined. Not rendering modal content.");
        return null; // Do not render the modal content if the user prop is invalid
    }

    // Now, 'user' is guaranteed to be a valid object for the rest of the component's logic.

    const isNutritionistCandidate = user.role === 'pending_nutritionist' || (user.role === 'user' && user.nutritionistApplicationStatus === 'pending');
    const isApprovedNutritionist = user.role === 'nutritionist';

    // Callbacks now use the props passed from the parent
    const handleApproveClick = () => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to APPROVE ${userName}'s nutritionist application?`)) {
            onApprove(user.id || user._id); // Use user.id or user._id consistently
        }
    };

    const handleOpenRejectReasonClick = () => {
        onReject(user.id || user._id); // This will trigger the parent to show the rejection modal
    };

    const handleConfirmRejectClick = () => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to REJECT ${userName}'s nutritionist application? This action cannot be undone.`)) {
            onConfirmReject(user.id || user._id, rejectionReason); // Pass id and reason back to parent
        }
    };

    const handleViewDocumentClick = () => {
        onViewDocument(user.id || user._id);
    };

    // Removed: handleSuspendClick
    // Removed: handleUnsuspendClick
    // Removed: handleChangeRoleClick
    // Removed: handleDeleteAccountClick

    // Helper function to format date
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        // Check if it's a Firebase Timestamp object
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return moment(timestamp.toDate()).format('DD/MM/YYYY HH:mm');
        }
        // If it's already a JS Date object or a string Moment can parse
        return moment(timestamp).format('DD/MM/YYYY HH:mm');
    };

    return (
        <div className="user-detail-modal-overlay">
            <div className="user-detail-modal-content">
                <button className="user-detail-modal-close-button" onClick={onClose}>&times;</button>
                <h2>User Details</h2>

                {loading && <p className="loading-message">Processing...</p>}
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <div className="user-detail-modal-info">
                    <p><strong>Name:</strong> {user.firstName ? `${user.firstName} ${user.lastName}` : (user.name || 'N/A')}</p>
                    <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                    {user.accountType && <p><strong>Account Type:</strong> {user.accountType}</p>}
                    {user.dob && <p><strong>Date of Birth:</strong> {formatDate(user.dob)}</p>}
                    <p>
                        <strong>Status:</strong>
                        <span className={`status-dot status-${user.status ? user.status.toLowerCase() : 'unknown'}`}></span>
                        {user.status || 'N/A'}
                    </p>
                    {user.userSince && <p><strong>User Since:</strong> {user.userSince}</p>}
                    {/* Use the new formatDate helper function */}
                    <p><strong>Created At:</strong> {formatDate(user.createdAt)}</p>

                    {(isNutritionistCandidate || isApprovedNutritionist) && user.certificateUrl && (
                        <div className="certificate-section">
                            <p><strong>Certificate:</strong>
                                <button className="doc-action-button view-button" onClick={handleViewDocumentClick} disabled={loading}>
                                    {loading ? 'Loading...' : 'VIEW DOCUMENT'}
                                </button>
                            </p>
                        </div>
                    )}

                    <div className="user-detail-modal-actions">
                        {/* Removed Suspend/Unsuspend button */}
                        {/* Removed Change Role section */}
                        
                        {isNutritionistCandidate && user.nutritionistApplicationStatus === 'pending' && (
                            <>
                                <button
                                    className="approve-button"
                                    onClick={handleApproveClick}
                                    disabled={loading}
                                >
                                    {loading ? 'Approving...' : 'Approve Nutritionist'}
                                </button>
                                <button
                                    className="reject-button"
                                    onClick={handleOpenRejectReasonClick}
                                    disabled={loading}
                                >
                                    Reject Nutritionist
                                </button>
                            </>
                        )}

                        {/* Removed Delete Account button */}
                    </div>
                </div>
            </div>

            {/* This rejection modal is now controlled by props, can be from parent (AdminDashboardViewModel) */}
            {showRejectionReasonModal && (
                <div className="user-detail-modal-overlay rejection-modal-overlay">
                    <div className="user-detail-modal-content rejection-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Reason for Rejection</h3>
                        <textarea
                            placeholder="Enter rejection reason (optional)"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows="4"
                        ></textarea>
                        <div className="rejection-modal-actions">
                            <button className="cancel-button" onClick={() => { /* needs to tell parent to close */ }} disabled={loading}>Cancel</button>
                            <button
                                className="confirm-reject-button"
                                onClick={handleConfirmRejectClick}
                                disabled={loading}
                            >
                                {loading ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default UserDetailModal;