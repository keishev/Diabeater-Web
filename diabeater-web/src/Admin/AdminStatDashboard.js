// src/Admin/AdminStatDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import './AdminStatDashboard.css'; // Ensure your CSS is correctly linked
import UserDetailModal from './UserDetailModal'; // Ensure this component exists
import EditSubscriptionModal from './EditSubscriptionModal'; // Ensure this component exists
import EditPremiumFeaturesModal from './EditPremiumFeaturesModal'; // Ensure this component exists
import AdminInsights from './AdminInsights'; // Ensure this component exists
import Tooltip from './Tooltip'; // Ensure this component exists
import UserHistoryModal from './UserHistoryModal'; // Import the new UserHistoryModal
import adminStatViewModel from '../ViewModels/AdminStatViewModel'; // Import the singleton instance
import { observer } from 'mobx-react-lite'; // Corrected import from 'mobobx-react-lite' to 'mobx-react-lite'
import moment from 'moment';

const AdminStatDashboard = observer(() => {
    // Destructure directly from the singleton ViewModel instance
    // This makes the component reactively observe changes in these properties
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
        userAccounts, // This array now contains ONLY premium users with correct status/endDate
        selectedUserForManagement, // Controlled by ViewModel, used for UserDetailModal
        selectedUserForHistory,    // Controlled by ViewModel, used for UserHistoryModal visibility
        premiumSubscriptionPrice,
        premiumFeatures,
        // Also destructure actions from the ViewModel if they are to be called directly
        setError,
        setSuccess,
        setSelectedUserForManagement,
        clearSelectedUserForManagement,
        setSelectedUserForHistory,
        clearSelectedUserForHistory, // Ensure this is also available from ViewModel
        loadDashboardData, // Direct access to the data loading method
    } = adminStatViewModel;

    const [searchTerm, setSearchTerm] = useState('');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    // isHistoryModalOpen is now controlled by selectedUserForHistory being truthy
    const [isEditPriceModalOpen, setIsEditPriceModalOpen] = useState(false);
    const [isEditFeaturesModal, setIsEditFeaturesModal] = useState(false);

    // Helper function to format any date value (Firestore Timestamp or JS Date)
    // Used for general date display like in tooltips
    const formatDate = (dateValue) => {
        if (!dateValue) return 'N/A';
        const date = dateValue.toDate ? dateValue.toDate() : dateValue; // Convert Firestore Timestamp to Date
        try {
            return moment(date).format('DD/MM/YYYY');
        } catch (e) {
            console.error("Error formatting date:", e);
            return 'Invalid Date';
        }
    };

    // New helper function to calculate and format the renewal date (endDate + 1 day)
    const formatRenewalDate = (endDateValue) => {
        if (!endDateValue) return 'N/A';
        const endDate = endDateValue.toDate ? endDateValue.toDate() : endDateValue; // Convert Firestore Timestamp to Date
        try {
            return moment(endDate).add(1, 'days').format('DD/MM/YYYY');
        } catch (e) {
            console.error("Error formatting renewal date:", e);
            return 'Invalid Date';
        }
    };

    // Use useCallback for memoizing the data loading function
    const handleLoadDashboardData = useCallback(async () => {
        await loadDashboardData(); // Call the ViewModel's method
    }, [loadDashboardData]); // Dependency on loadDashboardData (from ViewModel)

    // Initial data load on component mount
    useEffect(() => {
        handleLoadDashboardData();
    }, [handleLoadDashboardData]); // Depend on memoized handler

    const handleOpenUserModal = (user) => {
        setSelectedUserForManagement(user); // Set in ViewModel
        setIsUserModalOpen(true);
    };

    const handleCloseUserModal = () => {
        setIsUserModalOpen(false);
        clearSelectedUserForManagement(); // Clear in ViewModel
        handleLoadDashboardData(); // Reload data after user modal closes
    };

    // UPDATED: This now triggers the ViewModel to set the user for history,
    // which in turn will cause UserHistoryModal to open.
    const handleOpenHistoryModal = (user) => {
        setSelectedUserForHistory(user); // Set in ViewModel
    };

    // No explicit handleCloseHistoryModal needed here in parent
    // The UserHistoryModal itself should call adminStatViewModel.clearSelectedUserForHistory()
    // when it closes internally.

    const handleOpenEditPriceModal = () => {
        setIsEditPriceModalOpen(true);
    };

    const handleCloseEditPriceModal = () => {
        setIsEditPriceModalOpen(false);
    };

    const handleOpenEditFeaturesModal = () => {
        setIsEditFeaturesModal(true);
    };

    const handleCloseEditFeaturesModal = () => {
        setIsEditFeaturesModal(false);
        handleLoadDashboardData(); // Refresh to ensure UI reflects changes from feature update
    };

    const handleSaveSubscriptionPrice = async (newPrice) => {
        setSuccess(''); // Clear previous messages
        setError('');   // Clear previous messages
        try {
            const response = await adminStatViewModel.updatePremiumSubscriptionPrice(newPrice);
            if (response.success) {
                setIsEditPriceModalOpen(false);
                setSuccess(response.message || "Subscription price updated successfully!");
                // No need to load dashboard data here explicitly if ViewModel updates premiumSubscriptionPrice directly
            } else {
                setError(response.message || "Failed to update subscription price.");
            }
        } catch (e) {
            console.error("[AdminStatDashboard] Error saving subscription price:", e);
            setError(`Failed to update subscription price: ${e.message}`);
        }
    };

    const handleSavePremiumFeatures = async (newFeatures) => {
        setSuccess(''); // Clear previous messages
        setError('');   // Clear previous messages
        try {
            const response = await adminStatViewModel.updatePremiumFeatures(newFeatures);
            if (response.success) {
                setIsEditFeaturesModal(false);
                setSuccess(response.message || "Premium features updated successfully!");
                handleLoadDashboardData(); // Refresh to ensure UI reflects changes
            } else {
                setError(response.message || "Failed to update premium features.");
            }
        } catch (e) {
            console.error("[AdminStatDashboard] Error saving premium features:", e);
            setError(`Failed to update premium features: ${e.message}`);
        }
    };

    // Filter user accounts based on search term.
    // userAccounts already contains premium users from the ViewModel with correct status/endDate.
    const filteredUserAccounts = userAccounts.filter(user => {
        const searchTermLower = searchTerm.toLowerCase();
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();

        return (
            fullName.includes(searchTermLower) ||
            (user.email && user.email.toLowerCase().includes(searchTermLower)) ||
            (user.subscriptionStatus && user.subscriptionStatus.toLowerCase().includes(searchTermLower))
        );
    });

    // --- Chart Data Processing (Keeping as is, no changes requested) ---
    const chartDataArray = dailySignupsData
        ? Object.entries(dailySignupsData)
            .map(([date, count]) => ({
                date,
                value: count,
                month: moment(date).format('MMM')
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
        : [];

    const chartPadding = { top: 20, right: 30, bottom: 30, left: 35 };
    const chartWidth = 240 - chartPadding.left - chartPadding.right;
    const chartHeight = 150 - chartPadding.top - chartPadding.bottom;

    const maxValue = chartDataArray.length > 0 ? Math.max(...chartDataArray.map(d => d.value)) : 10;
    const yScaleFactor = chartHeight / (maxValue > 0 ? maxValue : 1);
    const xScale = chartDataArray.length > 1 ? chartWidth / (chartDataArray.length - 1) : 0;

    const linePoints = chartDataArray.map((d, i) =>
        `${chartPadding.left + i * xScale},${chartPadding.top + (chartHeight - d.value * yScaleFactor)}`
    ).join(' ');

    const areaPoints = [
        `${chartPadding.left},${chartPadding.top + chartHeight}`,
        ...chartDataArray.map((d, i) =>
            `${chartPadding.left + i * xScale},${chartPadding.top + (chartHeight - d.value * yScaleFactor)}`
        ),
        `${chartPadding.left + (chartDataArray.length > 0 ? (chartDataArray.length - 1) * xScale : 0)},${chartPadding.top + chartHeight}`,
        `${chartPadding.left},${chartPadding.top + chartHeight}`
    ].join(' ');

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

            let tooltipX = (pointRect.left - sectionRect.left) + (pointRect.width / 2);
            let tooltipY = (pointRect.top - sectionRect.top) - 10;

            tooltip.style.left = `${tooltipX - (tooltip.offsetWidth / 2)}px`;
            tooltip.style.top = `${tooltipY - tooltip.offsetHeight}px`;

            if (tooltipX - (tooltip.offsetWidth / 2) < 0) {
                tooltip.style.left = '5px';
            }
            if (tooltipX + (tooltip.offsetWidth / 2) > sectionRect.width) {
                tooltip.style.left = `${sectionRect.width - tooltip.offsetWidth - 5}px`;
            }
        };

        const handleMouseLeave = () => {
            tooltip.style.opacity = '0';
        };

        chartPoints.forEach(point => {
            point.addEventListener('mouseenter', handleMouseEnter);
            point.addEventListener('mouseleave', handleMouseLeave);
        });

        return () => {
            chartPoints.forEach(point => {
                point.removeEventListener('mouseenter', handleMouseEnter);
                point.removeEventListener('mouseleave', handleMouseLeave);
            });
        };
    }, [dailySignupsData, chartWidth, chartHeight, chartPadding, xScale, yScaleFactor]);

    // Data for AdminInsights component (static/mock values for some)
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

    if (loading) {
        return (
            <div className="admin-dashboard-main-content-area loading-state">
                <p>Loading dashboard data...</p>
                <div className="spinner"></div>
            </div>
        );
    }

    const renderMessages = () => (
        <>
            {error && (
                <div className="admin-dashboard-message error-message" role="alert">
                    <i className="fas fa-exclamation-circle"></i> {error}
                    <button onClick={() => setError('')} className="close-message-button" aria-label="Close error message">&times;</button>
                </div>
            )}
            {success && (
                <div className="admin-dashboard-message success-message" role="status">
                    <i className="fas fa-check-circle"></i> {success}
                    <button onClick={() => setSuccess('')} className="close-message-button" aria-label="Close success message">&times;</button>
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
                                    <div className="meal-plan-views">{plan.saveCount || 0} Save(s)</div>
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
                                        {value > 0 && (
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

            <section className="premium-features-section">
                <h2 className="section-title">PREMIUM PLAN FEATURES MANAGEMENT</h2>
                <div className="premium-features-card">
                    <div className="feature-list-display">
                        <h3>Current Premium Features:</h3>
                        {premiumFeatures && premiumFeatures.length > 0 ? (
                            <ul>
                                {premiumFeatures.map((feature, index) => (
                                    <li key={index}>{feature}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>No premium features defined yet.</p>
                        )}
                    </div>
                    <button className="manage-features-button" onClick={handleOpenEditFeaturesModal}>
                        MANAGE FEATURES
                    </button>
                </div>
            </section>

            <section className="premium-plan-section">
                <h2 className="section-title">SUBSCRIPTION PRICE MANAGEMENT</h2>
                <div className="premium-plan-card">
                    <span className="plan-name">Premium Plan</span>
                    <span className="plan-price">${premiumSubscriptionPrice.toFixed(2)}<span className="per-month"> /month</span></span>
                    <button className="manage-subscription-button" onClick={handleOpenEditPriceModal}>
                        MANAGE SUBSCRIPTION PRICE
                    </button>
                </div>
            </section>

            <section className="user-accounts-section">
                <h2 className="section-title">PREMIUM USER ACCOUNTS</h2>
                <div className="user-accounts-header">
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search by name, email, or status"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search premium user accounts"
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
                                <th>Status</th> {/* This will now correctly show Subscription Status */}
                                <th>Renewal Date</th> {/* This will now correctly show Subscription End Date */}
                                <th>Details</th>
                                <th>History</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Conditional rendering if filteredUserAccounts is empty */}
                            {filteredUserAccounts.length > 0 ? (
                                filteredUserAccounts.map(user => (
                                    <tr key={user._id}>
                                        <td>
                                            <div className="tooltip-container">
                                                <Tooltip content={
                                                    <>
                                                        <p><strong>Name:</strong> {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : 'N/A'}</p>
                                                        <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                                                        <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
                                                        <p><strong>Address:</strong> {user.address || 'N/A'}</p>
                                                        <p><strong>Role:</strong> {user.role || 'N/A'}</p>
                                                        {/* Displaying the user account status (active/suspended) */}
                                                        <p><strong>Account Status:</strong> {user.status || 'N/A'}</p>
                                                        {/* Displaying the SUBSCRIPTION status */}
                                                        <p><strong>Subscription Status:</strong> {user.subscriptionStatus || 'N/A'}</p>
                                                        {/* Displaying the SUBSCRIPTION end date */}
                                                        <p><strong>Subscription End:</strong> {formatDate(user.subscriptionEndDate)}</p>
                                                    </>
                                                }>
                                                    <div
                                                        className="user-name-clickable"
                                                        onClick={() => handleOpenUserModal(user)}
                                                        role="button"
                                                        tabIndex="0"
                                                        aria-label={`View details for ${user.firstName || ''} ${user.lastName || ''}`}
                                                    >
                                                        <i className="fas fa-user-circle table-user-icon" aria-hidden="true"></i>
                                                        {user.firstName && user.lastName
                                                            ? `${user.firstName} ${user.lastName}`.trim()
                                                            : user.email || 'N/A'
                                                        }
                                                    </div>
                                                </Tooltip>
                                            </div>
                                        </td>
                                        <td>{user.email || 'N/A'}</td>
                                        <td>
                                            {/* Displaying the SUBSCRIPTION status in the table cell */}
                                            <span className={`status-dot status-${user.subscriptionStatus ? user.subscriptionStatus.toLowerCase() : 'unknown'}`}></span>
                                            {user.subscriptionStatus || 'N/A'}
                                        </td>
                                        <td>{formatRenewalDate(user.subscriptionEndDate)}</td> {/* Renewal Date from the enriched user object */}
                                        <td>
                                            <button
                                                className="deets-action-button view-button"
                                                onClick={() => handleOpenUserModal(user)}
                                                aria-label={`View details for ${user.firstName || ''} ${user.lastName || ''}`}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                        <td>
                                            <button
                                                className="deets-action-button history-button"
                                                onClick={() => handleOpenHistoryModal(user)} // Calls ViewModel setter
                                                aria-label={`View history for ${user.firstName || ''} ${user.lastName || ''}`}
                                            >
                                                View History
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="no-data-message">No premium user accounts found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Modals */}
            {isUserModalOpen && selectedUserForManagement && (
                <UserDetailModal
                    isOpen={isUserModalOpen}
                    onClose={handleCloseUserModal}
                    user={selectedUserForManagement} // Pass the selected user directly
                    adminStatViewModel={adminStatViewModel} // Pass the entire ViewModel for actions
                />
            )}

            {isEditPriceModalOpen && (
                <EditSubscriptionModal
                    isOpen={isEditPriceModalOpen}
                    onClose={handleCloseEditPriceModal}
                    currentPrice={premiumSubscriptionPrice}
                    onSave={handleSaveSubscriptionPrice} // Pass the saving handler
                    // You might also pass setError/setSuccess if the modal itself needs to display messages
                    // Or, the modal could call a ViewModel method that handles messages
                    errorMessage={error} // Pass existing error for context
                    successMessage={success} // Pass existing success for context
                />
            )}

            {isEditFeaturesModal && (
                <EditPremiumFeaturesModal
                    isOpen={isEditFeaturesModal}
                    onClose={handleCloseEditFeaturesModal}
                    adminStatViewModel={adminStatViewModel} // Pass the entire ViewModel
                />
            )}

            {/* UserHistoryModal controlled by ViewModel's selectedUserForHistory */}
            {selectedUserForHistory && (
                <UserHistoryModal
                    isOpen={!!selectedUserForHistory} // isOpen is true if selectedUserForHistory is set
                    // The modal itself should call adminStatViewModel.clearSelectedUserForHistory() on close
                    // so you don't need a direct onClose prop here from the parent.
                    // Instead, the modal's internal close button will trigger the ViewModel clear.
                    adminStatViewModel={adminStatViewModel} // Pass the ViewModel to the modal
                />
            )}
        </div>
    );
});

export default AdminStatDashboard;