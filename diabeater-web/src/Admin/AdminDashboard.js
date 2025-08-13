// src/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import AdminDashboardViewModel from '../ViewModels/AdminDashboardViewModel'; // Ensure this path is correct
import AdminViewModel from '../ViewModels/AdminViewModel'; // Ensure this path is correct
import adminCreateAccountVM from '../ViewModels/AdminCreateAccountViewModel'; // Add this import
import UserDetailModal from './UserDetailModal'; // Ensure this path is correct
import RejectionReasonModal from './RejectionReasonModal'; // Ensure this path is correct
import AdminProfile from './AdminProfile';
import AdminStatDashboard from './AdminStatDashboard';
import AdminMealPlans from './AdminMealPlans';
import AdminExportReport from './AdminExportReport';
import MarketingWebsiteEditorPage from './MarketingWebsiteEditorPage';
import UserFeedbacksPage from './UserFeedbacksPage';
import AdminRewards from './AdminRewards';
import adminStatViewModel from '../ViewModels/AdminStatViewModel';
import PremiumPage from './PremiumPage';
import premiumStatViewModel from '../ViewModels/PremiumStatViewModel'; 

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
                    <i className="fas fa-star"></i> {/* You can choose an appropriate icon */}
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

// Admin Create Account Content Component - FIXED SEND VERIFICATION BUTTON
const AdminCreateAccountContent = observer(() => {
    const {
        formData,
        isCreating,
        isCheckingVerification,
        isSendingVerification,
        errors,
        globalError,
        successMessage,
        emailSent,
        emailVerified,
        accountCreated,
        createdAccount,
        pendingAccounts,
        canSendVerificationEmail,
        canCheckVerification,
        canCreateAccount,
        setFormField,
        sendVerificationEmail,
        checkEmailVerification,
        createAdminAccount,
        resendVerificationEmail,
        fetchPendingAccounts,
        clearMessages,
        resetFlow
    } = adminCreateAccountVM;

    useEffect(() => {
        fetchPendingAccounts();
    }, []);

    const handleInputChange = (field, value) => {
        setFormField(field, value);
    };

    const handleSendVerificationEmail = async (e) => {
        e.preventDefault();
        await sendVerificationEmail();
    };

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Handles the action of checking email verification status.
 * Calls the checkEmailVerification function to verify the status.
/*******  0e126236-1bbc-4fef-9527-c688172c4bad  *******/
    const handleCheckVerification = async () => {
        await checkEmailVerification();
    };

    const handleCreateAccount = async () => {
        await createAdminAccount();
    };

    const handleResendVerificationEmail = async () => {
        await resendVerificationEmail();
    };

    const handleStartOver = () => {
        resetFlow();
    };

    return (
        <div className="admin-create-account-content">
            <div className="admin-dashboard-main-content-area">
                <header className="admin-header">
                    <h1 className="admin-page-title">CREATE ADMIN ACCOUNT</h1>
                </header>
            </div>

            {/* Messages */}
            {globalError && (
                <div className="error-message">
                    {globalError}
                    <button onClick={clearMessages} className="close-message-btn">✕</button>
                </div>
            )}
            
            {successMessage && (
                <div className="success-message">
                    {successMessage}
                    <button onClick={clearMessages} className="close-message-btn">✕</button>
                </div>
            )}

        

            {/* Create Account Form */}
            <div className="create-admin-form-section">
                <h2>Admin Account Details</h2>
                <form className="admin-create-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="firstName">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                className={errors.firstName ? 'error' : ''}
                                disabled={emailSent || isSendingVerification}
                                placeholder="Enter first name"
                            />
                            {errors.firstName && <span className="field-error">{errors.firstName}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                className={errors.lastName ? 'error' : ''}
                                disabled={emailSent || isSendingVerification}
                                placeholder="Enter last name"
                            />
                            {errors.lastName && <span className="field-error">{errors.lastName}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={errors.email ? 'error' : ''}
                            disabled={emailSent || isSendingVerification}
                            placeholder="Enter email address"
                        />
                        {errors.email && <span className="field-error">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="dob">Date of Birth</label>
                        <input
                            type="date"
                            id="dob"
                            value={formData.dob}
                            onChange={(e) => handleInputChange('dob', e.target.value)}
                            className={errors.dob ? 'error' : ''}
                            disabled={emailSent || isSendingVerification}
                        />
                        {errors.dob && <span className="field-error">{errors.dob}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className={errors.password ? 'error' : ''}
                                disabled={emailSent || isSendingVerification}
                                placeholder="Enter password (min. 6 characters)"
                            />
                            {errors.password && <span className="field-error">{errors.password}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                className={errors.confirmPassword ? 'error' : ''}
                                disabled={emailSent || isSendingVerification}
                                placeholder="Confirm password"
                            />
                            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                        </div>
                    </div>

                    {/* Step 1: Send Verification Email */}
                    {!emailSent && (
                        <button 
                            type="button"
                            onClick={handleSendVerificationEmail}
                            className="create-admin-button"
                            
                        >
                            {isSendingVerification ? 'Sending Verification Email...' : 'Send Verification Email'}
                        </button>
                    )}
                </form>
            </div>

            {/* Step 2: Email Verification Section */}
            {emailSent && !emailVerified && (
                <div className="verification-section">
                    <h3>📧 Verification Email Sent!</h3>
                    <p>We've sent a verification email to: <strong>{formData.email}</strong></p>
                    <p>Please check your email and click the verification link, then click the button below to proceed.</p>
                    
                    <div className="verification-actions">
                        <button 
                            onClick={handleCheckVerification}
                            disabled={!canCheckVerification}
                            className="check-verification-button"
                        >
                            {isCheckingVerification ? 'Checking Verification...' : 'Check Email Verification'}
                        </button>

                        <button 
                            onClick={handleResendVerificationEmail}
                            disabled={isSendingVerification}
                            className="resend-verification-button"
                        >
                            {isSendingVerification ? 'Sending...' : 'Resend Verification Email'}
                        </button>

                        <button 
                            onClick={handleStartOver}
                            className="start-over-button"
                        >
                            Start Over
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Create Account Section */}
            {emailVerified && !accountCreated && (
                <div className="create-account-section">
                    <h3>✅ Email Verified Successfully!</h3>
                    <p>Your email has been verified. You can now create the admin account.</p>
                    
                    <div className="create-account-actions">
                        <button 
                            onClick={handleCreateAccount}
                            disabled={!canCreateAccount}
                            className="create-admin-button"
                        >
                            {isCreating ? 'Creating Admin Account...' : 'Create Admin Account'}
                        </button>

                        <button 
                            onClick={handleStartOver}
                            className="start-over-button"
                        >
                            Start Over
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Success Section */}
            {accountCreated && createdAccount && (
                <div className="success-section">
                    <h3>🎉 Admin Account Created Successfully!</h3>
                    <p>The admin account for <strong>{createdAccount.email}</strong> has been created and is now active.</p>
                    <p>The admin can now login using their email and password.</p>
                    
                    <div className="success-actions">
                        <button 
                            onClick={handleStartOver}
                            className="create-another-button"
                        >
                            Create Another Admin Account
                        </button>
                    </div>
                </div>
            )}
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

// FIXED PAGINATION COMPONENT WITH 10 ITEMS LOGIC
const Pagination = observer(({ currentData, itemsPerPage = 10, onPageChange, currentPage = 1 }) => {
    const totalItems = currentData?.length || 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    
    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };
    
    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };
    
    const handlePageClick = (pageNumber) => {
        onPageChange(pageNumber);
    };

    // Calculate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
        }
        
        return pages;
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
            
            {getPageNumbers().map(pageNumber => (
                <button
                    key={pageNumber}
                    onClick={() => handlePageClick(pageNumber)}
                    className={currentPage === pageNumber ? 'active' : ''}
                >
                    {pageNumber}
                </button>
            ))}
            
            <button 
                onClick={handleNext} 
                disabled={currentPage >= totalPages}
                className={currentPage >= totalPages ? 'disabled' : ''}
            >
                &gt;
            </button>
            
            <span className="pagination-info">
                Page {currentPage} of {totalPages} ({totalItems} total items)
            </span>
        </div>
    );
});

// FIXED USER ACCOUNTS CONTENT WITH PROPER PAGINATION
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

    // PAGINATION STATE
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        AdminDashboardViewModel.fetchAccounts();
    }, [activeTab]);

    // Reset to page 1 when tab changes or data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm]);

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

    // PAGINATION LOGIC
    const currentData = getCurrentData();
    const totalItems = currentData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = currentData.slice(startIndex, endIndex);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    return (
        <>
            <div className="admin-dashboard-main-content-area">
                <header className="admin-header">
                    <h1 className="admin-page-title">USER ACCOUNTS</h1>
                    <div className="admin-search-bar">
                        <input
                            type="text"
                            placeholder="Search by name or email"
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
                <button
                    className={`tab-button ${activeTab === 'CREATE_ADMIN' ? 'active' : ''}`}
                    onClick={() => AdminDashboardViewModel.setActiveTab('CREATE_ADMIN')}
                >
                    CREATE ADMIN
                </button>
            </div>

            {/* Render different content based on active tab */}
            {activeTab === 'CREATE_ADMIN' ? (
                <AdminCreateAccountContent />
            ) : (
                <>
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
                                {currentPageData.length > 0 ? (
                                    currentPageData.map(user => (
                                        <UserAccountRow
                                            key={user.id}
                                            user={user}
                                            onAction={handleSuspendUnsuspend}
                                            onNameClick={handleOpenModal}
                                            type={activeTab === 'ALL_ACCOUNTS' ? 'all' : 'pending'}
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
                        
                        {/* FIXED PAGINATION */}
                        {currentData.length > 0 && (
                            <Pagination 
                                currentData={currentData} 
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </div>
                </>
            )}

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
                {currentView === 'premiumAccounts' && <PremiumPage />} {/* RENDER NEW PREMIUM PAGE */}
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