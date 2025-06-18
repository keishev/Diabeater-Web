// src/Admin/AdminStatDashboard.js
import React, { useState, useEffect } from 'react';
import './AdminStatDashboard.css';
import UserDetailModal from './UserDetailModal';
import EditSubscriptionModal from './EditSubscriptionModal';
import './UserDetailModal.css';
import './EditSubscriptionModal.css';
import AdminInsights from './AdminInsights';
import Tooltip from './Tooltip'; // Assuming this Tooltip component is for the table rows

const AdminStatDashboard = () => {
    // Mock Data for Statistics
    const stats = {
        users: { value: 1562, change: 25, type: 'increase' },
        totalSales: { value: 2350, change: 10, type: 'increase' },
        totalSubscribers: { value: 540, change: 10, type: 'increase' },
    };

    // Mock Data for Weekly Top Meal Plans
    const topMealPlans = [
        { id: 1, name: 'Chopped Salad with Basil & Mozzarella', author: 'John Doe', views: '1.4k', imageFileName: 'chopped-salad.jpg' },
        { id: 2, name: 'Grilled Chicken Breast', author: 'Andrew Gonzales', views: '1.2k', imageFileName: 'grilled-chicken-breast.jpg' },
        { id: 3, name: 'Eggplant Pasta', author: 'DiaBeater', views: '1.0k', imageFileName: 'eggplant-pasta.jpg' },
    ];

    // Mock Data for Daily Signups (for chart)
    const dailySignups = [
        { month: 'Feb', value: 15 },
        { month: 'Mar', value: 40 },
        { month: 'Apr', value: 65 },
        { month: 'May', value: 88 },
        { month: 'Jun', value: 80 },
    ];

    // NEW: Mock Data for Small Insights below the chart
    const chartInsights = [
        { label: 'Avg. Daily Signups', value: '57' },
        { label: 'Highest Month', value: 'May (88)' },
        { label: 'Growth from Last Month', value: '+22%' },
    ];

    // Mock Data for General Insights Section
    const insightsData = [
        { value: '85%', label: 'Active Subscriptions', change: 5, type: 'increase', period: 'last month' },
        { value: '$4.5K', label: 'Monthly Revenue', change: 12, type: 'increase', period: 'last month' },
        { value: '250', label: 'New Signups', change: 8, type: 'increase', period: 'last week' },
        { value: '15', label: 'Cancelled Subscriptions', change: 2, type: 'decrease', period: 'last month' },
        { value: '75%', label: 'Meal Plan Approval Rate', change: 3, type: 'increase', period: 'last quarter' },
        { value: '2.5k', label: 'Total Meal Plans', change: 10, type: 'increase', period: 'all time' },
    ];

    // Mock Data for Subscriptions Table
    const subscriptionsData = [
        { id: 'H23XXMK11', name: 'Samantha Joe', email: 'samantha@gmail.com', status: 'Active', renewalDate: '01/02/2025', phone: '123-456-7890', address: '123 Main St, Anytown, USA' },
        { id: 'H23XXMK12', name: 'Matilda Swayne', email: 'matildaswayne@gmail.com', status: 'Active', renewalDate: '01/03/2025', phone: '987-654-3210', address: '456 Oak Ave, Somewhere, USA' },
        { id: 'H23XXMK13', name: 'David Brown', email: 'david.b@gmail.com', status: 'Active', renewalDate: '02/03/2025', phone: '555-111-2222', address: '789 Pine Ln, Nowhere, USA' },
        { id: 'H23XXMK14', name: 'Timothy Young', email: 'timothy_young@gmail.com', status: 'Active', renewalDate: '04/01/2025', phone: '111-222-3333', address: '101 Elm Blvd, Anycity, USA' },
        { id: 'H23XXMK15', name: 'Rachel Allen', email: 'rachelallen@gmail.com', status: 'Active', renewalDate: '05/04/2025', phone: '444-555-6666', address: '202 Birch St, Villagetown, USA' },
        { id: 'H23XXMK16', name: 'Andrew Gonzales', email: 'andrew_gonzales@gmail.com', status: 'Cancelled', renewalDate: '05/03/2025', phone: '777-888-9999', address: '303 Cedar Rd, Townsville, USA' },
        { id: 'H23XXMK17', name: 'Steven Walker', email: 'stevenwalker.2@gmail.com', status: 'Active', renewalDate: '06/02/2025', phone: '222-333-4444', address: '404 Willow Way, Hamlet, USA' },
        { id: 'H23XXMK18', name: 'Jason Scott', email: 'jasonscott231@gmail.com', status: 'Expired', renewalDate: '07/04/2025', phone: '666-777-8888', address: '505 Maple Dr, Suburbia, USA' },
        { id: 'H23XXMK19', name: 'Ryan Mitchell', email: 'ryan.mitchell@gmail.com', status: 'Active', renewalDate: '07/04/2025', phone: '999-000-1111', address: '606 Spruce Ct, Metropolis, USA' },
        { id: 'H23XXMK20', name: 'Beatrice Lim', email: 'beatrice_lim23@gmail.com', status: 'Active', renewalDate: '01/05/2025', phone: '333-444-5555', address: '707 Poplar Pl, Countryside, USA' },
    ];

    const [searchTerm, setSearchTerm] = useState('');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditPriceModalOpen, setIsEditPriceModalOpen] = useState(false);
    const [currentSubscriptionPrice, setCurrentSubscriptionPrice] = useState(10.00);

    const handleOpenUserModal = (user) => {
        setSelectedUser(user);
        setIsUserModalOpen(true);
    };

    const handleCloseUserModal = () => {
        setIsUserModalOpen(false);
        setSelectedUser(null);
    };

    const handleOpenEditPriceModal = () => {
        setIsEditPriceModalOpen(true);
    };

    const handleCloseEditPriceModal = () => {
        setIsEditPriceModalOpen(false);
    };

    const handleSaveSubscriptionPrice = (newPrice) => {
        setCurrentSubscriptionPrice(newPrice);
        console.log(`New subscription price saved: $${newPrice}`);
    };

    const filteredSubscriptions = subscriptionsData.filter(sub =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Chart calculations
    const chartPadding = { top: 20, right: 30, bottom: 30, left: 35 };
    const chartWidth = 240 - chartPadding.left - chartPadding.right;
    const chartHeight = 150 - chartPadding.top - chartPadding.bottom;

    const maxValue = Math.max(...dailySignups.map(d => d.value));
    const xScale = chartWidth / (dailySignups.length - 1);
    const yScale = chartHeight / maxValue;

    const linePoints = dailySignups.map((d, i) =>
        `${chartPadding.left + i * xScale},${chartPadding.top + (chartHeight - d.value * yScale)}`
    ).join(' ');

    // Points for the area fill, starting from bottom-left, along the line, then to bottom-right
    const areaPoints = [
        `${chartPadding.left},${chartPadding.top + chartHeight}`, // Bottom-left
        ...dailySignups.map((d, i) =>
            `${chartPadding.left + i * xScale},${chartPadding.top + (chartHeight - d.value * yScale)}`
        ),
        `${chartPadding.left + (dailySignups.length - 1) * xScale},${chartPadding.top + chartHeight}`, // Bottom-right
        `${chartPadding.left},${chartPadding.top + chartHeight}` // Back to bottom-left to close the shape
    ].join(' ');

    // --- EFFECT HOOK FOR TOOLTIP LOGIC ---
    useEffect(() => {
        const tooltip = document.getElementById('chart-tooltip');
        // We need to query the SVG element first, then find its circles
        const svgElement = document.querySelector('.daily-signups-chart-section svg');
        if (!svgElement || !tooltip) {
            console.warn("SVG element or tooltip not found. Tooltip functionality might not work.");
            return; // Exit if SVG or tooltip not found
        }

        const chartPoints = svgElement.querySelectorAll('.chart-point');

        const handleMouseEnter = (event) => {
            const point = event.target;
            const month = point.getAttribute('data-month');
            const value = point.getAttribute('data-value');

            tooltip.innerHTML = `Month: ${month}<br/>Signups: ${value}`;
            tooltip.style.opacity = '1';

            // Get the bounding rectangle of the point relative to the viewport
            const pointRect = point.getBoundingClientRect();
            // Get the bounding rectangle of the tooltip itself after content is set
            const tooltipRect = tooltip.getBoundingClientRect();

            // Get the bounding rectangle of the SECTION that holds the tooltip (.daily-signups-chart-section)
            const sectionRect = document.querySelector('.daily-signups-chart-section').getBoundingClientRect();

            // Calculate position relative to the section's top-left corner
            // For X: Center tooltip on the point
            let tooltipX = (pointRect.left - sectionRect.left) + (pointRect.width / 2) - (tooltipRect.width / 2);

            // For Y: Place tooltip above the point
            let tooltipY = (pointRect.top - sectionRect.top) - tooltipRect.height - 8; // 8px buffer above the point

            // Optional: Add boundary checks to keep tooltip within the section or viewport
            // Prevent going too far left
            if (tooltipX < 0) {
                tooltipX = 5; // 5px from left edge of section
            }
            // Prevent going too far right
            if (tooltipX + tooltipRect.width > sectionRect.width) {
                tooltipX = sectionRect.width - tooltipRect.width - 5; // 5px from right edge of section
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

        // Cleanup function: remove event listeners when component unmounts or re-renders
        return () => {
            chartPoints.forEach(point => {
                point.removeEventListener('mouseenter', handleMouseEnter);
                point.removeEventListener('mouseleave', handleMouseLeave);
            });
        };
    }, [dailySignups, chartWidth, chartHeight, chartPadding, xScale, yScale]);

    return (
        <div className="admin-dashboard-main-content-area">
            <div className="admin-header">
                <h1 className="admin-page-title">STATISTICS</h1>
                <span className="data-as-at">Data as at 13th May 2025 15:06</span>
            </div>

            <div className="stats-cards-container">
                <div className="stat-card">
                    <div className="stat-value">{stats.users.value}</div>
                    <div className="stat-label">Users</div>
                    <div className={`stat-change ${stats.users.type}`}>
                        <i className={`fas fa-caret-${stats.users.type === 'increase' ? 'up' : 'down'}`}></i> {stats.users.change}% since last week
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">${stats.totalSales.value}</div>
                    <div className="stat-label">Total Sales</div>
                    <div className={`stat-change ${stats.totalSales.type}`}>
                        <i className={`fas fa-caret-${stats.totalSales.type === 'increase' ? 'up' : 'down'}`}></i> {stats.totalSales.change}% since last week
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalSubscribers.value}</div>
                    <div className={`stat-label`}>Total Subscribers</div>
                    <div className={`stat-change ${stats.totalSubscribers.type}`}>
                        <i className={`fas fa-caret-${stats.totalSubscribers.type === 'increase' ? 'up' : 'down'}`}></i> {stats.totalSubscribers.change}% since last week
                    </div>
                </div>
            </div>

            <div className="dashboard-sections-row">
                <section className="weekly-meal-plans-section">
                    <h2 className="section-title">Weekly Top Meal Plans</h2>
                    <div className="meal-plans-list">
                        {topMealPlans.map((plan, index) => (
                            <div key={plan.id} className="meal-plan-item">
                                <span className="meal-plan-rank">#{index + 1}</span>
                                <img
                                    src={`/assetscopy/${plan.imageFileName}`}
                                    alt={plan.name}
                                    className="admin-meal-plan-image"
                                />
                                <div className="meal-plan-info">
                                    <div className="meal-plan-name">{plan.name}</div>
                                    <div className="meal-plan-author">by {plan.author}</div>
                                </div>
                                <div className="meal-plan-views">{plan.views} Viewed</div>
                            </div>
                        ))}
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
                            {dailySignups.map((d, i) => (
                                <line
                                    key={`x-line-${i}`}
                                    x1={chartPadding.left + i * xScale} y1={chartPadding.top}
                                    x2={chartPadding.left + i * xScale} y2={chartPadding.top + chartHeight}
                                    stroke="#eee"
                                    strokeDasharray="2 2"
                                />
                            ))}

                            {/* Area under the line */}
                            <path d={`M ${areaPoints}`} className="chart-area" />

                            {/* Line path */}
                            <polyline
                                fill="none"
                                stroke="#ff9800"
                                strokeWidth="2"
                                points={linePoints}
                                className="chart-line"
                            />

                            {/* Data points (circles) - with data attributes for tooltip */}
                            {dailySignups.map((d, i) => (
                                <circle
                                    key={`point-${i}`}
                                    cx={chartPadding.left + i * xScale}
                                    cy={chartPadding.top + (chartHeight - d.value * yScale)}
                                    r="4"
                                    className="chart-point"
                                    data-month={d.month}
                                    data-value={d.value}
                                />
                            ))}

                            {/* X-axis labels (months) */}
                            {dailySignups.map((d, i) => (
                                <text
                                    key={`x-label-${i}`}
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
                                        {value === 0 ? '' : value}
                                    </text>
                                );
                            })}
                        </svg>
                        {/* THE TOOLTIP DIV - Placed directly after the SVG */}
                        <div id="chart-tooltip"></div>
                    </div>
                    {/* Small Insights at the bottom of the chart */}
                    <div className="chart-insights">
                        {chartInsights.map((insight, index) => (
                            <div key={index} className="chart-insight-item">
                                <span className="chart-insight-label">{insight.label}:</span>
                                <span className="chart-insight-value">{insight.value}</span>
                            </div>
                        ))}
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
                                <th>Transactions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubscriptions.length > 0 ? (
                                filteredSubscriptions.map(sub => (
                                    <tr key={sub.id}>
                                        <td>
                                            <div className="tooltip-container">
                                                <Tooltip content={
                                                    <>
                                                        <p><strong>Name:</strong> {sub.name}</p>
                                                        <p><strong>Email:</strong> {sub.email}</p>
                                                        <p><strong>Phone:</strong> {sub.phone}</p>
                                                        <p><strong>Address:</strong> {sub.address}</p>
                                                    </>
                                                }>
                                                    <i className="fas fa-user-circle table-user-icon"></i> {sub.name}
                                                </Tooltip>
                                            </div>
                                        </td>
                                        <td>{sub.email}</td>
                                        <td>
                                            <span className={`status-dot status-${sub.status.toLowerCase()}`}></span>
                                            {sub.status}
                                        </td>
                                        <td>{sub.renewalDate}</td>
                                        <td>
                                            <button
                                                className="deets-action-button view-button"
                                                onClick={() => handleOpenUserModal(sub)}
                                            >
                                                VIEW
                                            </button>
                                        </td>
                                        <td><button className="action-button view-button">VIEW</button></td>
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
                    user={selectedUser}
                    onClose={handleCloseUserModal}
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
};

export default AdminStatDashboard;