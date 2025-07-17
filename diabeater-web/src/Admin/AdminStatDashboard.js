// AdminStatDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import './AdminStatDashboard.css';
import UserDetailModal from './UserDetailModal';
import EditSubscriptionModal from './EditSubscriptionModal';
import AdminInsights from './AdminInsights';
import Tooltip from './Tooltip';
import adminStatViewModel from '../ViewModels/AdminStatViewModel'; // Import the singleton instance
import { observer } from 'mobx-react-lite';
import moment from 'moment';

const AdminStatDashboard = observer(() => {
    // Destructure ONLY observable properties (data), not methods that change state.
    // Methods should be called directly on the 'adminStatViewModel' instance.
    const {
        loading,
        error,
        success,
        totalUsers,
        totalNutritionists,
        totalApprovedMealPlans,
        totalPendingMealPlans,
        totalSubscriptions,
        dailySignupsData,
        weeklyTopMealPlans,
        userAccounts, // The full array of user accounts
        selectedUserForManagement, // The currently selected user for the modal
        premiumSubscriptionPrice, // The premium subscription price
    } = adminStatViewModel; // Access the entire ViewModel instance

    const [searchTerm, setSearchTerm] = useState('');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isEditPriceModalOpen, setIsEditPriceModalOpen] = useState(false);

    /**
     * Handles loading initial dashboard data.
     * This callback is memoized to prevent unnecessary re-creations.
     * It calls the loadDashboardData method directly on the ViewModel instance.
     */
    const handleLoadDashboardData = useCallback(async () => {
        await adminStatViewModel.loadDashboardData();
    }, []); // No dependencies needed for adminStatViewModel.loadDashboardData as it's a singleton

    // Effect to load data on component mount
    useEffect(() => {
        handleLoadDashboardData();
    }, [handleLoadDashboardData]);

    const handleOpenUserModal = (user) => {
        // Call the ViewModel method directly to set the selected user
        adminStatViewModel.setSelectedUserForManagement(user);
        setIsUserModalOpen(true);
    };

    const handleCloseUserModal = () => {
        setIsUserModalOpen(false);
        // Call the ViewModel method directly to clear the selected user
        adminStatViewModel.clearSelectedUserForManagement();
        // Reload data after user modal closes to reflect any potential changes (e.g., role, status)
        handleLoadDashboardData();
    };

    const handleOpenEditPriceModal = () => {
        setIsEditPriceModalOpen(true);
    };

    const handleCloseEditPriceModal = () => {
        setIsEditPriceModalOpen(false);
    };

    /**
     * Handles saving the new subscription price.
     * @param {number} newPrice The new price to set.
     */
    const handleSaveSubscriptionPrice = async (newPrice) => {
        // Clear messages using ViewModel methods
        adminStatViewModel.setSuccess('');
        adminStatViewModel.setError('');

        try {
            const response = await adminStatViewModel.updatePremiumSubscriptionPrice(newPrice);
            if (response.success) {
                // ViewModel already updated the price and set success message
                setIsEditPriceModalOpen(false);
                // handleLoadDashboardData is not strictly necessary here unless other parts
                // of the dashboard need a full refresh from this action. ViewModel handles its state.
            } else {
                // ViewModel already set the error message
            }
        } catch (e) {
            console.error("[AdminStatDashboard] Error saving subscription price:", e);
            adminStatViewModel.setError(`Failed to update subscription price: ${e.message}`);
        }
    };

    /**
     * Handles suspending a user account.
     * @param {object} user The user object to suspend.
     */
    const handleSuspendUser = async (user) => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to suspend ${userName}'s account?`)) {
            try {
                // Call the ViewModel's unified suspend/unsuspend method
                const response = await adminStatViewModel.suspendUserAccount(user._id, true); // true for suspend
                if (response.success) {
                    // ViewModel has already set the success message and updated local state
                    handleLoadDashboardData(); // Refresh data to ensure all counts/tables are consistent
                }
            } catch (err) {
                // ViewModel's error handler will catch and display the error
            }
        }
    };

    /**
     * Handles unsuspending a user account.
     * @param {object} user The user object to unsuspend.
     */
    const handleUnsuspendUser = async (user) => {
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;
        if (window.confirm(`Are you sure you want to unsuspend ${userName}'s account?`)) {
            try {
                // Call the ViewModel's unified suspend/unsuspend method
                const response = await adminStatViewModel.suspendUserAccount(user._id, false); // false for unsuspend
                if (response.success) {
                    // ViewModel has already set the success message and updated local state
                    handleLoadDashboardData(); // Refresh data to ensure all counts/tables are consistent
                }
            } catch (err) {
                // ViewModel's error handler will catch and display the error
            }
        }
    };

    // Filter user accounts based on search term
    const filteredUserAccounts = userAccounts.filter(user => {
        const searchTermLower = searchTerm.toLowerCase();
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();

        return (
            fullName.includes(searchTermLower) ||
            (user.email && user.email.toLowerCase().includes(searchTermLower)) ||
            (user.role && user.role.toLowerCase().includes(searchTermLower)) ||
            (user.status && user.status.toLowerCase().includes(searchTermLower)) // Check user status
        );
    });

    // Process daily signups data for the chart
    const chartDataArray = dailySignupsData
        ? Object.entries(dailySignupsData)
            .map(([date, count]) => ({
                date,
                value: count,
                month: moment(date).format('MMM') // Format for X-axis labels
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date)) // Ensure chronological order
        : [];

    // Chart dimensions and scaling factors
    const chartPadding = { top: 20, right: 30, bottom: 30, left: 35 };
    const chartWidth = 240 - chartPadding.left - chartPadding.right;
    const chartHeight = 150 - chartPadding.top - chartPadding.bottom;

    const maxValue = chartDataArray.length > 0 ? Math.max(...chartDataArray.map(d => d.value)) : 10;
    const yScaleFactor = chartHeight / (maxValue > 0 ? maxValue : 1); // Avoid division by zero
    const xScale = chartDataArray.length > 1 ? chartWidth / (chartDataArray.length - 1) : 0;

    // SVG path points for the line and area
    const linePoints = chartDataArray.map((d, i) =>
        `${chartPadding.left + i * xScale},${chartPadding.top + (chartHeight - d.value * yScaleFactor)}`
    ).join(' ');

    const areaPoints = [
        `${chartPadding.left},${chartPadding.top + chartHeight}`, // Start from bottom-left
        ...chartDataArray.map((d, i) =>
            `${chartPadding.left + i * xScale},${chartPadding.top + (chartHeight - d.value * yScaleFactor)}`
        ),
        `${chartPadding.left + (chartDataArray.length > 0 ? (chartDataArray.length - 1) * xScale : 0)},${chartPadding.top + chartHeight}`, // End at bottom-right
        `${chartPadding.left},${chartPadding.top + chartHeight}` // Close path back to bottom-left
    ].join(' ');

    // Effect for chart tooltip dynamic positioning and content
    useEffect(() => {
        const tooltip = document.getElementById('chart-tooltip');
        const svgElement = document.querySelector('.daily-signups-chart-section svg');

        if (!svgElement || !tooltip) {
            return;
        }

        const chartPoints = svgElement.querySelectorAll('.chart-point');

        const handleMouseEnter = (event) => {
            const point = event.target;
            const date = point.getAttribute('data-date');
            const value = point.getAttribute('data-value');

            tooltip.innerHTML = `Date: ${moment(date).format('MMM Do, YYYY')}<br/>Signups: ${value}`;
            tooltip.style.opacity = '1';

            const pointRect = point.getBoundingClientRect();
            const sectionRect = document.querySelector('.daily-signups-chart-section').getBoundingClientRect();

            // Calculate tooltip position relative to the chart section
            let tooltipX = (pointRect.left - sectionRect.left) + (pointRect.width / 2);
            let tooltipY = (pointRect.top - sectionRect.top) - 10; // 10px buffer above point

            // Adjust for tooltip width to center it
            tooltip.style.left = `${tooltipX - (tooltip.offsetWidth / 2)}px`;
            // Position above the point, considering tooltip's own height
            tooltip.style.top = `${tooltipY - tooltip.offsetHeight}px`;

            // Prevent tooltip from going off-screen left/right
            if (tooltipX - (tooltip.offsetWidth / 2) < 0) {
                tooltip.style.left = '5px'; // Small padding from left edge
            }
            if (tooltipX + (tooltip.offsetWidth / 2) > sectionRect.width) {
                tooltip.style.left = `${sectionRect.width - tooltip.offsetWidth - 5}px`; // Small padding from right edge
            }
        };

        const handleMouseLeave = () => {
            tooltip.style.opacity = '0';
        };

        chartPoints.forEach(point => {
            point.addEventListener('mouseenter', handleMouseEnter);
            point.addEventListener('mouseleave', handleMouseLeave);
        });

        // Cleanup event listeners on component unmount or dependencies change
        return () => {
            chartPoints.forEach(point => {
                point.removeEventListener('mouseenter', handleMouseEnter);
                point.removeEventListener('mouseleave', handleMouseLeave);
            });
        };
    }, [dailySignupsData, chartWidth, chartHeight, chartPadding, xScale, yScaleFactor]); // Dependencies for useEffect

    // Data for AdminInsights component
    const insightsData = [
        { value: `${((totalSubscriptions / (totalUsers || 1)) * 100 || 0).toFixed(0)}%`, label: 'Subscription Rate', change: 0, type: 'neutral', period: 'overall' },
        { value: '$4.5K', label: 'Monthly Revenue', change: 12, type: 'increase', period: 'last month' }, // Static mock data
        {
            value: dailySignupsData ? Object.values(dailySignupsData).reduce((sum, val) => sum + val, 0) : '0',
            label: 'New Signups (7 Days)',
            change: 0, type: 'neutral', period: 'last week'
        },
        { value: '15', label: 'Cancelled Subscriptions', change: 2, type: 'decrease', period: 'last month' }, // Static mock data
        { value: `${((totalApprovedMealPlans / ((totalApprovedMealPlans + totalPendingMealPlans) || 1)) * 100 || 0).toFixed(0)}%`, label: 'Meal Plan Approval Rate', change: 0, type: 'neutral', period: 'overall' },
        { value: totalApprovedMealPlans + totalPendingMealPlans, label: 'Total Meal Plans', change: 0, type: 'neutral', period: 'all time' },
    ];

    // Display loading state
    if (loading) {
        return (
            <div className="admin-dashboard-main-content-area loading-state">
                <p>Loading dashboard data...</p>
                <div className="spinner"></div> {/* Basic spinner animation assumed via CSS */}
            </div>
        );
    }

    // Helper function to render error/success messages
    const renderMessages = () => (
        <>
            {error && (
                <div className="admin-dashboard-message error-message" role="alert">
                    <i className="fas fa-exclamation-circle"></i> {error}
                    {/* Call ViewModel's setError method directly */}
                    <button onClick={() => adminStatViewModel.setError('')} className="close-message-button" aria-label="Close error message">&times;</button>
                </div>
            )}
            {success && (
                <div className="admin-dashboard-message success-message" role="status">
                    <i className="fas fa-check-circle"></i> {success}
                    {/* Call ViewModel's setSuccess method directly */}
                    <button onClick={() => adminStatViewModel.setSuccess('')} className="close-message-button" aria-label="Close success message">&times;</button>
                </div>
            )}
        </>
    );

    return (
        <div className="admin-dashboard-main-content-area">
            {renderMessages()}

            <div className="admin-header">
                <h1 className="admin-page-title">STATISTICS</h1>
                <span className="data-as-at">Data as at {moment().format('Do MMM YYYY HH:mm')}</span>
            </div>

            <div className="stats-cards-container">
                <div className="stat-card">
                    <div className="stat-value">{totalUsers}</div>
                    <div className="stat-label">Total Users</div>
                    <div className="stat-change neutral">
                        <i className="fas fa-info-circle"></i> No change data
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalNutritionists}</div>
                    <div className="stat-label">Total Nutritionists</div>
                    <div className="stat-change neutral">
                        <i className="fas fa-info-circle"></i> No change data
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalSubscriptions}</div>
                    <div className="stat-label">Active Subscriptions</div>
                    <div className="stat-change neutral">
                        <i className="fas fa-info-circle"></i> No change data
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalApprovedMealPlans}</div>
                    <div className="stat-label">Approved Meal Plans</div>
                    <div className="stat-change neutral">
                        <i className="fas fa-info-circle"></i> No change data
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalPendingMealPlans}</div>
                    <div className="stat-label">Pending Meal Plans</div>
                    <div className="stat-change neutral">
                        <i className="fas fa-info-circle"></i> No change data
                    </div>
                </div>
            </div>

            <div className="dashboard-sections-row">
                <section className="weekly-meal-plans-section">
                    <h2 className="section-title">Weekly Top Meal Plans</h2>
                    <div className="meal-plans-list">
                        {weeklyTopMealPlans.length > 0 ? (
                            weeklyTopMealPlans.map((plan, index) => (
                                <div key={plan._id || `meal-plan-${index}`} className="meal-plan-item">
                                    <span className="meal-plan-rank">#{index + 1}</span>
                                    <img
                                        src={plan.imageUrl || `/assetscopy/${plan.imageFileName || 'default-meal-plan.jpg'}`}
                                        alt={plan.name || 'Meal Plan'}
                                        className="admin-meal-plan-image"
                                    />
                                    <div className="meal-plan-info">
                                        <div className="meal-plan-name">{plan.name || 'Untitled Meal Plan'}</div>
                                        <div className="meal-plan-author">by {plan.authorName || 'N/A'}</div>
                                    </div>
                                    <div className="meal-plan-views">{plan.viewsCount || 0} Viewed</div>
                                </div>
                            ))
                        ) : (
                            <p className="no-data-message">No top meal plans found for the week.</p>
                        )}
                    </div>
                </section>

                <section className="daily-signups-chart-section">
                    <h2 className="section-title">Daily Signups</h2>
                    <div className="chart-placeholder">
                        <svg width="100%" height="150" viewBox="0 0 240 150" aria-label="Daily Signups Chart">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#ff9800" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#ff9800" stopOpacity="0.05" />
                                </linearGradient>
                            </defs>

                            {/* Y-axis grid lines and labels */}
                            {Array.from({ length: 5 }).map((_, i) => {
                                const value = Math.round(i * (maxValue / 4));
                                const y = chartPadding.top + (chartHeight - value * yScaleFactor);
                                return (
                                    <g key={`y-axis-group-${i}`}>
                                        <line
                                            x1={chartPadding.left} y1={y}
                                            x2={chartPadding.left + chartWidth} y2={y}
                                            stroke="#eee"
                                            strokeDasharray="2 2"
                                        />
                                        {value > 0 && ( // Only show label if value is greater than 0
                                            <text
                                                x={chartPadding.left - 5}
                                                y={y + 4}
                                                className="chart-y-axis-label"
                                                textAnchor="end"
                                            >
                                                {value}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                            {/* X-axis grid lines */}
                            {chartDataArray.map((d, i) => (
                                <line
                                    key={`x-line-${d.date}`}
                                    x1={chartPadding.left + i * xScale} y1={chartPadding.top}
                                    x2={chartPadding.left + i * xScale} y2={chartPadding.top + chartHeight}
                                    stroke="#eee"
                                    strokeDasharray="2 2"
                                />
                            ))}

                            {/* Chart Area */}
                            {chartDataArray.length > 0 && (
                                <path d={`M ${areaPoints}`} className="chart-area" fill="url(#chartGradient)" />
                            )}

                            {/* Chart Line */}
                            {chartDataArray.length > 0 && (
                                <polyline
                                    fill="none"
                                    stroke="#ff9800"
                                    strokeWidth="2"
                                    points={linePoints}
                                    className="chart-line"
                                />
                            )}

                            {/* Chart Points (for tooltips) */}
                            {chartDataArray.map((d, i) => (
                                <circle
                                    key={`point-${d.date}`}
                                    cx={chartPadding.left + i * xScale}
                                    cy={chartPadding.top + (chartHeight - d.value * yScaleFactor)}
                                    r="4"
                                    className="chart-point"
                                    data-date={d.date}
                                    data-value={d.value}
                                />
                            ))}

                            {/* X-axis labels (months) */}
                            {chartDataArray.map((d, i) => (
                                <text
                                    key={`x-label-${d.date}`}
                                    x={chartPadding.left + i * xScale}
                                    y={chartPadding.top + chartHeight + 15}
                                    className="chart-x-axis-label"
                                    textAnchor="middle"
                                >
                                    {d.month}
                                </text>
                            ))}
                        </svg>
                        <div id="chart-tooltip" className="chart-tooltip" aria-live="polite"></div>
                    </div>
                    <div className="chart-insights">
                        <div className="chart-insight-item">
                            <span className="chart-insight-label">Avg. Daily Signups:</span>
                            <span className="chart-insight-value">
                                {chartDataArray.length > 0
                                    ? (chartDataArray.reduce((sum, d) => sum + d.value, 0) / chartDataArray.length).toFixed(0)
                                    : 'N/A'
                                }
                            </span>
                        </div>
                        <div className="chart-insight-item">
                            <span className="chart-insight-label">Highest Signups:</span>
                            <span className="chart-insight-value">
                                {chartDataArray.length > 0
                                    ? `${maxValue} (${moment(chartDataArray.find(d => d.value === maxValue)?.date).format('MMM Do') || 'N/A'})`
                                    : 'N/A'
                                }
                            </span>
                        </div>
                        <div className="chart-insight-item">
                            <span className="chart-insight-label">Growth (Last Day):</span>
                            <span className={`chart-insight-value ${chartDataArray.length > 1 && chartDataArray[chartDataArray.length - 1].value > chartDataArray[chartDataArray.length - 2].value ? 'increase' : 'decrease'}`}>
                                {chartDataArray.length > 1
                                    ? `${(chartDataArray[chartDataArray.length - 1].value - chartDataArray[chartDataArray.length - 2].value)}`
                                    : 'N/A'
                                }
                            </span>
                        </div>
                    </div>
                </section>
            </div>

            <AdminInsights data={insightsData} />

            <section className="premium-plan-section">
                <h2 className="section-title">SUBSCRIPTION PRICE MANAGEMENT</h2>
                <div className="premium-plan-card">
                    <span className="plan-name">Premium Plan</span>
                    {/* Use premiumSubscriptionPrice from ViewModel */}
                    <span className="plan-price">${premiumSubscriptionPrice.toFixed(2)}<span className="per-month"> /month</span></span>
                    <button className="manage-subscription-button" onClick={handleOpenEditPriceModal}>
                        MANAGE SUBSCRIPTION PRICE
                    </button>
                </div>
            </section>

            <section className="user-accounts-section">
                <h2 className="section-title">USER ACCOUNTS</h2>
                <div className="user-accounts-header">
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search by name, email, role, or status"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search user accounts"
                        />
                        <i className="fas fa-search" aria-hidden="true"></i>
                    </div>
                </div>
                <div className="stat-table-container">
                    <table className="user-accounts-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Sign-up Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUserAccounts.length > 0 ? (
                                filteredUserAccounts.map(user => (
                                    <tr key={user._id}> {/* Assuming _id is the unique key from your backend */}
                                        <td>
                                            <div className="tooltip-container">
                                                <Tooltip content={
                                                    <>
                                                        <p><strong>Name:</strong> {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : 'N/A'}</p>
                                                        <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                                                        <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
                                                        <p><strong>Address:</strong> {user.address || 'N/A'}</p>
                                                        <p><strong>Role:</strong> {user.role || 'N/A'}</p>
                                                        <p><strong>Status:</strong> {user.status || 'N/A'}</p>
                                                    </>
                                                }>
                                                    <i className="fas fa-user-circle table-user-icon" aria-hidden="true"></i>
                                                    {user.firstName && user.lastName
                                                        ? `${user.firstName} ${user.lastName}`.trim()
                                                        : user.email || 'N/A' /* Fallback to email if name parts are missing */
                                                    }
                                                </Tooltip>
                                            </div>
                                        </td>
                                        <td>{user.email || 'N/A'}</td>
                                        <td>{user.role || 'N/A'}</td>
                                        <td>
                                            {/* Assuming 'status' field exists and is 'active' or 'suspended' */}
                                            <span className={`status-dot status-${user.status ? user.status.toLowerCase() : 'unknown'}`}></span>
                                            {user.status || 'N/A'}
                                        </td>
                                        <td>{user.createdAt && user.createdAt.toDate ? moment(user.createdAt.toDate()).format('DD/MM/YYYY') : 'N/A'}</td>
                                        <td className="user-actions">
                                            <button
                                                className="deets-action-button view-button"
                                                onClick={() => handleOpenUserModal(user)}
                                                aria-label={`View details for ${user.firstName || ''} ${user.lastName || ''}`}
                                            >
                                                VIEW
                                            </button>
                                            {/* Logic for Suspend/Unsuspend button based on user.status */}
                                            {user.status && user.status.toLowerCase() === 'active' ? (
                                                <button
                                                    className="action-button suspend-button"
                                                    onClick={() => handleSuspendUser(user)}
                                                    aria-label={`Suspend account for ${user.firstName || ''} ${user.lastName || ''}`}
                                                >
                                                    SUSPEND
                                                </button>
                                            ) : (user.status && user.status.toLowerCase() === 'suspended') ? (
                                                <button
                                                    className="action-button unsuspend-button"
                                                    onClick={() => handleUnsuspendUser(user)}
                                                    aria-label={`Unsuspend account for ${user.firstName || ''} ${user.lastName || ''}`}
                                                >
                                                    UNSUSPEND
                                                </button>
                                            ) : (
                                                // Fallback for unknown/other statuses
                                                <button
                                                    className="action-button default-action-button"
                                                    onClick={() => alert(`Cannot determine action for user status: ${user.status || 'N/A'}`)}
                                                    aria-label={`Action for user ${user.firstName || ''} ${user.lastName || ''}`}
                                                >
                                                    MANAGE
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="no-data-message">No user accounts found matching your search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {isUserModalOpen && (
                <UserDetailModal
                    user={selectedUserForManagement}
                    onClose={handleCloseUserModal}
                    // Pass ViewModel methods directly using arrow functions to bind context
                    updateUserRole={(uid, role) => adminStatViewModel.updateUserRole(uid, role)}
                    updateNutritionistStatus={(uid, status) => adminStatViewModel.updateNutritionistStatus(uid, status)}
                    deleteUserAccount={(uid) => adminStatViewModel.deleteUserAccount(uid)}
                    // Use the unified suspendUserAccount action
                    suspendUserAccount={(uid, suspend) => adminStatViewModel.suspendUserAccount(uid, suspend)}
                    onUserActionSuccess={(msg) => {
                        adminStatViewModel.setSuccess(msg); // Use ViewModel's setSuccess
                        handleLoadDashboardData(); // Reload data after action
                    }}
                    onUserActionError={(msg) => adminStatViewModel.setError(`User action failed: ${msg}`)} // Use ViewModel's setError
                />
            )}

            {isEditPriceModalOpen && (
                <EditSubscriptionModal
                    isOpen={isEditPriceModalOpen}
                    onClose={handleCloseEditPriceModal}
                    initialPrice={premiumSubscriptionPrice} // Get initial price from ViewModel
                    onSave={handleSaveSubscriptionPrice}
                />
            )}
        </div>
    );
});

export default AdminStatDashboard;