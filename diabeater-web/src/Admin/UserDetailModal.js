// src/Admin/UserDetailModal.js
import React from 'react';
import './UserDetailModal.css'; // We'll create this CSS next

const UserDetailModal = ({ user, onClose }) => {
    if (!user) {
        return null; // Don't render if no user is provided
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Prevent clicks inside modal from closing it */}
                <button className="modal-close-button" onClick={onClose}>&times;</button>
                <div className="modal-header">
                    <div className="modal-user-icon-container">
                        <i className="fas fa-user-circle modal-user-icon"></i>
                    </div>
                    <h2>{user.name}</h2>
                </div>
                <div className="modal-body">
                    <div className="info-item">
                        <span className="label">UID</span>
                        <span className="value">{user.uid || 'N/A'}</span> {/* Add UID to mock data if needed */}
                    </div>
                    <div className="info-item">
                        <span className="label">Email</span>
                        <span className="value">{user.email}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Account Type</span>
                        <span className="value">{user.accountType}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Status</span>
                        <span className={`value status-${user.status === 'Active' ? 'active' : 'inactive'}`}>
                            <span className="status-dot"></span>{user.status}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="label">Member Since</span>
                        <span className="value">{user.userSince}</span>
                    </div>
                    {/* Add more user details here as needed */}
                </div>
            </div>
        </div>
    );
};

export default UserDetailModal;