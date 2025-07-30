// src/AdminDashboard.js

import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import AdminDashboardViewModel from '../ViewModels/AdminDashboardViewModel'; // Ensure this path is correct
// Keep this import if NutritionistApplicationViewModel is still directly used or needed by other components
// import NutritionistApplicationViewModel from '../ViewModels/NutritionistApplicationViewModel'; // Removed if not directly used
import AdminViewModel from '../ViewModels/AdminViewModel'; // Ensure this path is correct
import UserDetailModal from './UserDetailModal'; // Ensure this path is correct
import RejectionReasonModal from './RejectionReasonModal'; // Ensure this path is correct
import AdminProfile from './AdminProfile';
import AdminStatDashboard from './AdminStatDashboard';
import AdminMealPlans from './AdminMealPlans';
import AdminExportReport from './AdminExportReport';
import MarketingWebsiteEditorPage from './MarketingWebsiteEditorPage';
import UserFeedbacksPage from './UserFeedbacksPage';
import AdminRewards from './AdminRewards';
// Import adminStatViewModel ONLY if its methods are called directly in UserAccountsContent,
// otherwise, pass them as callbacks to UserDetailModal.
// For now, we'll keep it as the action provider
import adminStatViewModel from '../ViewModels/AdminStatViewModel'; // Make sure this path is correct

import './AdminDashboard.css';
import './AdminStatDashboard.css';

// Admin Sidebar Component (no changes needed)
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
                    className={`nav-item ${currentView === 'rewards' ? 'active' : ''}`}
                    onClick={() => onNavigate('rewards')}
                >
                    <i className="fas fa-trophy"></i>
                    <span>Rewards</span>
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
                    <span>User Feedback</span>
                </div>
            </nav>
            <button className="logout-button" onClick={handleLogout}>Log out</button>
        </div>
    );
});

