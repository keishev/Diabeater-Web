import React, { useState, useMemo } from 'react';
import './NotificationList.css';

const NotificationList = ({ notifications, onMarkAsRead }) => {
    const [selectedNotifications, setSelectedNotifications] = useState(new Set());
    const [hiddenNotifications, setHiddenNotifications] = useState(new Set());


    const filteredNotifications = useMemo(() => {
        return notifications
            .filter(notification => {

                const isMealPlanNotification =
                    notification.type === 'MEAL_PLAN_STATUS_UPDATE' || 
                    notification.type === 'mealPlanApproval' || 
                    notification.type === 'mealPlanRejection';
                
                return isMealPlanNotification && !hiddenNotifications.has(notification._id);
            })
            .sort((a, b) => {

                if (!a.timestamp && !b.timestamp) return 0;
                if (!a.timestamp) return 1;
                if (!b.timestamp) return -1;
                
                const aTime = a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
                const bTime = b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
                return bTime - aTime;
            });
    }, [notifications, hiddenNotifications]);

    const unreadNotifications = useMemo(() => {
        return filteredNotifications.filter(notification => !notification.read && !notification.isRead);
    }, [filteredNotifications]);

    const handleSelectNotification = (notificationId) => {
        const newSelected = new Set(selectedNotifications);
        if (newSelected.has(notificationId)) {
            newSelected.delete(notificationId);
        } else {
            newSelected.add(notificationId);
        }
        setSelectedNotifications(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedNotifications.size === filteredNotifications.length) {
            setSelectedNotifications(new Set());
        } else {
            setSelectedNotifications(new Set(filteredNotifications.map(n => n._id)));
        }
    };

    const handleMarkAllAsRead = async () => {
        const unreadIds = unreadNotifications.map(n => n._id);
        for (const id of unreadIds) {
            await onMarkAsRead(id);
        }
    };

    const handleDeleteSelected = () => {
        setHiddenNotifications(prev => {
            const newHidden = new Set(prev);
            selectedNotifications.forEach(id => newHidden.add(id));
            return newHidden;
        });
        setSelectedNotifications(new Set());
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleString();
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return 'N/A';
        }
    };

    const formatNotificationType = (type) => {
        switch (type) {
            case 'MEAL_PLAN_STATUS_UPDATE':
                return 'MEAL PLAN UPDATE';
            case 'mealPlanApproval':
                return 'MEAL PLAN APPROVED';
            case 'mealPlanRejection':
                return 'MEAL PLAN REJECTED';
            default:
                return type.replace(/_/g, ' ');
        }
    };

    if (filteredNotifications.length === 0) {
        return (
            <div className="notification-list-content">
                <h2 className="notification-page-title">NOTIFICATIONS</h2>
                <p className="no-notifications-message">You have no meal plan notifications at the moment.</p>
            </div>
        );
    }

    return (
        <div className="notification-list-content">
            <div className="notifications-header">
                <h2 className="notification-page-title">NOTIFICATIONS</h2>
                <div className="notification-stats">
                    <span className="total-count">Total: {filteredNotifications.length}</span>
                    {unreadNotifications.length > 0 && (
                        <span className="unread-count">Unread: {unreadNotifications.length}</span>
                    )}
                </div>
            </div>

            <div className="notification-controls">
                {/* Commented out selection controls - select all and delete functionality
                <div className="selection-controls">
                    <button
                        className="control-button select-all-button"
                        onClick={handleSelectAll}
                    >
                        {selectedNotifications.size === filteredNotifications.length ? 'Deselect All' : 'Select All'}
                    </button>

                    {selectedNotifications.size > 0 && (
                        <button
                            className="control-button delete-selected-button"
                            onClick={handleDeleteSelected}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : `Delete Selected (${selectedNotifications.size})`}
                        </button>
                    )}
                </div>
                */}

                <div className="action-controls">
                    {unreadNotifications.length > 0 && (
                        <button
                            className="control-button mark-all-read-button"
                            onClick={handleMarkAllAsRead}
                        >
                            Mark All as Read ({unreadNotifications.length})
                        </button>
                    )}
                </div>
            </div>

            <div className="notifications-container">
                {filteredNotifications.map(notification => {
                    const isSelected = selectedNotifications.has(notification._id);
                    const isRead = notification.read || notification.isRead;
                    
                    return (
                        <div
                            key={notification._id}
                            className={`notification-item ${isRead ? 'read' : 'unread'} ${isSelected ? 'selected' : ''}`}
                        >
                            <div className="notification-checkbox">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelectNotification(notification._id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>

                            <div className="notification-content">
                                <div className="notification-header">
                                    <span className={`notification-type type-${notification.type.toLowerCase().replace(/_/g, '-')}`}>
                                        {formatNotificationType(notification.type)}
                                    </span>
                                    <span className="notification-date">
                                        {formatTimestamp(notification.timestamp)}
                                    </span>
                                </div>

                                <p className="notification-message">{notification.message}</p>
                                
                                {notification.rejectionReason && (
                                    <p className="notification-reason">
                                        <strong>Reason:</strong> {notification.rejectionReason}
                                    </p>
                                )}

                                {!isRead && (
                                    <button
                                        className="mark-as-read-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMarkAsRead(notification._id);
                                        }}
                                    >
                                        Mark as Read
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NotificationList;