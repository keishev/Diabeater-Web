// src/Components/Modals/UserDetailModal.js
import React from 'react';
import { observer } from 'mobx-react-lite';
import './UserDetailModal.css';
import moment from 'moment'; // For date formatting

// Destructure all expected props
const UserDetailModal = observer(({
    user, // <-- Now received as a prop
    onClose,
    onApprove, // <-- Action callback props
    onReject, // This will now typically just trigger the rejection modal to open
    onViewDocument,
    // Removed: onSuspend, onUnsuspend, onChangeRole, onDeleteAccount as they are not in the scope of premium users
    loading, // <-- Loading state for actions related to this specific modal
    error,   // <-- Error state for actions
    success, // <-- Success state for actions

    // Props specifically for the nested rejection modal
    showRejectionReasonModal, // Boolean to show/hide the nested rejection reason input
    rejectionReason,          // Current value of the rejection reason textarea
    setRejectionReason,       // Setter for the rejection reason
    onConfirmReject,          // Callback for confirming rejection with reason
    onCancelReject            // Callback to close the rejection reason modal without confirming
}) => {
    console.log("[UserDetailModal] Received user prop:", user); //

    if (!user) {
        console.warn("[UserDetailModal] User prop is null or undefined. Not rendering modal content."); //
        return null;
    }

    const isNutritionistCandidate = user.role === 'pending_nutritionist' || (user.role === 'user' && user.nutritionistApplicationStatus === 'pending'); //
    const isApprovedNutritionist = user.role === 'nutritionist'; //

    const handleApproveClick = () => { //
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email; //
        if (window.confirm(`Are you sure you want to APPROVE ${userName}'s nutritionist application?`)) { //
            // Note: user.id might be undefined if not explicitly set by the DB. user._id (document ID) is safer.
            onApprove(user._id);
        }
    };

    const handleOpenRejectReasonClick = () => { //
        // This action will trigger the parent to manage the state for the nested rejection modal
        onReject(); // Simplified, parent should handle opening its own rejection modal
    };

    const handleConfirmRejectClick = () => { //
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email; //
        if (window.confirm(`Are you sure you want to REJECT ${userName}'s nutritionist application? This action cannot be undone.`)) { //
            // Pass the user's ID and the reason back to the parent ViewModel
            onConfirmReject(user._id, rejectionReason); //
        }
    };

    const handleViewDocumentClick = () => { //
        onViewDocument(user._id);
    };

    const formatDate = (timestamp) => { //
        if (!timestamp) return 'N/A'; //
        if (timestamp.toDate && typeof timestamp.toDate === 'function') { // Check if it's a Firebase Timestamp object
            return moment(timestamp.toDate()).format('DD/MM/YYYY HH:mm'); //
        }
        return moment(timestamp).format('DD/MM/YYYY HH:mm'); //
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

                    <h4>Subscription Details (Latest Premium):</h4>
                    {user.currentSubscription ? (
                        <>
                            <p><strong>Plan:</strong> {user.currentSubscription.plan || 'N/A'}</p>
                            <p><strong>Status:</strong> {user.currentSubscription.status || 'N/A'}</p>
                            <p><strong>Start Date:</strong> {formatDate(user.currentSubscription.startDate)}</p>
                            <p><strong>End Date:</strong> {formatDate(user.currentSubscription.endDate)}</p>
                            <p><strong>Renewal Date:</strong> {user.displayRenewalDate || 'N/A'}</p> {/* Use pre-processed renewal date */}
                            <p><strong>Price:</strong> ${user.currentSubscription.price?.toFixed(2) || 'N/A'}</p>
                            <p><strong>Type:</strong> {user.currentSubscription.type || 'N/A'}</p>
                            <p><strong>Subscription ID:</strong> {user.currentSubscription.subscriptionId || 'N/A'}</p>
                        </>
                    ) : (
                        <p>No latest premium subscription found for this user.</p>
                    )}

                    <div className="user-detail-modal-actions">
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
                    </div>
                </div>
            </div>

            {/* Nested Rejection Reason Modal */}
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
                            <button className="cancel-button" onClick={onCancelReject} disabled={loading}>Cancel</button>
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