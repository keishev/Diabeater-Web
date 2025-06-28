// src/Admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite'; // Import observer
import AdminDashboardViewModel from '../ViewModels/AdminDashboardViewModel'; // Import the ViewModel (it's a singleton)
import UserDetailModal from './UserDetailModal';
import AdminProfile from './AdminProfile';
import AdminStatDashboard from './AdminStatDashboard';
import AdminMealPlans from './AdminMealPlans';
import AdminExportReport from './AdminExportReport';
import MarketingWebsiteEditorPage from './MarketingWebsiteEditorPage';
import UserFeedbacksPage from './UserFeedbacksPage';

import './AdminDashboard.css';
import './AdminStatDashboard.css';

// Admin Sidebar Component
const AdminSidebar = observer(({ onNavigate, currentView }) => {
    const handleLogout = () => {
        // In a real app, you'd call a logout function from an Auth service
        // For now, redirect.
        window.location.href = '/login';
    };

    return (
        <div className="admin-sidebar">
            <div className="logo">
                <img src="/assetscopy/blood_drop_logo.png" alt="DiaBeater Logo" />
                <span className="logo-text">DiaBeater</span>
            </div>
            <nav className="navigation">
                <div
                    className={`nav-item ${currentView === 'myProfile' ? 'active' : ''}`} // Use prop here
                    onClick={() => onNavigate('myProfile')}
                >
                    <i className="fas fa-user"></i>
                    <span>My Profile</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} // Use prop here
                    onClick={() => onNavigate('dashboard')}
                >
                    <i className="fas fa-home"></i>
                    <span>Dashboard</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'userAccounts' ? 'active' : ''}`} // Use prop here
                    onClick={() => onNavigate('userAccounts')}
                >
                    <i className="fas fa-users"></i>
                    <span>User Accounts</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'mealPlans' ? 'active' : ''}`} // Use prop here
                    onClick={() => onNavigate('mealPlans')}
                >
                    <i className="fas fa-clipboard-list"></i>
                    <span>Meal Plans</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'exportReport' ? 'active' : ''}`} // Use prop here
                    onClick={() => onNavigate('exportReport')}
                >
                    <i className="fas fa-file-export"></i>
                    <span>Export Report</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'editWebsite' ? 'active' : ''}`} // Use prop here
                    onClick={() => onNavigate('editWebsite')}
                >
                    <i className="fas fa-globe"></i>
                    <span>Edit Website</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'userFeedbacks' ? 'active' : ''}`} // Use prop here
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
    // Determine status class based on the 'status' property from Firestore
    const statusClass = user.status === 'approved' || user.status === 'Active' ? 'status-active' : 'status-inactive';

    return (
        <tr>
            <td>
                <span className="user-name-clickable" onClick={() => onNameClick(user)}>
                    <i className="fas fa-user-circle user-icon"></i>{user.firstName ? `${user.firstName} ${user.lastName}` : user.name}
                </span>
            </td>
            <td>{user.email}</td>
            {type === 'all' && <td>{user.accountType || 'Nutritionist'}</td>} {/* Use accountType from mock, or default to Nutritionist */}
            <td className={statusClass}>
                <span className="status-dot"></span>{user.status === 'approved' ? 'Active' : user.status} {/* Display 'Active' for 'approved' status */}
            </td>
            {type === 'all' && <td>{user.userSince || (user.createdAt ? user.createdAt.toLocaleDateString() : 'N/A')}</td>}
            {type === 'pending' && <td>{user.createdAt ? user.createdAt.toLocaleDateString() : 'N/A'}</td>} {/* Display creation date for pending */}
            {type === 'pending' && (
                <td>
                    <button className="doc-action-button view-button" onClick={() => AdminDashboardViewModel.viewCertificate(user.id)} disabled={AdminDashboardViewModel.isLoading}>
                        VIEW
                    </button>
                </td>
            )}
            {type === 'all' && (
                <td>
                    {/* Placeholder for suspend/unsuspend action for 'all' accounts */}
                    <button
                        className={`action-button ${user.status === 'Active' || user.status === 'approved' ? 'suspend-button' : 'unsuspend-button'}`}
                        onClick={() => onAction(user.id, user.status)}
                    >
                        {(user.status === 'Active' || user.status === 'approved') ? 'Suspend' : 'Unsuspend'}
                    </button>
                </td>
            )}
        </tr>
    );
});

// User Accounts Content Component
const UserAccountsContent = observer(() => { // Make it an observer
    // Use ViewModel state directly
    const {
        activeTab,
        searchTerm,
        filteredAllAccounts,
        filteredPendingAccounts,
        showUserDetailModal,
        selectedUser,
        // No need to destructure setActiveTab, setSearchTerm, setSelectedUser, setShowUserDetailModal here
        fetchAccounts, // Function to re-fetch data
        isLoading,
        error
    } = AdminDashboardViewModel; // Access the singleton ViewModel directly

    // Fetch accounts on component mount
      useEffect(() => {
        AdminDashboardViewModel.fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Added because fetchAccounts is a stable reference from the singleton

    const handleOpenModal = (user) => {
        AdminDashboardViewModel.setSelectedUser(user);
        AdminDashboardViewModel.setShowUserDetailModal(true);
    };

    const handleCloseModal = () => {
        AdminDashboardViewModel.setShowUserDetailModal(false);
        AdminDashboardViewModel.setSelectedUser(null);
        AdminDashboardViewModel.fetchAccounts(); // Refresh accounts after modal closes, in case changes were made
    };

    // Placeholder for suspend/unsuspend (not integrated with Firestore in this example)
    const handleSuspendUnsuspend = (userId, currentStatus) => {
        console.log(`Action: User ${userId} status changed to ${currentStatus === 'Active' ? 'Inactive' : 'Active'}`);
        // Implement Firestore update here if needed, or trigger a Cloud Function
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
                            onChange={(e) => AdminDashboardViewModel.setSearchTerm(e.target.value)} // Call method directly
                        />
                        <i className="fas fa-search"></i>
                    </div>
                </header>
            </div>

            <div className="admin-tabs">
                <button
                    className={`tab-button ${activeTab === 'ALL_ACCOUNTS' ? 'active' : ''}`}
                    onClick={() => AdminDashboardViewModel.setActiveTab('ALL_ACCOUNTS')} // Call method directly
                >
                    ALL ACCOUNTS
                </button>
                <button
                    className={`tab-button ${activeTab === 'PENDING_APPROVAL' ? 'active' : ''}`}
                    onClick={() => AdminDashboardViewModel.setActiveTab('PENDING_APPROVAL')} // Call method directly
                >
                    PENDING APPROVAL
                </button>
            </div>

            {isLoading && <p>Loading accounts...</p>}
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
                            {activeTab === 'PENDING_APPROVAL' && <th>Applied Date</th>} {/* Changed renewalDate to Applied Date */}
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
                                    {activeTab === 'ALL_ACCOUNTS' ? 'No user accounts found.' : 'No accounts pending approval.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="pagination">
                    <button>&lt;</button>
                    <span>Page 1/5</span>
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
const AdminDashboard = observer(() => { // Make it an observer
    // Use ViewModel state for currentView
    const { currentView } = AdminDashboardViewModel; // Only destructure currentView

    console.log('AdminDashboard component rendered.');
    console.log('   - Imported AdminDashboardViewModel (singleton):', AdminDashboardViewModel);
    console.log('   - currentView from ViewModel:', currentView);
    console.log('   - setCurrentView from ViewModel:', AdminDashboardViewModel.setCurrentView); // Log the function reference

    // Check admin status on mount
    useEffect(() => {
        const check = async () => {
            const isAdmin = await AdminDashboardViewModel.checkAdminStatus();
            if (!isAdmin) {
                // If not admin, redirect to login or show an error
                alert("Access Denied: You must be an administrator to view this page.");
                window.location.href = '/login'; // Or handle more gracefully
            }
        };
        check();
    }, []);


    return (
        <div className="admin-dashboard-page">
            {/* Pass setCurrentView directly from the ViewModel instance */}
            <AdminSidebar onNavigate={AdminDashboardViewModel.setCurrentView} currentView={currentView} />
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