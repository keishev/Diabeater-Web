// src/Components/Modals/UserHistoryModal.js
import React from 'react';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import './UserHistoryModal.css';

const UserHistoryModal = observer(({
    user, // The selected user object
    history, // The array of subscription history records
    loading, // Loading state for history
    error, // Error message for history loading
    onClose // Callback to close the modal
}) => {

    // Debug log to see if component is rendering and what props it receives
    console.log("[UserHistoryModal] Component is rendering with props:", {
        user: user ? { _id: user._id, email: user.email } : null,
        historyLength: history?.length || 0,
        loading,
        error
    });

    if (!user) {
        console.warn("[UserHistoryModal] User prop is null or undefined. Not rendering modal content.");
        return (
            <div className="user-history-modal-overlay" onClick={onClose}>
                <div className="user-history-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="user-history-modal-header">
                        <button className="user-history-modal-close" onClick={onClose}>&times;</button>
                        <h2 className="user-history-modal-title">Debug: No User Prop</h2>
                    </div>
                    <div className="user-history-modal-body">
                        <div className="user-history-error">
                            UserHistoryModal received no user prop
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate && typeof timestamp.toDate === 'function' ? timestamp.toDate() : timestamp;
        return moment(date).format('DD/MM/YYYY hh:mm A');
    };

    const formatDateShort = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate && typeof timestamp.toDate === 'function' ? timestamp.toDate() : timestamp;
        return moment(date).format('DD/MM/YYYY');
    };

    const getUserDisplayName = (user) => {
        return user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
    };

    const userName = getUserDisplayName(user);

    const getStatusClass = (status) => {
        const statusLower = status ? status.toLowerCase() : '';
        switch(statusLower) {
            case 'active':
                return 'user-history-status-active';
            case 'cancelled':
            case 'canceled':
                return 'user-history-status-cancelled';
            case 'expired':
                return 'user-history-status-expired';
            case 'pending':
                return 'user-history-status-pending';
            case 'failed':
                return 'user-history-status-failed';
            default:
                return 'user-history-status-unknown';
        }
    };

    console.log("[UserHistoryModal] About to render modal with user:", userName);

    return (
        <div className="user-history-modal-overlay" onClick={onClose}>
            <div className="user-history-modal-content" onClick={(e) => e.stopPropagation()}>
                
                {/* Modal Header */}
                <div className="user-history-modal-header">
                    <button className="user-history-modal-close" onClick={onClose}>&times;</button>
                    <h2 className="user-history-modal-title">Subscription History</h2>
                    <p className="user-history-modal-subtitle">for {userName}</p>
                </div>
                
                {/* Modal Body */}
                <div className="user-history-modal-body">

                    {/* Loading State */}
                    {loading && (
                        <div className="user-history-loading">
                            <div className="user-history-loading-spinner"></div>
                            Loading subscription history...
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="user-history-error">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {/* No History State */}
                    {!loading && !error && history.length === 0 && (
                        <div className="user-history-no-data">
                            <p>No subscription history found</p>
                            <p>This user may not have had any premium subscriptions yet.</p>
                        </div>
                    )}

                    {/* History Data */}
                    {!loading && !error && history.length > 0 && (
                        <div className="user-history-fade-in">
                            
                            {/* Summary Section */}
                            <div className="user-history-summary">
                                <div className="user-history-summary-item">
                                    <strong>Total Subscriptions</strong>
                                    <span>{history.length}</span>
                                </div>
                                <div className="user-history-summary-item">
                                    <strong>Account Email</strong>
                                    <span>{user.email}</span>
                                </div>
                                <div className="user-history-summary-item">
                                    <strong>Total Spent</strong>
                                    <span>${history.reduce((sum, sub) => sum + (sub.price || 0), 0).toFixed(2)}</span>
                                </div>
                            </div>
                            
                            {/* History List */}
                            <div className="user-history-list">
                                {history.map((sub, index) => (
                                    <div key={sub._id || index} className="user-history-item">
                                        
                                        {/* Item Header */}
                                        <div className="user-history-item-header">
                                            <div className="user-history-item-number">
                                                Subscription #{history.length - index}
                                            </div>
                                            <div className="user-history-item-price">
                                                ${sub.price ? sub.price.toFixed(2) : '0.00'}
                                            </div>
                                        </div>

                                        {/* Plan Name */}
                                        <div className="user-history-plan-name">
                                            {sub.plan || 'Premium Plan'}
                                        </div>

                                        {/* Date Range */}
                                        <div className="user-history-date-range">
                                            {formatDateShort(sub.startDate)} → {formatDateShort(sub.endDate)}
                                        </div>

                                        {/* Status */}
                                        <div className="user-history-item-status">
                                            <div className={`user-history-status-dot ${getStatusClass(sub.status)}`}></div>
                                            <div className={`user-history-status-text ${getStatusClass(sub.status)}`}>
                                                {sub.status || 'Unknown'}
                                            </div>
                                        </div>
                                        
                                        {/* Details Grid */}
                                        <div className="user-history-item-details">
                                            
                                            <div className="user-history-detail-row">
                                                <span className="user-history-detail-label">Payment Method</span>
                                                <span className="user-history-detail-value">{sub.paymentMethod || 'N/A'}</span>
                                            </div>

                                            <div className="user-history-detail-row">
                                                <span className="user-history-detail-label">Purchase Date</span>
                                                <span className="user-history-detail-value">{formatDate(sub.createdAt)}</span>
                                            </div>

                                            <div className="user-history-detail-row">
                                                <span className="user-history-detail-label">Start Date</span>
                                                <span className="user-history-detail-value">{formatDate(sub.startDate)}</span>
                                            </div>

                                            <div className="user-history-detail-row">
                                                <span className="user-history-detail-label">End Date</span>
                                                <span className="user-history-detail-value">{formatDate(sub.endDate)}</span>
                                            </div>

                                            {sub.cancelReason && (
                                                <div className="user-history-detail-row">
                                                    <span className="user-history-detail-label">Cancel Reason</span>
                                                    <span className="user-history-detail-value">{sub.cancelReason}</span>
                                                </div>
                                            )}

                                            <div className="user-history-detail-row">
                                                <span className="user-history-detail-label">Subscription ID</span>
                                                <span className="user-history-detail-value">{sub.subscriptionId || 'N/A'}</span>
                                            </div>
                                            
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default UserHistoryModal;