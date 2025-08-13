// src/Components/Modals/UserDetailModal.js
import React from 'react';
import { observer } from 'mobx-react-lite';
import './UserDetailModal.css';
import moment from 'moment'; // For date formatting

// Destructure all expected props
const UserDetailModal = observer(({
    user,
    onClose,
    onApprove,
    onReject,
    onViewDocument,
    loading,
    error,
    success,
    showRejectionReasonModal,
    rejectionReason,
    setRejectionReason,
    onConfirmReject,
    onCancelReject
}) => {
    console.log("[UserDetailModal] Received user prop:", user);

    if (!user) {
        console.warn("[UserDetailModal] User prop is null or undefined. Not rendering modal content.");
        return null;
    }

    const isNutritionistCandidate = user.role === 'pending_nutritionist' || (user.role === 'user' && user.nutritionistApplicationStatus === 'pending');
    const isApprovedNutritionist = user.role === 'nutritionist';

    const handleApproveClick = () => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to APPROVE ${userName}'s nutritionist application?`)) {
            onApprove(user._id);
        }
    };

    const handleOpenRejectReasonClick = () => {
        onReject();
    };

    const handleConfirmRejectClick = () => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to REJECT ${userName}'s nutritionist application? This action cannot be undone.`)) {
            onConfirmReject(user._id, rejectionReason);
        }
    };

    const handleViewDocumentClick = () => {
        onViewDocument(user._id);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return moment(timestamp.toDate()).format('DD/MM/YYYY HH:mm');
        }
        return moment(timestamp).format('DD/MM/YYYY HH:mm');
    };

    const calculateRenewalDate = (endDate) => {
        if (!endDate) {
            return 'N/A';
        }

        try {
            let dateObject;
            
            if (endDate.toDate && typeof endDate.toDate === 'function') {
                dateObject = endDate.toDate();
            } else if (endDate instanceof Date) {
                dateObject = endDate;
            } else if (typeof endDate === 'string') {
                dateObject = new Date(endDate);
            } else {
                console.warn('Invalid endDate format:', endDate);
                return 'N/A';
            }

            if (isNaN(dateObject.getTime())) {
                console.warn('Invalid date object:', dateObject);
                return 'N/A';
            }

            const renewalDate = new Date(dateObject);
            renewalDate.setDate(renewalDate.getDate() + 1);
            
            return moment(renewalDate).format('DD/MM/YYYY');

        } catch (error) {
            console.error('Error calculating renewal date:', error);
            return 'N/A';
        }
    };

    const formatRole = (role) => {
        if (!role) return 'N/A';
        
        switch (role.toLowerCase()) {
            case 'admin':
                return 'Administrator';
            case 'nutritionist':
                return 'Nutritionist';
            case 'user':
                return 'Regular User';
            case 'pending_nutritionist':
                return 'Pending Nutritionist';
            default:
                return role.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
        }
    };

    // Helper to format user since date consistently
    const formatUserSince = (userSince, createdAt) => {
        // Try userSince first, then fallback to createdAt, then show N/A
        if (userSince) {
            return userSince;
        } else if (createdAt) {
            return formatDate(createdAt);
        } else {
            return 'N/A';
        }
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
                    
                    {/* Role field */}
                    <p><strong>Role:</strong> 
                        <span className={`role-badge role-${user.role ? user.role.toLowerCase().replace('_', '-') : 'unknown'}`}>
                            {formatRole(user.role)}
                        </span>
                    </p>
                    
                    {user.accountType && <p><strong>Account Type:</strong> {user.accountType}</p>}
                    
                    {/* FIXED: Always show these fields with fallbacks */}
                    <p><strong>Date of Birth:</strong> {user.dob ? formatDate(user.dob) : 'Not provided'}</p>
                    
                    <p>
                        <strong>Status:</strong>
                        <span className={`status-dot status-${user.status ? user.status.toLowerCase() : 'unknown'}`}></span>
                        {user.status || 'N/A'}
                    </p>
                    
                    {/* FIXED: Always show User Since */}
                    <p><strong>User Since:</strong> {formatUserSince(user.userSince, user.createdAt)}</p>

                    {/* Certificate section */}
                    {(isNutritionistCandidate || isApprovedNutritionist) && user.certificateUrl && (
                        <div className="certificate-section">
                            <p><strong>Certificate:</strong>
                                <button className="doc-action-button view-button" onClick={handleViewDocumentClick} disabled={loading}>
                                    {loading ? 'Loading...' : 'VIEW DOCUMENT'}
                                </button>
                            </p>
                        </div>
                    )}

                    {/* Premium Status Section */}
                    <h4>Current Premium Status:</h4>
                    {user.currentSubscription ? (
                        <>
                            <p><strong>Plan:</strong> {user.currentSubscription.plan || 'N/A'}</p>
                            <p><strong>Status:</strong> 
                                <span className={`status-dot status-${user.currentSubscription.status ? user.currentSubscription.status.toLowerCase() : 'unknown'}`}></span>
                                {user.currentSubscription.status || 'N/A'}
                            </p>
                            <p><strong>Price:</strong> ${user.currentSubscription.price?.toFixed(2) || 'N/A'}</p>
                            <p><strong>Current Period:</strong> {formatDate(user.currentSubscription.startDate)} - {formatDate(user.currentSubscription.endDate)}</p>
                            <p><strong>Next Renewal:</strong> {calculateRenewalDate(user.currentSubscription.endDate)}</p>
                        </>
                    ) : (
                        <p>No active premium subscription found for this user.</p>
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