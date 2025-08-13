import React, { useState, useEffect, useCallback } from 'react';
import './AdminStatDashboard.css';
import UserDetailModal from './UserDetailModal';
import UserHistoryModal from './UserHistoryModal';
import AdminInsights from './AdminInsights';
import Tooltip from './Tooltip';
import adminStatViewModel from '../ViewModels/AdminStatViewModel';
import { observer } from 'mobx-react-lite';
import moment from 'moment';

const AdminStatDashboard = observer(() => {
    // Destructure directly from the singleton ViewModel instance
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
        monthlyRevenue,
        cancelledSubscriptionsCount, // <--- This is correctly observed now
        selectedUserForManagement,
        selectedUserForHistory,
        setError,
        setSuccess,
        setSelectedUserForManagement,
        clearSelectedUserForManagement,
        setSelectedUserForHistory,
        clearSelectedUserForHistory,
        loadDashboardData,
    } = adminStatViewModel;

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    // Helper function to format any date value (Firestore Timestamp or JS Date)
    const formatDate = (dateValue) => {
        if (!dateValue) return 'N/A';
        const date = dateValue.toDate ? dateValue.toDate() : dateValue;
        try {
            return moment(date).format('DD/MM/YYYY');
        } catch (e) {
            console.error("Error formatting date:", e);
            return 'Invalid Date';
        }
    };

    // Helper function to calculate and format the renewal date (endDate + 1 day)
    const formatRenewalDate = (endDateValue) => {
        if (!endDateValue) return 'N/A';
        const endDate = endDateValue.toDate ? endDateValue.toDate() : endDateValue;
        try {
            return moment(endDate).add(1, 'days').format('DD/MM/YYYY');
        } catch (e) {
            console.error("Error formatting renewal date:", e);
            return 'Invalid Date';
        }
    };

    // Use useCallback for memoizing the data loading function
    const handleLoadDashboardData = useCallback(async () => {
        await loadDashboardData();
    }, [loadDashboardData]);

    // Initial data load on component mount
    useEffect(() => {
        handleLoadDashboardData();
    }, [handleLoadDashboardData]);

    const handleOpenUserModal = (user) => {
        setSelectedUserForManagement(user);
        setIsUserModalOpen(true);
    };

    const handleCloseUserModal = () => {
        setIsUserModalOpen(false);
        clearSelectedUserForManagement();
        handleLoadDashboardData(); // Reload data after user modal closes
    };

    const handleOpenHistoryModal = (user) => {
        setSelectedUserForHistory(user);
    };

    // --- Chart Data Processing (Keeping as is) ---
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

    // Data for AdminInsights component
    const insightsData = [
        { value: `${((totalSubscriptions / (totalUsers || 1)) * 100 || 0).toFixed(0)}%`, label: 'Subscription Rate', change: 0, type: 'neutral', period: 'overall' },
        {
            // --- MODIFIED THIS BLOCK FOR MONTHLY REVENUE DISPLAY ---
            value: typeof monthlyRevenue === 'number' && !isNaN(monthlyRevenue)
                ? (monthlyRevenue >= 1000
                    ? `$${(monthlyRevenue / 1000).toFixed(1)}K` // For thousands, use one decimal place and 'K'
                    : `$${monthlyRevenue.toFixed(2)}`)          // For less than thousands, show exact value with two decimal places
                : 'N/A', // If monthlyRevenue is not a valid number
            // --- END MODIFIED BLOCK ---
            label: 'Monthly Revenue',
            change: 0, // Placeholder, actual change calculation would require historical data
            type: 'neutral', // Placeholder
            period: 'last month'
        },
        {
            value: dailySignupsData ? Object.values(dailySignupsData).reduce((sum, val) => sum + val, 0) : '0',
            label: 'New Signups (7 Days)',
            change: 0, type: 'neutral', period: 'last week'
        },
        {
            value: cancelledSubscriptionsCount, // This correctly uses the value from ViewModel
            label: 'Cancelled Subscriptions',
            change: 0, // You can add logic for change if you track previous month's cancellations
            type: 'neutral', // Adjust type based on change if implemented
            period: 'last month'
        },
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
                
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalNutritionists}</div>
                    <div className="stat-label">Total Nutritionists</div>
                    <div className="stat-change neutral">
                        
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalSubscriptions}</div>
                    <div className="stat-label">Active Subscriptions</div>
                    <div className="stat-change neutral">
                      
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalApprovedMealPlans}</div>
                    <div className="stat-label">Approved Meal Plans</div>
                    <div className="stat-change neutral">
                        
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalPendingMealPlans}</div>
                    <div className="stat-label">Pending Meal Plans</div>
                    <div className="stat-change neutral">
                     
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

            {/* Modals (kept for potential general user management if desired later) */}
            {isUserModalOpen && selectedUserForManagement && (
                <UserDetailModal
                    user={selectedUserForManagement}
                    onClose={handleCloseUserModal}
                    setError={setError}
                    setSuccess={setSuccess}
                    refreshUsers={handleLoadDashboardData}
                />
            )}

            {selectedUserForHistory && (
                <UserHistoryModal
                    user={selectedUserForHistory}
                />
            )}
        </div>
    );
});

export default AdminStatDashboard;