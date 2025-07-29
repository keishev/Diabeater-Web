// src/Admin/UserDetailModal.js
import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import adminStatViewModel from '../ViewModels/AdminStatViewModel';
import './UserDetailModal.css';
import moment from 'moment'; // For date formatting

const UserDetailModal = observer(({ onClose }) => {
    const user = adminStatViewModel.selectedUserForManagement;
    const { loading, error, success, showRejectionReasonModal, rejectionReason } = adminStatViewModel;

    useEffect(() => {
        console.log("[UserDetailModal] Received user prop:", user);
        if (!user) {
            console.warn("[UserDetailModal] User prop is null or undefined.");
        }
    }, [user]);

    if (!user) return null;

    const isNutritionistCandidate = user.role === 'pending_nutritionist' || (user.role === 'user' && user.nutritionistApplicationStatus === 'pending');
    const isApprovedNutritionist = user.role === 'nutritionist';

    const handleApprove = async () => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to APPROVE ${userName}'s nutritionist application?`)) {
            const response = await adminStatViewModel.approveNutritionist(user._id);
            if (response.success) {
                onClose();
            }
        }
    };

    const handleOpenRejectReason = () => {
        adminStatViewModel.setShowRejectionReasonModal(true);
    };

    const handleConfirmReject = async () => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to REJECT ${userName}'s nutritionist application? This action cannot be undone.`)) {
            const response = await adminStatViewModel.rejectNutritionist(user._id);
            if (response.success) {
                onClose();
            }
        }
    };

    const handleViewDocument = async () => {
        await adminStatViewModel.viewCertificate(user._id);
    };

    const handleSuspend = async () => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to suspend ${userName}'s account?`)) {
            const response = await adminStatViewModel.suspendUserAccount(user._id, true);
            if (response.success) {
                onClose();
            }
        }
    };

    const handleUnsuspend = async () => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to unsuspend ${userName}'s account?`)) {
            const response = await adminStatViewModel.suspendUserAccount(user._id, false);
            if (response.success) {
                onClose();
            }
        }
    };

    const handleChangeRole = async (newRole) => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to change ${userName}'s role to ${newRole}?`)) {
            const response = await adminStatViewModel.updateUserRole(user._id, newRole);
            if (response.success) {
                onClose();
            }
        }
    };

    const handleDeleteAccount = async () => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to PERMANENTLY DELETE ${userName}'s account? This action cannot be undone.`)) {
            const response = await adminStatViewModel.deleteUserAccount(user._id);
            if (response.success) {
                onClose();
            }
        }
    };

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
                                <button className="doc-action-button view-button" onClick={handleViewDocument} disabled={loading}>
                                    {loading ? 'Loading...' : 'VIEW DOCUMENT'}
                                </button>
                            </p>
                        </div>
                    )}

                    <div className="user-detail-modal-actions">
                        {user.status && user.status.toLowerCase() === 'active' ? (
                            <button
                                className="action-button suspend-button"
                                onClick={handleSuspend}
                                disabled={loading}
                            >
                                {loading ? 'Suspending...' : 'Suspend Account'}
                            </button>
                        ) : (user.status && user.status.toLowerCase() === 'suspended') ? (
                            <button
                                className="action-button unsuspend-button"
                                onClick={handleUnsuspend}
                                disabled={loading}
                            >
                                {loading ? 'Unsuspending...' : 'Unsuspend Account'}
                            </button>
                        ) : null}

                        <div className="role-change-section">
                            <label htmlFor="user-role-select">Change Role:</label>
                            <select
                                id="user-role-select"
                                value={user.role || ''}
                                onChange={(e) => handleChangeRole(e.target.value)}
                                disabled={loading}
                            >
                                <option value="user">User</option>
                                <option value="nutritionist">Nutritionist</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {isNutritionistCandidate && user.nutritionistApplicationStatus === 'pending' && (
                            <>
                                <button
                                    className="approve-button"
                                    onClick={handleApprove}
                                    disabled={loading}
                                >
                                    {loading ? 'Approving...' : 'Approve Nutritionist'}
                                </button>
                                <button
                                    className="reject-button"
                                    onClick={handleOpenRejectReason}
                                    disabled={loading}
                                >
                                    Reject Nutritionist
                                </button>
                            </>
                        )}

                        <button
                            className="delete-button"
                            onClick={handleDeleteAccount}
                            disabled={loading}
                        >
                            {loading ? 'Deleting...' : 'Delete Account'}
                        </button>
                    </div>
                </div>
            </div>

            {showRejectionReasonModal && (
                <div className="user-detail-modal-overlay rejection-modal-overlay">
                    <div className="user-detail-modal-content rejection-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Reason for Rejection</h3>
                        <textarea
                            placeholder="Enter rejection reason (optional)"
                            value={rejectionReason}
                            onChange={(e) => adminStatViewModel.setRejectionReason(e.target.value)}
                            rows="4"
                        ></textarea>
                        <div className="rejection-modal-actions">
                            <button className="cancel-button" onClick={() => adminStatViewModel.setShowRejectionReasonModal(false)} disabled={loading}>Cancel</button>
                            <button
                                className="confirm-reject-button"
                                onClick={handleConfirmReject}
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