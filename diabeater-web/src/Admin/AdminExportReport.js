// src/Admin/AdminExportReport.js
import React from 'react';
import './AdminExportReport.css'; // Import the CSS file

const AdminExportReport = () => {
    // Dummy (hardcoded) data for the overall stat report
    const overallStats = {
        totalUsers: 1250,
        totalNutritionists: 45,
        totalMealPlansCreated: 5678,
        averageDailyLogins: 350,
        reportsGeneratedLastMonth: 120,
        activeSubscriptions: 890,
        mealsAddedToday: 15,
    };

    const handleExportReport = () => {
        // In a real application, you would:
        // 1. Fetch the actual report data from your backend.
        // 2. Format it (e.g., as CSV, PDF, Excel).
        // 3. Trigger a file download.

        alert('Exporting Report... (This is a dummy action)');
        console.log('Initiating report export with current stats:', overallStats);

        // Example: Simulate downloading a CSV (very basic)
        const csvContent = "data:text/csv;charset=utf-8,"
                         + "Metric,Value\n"
                         + `Total Users,${overallStats.totalUsers}\n`
                         + `Total Nutritionists,${overallStats.totalNutritionists}\n`
                         + `Total Meal Plans Created,${overallStats.totalMealPlansCreated}\n`
                         + `Average Daily Logins,${overallStats.averageDailyLogins}\n`
                         + `Reports Generated Last Month,${overallStats.reportsGeneratedLastMonth}\n`
                         + `Active Subscriptions,${overallStats.activeSubscriptions}\n`
                         + `Meals Added Today,${overallStats.mealsAddedToday}\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "overall_report.csv");
        document.body.appendChild(link); // Required for Firefox
        link.click(); // This will download the data file named "overall_report.csv"
        document.body.removeChild(link); // Clean up
    };

    return (
        <div className="admin-export-report-content">
            <header className="report-header">
                <h1 className="report-page-title">Export Reports</h1>
            </header>

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

                <button className="export-button" onClick={handleExportReport}>
                    Export Report
                </button>
            </div>
        </div>
    );
};

export default AdminExportReport;