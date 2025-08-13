// src/Admin/AdminExportReport.js
import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import adminReportViewModel from '../ViewModels/AdminReportViewModel';
import './AdminExportReport.css';

const AdminExportReport = observer(() => {
    const { overallStats, loading, error, success, exportOverallReport, loadOverallStats } = adminReportViewModel;

    useEffect(() => {
        loadOverallStats();
    }, []);

    const renderMetricCard = (title, metrics) => (
        <div className="metric-card">
            <h3 className="metric-card-title">{title}</h3>
            <div className="metrics-grid">
                {metrics.map((metric, index) => (
                    <div key={index} className="metric-item">
                        <span className="metric-label">{metric.label}:</span>
                        <span className={`metric-value ${metric.trend || ''}`}>
                            {metric.value}
                            {metric.change && (
                                <span className={`metric-change ${metric.change > 0 ? 'positive' : 'negative'}`}>
                                    {metric.change > 0 ? '↗' : '↘'} {Math.abs(metric.change).toFixed(1)}%
                                </span>
                            )}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="admin-export-report-content">
            <header className="report-header">
                <h1 className="report-page-title">Business Analytics & Export Reports</h1>
                <p className="report-subtitle">Comprehensive business metrics and performance analytics</p>
            </header>

            {loading && <div className="loading-message">Loading comprehensive business analytics...</div>}
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="report-dashboard">
                {/* Executive Summary */}
                <div className="executive-summary">
                    <h2>Executive Summary</h2>
                    <div className="summary-stats">
                        <div className="summary-stat">
                            <div className="summary-value">{overallStats.formatCurrency?.(overallStats.currentMonthRevenue) || `$${overallStats.currentMonthRevenue?.toFixed(2) || '0.00'}`}</div>
                            <div className="summary-label">Monthly Revenue</div>
                        </div>
                        <div className="summary-stat">
                            <div className="summary-value">{overallStats.totalUsers || 0}</div>
                            <div className="summary-label">Total Users</div>
                        </div>
                        <div className="summary-stat">
                            <div className="summary-value">{overallStats.activeSubscriptions || 0}</div>
                            <div className="summary-label">Active Subscriptions</div>
                        </div>
                        <div className="summary-stat">
                            <div className="summary-value">{overallStats.formatPercentage?.(overallStats.conversionRate) || `${(overallStats.conversionRate || 0).toFixed(1)}%`}</div>
                            <div className="summary-label">Conversion Rate</div>
                        </div>
                    </div>
                </div>

                {/* Revenue Metrics */}
                {renderMetricCard("Revenue & Financial Performance", [
                    {
                        label: "Current Month Revenue",
                        value: overallStats.formatCurrency?.(overallStats.currentMonthRevenue) || `$${(overallStats.currentMonthRevenue || 0).toFixed(2)}`,
                        change: overallStats.revenueGrowthRate
                    },
                    {
                        label: "Last Month Revenue",
                        value: overallStats.formatCurrency?.(overallStats.lastMonthRevenue) || `$${(overallStats.lastMonthRevenue || 0).toFixed(2)}`
                    },
                    {
                        label: "Revenue Growth Rate",
                        value: overallStats.formatPercentage?.(overallStats.revenueGrowthRate) || `${(overallStats.revenueGrowthRate || 0).toFixed(1)}%`,
                        trend: overallStats.revenueGrowthRate > 0 ? 'positive' : 'negative'
                    },
                    {
                        label: "Average Revenue Per User (ARPU)",
                        value: overallStats.formatCurrency?.(overallStats.averageRevenuePerUser) || `$${(overallStats.averageRevenuePerUser || 0).toFixed(2)}`
                    },
                    {
                        label: "Average Subscription Value",
                        value: overallStats.formatCurrency?.(overallStats.averageSubscriptionValue) || `$${(overallStats.averageSubscriptionValue || 0).toFixed(2)}`
                    },
                    {
                        label: "Estimated Customer Lifetime Value",
                        value: overallStats.formatCurrency?.(overallStats.lifetimeValue) || `$${(overallStats.lifetimeValue || 0).toFixed(2)}`
                    }
                ])}

                {/* User Metrics */}
                {renderMetricCard("User Growth & Acquisition", [
                    {
                        label: "Total Users",
                        value: overallStats.formatNumber?.(overallStats.totalUsers) || (overallStats.totalUsers || 0).toLocaleString()
                    },
                    {
                        label: "New Users This Month",
                        value: overallStats.formatNumber?.(overallStats.newUsersThisMonth) || (overallStats.newUsersThisMonth || 0).toLocaleString(),
                        change: overallStats.userGrowthRate
                    },
                    {
                        label: "New Users Last Month",
                        value: overallStats.formatNumber?.(overallStats.newUsersLastMonth) || (overallStats.newUsersLastMonth || 0).toLocaleString()
                    },
                    {
                        label: "User Growth Rate",
                        value: overallStats.formatPercentage?.(overallStats.userGrowthRate) || `${(overallStats.userGrowthRate || 0).toFixed(1)}%`,
                        trend: overallStats.userGrowthRate > 0 ? 'positive' : 'negative'
                    },
                    {
                        label: "Total Nutritionists",
                        value: overallStats.formatNumber?.(overallStats.totalNutritionists) || (overallStats.totalNutritionists || 0).toLocaleString()
                    },
                    {
                        label: "Conversion Rate (Users to Subscribers)",
                        value: overallStats.formatPercentage?.(overallStats.conversionRate) || `${(overallStats.conversionRate || 0).toFixed(1)}%`
                    }
                ])}

                {/* Subscription Metrics */}
                {renderMetricCard("Subscription & Retention Analytics", [
                    {
                        label: "Total Subscriptions",
                        value: overallStats.formatNumber?.(overallStats.totalSubscriptions) || (overallStats.totalSubscriptions || 0).toLocaleString()
                    },
                    {
                        label: "Active Subscriptions",
                        value: overallStats.formatNumber?.(overallStats.activeSubscriptions) || (overallStats.activeSubscriptions || 0).toLocaleString()
                    },
                    {
                        label: "Cancelled This Month",
                        value: overallStats.formatNumber?.(overallStats.cancelledThisMonth) || (overallStats.cancelledThisMonth || 0).toLocaleString()
                    },
                    {
                        label: "Cancelled Last Month",
                        value: overallStats.formatNumber?.(overallStats.cancelledLastMonth) || (overallStats.cancelledLastMonth || 0).toLocaleString()
                    },
                    {
                        label: "Total Cancelled",
                        value: overallStats.formatNumber?.(overallStats.cancelledSubscriptions) || (overallStats.cancelledSubscriptions || 0).toLocaleString()
                    },
                    {
                        label: "Churn Rate",
                        value: overallStats.formatPercentage?.(overallStats.churnRate) || `${(overallStats.churnRate || 0).toFixed(1)}%`,
                        trend: overallStats.churnRate > 5 ? 'negative' : 'positive'
                    }
                ])}

                {/* Content & Engagement Metrics */}
                {renderMetricCard("Content & User Engagement", [
                    {
                        label: "Total Meal Plans Created",
                        value: overallStats.formatNumber?.(overallStats.totalMealPlansCreated) || (overallStats.totalMealPlansCreated || 0).toLocaleString()
                    },
                    {
                        label: "Approved Meal Plans",
                        value: overallStats.formatNumber?.(overallStats.approvedMealPlans) || (overallStats.approvedMealPlans || 0).toLocaleString()
                    },
                    {
                        label: "Pending Approval",
                        value: overallStats.formatNumber?.(overallStats.pendingMealPlans) || (overallStats.pendingMealPlans || 0).toLocaleString()
                    },
                    {
                        label: "Meal Plans Created This Month",
                        value: overallStats.formatNumber?.(overallStats.mealPlansCreatedThisMonth) || (overallStats.mealPlansCreatedThisMonth || 0).toLocaleString()
                    },
                    {
                        label: "Meal Plans Created Last Month",
                        value: overallStats.formatNumber?.(overallStats.mealPlansCreatedLastMonth) || (overallStats.mealPlansCreatedLastMonth || 0).toLocaleString()
                    },
                    {
                        label: "Total Meal Plan Saves",
                        value: overallStats.formatNumber?.(overallStats.totalMealPlanSaves) || (overallStats.totalMealPlanSaves || 0).toLocaleString()
                    },
                    {
                        label: "Engagement Rate (Saves/Plans)",
                        value: overallStats.formatPercentage?.(overallStats.mealPlanEngagementRate) || `${(overallStats.mealPlanEngagementRate || 0).toFixed(1)}%`
                    }
                ])}

                {/* Export Section */}
                <div className="export-section">
                    <h2>Export Reports</h2>
                    <p>Generate comprehensive CSV reports with all business metrics and analytics.</p>
                    <div className="export-buttons-group">
                        <button 
                            className="export-button primary" 
                            onClick={exportOverallReport} 
                            disabled={loading}
                        >
                            {loading ? 'Generating Report...' : 'Export Comprehensive Business Report (CSV)'}
                        </button>
                        <button 
                            className="export-button secondary" 
                            onClick={loadOverallStats} 
                            disabled={loading}
                        >
                            {loading ? 'Refreshing...' : 'Refresh Data'}
                        </button>
                    </div>
                </div>

                {/* Report Info */}
                <div className="report-footer">
                    <p className="report-timestamp">
                        Report generated on: {overallStats.reportGeneratedAt ? 
                            new Date(overallStats.reportGeneratedAt).toLocaleString() : 
                            new Date().toLocaleString()
                        }
                    </p>
                    <p className="report-period">Report Period: {overallStats.reportPeriod || 'Monthly'}</p>
                </div>
            </div>
        </div>
    );
});

export default AdminExportReport;