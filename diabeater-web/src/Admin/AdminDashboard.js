import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import AdminDashboardViewModel from '../ViewModels/AdminDashboardViewModel';
// Keep this import if NutritionistApplicationViewModel is still directly used or needed by other components
import NutritionistApplicationViewModel from '../ViewModels/NutritionistApplicationViewModel'; // Reinstated import
import AdminViewModel from '../ViewModels/AdminViewModel';
import UserDetailModal from './UserDetailModal';
import RejectionReasonModal from './RejectionReasonModal'; // <--- CRITICAL FIX: Import the RejectionReasonModal
import AdminProfile from './AdminProfile';
import AdminStatDashboard from './AdminStatDashboard';
import AdminMealPlans from './AdminMealPlans';
import AdminExportReport from './AdminExportReport';
import MarketingWebsiteEditorPage from './MarketingWebsiteEditorPage';
import UserFeedbacksPage from './UserFeedbacksPage';
import AdminRewards from './AdminRewards'; // Import the new AdminRewards component

import './AdminDashboard.css';
import './AdminStatDashboard.css';
// You might also want to import AdminRewards.css here if it's a global style,
// or ensure it's imported in AdminRewards.js itself.

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
                    {/* pieza line was likely a placeholder/typo and has been removed */}
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
                {/* NEW REWARDS TAB */}
                <div
                    className={`nav-item ${currentView === 'rewards' ? 'active' : ''}`}
                    onClick={() => onNavigate('rewards')}
                >
                    <i className="fas fa-trophy"></i> {/* Using a trophy icon for rewards */}
                    <span>Rewards</span>
                </div>
                {/* END NEW REWARDS TAB */}
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
    // Determine the status class based on the user's status.
    const statusClass = user.status === 'Active' || user.status === 'approved' ? 'status-active' : 'status-inactive';

    return (
        <tr>
            <td>
                <span className="user-name-clickable" onClick={() => onNameClick(user)}>
                    <i className="fas fa-user-circle user-icon"></i>
                    {/* Display name based on available fields */}
                    {user.firstName ? `${user.firstName} ${user.lastName}` : user.name}
                </span>
            </td>
            <td>{user.email}</td>
            {type === 'all' && <td>{user.accountType || 'N/A'}</td>}
            <td className={statusClass}>
                <span className="status-dot"></span>{user.status === 'approved' ? 'Active' : user.status}
            </td>
            {type === 'all' && <td>{user.userSince || 'N/A'}</td>}
            {type === 'pending' && <td>{user.appliedDate || 'N/A'}</td>}

            {/* VIEW BUTTON for pending nutritionists */}
            {type === 'pending' && (
                <td>
                    <button
                        className="doc-action-button view-button"
                        onClick={() => AdminDashboardViewModel.viewCertificate(user.id)} // Correctly calls the method on AdminDashboardViewModel
                        disabled={AdminDashboardViewModel.isLoading}
                    >
                        VIEW
                    </button>
                </td>
            )}

            {/* Action button for ALL ACCOUNTS tab */}
            {type === 'all' && (
                <td>
                    {user.accountType !== 'admin' && ( // Prevent suspending admins
                        <button
                            className={`action-button ${user.status === 'Active' ? 'suspend-button' : 'unsuspend-button'}`}
                            onClick={() => onAction(user.id, user.status)} // Calls handleSuspendUnsuspend in UserAccountsContent
                            disabled={AdminDashboardViewModel.userAccountsVM.isLoading} /* Use userAccountsVM's loading state */
                        >
                            {user.status === 'Active' ? 'Suspend' : 'Unsuspend'}
                        </button>
                    )}
                </td>
            )}
            {/* Action buttons for PENDING_APPROVAL tab */}
            {type === 'pending' && (
                <td>
                    <button
                        className="action-button approve-button"
                        onClick={() => AdminDashboardViewModel.approveNutritionist(user.id)}
                        disabled={AdminDashboardViewModel.isLoading}
                    >
                        Approve
                    </button>
                    <button
                        className="action-button reject-button"
                        onClick={() => {
                            // Call directly on the singleton ViewModel instance
                            AdminDashboardViewModel.setSelectedUser(user);
                            AdminDashboardViewModel.setShowRejectionReasonModal(true);
                        }}
                        disabled={AdminDashboardViewModel.isLoading}
                    >
                        Reject
                    </button>
                </td>
            )}
        </tr>
    );
});


