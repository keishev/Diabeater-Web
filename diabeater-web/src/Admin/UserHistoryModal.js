// src/Components/Modals/UserHistoryModal.js
import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import adminStatViewModel from '../ViewModels/AdminStatViewModel';
// Removed direct import of SubscriptionService as data will come from ViewModel
import moment from 'moment';
import './UserHistoryModal.css';

const UserHistoryModal = observer(() => {
    // Get all necessary states and actions from the ViewModel
    const {
        selectedUserForHistory: user,
        userSubscriptionHistory: userHistory, // Renamed for clarity in the component
        loadingHistory,
        historyError,
        clearSelectedUserForHistory,
        loadUserSubscriptionHistory // New action to trigger data load
    } = adminStatViewModel;

    // The useEffect now triggers the ViewModel's data loading method
    useEffect(() => {
        if (user) {
            // The ViewModel will handle setting loading, error, and history data
            loadUserSubscriptionHistory(user._id);
        }
    }, [user, loadUserSubscriptionHistory]); // Dependency array: re-run if user or the load function changes

    if (!user) return null; // Only render modal if a user is selected

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : timestamp;
        return moment(date).format('DD/MM/YYYY hh:mm A');
    };

    const getUserDisplayName = (user) => {
        return user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
    };

    const userName = getUserDisplayName(user);

    return (
        <div className="modal-overlay" onClick={clearSelectedUserForHistory}>
            <div className="modal-content user-history-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={clearSelectedUserForHistory}>&times;</button>
                <h2>Subscription History for {userName}</h2>

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