import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import AdminDashboardViewModel from '../ViewModels/AdminDashboardViewModel'; 
import NutritionistApplicationViewModel from '../ViewModels/NutritionistApplicationViewModel';
import AdminViewModel from '../ViewModels/AdminViewModel';
import UserDetailModal from './UserDetailModal';
import AdminProfile from './AdminProfile';
import AdminStatDashboard from './AdminStatDashboard';
import AdminMealPlans from './AdminMealPlans';
import AdminExportReport from './AdminExportReport';
import MarketingWebsiteEditorPage from './MarketingWebsiteEditorPage';
import UserFeedbacksPage from './UserFeedbacksPage';

import './AdminDashboard.css';
import './AdminStatDashboard.css'; // Assuming this has general dashboard styles

const nutritionistAppVM = new NutritionistApplicationViewModel();

// Admin Sidebar Component
const AdminSidebar = observer(({ onNavigate, currentView, onLogout }) => {
    const handleLogout = async () => {
        await onLogout(); 
        window.location.href = '/'; 
    };

    return (
        <div className="admin-sidebar">
            <div className="logo">
                <img src="/assetscopy/blood_drop_logo.png" alt="DiaBeater Logo" />
                <span className="logo-text">DiaBeater</span>
            </div>
            <nav className="navigation">
                <div
                    className={`nav-item ${currentView === 'myProfile' ? 'active' : ''}`}
                    onClick={() => onNavigate('myProfile')}
                >
                    <i className="fas fa-user"></i>
                    <span>My Profile</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
                    onClick={() => onNavigate('dashboard')}
                >
                    <i className="fas fa-home"></i>
                    <span>Dashboard</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'userAccounts' ? 'active' : ''}`}
                    onClick={() => onNavigate('userAccounts')}
                >
                    <i className="fas fa-users"></i>
                    <span>User Accounts</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'mealPlans' ? 'active' : ''}`}
                    onClick={() => onNavigate('mealPlans')}
                >
                    <i className="fas fa-clipboard-list"></i>
                    <span>Meal Plans</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'exportReport' ? 'active' : ''}`}
                    onClick={() => onNavigate('exportReport')}
                >
                    <i className="fas fa-file-export"></i>
                    <span>Export Report</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'editWebsite' ? 'active' : ''}`}
                    onClick={() => onNavigate('editWebsite')}
                >
                    <i className="fas fa-globe"></i>
                    <span>Edit Website</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'userFeedbacks' ? 'active' : ''}`}
                    onClick={() => onNavigate('userFeedbacks')}
                >
                    <i className="fas fa-comments"></i>
                    <span>User Feedbacks</span>
                </div>
            </nav>
            <button className="logout-button" onClick={handleLogout}>Log out</button>
        </div>
    );
});

// User Account Table Row Component - Renders based on ViewModel data
const UserAccountRow = observer(({ user, onAction, onNameClick, type }) => {
    // Determine status class based on the 'status' property
    const statusClass = user.status === 'Active' || user.status === 'approved' ? 'status-active' : 'status-inactive';

    return (
        <tr>
            <td>
                <span className="user-name-clickable" onClick={() => onNameClick(user)}>
                    <i className="fas fa-user-circle user-icon"></i>
                    {user.firstName ? `${user.firstName} ${user.lastName}` : user.name}
                </span>
            </td>
            <td>{user.email}</td>
            {type === 'all' && <td>{user.accountType || 'N/A'}</td>} {/* Display Account Type only for 'all' accounts */}
            <td className={statusClass}>
                <span className="status-dot"></span>{user.status === 'approved' ? 'Active' : user.status}
            </td>
            {type === 'all' && <td>{user.userSince || 'N/A'}</td>}
            {type === 'pending' && <td>{user.appliedDate || 'N/A'}</td>} {/* Display Applied Date for pending */}
            {type === 'pending' && (
                <td>
                    <button
                        className="doc-action-button view-button"
                        onClick={() => nutritionistAppVM.viewCertificate(user.id)}
                        disabled={AdminDashboardViewModel.isLoading}
                    >
                        VIEW
                    </button>
                </td>
            )}
            {type === 'all' && (
                <td>
                    <button
                        className={`action-button ${user.status === 'Active' ? 'suspend-button' : 'unsuspend-button'}`}
                        onClick={() => onAction(user.id, user.status)}
                        disabled={AdminDashboardViewModel.isLoading}
                    >
                        {user.status === 'Active' ? 'Suspend' : 'Unsuspend'}
                    </button>
                </td>
            )}
        </tr>
    );
});

// User Accounts Content Component
const UserAccountsContent = observer(() => {
    const {
        activeTab,
        searchTerm,
        filteredAllAccounts,
        filteredPendingAccounts,
        showUserDetailModal,
        selectedUser,
        isLoading,
        error
    } = AdminDashboardViewModel;

    // Fetch accounts on component mount
    useEffect(() => {
        AdminDashboardViewModel.fetchAccounts();
    }, []); // Empty dependency array means this runs once on mount

    const handleOpenModal = (user) => {
        AdminDashboardViewModel.setSelectedUser(user);
        AdminDashboardViewModel.setShowUserDetailModal(true);
    };

    const handleCloseModal = () => {
        AdminDashboardViewModel.setShowUserDetailModal(false);
        AdminDashboardViewModel.setSelectedUser(null);
        AdminDashboardViewModel.fetchAccounts(); // Refresh accounts after modal closes
    };

    const handleSuspendUnsuspend = async (userId, currentStatus) => {
        console.log(`Attempting to change status for User ${userId} from ${currentStatus}`);
        AdminDashboardViewModel.setLoading(true);
        try {
            if (currentStatus === 'Active') {
                // Assuming 'suspend' logic might set status to 'suspended' or 'inactive'
                await AdminDashboardViewModel.suspendUser(userId);
            } else {
                // Assuming 'unsuspend' logic might set status back to 'active'
                await AdminDashboardViewModel.unsuspendUser(userId);
            }
            // Re-fetch accounts to update the UI
            await AdminDashboardViewModel.fetchAccounts();
            console.log(`Status change successful for user ${userId}`);
        } catch (error) {
            console.error("Error changing user status:", error);
            AdminDashboardViewModel.setError(`Failed to change status: ${error.message}`);
        } finally {
            AdminDashboardViewModel.setLoading(false);
        }
    };


    return (
        <>
            <div className="admin-dashboard-main-content-area">
                <header className="admin-header">
                    <h1 className="admin-page-title">USER ACCOUNTS</h1>
                    <div className="admin-search-bar">
                        <input
                            type="text"
                            placeholder="Search by username, email, or name"
                            value={searchTerm}
                            onChange={(e) => AdminDashboardViewModel.setSearchTerm(e.target.value)}
                        />
                        <i className="fas fa-search"></i>
                    </div>
                </header>
            </div>

            <div className="admin-tabs">
                <button
                    className={`tab-button ${activeTab === 'ALL_ACCOUNTS' ? 'active' : ''}`}
                    onClick={() => AdminDashboardViewModel.setActiveTab('ALL_ACCOUNTS')}
                >
                    ALL ACCOUNTS
                </button>
                <button
                    className={`tab-button ${activeTab === 'PENDING_APPROVAL' ? 'active' : ''}`}
                    onClick={() => AdminDashboardViewModel.setActiveTab('PENDING_APPROVAL')}
                >
                    PENDING APPROVAL
                </button>
            </div>

            {isLoading && <p className="loading-message">Loading accounts...</p>}
            {error && <p className="error-message">{error}</p>}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            {activeTab === 'ALL_ACCOUNTS' && <th>Account Type</th>}
                            <th>Status</th>
                            {activeTab === 'ALL_ACCOUNTS' && <th>User Since</th>}
                            {activeTab === 'PENDING_APPROVAL' && <th>Applied Date</th>}
                            {activeTab === 'PENDING_APPROVAL' && <th>Documents</th>}
                            {activeTab === 'ALL_ACCOUNTS' && <th>Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {activeTab === 'ALL_ACCOUNTS' && filteredAllAccounts.length > 0 ? (
                            filteredAllAccounts.map(user => (
                                <UserAccountRow
                                    key={user.id}
                                    user={user}
                                    onAction={handleSuspendUnsuspend}
                                    onNameClick={handleOpenModal}
                                    type="all"
                                />
                            ))
                        ) : activeTab === 'PENDING_APPROVAL' && filteredPendingAccounts.length > 0 ? (
                            filteredPendingAccounts.map(user => (
                                <UserAccountRow
                                    key={user.id}
                                    user={user}
                                    onAction={() => {}} // No suspend/unsuspend for pending
                                    onNameClick={handleOpenModal}
                                    type="pending"
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={activeTab === 'ALL_ACCOUNTS' ? '6' : '5'} className="no-data-message">
                                    {isLoading ? '' : (activeTab === 'ALL_ACCOUNTS' ? 'No user accounts found.' : 'No accounts pending approval.')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="pagination">
                    <button>&lt;</button>
                    <span>Page 1/5</span> {/* This needs to be dynamic with actual pagination logic */}
                    <button>&gt;</button>
                </div>
            </div>

            {showUserDetailModal && selectedUser && (
                <UserDetailModal
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
});


// AdminDashboard Main Component
const AdminDashboard = observer(({ onLogout }) => {
    const { currentView } = AdminDashboardViewModel;

    // Check admin status on mount
    useEffect(() => {
    const checkAccess = async () => {
        await AdminViewModel.verifyAdminAccess();
        console.log('isAdmin', AdminViewModel.isAdmin);
        if (!AdminViewModel.isAdmin) {
            alert("Access Denied: You must be an administrator to view this page.");
            window.location.href = '/login';
        }
    };
    checkAccess();
}, []);


    return (
        <div className="admin-dashboard-page">
            <AdminSidebar
                onNavigate={(view) => AdminDashboardViewModel.setCurrentView(view)}
                currentView={currentView}
                onLogout={onLogout} 
            />
            <div className="admin-main-content">
                {currentView === 'myProfile' && <AdminProfile />}
                {currentView === 'dashboard' && <AdminStatDashboard />}
                {currentView === 'userAccounts' && <UserAccountsContent />}
                {currentView === 'mealPlans' && <AdminMealPlans />}
                {currentView === 'exportReport' && <AdminExportReport />}
                {currentView === 'editWebsite' && <MarketingWebsiteEditorPage />}
                {currentView === 'userFeedbacks' && <UserFeedbacksPage />}
            </div>
        </div>
    );
});

export default AdminDashboard;