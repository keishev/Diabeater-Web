// src/Admin/AdminStatDashboard.js
import React, { useState, useEffect } from 'react';
import './AdminStatDashboard.css';
import UserDetailModal from './UserDetailModal';
import EditSubscriptionModal from './EditSubscriptionModal';
import './UserDetailModal.css';
import './EditSubscriptionModal.css';
import AdminInsights from './AdminInsights';
import Tooltip from './Tooltip';
import adminStatViewModel from '../ViewModels/AdminStatViewModel'; // Correct path to ViewModel
import { observer } from 'mobx-react-lite';
import moment from 'moment'; // For formatting dates and 'data as at' time

const AdminStatDashboard = observer(() => {
    // Destructure state and actions from the MobX ViewModel
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
        userAccounts, // This will be used for the main user accounts table
        allSubscriptions, // New observable from ViewModel for subscription table
        // We do NOT destructure loadDashboardData here if we're calling it via the instance below.
        // If you were to destructure it, you'd need to ensure its 'this' context is bound,
        // but calling directly on the singleton instance is simpler for this use case.
        updateUserRole,
        deleteUserAccount,
        updateNutritionistStatus,
        setSelectedUserForManagement,
        selectedUserForManagement,
        clearSelectedUserForManagement,
        // Add other ViewModel properties/methods as needed
    } = adminStatViewModel; // <--- We get the ViewModel instance here

    // Local component state for search, modals, and current subscription price (if not in ViewModel)
    const [searchTerm, setSearchTerm] = useState('');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isEditPriceModalOpen, setIsEditPriceModalOpen] = useState(false);
    // Assuming currentSubscriptionPrice is managed locally or fetched from a separate 'settings' collection
    const [currentSubscriptionPrice, setCurrentSubscriptionPrice] = useState(10.00);


    // Fetch data from ViewModel on component mount
    useEffect(() => {
        // --- FIX APPLIED HERE ---
        // Call the method directly on the singleton instance to preserve 'this' context.
        adminStatViewModel.loadDashboardData();
        // The dependency array is now empty because adminStatViewModel is a singleton
        // and its methods' references do not change across renders.
    }, []); // <--- IMPORTANT CHANGE: Dependency array is now empty

    // Handler for opening user detail modal
    const handleOpenUserModal = (user) => {
        // Set the user in the ViewModel, which will also be used by the modal
        setSelectedUserForManagement(user);
        setIsUserModalOpen(true);
    };

    // Handler for closing user detail modal
    const handleCloseUserModal = () => {
        setIsUserModalOpen(false);
        clearSelectedUserForManagement(); // Clear selected user in ViewModel
    };

    // Handlers for subscription price modal
    const handleOpenEditPriceModal = () => {
        setIsEditPriceModalOpen(true);
    };

    const handleCloseEditPriceModal = () => {
        setIsEditPriceModalOpen(false);
    };

    const handleSaveSubscriptionPrice = (newPrice) => {
        // In a real application, you'd call a service method to update this in Firebase
        setCurrentSubscriptionPrice(newPrice);
        console.log(`New subscription price saved: $${newPrice}`);
        // Potentially set success message in ViewModel: adminStatViewModel.setSuccess('Subscription price updated!');
    };

    // Filter subscriptions directly from the ViewModel's allSubscriptions array
    const filteredSubscriptions = allSubscriptions.filter(sub =>
        (sub.name && sub.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sub.email && sub.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sub.status && sub.status.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // --- Chart calculations using real data ---
    const chartDataArray = Object.entries(dailySignupsData).map(([date, count]) => ({
        date,
        value: count,
        month: moment(date).format('MMM') // Use moment to get month abbreviation
    })).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date for chart

    const chartPadding = { top: 20, right: 30, bottom: 30, left: 35 };
    const chartWidth = 240 - chartPadding.left - chartPadding.right;
    const chartHeight = 150 - chartPadding.top - chartPadding.bottom;

    const maxValue = chartDataArray.length > 0 ? Math.max(...chartDataArray.map(d => d.value)) : 100; // Default to 100 if no data
    const xScale = chartDataArray.length > 1 ? chartWidth / (chartDataArray.length - 1) : 0;
    const yScale = chartHeight / maxValue;

    const linePoints = chartDataArray.map((d, i) =>
        `${chartPadding.left + i * xScale},${chartPadding.top + (chartHeight - d.value * yScale)}`
    ).join(' ');

    const areaPoints = [
        `${chartPadding.left},${chartPadding.top + chartHeight}`,
        ...chartDataArray.map((d, i) =>
            `${chartPadding.left + i * xScale},${chartPadding.top + (chartHeight - d.value * yScale)}`
        ),
        `${chartPadding.left + (chartDataArray.length > 0 ? (chartDataArray.length - 1) * xScale : 0)},${chartPadding.top + chartHeight}`,
        `${chartPadding.left},${chartPadding.top + chartHeight}`
    ].join(' ');

    // --- Chart Tooltip Effect ---
    useEffect(() => {
        const tooltip = document.getElementById('chart-tooltip');
        const svgElement = document.querySelector('.daily-signups-chart-section svg');

        if (!svgElement || !tooltip) {
            console.warn("SVG element or tooltip not found. Tooltip functionality might not work.");
            return;
        }

        const chartPoints = svgElement.querySelectorAll('.chart-point');

        const handleMouseEnter = (event) => {
            const point = event.target;
            const date = point.getAttribute('data-date');
            const value = point.getAttribute('data-value');

            tooltip.innerHTML = `Date: ${date}<br/>Signups: ${value}`;
            tooltip.style.opacity = '1';

            const pointRect = point.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            const sectionRect = document.querySelector('.daily-signups-chart-section').getBoundingClientRect();

            let tooltipX = (pointRect.left - sectionRect.left) + (pointRect.width / 2) - (tooltipRect.width / 2);
            let tooltipY = (pointRect.top - sectionRect.top) - tooltipRect.height - 8;

            if (tooltipX < 0) { tooltipX = 5; }
            if (tooltipX + tooltipRect.width > sectionRect.width) {
                tooltipX = sectionRect.width - tooltipRect.width - 5;
            }

            tooltip.style.left = `${tooltipX}px`;
            tooltip.style.top = `${tooltipY}px`;
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
    }, [dailySignupsData, chartWidth, chartHeight, chartPadding, xScale, yScale]); // Re-run effect if data changes

    // Data for General Insights Section (can be fetched from ViewModel if you have an 'insights' collection)
    // For now, these are still mock/derived from ViewModel stats
    const insightsData = [
        { value: `${((totalSubscriptions / totalUsers) * 100 || 0).toFixed(0)}%`, label: 'Subscription Rate', change: 0, type: 'neutral', period: 'overall' }, // Derived
        { value: '$4.5K', label: 'Monthly Revenue', change: 12, type: 'increase', period: 'last month' }, // Placeholder, integrate real revenue if tracked
        { value: dailySignupsData ? Object.values(dailySignupsData).reduce((sum, val) => sum + val, 0) : '0', label: 'New Signups (7 Days)', change: 0, type: 'neutral', period: 'last week' }, // Derived
        { value: '15', label: 'Cancelled Subscriptions', change: 2, type: 'decrease', period: 'last month' }, // Placeholder
        { value: `${((totalApprovedMealPlans / (totalApprovedMealPlans + totalPendingMealPlans)) * 100 || 0).toFixed(0)}%`, label: 'Meal Plan Approval Rate', change: 0, type: 'neutral', period: 'overall' }, // Derived
        { value: totalApprovedMealPlans + totalPendingMealPlans, label: 'Total Meal Plans', change: 0, type: 'neutral', period: 'all time' }, // Derived
    ];

    if (loading) {
        return (
            <div className="admin-dashboard-main-content-area loading-state">
                <p>Loading dashboard data...</p>
                <div className="spinner"></div> {/* Add a CSS spinner */}
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-dashboard-main-content-area error-state">
                <p>Error: {error}</p>
                {/* When retrying, also call the method on the instance */}
                <button onClick={() => adminStatViewModel.loadDashboardData()}>Retry Load Data</button>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-main-content-area">
            {success && <div className="admin-dashboard-success-message">{success}</div>}
            <div className="admin-header">
                <h1 className="admin-page-title">STATISTICS</h1>
                <span className="data-as-at">Data as at {moment().format('Do MMM YYYY HH:mm')}</span>
            </div>

            <div className="stats-cards-container">
                <div className="stat-card">
                    <div className="stat-value">{totalUsers}</div>
                    <div className="stat-label">Total Users</div>
                    {/* Placeholder for change, actual change requires historical data */}
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
                    <div className={`stat-label`}>Active Subscriptions</div>
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
                                <div key={plan._id} className="meal-plan-item">
                                    <span className="meal-plan-rank">#{index + 1}</span>
                                    {/* Assuming imageFileName is directly on the plan object and accessible */}
                                    <img
                                        src={plan.imageUrl || `/assetscopy/${plan.imageFileName || 'default-meal-plan.jpg'}`} // Fallback
                                        alt={plan.name}
                                        className="admin-meal-plan-image"
                                    />
                                    <div className="meal-plan-info">
                                        <div className="meal-plan-name">{plan.name}</div>
                                        <div className="meal-plan-author">by {plan.authorName || 'N/A'}</div>
                                    </div>
                                    <div className="meal-plan-views">{plan.viewsCount || 0} Viewed</div>
                                </div>
                            ))
                        ) : (
                            <p className="no-data-message">No top meal plans found.</p>
                        )}
                    </div>
                </section>

                {/* Daily Signups Chart Section */}
                <section className="daily-signups-chart-section">
                    <h2 className="section-title">Daily Signups</h2>
                    <div className="chart-placeholder">
                        <svg width="100%" height="150" viewBox="0 0 240 150">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#ff9800" stopOpacity="0.4"/>
                                    <stop offset="100%" stopColor="#ff9800" stopOpacity="0.05"/>
                                </linearGradient>
                            </defs>

                            {/* Horizontal Grid Lines */}
                            {Array.from({ length: 5 }).map((_, i) => {
                                const value = i * (maxValue / 4);
                                const y = chartPadding.top + (chartHeight - value * yScale);
                                return (
                                    <line
                                        key={`y-line-${i}`}
                                        x1={chartPadding.left} y1={y}
                                        x2={chartPadding.left + chartWidth} y2={y}
                                        stroke="#eee"
                                        strokeDasharray="2 2"
                                    />
                                );
                            })}
                            {/* Vertical Grid Lines */}
                            {chartDataArray.map((d, i) => (
                                <line
                                    key={`x-line-${i}`}
                                    x1={chartPadding.left + i * xScale} y1={chartPadding.top}
                                    x2={chartPadding.left + i * xScale} y2={chartPadding.top + chartHeight}
                                    stroke="#eee"
                                    strokeDasharray="2 2"
                                />
                            ))}

                            {/* Area under the line */}
                            {chartDataArray.length > 0 && (
                                <path d={`M ${areaPoints}`} className="chart-area" />
                            )}

                            {/* Line path */}
                            {chartDataArray.length > 0 && (
                                <polyline
                                    fill="none"
                                    stroke="#ff9800"
                                    strokeWidth="2"
                                    points={linePoints}
                                    className="chart-line"
                                />
                            )}

                            {/* Data points (circles) - with data attributes for tooltip */}
                            {chartDataArray.map((d, i) => (
                                <circle
                                    key={`point-${d.date}`} // Use date as key for uniqueness
                                    cx={chartPadding.left + i * xScale}
                                    cy={chartPadding.top + (chartHeight - d.value * yScale)}
                                    r="4"
                                    className="chart-point"
                                    data-date={d.date} // Use full date for tooltip
                                    data-value={d.value}
                                />
                            ))}

                            {/* X-axis labels (months/dates) */}
                            {chartDataArray.map((d, i) => (
                                <text
                                    key={`x-label-${d.date}`}
                                    x={chartPadding.left + i * xScale}
                                    y={chartPadding.top + chartHeight + 15}
                                    className="chart-x-axis-label"
                                >
                                    {d.month}
                                </text>
                            ))}
                            {/* Y-axis labels */}
                            {Array.from({ length: 5 }).map((_, i) => {
                                const value = i * (maxValue / 4);
                                const y = chartPadding.top + (chartHeight - value * yScale);
                                return (
                                    <text
                                        key={`y-label-${i}`}
                                        x={chartPadding.left - 5}
                                        y={y + 4}
                                        className="chart-y-axis-label"
                                    >
                                        {value === 0 ? '' : Math.round(value)}
                                    </text>
                                );
                            })}
                        </svg>
                        {/* THE TOOLTIP DIV - Placed directly after the SVG */}
                        <div id="chart-tooltip"></div>
                    </div>
                    {/* Small Insights at the bottom of the chart */}
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
                                    ? `${maxValue} (${chartDataArray.find(d => d.value === maxValue)?.month || 'N/A'})`
                                    : 'N/A'
                                }
                            </span>
                        </div>
                        <div className="chart-insight-item">
                            <span className="chart-insight-label">Growth (Last Day):</span>
                            <span className={`chart-insight-value ${chartDataArray.length > 1 && chartDataArray[chartDataArray.length-1].value > chartDataArray[chartDataArray.length-2].value ? 'increase' : 'decrease'}`}>
                                {chartDataArray.length > 1
                                    ? `${(chartDataArray[chartDataArray.length-1].value - chartDataArray[chartDataArray.length-2].value)}`
                                    : 'N/A'
                                }
                            </span>
                        </div>
                    </div>
                </section>
            </div>

            {/* General Admin Insights section */}
            <AdminInsights data={insightsData} />

            {/* Premium Plan Container - positioned above subscriptions table */}
            <section className="premium-plan-section">
                <h2 className="section-title">SUBSCRIPTIONS</h2>
                <div className="premium-plan-card">
                    <span className="plan-name">Premium Plan</span>
                    <span className="plan-price">${currentSubscriptionPrice.toFixed(2)}<span className="per-month"> /month</span></span>
                    <button className="manage-subscription-button" onClick={handleOpenEditPriceModal}>
                        MANAGE SUBSCRIPTION
                    </button>
                </div>
            </section>
            {/* END NEW Premium Plan Container */}

            <section className="subscriptions-section">
                <div className="subscriptions-header">
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search by name, email, or status"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <i className="fas fa-search"></i>
                    </div>
                </div>
                <div className="stat-table-container">
                    <table className="subscriptions-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Renewal Date</th>
                                <th>Details</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubscriptions.length > 0 ? (
                                filteredSubscriptions.map(sub => (
                                    <tr key={sub._id}> {/* Use Firebase _id for unique key */}
                                        <td>
                                            <div className="tooltip-container">
                                                <Tooltip content={
                                                    <>
                                                        <p><strong>Name:</strong> {sub.name}</p>
                                                        <p><strong>Email:</strong> {sub.email}</p>
                                                        <p><strong>Phone:</strong> {sub.phone || 'N/A'}</p>
                                                        <p><strong>Address:</strong> {sub.address || 'N/A'}</p>
                                                    </>
                                                }>
                                                    <i className="fas fa-user-circle table-user-icon"></i> {sub.name}
                                                </Tooltip>
                                            </div>
                                        </td>
                                        <td>{sub.email}</td>
                                        <td>
                                            <span className={`status-dot status-${sub.status ? sub.status.toLowerCase() : 'unknown'}`}></span>
                                            {sub.status || 'N/A'}
                                        </td>
                                        <td>{sub.renewalDate ? moment(sub.renewalDate).format('DD/MM/YYYY') : 'N/A'}</td>
                                        <td>
                                            <button
                                                className="deets-action-button view-button"
                                                onClick={() => handleOpenUserModal(sub)} // Pass the full subscription object
                                            >
                                                VIEW
                                            </button>
                                        </td>
                                        <td>
                                            {/* Example action buttons */}
                                            <button className="action-button edit-button" onClick={() => console.log('Edit subscription', sub._id)}>EDIT</button>
                                            <button className="action-button delete-button" onClick={() => console.log('Delete subscription', sub._id)}>DELETE</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="no-data-message">No subscriptions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {isUserModalOpen && (
                <UserDetailModal
                    user={selectedUserForManagement} // Use the user selected via ViewModel
                    onClose={handleCloseUserModal}
                    // Pass ViewModel actions for user updates/deletions if the modal handles them
                    updateUserRole={updateUserRole}
                    updateNutritionistStatus={updateNutritionistStatus}
                    deleteUserAccount={deleteUserAccount}
                />
            )}

            {isEditPriceModalOpen && (
                <EditSubscriptionModal
                    isOpen={isEditPriceModalOpen}
                    onClose={handleCloseEditPriceModal}
                    initialPrice={currentSubscriptionPrice}
                    onSave={handleSaveSubscriptionPrice}
                />
            )}
        </div>
    );
});

export default AdminStatDashboard;