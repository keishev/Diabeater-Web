// src/Admin/UserDetailModal.js
import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import adminStatViewModel from '../ViewModels/AdminStatViewModel'; // ⭐ Corrected import to AdminStatViewModel
import './UserDetailModal.css'; // Make sure you have this CSS file
import moment from 'moment'; // For date formatting

const UserDetailModal = observer(({ onClose }) => {
    // We get the selected user directly from the ViewModel
    // ⭐ Using selectedUserForManagement as per AdminStatViewModel
    const user = adminStatViewModel.selectedUserForManagement;
    const { loading, error, success, showRejectionReasonModal, rejectionReason } = adminStatViewModel;

    // Log the user prop when it changes for debugging
    useEffect(() => {
        console.log("[UserDetailModal] Received user prop:", user);
        if (!user) {
            console.warn("[UserDetailModal] User prop is null or undefined.");
        }
    }, [user]);

    // Render nothing if no user is selected
    if (!user) return null;

    // Determine if the user is a nutritionist candidate or approved
    // Assuming 'role' field is what dictates a user's type.
    const isNutritionistCandidate = user.role === 'pending_nutritionist' || (user.role === 'user' && user.nutritionistApplicationStatus === 'pending');
    const isApprovedNutritionist = user.role === 'nutritionist';

    // Handler for Approve action
    const handleApprove = async () => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to APPROVE ${userName}'s nutritionist application?`)) {
            const response = await adminStatViewModel.approveNutritionist(user._id);
            if (response.success) {
                // ViewModel will set success message and update local state
                onClose(); // Close modal after successful action
            }
            // ViewModel will set error message if failed
        }
    };

    // Handler to open rejection reason modal
    const handleOpenRejectReason = () => {
        adminStatViewModel.setShowRejectionReasonModal(true);
    };

    // Handler for Confirm Reject action
    const handleConfirmReject = async () => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to REJECT ${userName}'s nutritionist application? This action cannot be undone.`)) {
            const response = await adminStatViewModel.rejectNutritionist(user._id);
            if (response.success) {
                // ViewModel will set success message and update local state
                onClose(); // Close modal after successful action
            }
            // ViewModel will set error message if failed
        }
    };

    // Handler for viewing certificate
    const handleViewDocument = async () => {
        await adminStatViewModel.viewCertificate(user._id);
    };

    // Handlers for suspend/unsuspend (passed from AdminStatDashboard as props)
    // These now call the unified suspendUserAccount in the ViewModel
    const handleSuspend = async () => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to suspend ${userName}'s account?`)) {
            const response = await adminStatViewModel.suspendUserAccount(user._id, true);
            if (response.success) {
                onClose(); // Close modal after action
            }
        }
    };

    const handleUnsuspend = async () => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to unsuspend ${userName}'s account?`)) {
            const response = await adminStatViewModel.suspendUserAccount(user._id, false);
            if (response.success) {
                onClose(); // Close modal after action
            }
        }
    };

    // Handler for changing role
    const handleChangeRole = async (newRole) => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to change ${userName}'s role to ${newRole}?`)) {
            const response = await adminStatViewModel.updateUserRole(user._id, newRole);
            if (response.success) {
                onClose(); // Close modal after action
            }
        }
    };

    // Handler for deleting account
    const handleDeleteAccount = async () => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to PERMANENTLY DELETE ${userName}'s account? This action cannot be undone.`)) {
            const response = await adminStatViewModel.deleteUserAccount(user._id);
            if (response.success) {
                onClose(); // Close modal after action
            }
        }
    };

    return (
        <div className="user-detail-modal-overlay">
            <div className="user-detail-modal-content">
                <button className="user-detail-modal-close-button" onClick={onClose}>&times;</button>
                <h2>User Details</h2>

                {/* Display loading/error/success messages from ViewModel */}
                {loading && <p className="loading-message">Processing...</p>}
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <div className="user-detail-modal-info">
                    {/* Ensure these properties match what your user objects have */}
                    <p><strong>Name:</strong> {user.firstName ? `${user.firstName} ${user.lastName}` : (user.name || 'N/A')}</p>
                    <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                    {user.accountType && <p><strong>Account Type:</strong> {user.accountType}</p>}
                    {user.dob && <p><strong>Date of Birth:</strong> {user.dob}</p>}
                    <p>
                        <strong>Status:</strong>
                        <span className={`status-dot status-${user.status ? user.status.toLowerCase() : 'unknown'}`}></span>
                        {user.status || 'N/A'}
                    </p>
                    {user.userSince && <p><strong>User Since:</strong> {user.userSince}</p>}
                    {/* Assuming createdAt can be a Firebase Timestamp, convert it */}
                    {user.createdAt && (user.createdAt.toDate ? <p><strong>Created At:</strong> {moment(user.createdAt.toDate()).format('DD/MM/YYYY HH:mm')}</p> : <p><strong>Created At:</strong> {user.createdAt}</p>)}

                    {/* Show certificate details for nutritionists */}
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
                        {/* Suspend/Unsuspend button */}
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

                        {/* Role Change Dropdown/Buttons */}
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

                        {/* Action buttons for Pending Nutritionists (Approval/Rejection) */}
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

                        {/* Delete Account Button */}
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

            {/* Rejection Reason Modal (controlled by ViewModel state) */}
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