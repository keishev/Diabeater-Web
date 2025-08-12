// src/AdminDashboard.js - Fixed Version
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import AdminDashboardViewModel from '../ViewModels/AdminDashboardViewModel';
import AdminViewModel from '../ViewModels/AdminViewModel';
import UserDetailModal from './UserDetailModal';
import RejectionReasonModal from './RejectionReasonModal';
import AdminProfile from './AdminProfile';
import AdminStatDashboard from './AdminStatDashboard';
import AdminMealPlans from './AdminMealPlans';
import AdminExportReport from './AdminExportReport';
import MarketingWebsiteEditorPage from './MarketingWebsiteEditorPage';
import UserFeedbacksPage from './UserFeedbacksPage';
import AdminRewards from './AdminRewards';
import adminStatViewModel from '../ViewModels/AdminStatViewModel';
import PremiumPage from './PremiumPage';
import premiumStatViewModel from '../ViewModels/PremiumStatViewModel'; // Add this import

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
                    className={`nav-item ${currentView === 'premiumAccounts' ? 'active' : ''}`}
                    onClick={() => onNavigate('premiumAccounts')}
                >
                    <i className="fas fa-star"></i>
                    <span>Premium</span>
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

// User Account Table Row Component (no changes needed for this specific task)
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
            {type === 'all' && <td>{user.role || 'N/A'}</td>}
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

// Pagination Component with dynamic calculation
const Pagination = observer(({ currentData, itemsPerPage = 10 }) => {
    const [currentPage, setCurrentPage] = useState(1);
    
    const totalItems = currentData?.length || 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    
    // Reset to page 1 when data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [currentData]);
    
    const handlePrevious = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };
    
    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };
    
    return (
        <div className="pagination">
            <button 
                onClick={handlePrevious} 
                disabled={currentPage <= 1}
                className={currentPage <= 1 ? 'disabled' : ''}
            >
                &lt;
            </button>
            <span>Page {currentPage}/{totalPages}</span>
            <button 
                onClick={handleNext} 
                disabled={currentPage >= totalPages}
                className={currentPage >= totalPages ? 'disabled' : ''}
            >
                &gt;
            </button>
        </div>
    );
});

