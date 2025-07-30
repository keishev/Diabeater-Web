// src/Components/Modals/UserHistoryModal.js
import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import adminStatViewModel from '../ViewModels/AdminStatViewModel';
import moment from 'moment';
import './UserHistoryModal.css';

const UserHistoryModal = observer(() => {
    const {
        selectedUserForHistory: user,
        userSubscriptionHistory: userHistory,
        loadingHistory,
        historyError,
        clearSelectedUserForHistory,
        loadUserSubscriptionHistory
    } = adminStatViewModel;

    useEffect(() => {
        if (user) {
            loadUserSubscriptionHistory(user._id);
        }
    }, [user, loadUserSubscriptionHistory]);

    // IMPORTANT: Remove 'if (!user) return null;' here.
    // We always render the overlay, but control its visibility with the 'show' class.

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : timestamp;
        return moment(date).format('DD/MM/YYYY hh:mm A');
    };

    const getUserDisplayName = (user) => {
        return user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
    };

    const userName = user ? getUserDisplayName(user) : ''; // Handle case where user might be null initially

    return (
        // Add the .show class conditionally to the modal-overlay
        <div className={`modal-overlay ${user ? 'show' : ''}`} onClick={clearSelectedUserForHistory}>
            <div className="modal-content user-history-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={clearSelectedUserForHistory}>&times;</button>
                <h2>Subscription History for {userName}</h2>

                {/* Conditional rendering for content *inside* the modal body */}
                {loadingHistory && <p className="loading-message">Loading history...</p>}
                {historyError && <p className="error-message">{historyError}</p>}

                {userHistory.length === 0 && !loadingHistory && !historyError && (
                    <p>No subscription history found for this user.</p>
                )}

                {userHistory.length > 0 && (
                    <div className="history-list">
                        {userHistory.map((sub, index) => (
                            <div key={sub._id || index} className="history-item">
                                <h4>Subscription {userHistory.length - index}</h4>
                                <p><strong>Plan:</strong> {sub.plan || 'N/A'}</p>
                                <p><strong>Status:</strong> <span className={`status-dot status-${sub.status ? sub.status.toLowerCase() : 'unknown'}`}></span> {sub.status || 'N/A'}</p>
                                <p><strong>Price:</strong> ${sub.price ? sub.price.toFixed(2) : 'N/A'}</p>
                                <p><strong>Payment Method:</strong> {sub.paymentMethod || 'N/A'}</p>
                                <p><strong>Start Date:</strong> {formatDate(sub.startDate)}</p>
                                <p><strong>End Date:</strong> {formatDate(sub.endDate)}</p>
                                {sub.cancelReason && (
                                    <p><strong>Cancel Reason:</strong> {sub.cancelReason}</p>
                                )}
                                <p><strong>Purchased On:</strong> {formatDate(sub.createdAt)}</p>
                                <p><strong>Subscription ID:</strong> {sub.subscriptionId || 'N/A'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

export default UserHistoryModal;