// User Account Table Row Component (no changes needed)
const UserAccountRow = observer(({ user, onAction, onNameClick, type }) => {
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
            {type === 'all' && <td>{user.accountType || 'N/A'}</td>}
            <td className={statusClass}>
                <span className="status-dot"></span>{user.status === 'approved' ? 'Active' : user.status}
            </td>
            {type === 'all' && <td>{user.userSince || 'N/A'}</td>}
            {type === 'pending' && <td>{user.appliedDate || 'N/A'}</td>}

            {type === 'pending' && (
                <td>
                    <button
                        className="doc-action-button view-button"
                        onClick={() => AdminDashboardViewModel.viewCertificate(user.id)}
                        disabled={AdminDashboardViewModel.isLoading}
                    >
                        VIEW
                    </button>
                </td>
            )}

            {type === 'all' && (
                <td>
                    {user.accountType !== 'admin' && (
                        <button
                            className={`action-button ${user.status === 'Active' ? 'suspend-button' : 'unsuspend-button'}`}
                            onClick={() => onAction(user.id, user.status)}
                            disabled={AdminDashboardViewModel.userAccountsVM.isLoading}
                        >
                            {user.status === 'Active' ? 'Suspend' : 'Unsuspend'}
                        </button>
                    )}
                </td>
            )}
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
                            AdminDashboardViewModel.setSelectedUser(user); // Still used for RejectionReasonModal
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


// User Accounts Content Component (now correctly using AdminDashboardViewModel for modal and passing actions)
const UserAccountsContent = observer(() => {
    // Access properties directly from the AdminDashboardViewModel singleton instance
    const {
        activeTab,
        filteredPendingAccounts,
        isLoading,
        error,
        showRejectionReasonModal,
        rejectionReason,
        // States for the UserDetailModal, managed by AdminDashboardViewModel
        selectedUser,
        showUserDetailModal,
        // Methods called directly on the singleton
        approveNutritionist,
        rejectNutritionist,
        viewCertificate,
        userAccountsVM, // Direct access to the UserAccountsViewModel instance
        // Setters from AdminDashboardViewModel
        setSelectedUser,
        setShowUserDetailModal,
        setShowRejectionReasonModal,
        setRejectionReason,
    } = AdminDashboardViewModel;

    // Destructure specific states and methods from userAccountsVM
    const {
        searchTerm,
        filteredAllAccounts,
        isLoading: userAccountsLoading,
        error: userAccountsError,
    } = userAccountsVM;

    useEffect(() => {
        AdminDashboardViewModel.fetchAccounts();
    }, [activeTab]);

    // Handle opening the UserDetailModal
    const handleOpenModal = (user) => {
        setSelectedUser(user); // Set the user in AdminDashboardViewModel
        setShowUserDetailModal(true); // Show modal via AdminDashboardViewModel
    };

    // Handle closing the UserDetailModal
    const handleCloseModal = () => {
        setShowUserDetailModal(false); // Hide modal via AdminDashboardViewModel
        setSelectedUser(null); // Clear the selected user
        AdminDashboardViewModel.fetchAccounts(); // Refresh accounts after modal closes
    };

    // Action handlers for UserDetailModal, calling methods on adminStatViewModel
    const handleApproveFromModal = async (userId) => {
        await adminStatViewModel.approveNutritionist(userId);
        handleCloseModal(); // Close modal after action
    };

    const handleRejectFromModal = async (userId) => {
        // This will open the rejection reason modal, which AdminDashboardViewModel already handles
        // And then the confirm reject action from that modal will handle the actual rejection via adminStatViewModel
        setSelectedUser(adminStatViewModel.selectedUserForManagement); // Ensure AdminDashboardViewModel.selectedUser is correctly set for the rejection modal
        setShowRejectionReasonModal(true);
    };

    const handleConfirmRejectFromModal = async (userId, reason) => {
        await adminStatViewModel.rejectNutritionist(userId, reason);
        setShowRejectionReasonModal(false); // Close rejection reason modal
        handleCloseModal(); // Close main detail modal
    };


    const handleViewDocumentFromModal = async (userId) => {
        await adminStatViewModel.viewCertificate(userId);
    };

    const handleSuspendFromModal = async (userId, isSuspended) => {
        await adminStatViewModel.suspendUserAccount(userId, isSuspended);
        handleCloseModal(); // Close modal after action
    };

    const handleChangeRoleFromModal = async (userId, newRole) => {
        await adminStatViewModel.updateUserRole(userId, newRole);
        handleCloseModal(); // Close modal after action
    };

    const handleDeleteAccountFromModal = async (userId) => {
        await adminStatViewModel.deleteUserAccount(userId);
        handleCloseModal(); // Close modal after action
    };


    const handleSuspendUnsuspend = async (userId, currentStatus) => {
        console.log(`Attempting to change status for User ${userId} from ${currentStatus}`);
        try {
            if (currentStatus === 'Active') {
                await userAccountsVM.suspendUser(userId);
            } else {
                await userAccountsVM.unsuspendUser(userId);
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
                            value={searchTerm}
                            onChange={(e) => userAccountsVM.setSearchTerm(e.target.value)}
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
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {activeTab === 'ALL_ACCOUNTS' && filteredAllAccounts.length > 0 ? (
                            filteredAllAccounts.map(user => (
                                <UserAccountRow
                                    key={user.id}
                                    user={user}
                                    onAction={handleSuspendUnsuspend}
                                    onNameClick={handleOpenModal} // <-- This calls the updated handleOpenModal
                                    type="all"
                                />
                            ))
                        ) : activeTab === 'PENDING_APPROVAL' && filteredPendingAccounts.length > 0 ? (
                            filteredPendingAccounts.map(user => (
                                <UserAccountRow
                                    key={user.id}
                                    user={user}
                                    onAction={() => { }}
                                    onNameClick={handleOpenModal} // <-- This calls the updated handleOpenModal
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
                    <span>Page 1/5</span>
                    <button>&gt;</button>
                </div>
            </div>

            {/* Render UserDetailModal using states from AdminDashboardViewModel */}
            {showUserDetailModal && selectedUser && (
                <UserDetailModal
                    user={selectedUser} // <-- Pass the selected user as a prop
                    onClose={handleCloseModal}
                    // Pass down action handlers, which will call adminStatViewModel methods
                    onApprove={handleApproveFromModal}
                    onReject={handleRejectFromModal}
                    onViewDocument={handleViewDocumentFromModal}
                    onSuspend={handleSuspendFromModal}
                    onUnsuspend={handleSuspendFromModal} // Use the same suspend method with a flag
                    onChangeRole={handleChangeRoleFromModal}
                    onDeleteAccount={handleDeleteAccountFromModal}
                    // Pass loading, error, success states from adminStatViewModel for actions
                    loading={adminStatViewModel.loading}
                    error={adminStatViewModel.error}
                    success={adminStatViewModel.success}
                    // Pass rejection reason modal states
                    showRejectionReasonModal={showRejectionReasonModal} // This one from AdminDashboardVM
                    rejectionReason={rejectionReason}                   // This one from AdminDashboardVM
                    setRejectionReason={setRejectionReason}             // This one from AdminDashboardVM
                    onConfirmReject={handleConfirmRejectFromModal}      // New prop for confirming rejection
                />
            )}

            {/* Rejection Reason Modal - still controlled by AdminDashboardViewModel */}
            {showRejectionReasonModal && (
                <RejectionReasonModal
                    reason={rejectionReason}
                    setReason={(value) => setRejectionReason(value)}
                    onConfirm={() => handleConfirmRejectFromModal(selectedUser.id, rejectionReason)} // Use new handler
                    onClose={() => setShowRejectionReasonModal(false)}
                />
            )}
        </>
    );
});


// AdminDashboard Main Component (no changes needed)
const AdminDashboard = observer(({ onLogout }) => {
    const { currentView } = AdminDashboardViewModel;

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
                {currentView === 'rewards' && <AdminRewards />}
                {currentView === 'editWebsite' && <MarketingWebsiteEditorPage />}
                {currentView === 'userFeedbacks' && <UserFeedbacksPage />}
            </div>
        </div>
    );
});

export default AdminDashboard;