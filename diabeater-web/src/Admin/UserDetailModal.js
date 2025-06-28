// src/Admin/UserDetailModal.js
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import adminDashboardViewModel from '../ViewModels/AdminDashboardViewModel'; // Import the ViewModel
import './UserDetailModal.css'; // Make sure you have this CSS file

const UserDetailModal = observer(({ onClose }) => {
    // We get the selected user directly from the ViewModel
    const user = adminDashboardViewModel.selectedUser;
    const isPendingNutritionist = user?.status === 'pending';
    const isApprovedNutritionist = user?.accountType === 'Nutritionist' && user.status === 'Active'; // For already approved ones

    if (!user) return null; // Should not happen if selectedUser is always set before showing modal

    const handleApprove = async () => {
        if (window.confirm(`Are you sure you want to APPROVE ${user.name}'s account?`)) {
            await adminDashboardViewModel.approveNutritionist(user.id);
        }
    };

    const handleReject = () => {
        adminDashboardViewModel.setShowRejectionReasonModal(true);
    };

    const handleConfirmReject = async () => {
        if (window.confirm(`Are you sure you want to REJECT ${user.name}'s account? This action cannot be undone.`)) {
            await adminDashboardViewModel.rejectNutritionist(user.id);
        }
    };

    const handleViewDocument = async () => {
        await adminDashboardViewModel.viewCertificate(user.id);
    };

    return (
        <div className="user-detail-modal-overlay">
            <div className="user-detail-modal-content">
                <button className="user-detail-modal-close-button" onClick={onClose}>&times;</button>
                <h2>User Details</h2>
                <div className="user-detail-modal-info">
                    <p><strong>Name:</strong> {user.firstName} {user.lastName || user.name}</p> {/* Handle both cases */}
                    <p><strong>Email:</strong> {user.email}</p>
                    {user.accountType && <p><strong>Account Type:</strong> {user.accountType}</p>}
                    {user.dob && <p><strong>Date of Birth:</strong> {user.dob}</p>}
                    <p><strong>Status:</strong> <span className={`status-dot ${user.status === 'Active' ? 'status-active' : 'status-inactive'}`}></span>{user.status}</p>
                    {user.userSince && <p><strong>User Since:</strong> {user.userSince}</p>}
                    {user.createdAt && <p><strong>Created At:</strong> {user.createdAt.toLocaleString()}</p>}

                    {/* Show certificate details for nutritionists */}
                    {(isPendingNutritionist || isApprovedNutritionist) && user.certificateUrl && (
                        <div>
                            <p><strong>Certificate:</strong>
                                <button className="doc-action-button view-button" onClick={handleViewDocument} disabled={adminDashboardViewModel.isLoading}>
                                    {adminDashboardViewModel.isLoading ? 'Loading...' : 'VIEW DOCUMENT'}
                                </button>
                            </p>
                        </div>
                    )}

                    {adminDashboardViewModel.error && <p className="error-message">{adminDashboardViewModel.error}</p>}

                    {/* Action buttons for Pending Nutritionists */}
                    {isPendingNutritionist && (
                        <div className="user-detail-modal-actions">
                            <button
                                className="approve-button"
                                onClick={handleApprove}
                                disabled={adminDashboardViewModel.isLoading}
                            >
                                {adminDashboardViewModel.isLoading ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                                className="reject-button"
                                onClick={handleReject}
                                disabled={adminDashboardViewModel.isLoading}
                            >
                                Reject
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Rejection Reason Modal */}
            {adminDashboardViewModel.showRejectionReasonModal && (
                <div className="user-detail-modal-overlay rejection-modal-overlay">
                    <div className="user-detail-modal-content rejection-modal-content">
                        <h3>Reason for Rejection</h3>
                        <textarea
                            placeholder="Enter rejection reason (optional)"
                            value={adminDashboardViewModel.rejectionReason}
                            onChange={(e) => adminDashboardViewModel.setRejectionReason(e.target.value)}
                            rows="4"
                        ></textarea>
                        <div className="rejection-modal-actions">
                            <button onClick={() => adminDashboardViewModel.setShowRejectionReasonModal(false)}>Cancel</button>
                            <button onClick={handleConfirmReject} disabled={adminDashboardViewModel.isLoading}>
                                {adminDashboardViewModel.isLoading ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default UserDetailModal;