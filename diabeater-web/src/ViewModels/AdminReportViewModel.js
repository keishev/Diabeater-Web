// src/viewmodels/AdminReportViewModel.js
import { makeAutoObservable, runInAction } from 'mobx';
import AdminReportService from '../Services/AdminReportService';
import ReportModel from '../Models/ReportModel';

class AdminReportViewModel {
    overallStats = new ReportModel({}); // Initialize with an empty ReportModel
    loading = false;
    error = '';
    success = '';

    constructor() {
        makeAutoObservable(this);
        this.loadOverallStats(); // Load stats on component mount
    }

    setLoading = (isLoading) => {
        runInAction(() => {
            this.loading = isLoading;
        });
    };

    setError = (message) => {
        runInAction(() => {
            this.error = message;
            if (message) {
                setTimeout(() => runInAction(() => this.error = ''), 5000);
            }
        });
    };

    setSuccess = (message) => {
        runInAction(() => {
            this.success = message;
            if (message) {
                setTimeout(() => runInAction(() => this.success = ''), 5000);
            }
        });
    };

    /**
     * Loads the overall dashboard statistics.
     */
    loadOverallStats = async () => {
        this.setLoading(true);
        this.setError('');
        try {
            const stats = await AdminReportService.getOverallStatReport();
            runInAction(() => {
                this.overallStats = stats;
            });
            this.setSuccess('Overall statistics loaded successfully.');
        } catch (err) {
            console.error('Error loading overall stats:', err);
            this.setError('Failed to load overall statistics: ' + err.message);
        } finally {
            this.setLoading(false);
        }
    };

    /**
     * Exports a general CSV report based on the overall stats.
     */
    exportOverallReport = async () => {
        this.setLoading(true);
        this.setError('');
        this.setSuccess('');
        try {
            // Ensure the latest stats are loaded before exporting
            // This re-fetches the data just before export to ensure it's fresh.
            await this.loadOverallStats();

            const stats = this.overallStats;
            const csvContent = "data:text/csv;charset=utf-8,"
                             + "Metric,Value\n"
                             + `Total Users,${stats.totalUsers}\n`
                             + `Total Nutritionists,${stats.totalNutritionists}\n`
                             + `Total Meal Plans Created,${stats.totalMealPlansCreated}\n`
                             + `Average Daily Logins,${stats.averageDailyLogins}\n`
                             + `Reports Generated Last Month,${stats.reportsGeneratedLastMonth}\n`
                             + `Active Subscriptions,${stats.activeSubscriptions}\n`
                             + `Meals Added Today,${stats.mealsAddedToday}\n`;

            this.downloadCsv(csvContent, "overall_diabeater_report.csv");
            this.setSuccess('Overall report exported successfully!');
        } catch (err) {
            console.error('Error exporting overall report:', err);
            this.setError('Failed to export overall report: ' + err.message);
        } finally {
            this.setLoading(false);
        }
    };

    /**
     * Helper function to trigger CSV download.
     * @param {string} csvContent
     * @param {string} fileName
     */
    downloadCsv = (csvContent, fileName) => {
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link); // Clean up
    };
}

const adminReportViewModel = new AdminReportViewModel();
export default adminReportViewModel;