// User Accounts Content Component (now correctly using userAccountsVM)
const UserAccountsContent = observer(() => {
    // Access properties directly from the AdminDashboardViewModel singleton instance
    const {
        activeTab,
        filteredPendingAccounts,
        showUserDetailModal,
        selectedUser,
        isLoading,
        error,
        showRejectionReasonModal,
        rejectionReason,
        // Methods called directly on the singleton
        approveNutritionist,
        rejectNutritionist,
        viewCertificate,
        userAccountsVM // Direct access to the UserAccountsViewModel instance
    } = AdminDashboardViewModel; // Destructure directly from the AdminDashboardViewModel singleton

    // Destructure specific states and methods from userAccountsVM
    // No need to rename as we are using them directly from userAccountsVM
    const {
        searchTerm, // Use searchTerm directly
        filteredAllAccounts, // Use filteredAllAccounts directly
        isLoading: userAccountsLoading, // Specific loading for user accounts tab
        error: userAccountsError,       // Specific error for user accounts tab
    } = userAccountsVM; // Destructure from the userAccountsVM instance

    // Fetch accounts on component mount or when the tab changes to ensure fresh data
    useEffect(() => {
        AdminDashboardViewModel.fetchAccounts(); // This will trigger both pending and all user fetches
    }, [activeTab]);


    const handleOpenModal = (user) => {
        AdminDashboardViewModel.setSelectedUser(user); // Ensure direct call to the imported singleton ViewModel
        AdminDashboardViewModel.setShowUserDetailModal(true);
    };

    const handleCloseModal = () => {
        AdminDashboardViewModel.setShowUserDetailModal(false);
        AdminDashboardViewModel.setSelectedUser(null);
        // Refresh both sets of accounts after modal closes to reflect any changes
        AdminDashboardViewModel.fetchAccounts();
    };

    const handleSuspendUnsuspend = async (userId, currentStatus) => {
        console.log(`Attempting to change status for User ${userId} from ${currentStatus}`);
        try {
            if (currentStatus === 'Active') {
                await userAccountsVM.suspendUser(userId); // Explicitly call on userAccountsVM
            } else {
                await userAccountsVM.unsuspendUser(userId); // Explicitly call on userAccountsVM
            }
        } catch (operationError) {
            console.error("Error changing user status in component:", operationError);
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
                            value={searchTerm} // Use searchTerm directly from userAccountsVM
                            onChange={(e) => userAccountsVM.setSearchTerm(e.target.value)} // Call setSearchTerm directly on userAccountsVM
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

            {/* Display loading and error messages from both view models */}
            {(isLoading || userAccountsLoading) && <p className="loading-message">Loading accounts...</p>}
            {(error || userAccountsError) && <p className="error-message">{error || userAccountsError}</p>}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            {activeTab === 'ALL_ACCOUNTS' && <th>Account Type</th>}
                            <th>Status</th>
                            {activeTab === 'ALL_ACCOUNTS' && <th>User Since</th>}
                            {activeTab === 'PENDING_APPROVAL' && (
                                <>
                                    <th>Signed up at</th>
                                    <th>Documents</th>
                                </>
                            )}
                            <th>Action</th> {/* Single Action column for both tabs */}
                        </tr>
                    </thead>

                    <tbody>
                        {activeTab === 'ALL_ACCOUNTS' && filteredAllAccounts.length > 0 ? ( // Use filteredAllAccounts directly from userAccountsVM
                            filteredAllAccounts.map(user => (
                                <UserAccountRow
                                    key={user.id}
                                    user={user}
                                    onAction={handleSuspendUnsuspend} // This calls the specific action function
                                    onNameClick={handleOpenModal}
                                    type="all"
                                />
                            ))
                        ) : activeTab === 'PENDING_APPROVAL' && filteredPendingAccounts.length > 0 ? (
                            filteredPendingAccounts.map(user => (
                                <UserAccountRow
                                    key={user.id}
                                    user={user}
                                    onAction={() => { }} // Action is handled within UserAccountRow for pending
                                    onNameClick={handleOpenModal}
                                    type="pending"
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={activeTab === 'ALL_ACCOUNTS' ? '6' : '5'} className="no-data-message">
                                    {(isLoading || userAccountsLoading) ? '' : (activeTab === 'ALL_ACCOUNTS' ? 'No user accounts found.' : 'No accounts pending approval.')}
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
                    user={selectedUser} // Pass the selected user to the modal
                    onClose={handleCloseModal}
                    onApprove={approveNutritionist} // From AdminDashboardViewModel
                    onReject={() => AdminDashboardViewModel.setShowRejectionReasonModal(true)} // Directly call on ViewModel
                    onViewCertificate={viewCertificate} // From AdminDashboardViewModel
                    isPendingNutritionist={activeTab === 'PENDING_APPROVAL'} // Inform modal about context
                />
            )}

            {/* Rejection Reason Modal - controlled by AdminDashboardViewModel */}
            {showRejectionReasonModal && (
                <RejectionReasonModal
                    reason={rejectionReason}
                    setReason={(value) => AdminDashboardViewModel.setRejectionReason(value)} // Directly call on ViewModel
                    onConfirm={() => rejectNutritionist(selectedUser.id)}
                    onClose={() => AdminDashboardViewModel.setShowRejectionReasonModal(false)} // Directly call on ViewModel
                />
            )}
        </>
    );
});


// AdminDashboard Main Component
const AdminDashboard = observer(({ onLogout }) => {
    // Access currentView directly from AdminDashboardViewModel
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
                {currentView === 'rewards' && <AdminRewards />} {/* Render AdminRewards component */}
                {currentView === 'editWebsite' && <MarketingWebsiteEditorPage />}
                {currentView === 'userFeedbacks' && <UserFeedbacksPage />}
            </div>
        </div>
    );
});

export default AdminDashboard;