// User Accounts Content Component (FIXED VERSION)
const UserAccountsContent = observer(() => {
    const {
        activeTab,
        filteredPendingAccounts,
        isLoading,
        error,
        showRejectionReasonModal,
        rejectionReason,
        selectedUser,
        showUserDetailModal,
        userAccountsVM,
        setSelectedUser,
        setShowUserDetailModal,
        setShowRejectionReasonModal,
        setRejectionReason,
    } = AdminDashboardViewModel;

    const {
        searchTerm,
        filteredAllAccounts,
        isLoading: userAccountsLoading,
        error: userAccountsError,
    } = userAccountsVM;

    useEffect(() => {
        AdminDashboardViewModel.fetchAccounts();
    }, [activeTab]);

    // FIXED: Enhanced handleOpenModal to fetch premium data like PremiumPage does
    const handleOpenModal = async (user) => {
        console.log("[AdminDashboard] Opening user detail modal for:", user);
        
        try {
            // First set the basic user data
            setSelectedUser(user);
            
            // Try to enrich the user with premium subscription data
            if (user.id || user._id) {
                const userId = user.id || user._id;
                
                // Check if premiumStatViewModel has the required methods
                if (typeof premiumStatViewModel.loadPremiumData === 'function') {
                    // Load premium data if not already loaded
                    if (premiumStatViewModel.allPremiumUserAccounts.length === 0) {
                        await premiumStatViewModel.loadPremiumData();
                    }
                    
                    // Find the user in premium accounts
                    const premiumUser = premiumStatViewModel.allPremiumUserAccounts.find(
                        premiumAccount => premiumAccount._id === userId || premiumAccount.id === userId
                    );
                    
                    if (premiumUser) {
                        console.log("[AdminDashboard] Found premium user data:", premiumUser);
                        setSelectedUser(premiumUser);
                    } else {
                        console.log("[AdminDashboard] No premium data found for user, using basic data");
                        // Enrich basic user data with default premium structure
                        const enrichedUser = {
                            ...user,
                            _id: userId,
                            displayName: user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}` 
                                : (user.name || user.email),
                            displayStatus: 'inactive',
                            displayRenewalDate: 'N/A',
                            currentSubscription: null
                        };
                        setSelectedUser(enrichedUser);
                    }
                } else {
                    console.log("[AdminDashboard] PremiumStatViewModel methods not available, using basic user data");
                }
            }
            
            // Open the modal
            setShowUserDetailModal(true);
            
        } catch (error) {
            console.error("[AdminDashboard] Error enriching user data:", error);
            // Still open the modal with basic user data even if premium data fetch fails
            setShowUserDetailModal(true);
        }
    };

    const handleCloseModal = () => {
        setShowUserDetailModal(false);
        setSelectedUser(null);
        AdminDashboardViewModel.fetchAccounts();
    };

    const handleApproveFromModal = async (userId) => {
        await adminStatViewModel.approveNutritionist(userId);
        handleCloseModal();
    };

    const handleRejectFromModal = async (userId) => {
        setSelectedUser(adminStatViewModel.selectedUserForManagement);
        setShowRejectionReasonModal(true);
    };

    const handleConfirmRejectFromModal = async (userId, reason) => {
        await adminStatViewModel.rejectNutritionist(userId, reason);
        setShowRejectionReasonModal(false);
        handleCloseModal();
    };

    const handleViewDocumentFromModal = async (userId) => {
        await adminStatViewModel.viewCertificate(userId);
    };

    const handleSuspendFromModal = async (userId, isSuspended) => {
        await adminStatViewModel.suspendUserAccount(userId, isSuspended);
        handleCloseModal();
    };

    const handleChangeRoleFromModal = async (userId, newRole) => {
        await adminStatViewModel.updateUserRole(userId, newRole);
        handleCloseModal();
    };

    const handleDeleteAccountFromModal = async (userId) => {
        await adminStatViewModel.deleteUserAccount(userId);
        handleCloseModal();
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

    // Get current data based on active tab for pagination
    const getCurrentData = () => {
        return activeTab === 'ALL_ACCOUNTS' ? filteredAllAccounts : filteredPendingAccounts;
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
                                    onNameClick={handleOpenModal}
                                    type="all"
                                />
                            ))
                        ) : activeTab === 'PENDING_APPROVAL' && filteredPendingAccounts.length > 0 ? (
                            filteredPendingAccounts.map(user => (
                                <UserAccountRow
                                    key={user.id}
                                    user={user}
                                    onAction={() => { }}
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
                
                {/* Dynamic Pagination */}
                <Pagination currentData={getCurrentData()} itemsPerPage={10} />
            </div>

            {/* Render UserDetailModal using states from AdminDashboardViewModel */}
            {showUserDetailModal && selectedUser && (
                <UserDetailModal
                    user={selectedUser}
                    onClose={handleCloseModal}
                    onApprove={handleApproveFromModal}
                    onReject={handleRejectFromModal}
                    onViewDocument={handleViewDocumentFromModal}
                    onSuspend={handleSuspendFromModal}
                    onUnsuspend={handleSuspendFromModal}
                    onChangeRole={handleChangeRoleFromModal}
                    onDeleteAccount={handleDeleteAccountFromModal}
                    loading={adminStatViewModel.loading}
                    error={adminStatViewModel.error}
                    success={adminStatViewModel.success}
                    showRejectionReasonModal={showRejectionReasonModal}
                    rejectionReason={rejectionReason}
                    setRejectionReason={setRejectionReason}
                    onConfirmReject={handleConfirmRejectFromModal}
                />
            )}

            {/* Rejection Reason Modal - still controlled by AdminDashboardViewModel */}
            {showRejectionReasonModal && (
                <RejectionReasonModal
                    reason={rejectionReason}
                    setReason={(value) => setRejectionReason(value)}
                    onConfirm={() => handleConfirmRejectFromModal(selectedUser.id, rejectionReason)}
                    onClose={() => setShowRejectionReasonModal(false)}
                />
            )}
        </>
    );
});

// AdminDashboard Main Component
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
                {currentView === 'premiumAccounts' && <PremiumPage />}
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