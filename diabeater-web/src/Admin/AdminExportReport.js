// src/Admin/AdminExportReport.js
import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import adminReportViewModel from '../ViewModels/AdminReportViewModel';
import './AdminExportReport.css';

const AdminExportReport = observer(() => {
    const { overallStats, loading, error, success, exportOverallReport } = adminReportViewModel;

    return (
        <div className="admin-export-report-content">
            <header className="report-header">
                <h1 className="report-page-title">Export Reports</h1>
            </header>

            {loading && <div className="loading-message">Loading reports...</div>}
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="report-card">
                <div className="stat-report-section">
                    <h2 className="section-title">Overall Stat Report</h2>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">Total Users:</span>
                            <span className="stat-value">{overallStats.totalUsers}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Nutritionists:</span>
                            <span className="stat-value">{overallStats.totalNutritionists}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Meal Plans Created:</span>
                            <span className="stat-value">{overallStats.totalMealPlansCreated}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Average Daily Logins:</span>
                            <span className="stat-value">{overallStats.averageDailyLogins}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Reports Generated Last Month:</span>
                            <span className="stat-value">{overallStats.reportsGeneratedLastMonth}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Active Subscriptions:</span>
                            <span className="stat-value">{overallStats.activeSubscriptions}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Meals Added Today:</span>
                            <span className="stat-value">{overallStats.mealsAddedToday}</span>
                        </div>
                    </div>
                </div>

                <div className="export-buttons-group">
                    <button className="export-button" onClick={exportOverallReport} disabled={loading}>
                        Export Overall Report (CSV)
                    </button>
                </div>
            </div>
        </div>
    );
});

export default AdminExportReport;