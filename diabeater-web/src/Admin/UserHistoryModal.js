// src/Components/Modals/UserHistoryModal.js
import React from 'react';
import { observer } from 'mobx-react-lite';
// Removed: import adminStatViewModel from '../ViewModels/AdminStatViewModel'; // NO LONGER DIRECTLY IMPORT VIEWMODEL
import moment from 'moment';
import './UserHistoryModal.css';

// Props received from parent (e.g., PremiumPage) which gets them from PremiumStatViewModel
const UserHistoryModal = observer(({
    user, // The selected user object
    history, // The array of subscription history records
    loading, // Loading state for history
    error, // Error message for history loading
    onClose // Callback to close the modal
}) => {

    if (!user) {
        // This case should ideally not happen if parent manages state well,
        // but it's a defensive check.
        console.warn("[UserHistoryModal] User prop is null or undefined. Not rendering modal content.");
        return null;
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        // Ensure it's a JS Date object before formatting
        const date = timestamp.toDate && typeof timestamp.toDate === 'function' ? timestamp.toDate() : timestamp;
        return moment(date).format('DD/MM/YYYY hh:mm A');
    };

    const getUserDisplayName = (user) => {
        return user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
    };

    const userName = getUserDisplayName(user); // Now 'user' is guaranteed to be present if we reach here

    return (
        // The modal-overlay should be conditionally rendered by the parent component
        // or controlled by a CSS class applied based on a prop from the parent.
        // For simplicity with this file, it's assumed to be rendered only when needed.
        <div className="modal-overlay" onClick={onClose}> {/* Clicking overlay closes modal */}
            <div className="modal-content user-history-modal" onClick={(e) => e.stopPropagation()}> {/* Stop propagation to prevent closing on content click */}
                <button className="close-button" onClick={onClose}>&times;</button>
                <h2>Subscription History for {userName}</h2>

                {loading && <p className="loading-message">Loading history...</p>}
                {error && <p className="error-message">{error}</p>}

                {!loading && !error && history.length === 0 && (
                    <p>No subscription history found for this user.</p>
                )}

                {!loading && !error && history.length > 0 && (
                    <div className="history-list">
                        {history.map((sub, index) => (
                            <div key={sub._id || index} className="history-item">
                                <h4>Subscription {history.length - index}</h4> {/* Display in descending order by index for simpler numbering */}
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