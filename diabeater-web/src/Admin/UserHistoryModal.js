// src/Components/Modals/UserHistoryModal.js - Debug Version
import React from 'react';
import { observer } from 'mobx-react-lite';
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

    // Debug log to see if component is rendering and what props it receives
    console.log("[UserHistoryModal] Component is rendering with props:", {
        user: user ? { _id: user._id, email: user.email } : null,
        historyLength: history?.length || 0,
        loading,
        error
    });

    if (!user) {
        // This case should ideally not happen if parent manages state well,
        // but it's a defensive check.
        console.warn("[UserHistoryModal] User prop is null or undefined. Not rendering modal content.");
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 0, 0, 0.5)', // Red background to make it obvious
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px'
                }}>
                    <h3>Debug: No User Prop</h3>
                    <p>UserHistoryModal received no user prop</p>
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        );
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

    const getStatusColor = (status) => {
        const statusLower = status ? status.toLowerCase() : '';
        switch(statusLower) {
            case 'active':
                return '#28a745'; // Green
            case 'cancelled':
            case 'canceled':
                return '#ffc107'; // Yellow/Orange
            case 'expired':
                return '#dc3545'; // Red
            case 'pending':
                return '#17a2b8'; // Blue
            default:
                return '#6c757d'; // Gray
        }
    };

    // Temporary simple styling to make sure modal is visible
    const modalOverlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
    };

    const modalContentStyle = {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'auto',
        position: 'relative'
    };

    const closeButtonStyle = {
        position: 'absolute',
        top: '10px',
        right: '15px',
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer'
    };

    console.log("[UserHistoryModal] About to render modal with user:", userName);

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <button style={closeButtonStyle} onClick={onClose}>&times;</button>
                <h2>Complete Subscription History</h2>
                <h3 style={{ margin: '0 0 20px 0', color: '#666' }}>for {userName}</h3>
                
                <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f8ff', border: '1px solid #ccc' }}>
                    <strong>Debug Info:</strong>
                    <p>User ID: {user._id}</p>
                    <p>Loading: {loading ? 'Yes' : 'No'}</p>
                    <p>Error: {error || 'None'}</p>
                    <p>History Records: {history?.length || 0}</p>
                </div>

                {loading && <p style={{ color: 'blue' }}>Loading subscription history...</p>}
                {error && <p style={{ color: 'red' }}>Error: {error}</p>}

                {!loading && !error && history.length === 0 && (
                    <div>
                        <p>No subscription history found for this user.</p>
                        <p style={{ fontSize: '14px', color: '#666' }}>This user may not have had any premium subscriptions yet.</p>
                    </div>
                )}

                {!loading && !error && history.length > 0 && (
                    <div>
                        <div>
                            <p><strong>Total Subscriptions:</strong> {history.length}</p>
                            <p><strong>Account Email:</strong> {user.email}</p>
                        </div>
                        
                        <div>
                            {history.map((sub, index) => (
                                <div key={sub._id || index} style={{ 
                                    border: '1px solid #ddd', 
                                    margin: '10px 0', 
                                    padding: '15px',
                                    borderRadius: '5px'
                                }}>
                                    <h4>Subscription #{history.length - index}</h4>
                                    <div style={{ marginTop: '10px' }}>
                                        <div style={{ 
                                            display: 'inline-block',
                                            backgroundColor: getStatusColor(sub.status),
                                            color: 'white',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                        }}>
                                            {sub.status || 'Unknown'}
                                        </div>
                                    </div>
                                    
                                    <div style={{ marginTop: '10px' }}>
                                        <p><strong>Plan:</strong> {sub.plan || 'N/A'}</p>
                                        <p><strong>Price:</strong> ${sub.price ? sub.price.toFixed(2) : 'N/A'}</p>
                                        <p><strong>Payment Method:</strong> {sub.paymentMethod || 'N/A'}</p>
                                        <p><strong>Period:</strong> {formatDate(sub.startDate)} → {formatDate(sub.endDate)}</p>
                                        <p><strong>Purchased:</strong> {formatDate(sub.createdAt)}</p>
                                        
                                        {sub.cancelReason && (
                                            <p><strong>Cancellation Reason:</strong> {sub.cancelReason}</p>
                                        )}
                                        
                                        <p><strong>Subscription ID:</strong> {sub.subscriptionId || 'N/A'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

export default UserHistoryModal;