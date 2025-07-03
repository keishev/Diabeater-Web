import React from 'react';
import './NotificationList.css'; // Create a CSS file for styling

const NotificationList = ({ notifications, onMarkAsRead }) => {
    return (
        <div className="notification-list-content">
            <h2 className="page-title">NOTIFICATIONS</h2>
            {notifications.length === 0 ? (
                <p className="no-notifications-message">You have no notifications at the moment.</p>
            ) : (
                <div className="notifications-container">
                    {notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                        >
                            <div className="notification-header">
                                <span className={`notification-type type-${notification.type.toLowerCase().replace(/_/g, '-')}`}>
                                    {notification.type.replace(/_/g, ' ')} {/* Formats like "MEAL PLAN APPROVED" */}
                                </span>
                                <span className="notification-date">
                                    {/* FIX: Use notification.timestamp and convert it */}
                                    {notification.timestamp ? new Date(notification.timestamp.toDate()).toLocaleString() : 'N/A'}
                                </span>
                            </div>
                            <p className="notification-message">{notification.message}</p>
                            {/* FIX: Use notification.rejectionReason as per Firestore document, not 'reason' */}
                            {notification.rejectionReason && (
                                <p className="notification-reason">Reason: {notification.rejectionReason}</p>
                            )}
                            {!notification.isRead && (
                                <button
                                    className="mark-as-read-button"
                                    onClick={() => onMarkAsRead(notification.id)}
                                >
                                    Mark as Read
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationList;