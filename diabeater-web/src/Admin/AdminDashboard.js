// src/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useLocation } from 'react-router-dom';
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

// Admin Sidebar Component - Updated to use React Router navigation
const AdminSidebar = observer(({ onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Map URL paths to view names for active state
    const getViewFromPath = (pathname) => {
        if (pathname.includes('/admin/profile')) return 'myProfile';
        if (pathname.includes('/admin/dashboard')) return 'dashboard';
        if (pathname.includes('/admin/user-accounts')) return 'userAccounts';
        if (pathname.includes('/admin/premium-accounts')) return 'premiumAccounts';
        if (pathname.includes('/admin/meal-plans')) return 'mealPlans';
        if (pathname.includes('/admin/export-report')) return 'exportReport';
        if (pathname.includes('/admin/rewards')) return 'rewards';
        if (pathname.includes('/admin/edit-website')) return 'editWebsite';
        if (pathname.includes('/admin/user-feedbacks')) return 'userFeedbacks';
        return 'dashboard';
    };

    const currentActiveView = getViewFromPath(location.pathname);

    const handleNavigation = (view) => {
        const routeMap = {
            'myProfile': '/admin/profile',
            'dashboard': '/admin/dashboard',
            'userAccounts': '/admin/user-accounts',
            'premiumAccounts': '/admin/premium-accounts',
            'mealPlans': '/admin/meal-plans',
            'exportReport': '/admin/export-report',
            'rewards': '/admin/rewards',
            'editWebsite': '/admin/edit-website',
            'userFeedbacks': '/admin/user-feedbacks'
        };

        if (routeMap[view]) {
            navigate(routeMap[view]);
        }
    };

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
                    className={`nav-item ${currentActiveView === 'myProfile' ? 'active' : ''}`}
                    onClick={() => handleNavigation('myProfile')}
                >
                    <i className="fas fa-user"></i>
                    <span>My Profile</span>
                </div>
                <div
                    className={`nav-item ${currentActiveView === 'dashboard' ? 'active' : ''}`}
                    onClick={() => handleNavigation('dashboard')}
                >
                    <i className="fas fa-home"></i>
                    <span>Dashboard</span>
                </div>
                <div
                    className={`nav-item ${currentActiveView === 'userAccounts' ? 'active' : ''}`}
                    onClick={() => handleNavigation('userAccounts')}
                >
                    <i className="fas fa-users"></i>
                    <span>User Accounts</span>
                </div>
                <div
                    className={`nav-item ${currentActiveView === 'premiumAccounts' ? 'active' : ''}`}
                    onClick={() => handleNavigation('premiumAccounts')}
                >
                    <i className="fas fa-star"></i>
                    <span>Premium</span>
                </div>
                <div
                    className={`nav-item ${currentActiveView === 'mealPlans' ? 'active' : ''}`}
                    onClick={() => handleNavigation('mealPlans')}
                >
                    <i className="fas fa-clipboard-list"></i>
                    <span>Meal Plans</span>
                </div>
                <div
                    className={`nav-item ${currentActiveView === 'exportReport' ? 'active' : ''}`}
                    onClick={() => handleNavigation('exportReport')}
                >
                    <i className="fas fa-file-export"></i>
                    <span>Export Report</span>
                </div>
                <div
                    className={`nav-item ${currentActiveView === 'rewards' ? 'active' : ''}`}
                    onClick={() => handleNavigation('rewards')}
                >
                    <i className="fas fa-trophy"></i>
                    <span>Rewards</span>
                </div>
                <div
                    className={`nav-item ${currentActiveView === 'editWebsite' ? 'active' : ''}`}
                    onClick={() => handleNavigation('editWebsite')}
                >
                    <i className="fas fa-globe"></i>
                    <span>Edit Website</span>
                </div>
                <div
                    className={`nav-item ${currentActiveView === 'userFeedbacks' ? 'active' : ''}`}
                    onClick={() => handleNavigation('userFeedbacks')}
                >
                    <i className="fas fa-comments"></i>
                    <span>User Feedback</span>
                </div>
            </nav>
            <button className="logout-button" onClick={handleLogout}>Log out</button>
        </div>
    );
});

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
        canCreateAccount,
        canCheckVerification,
        canResendEmail,
        setFormField,
        createAdminAccount,
        checkEmailVerification,
        resendVerificationEmail,
        clearMessages,
        resetFlow
    } = adminCreateAccountVM;

    const handleInputChange = (field, value) => {
        setFormField(field, value);
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        await createAdminAccount();
    };

    const handleCheckVerification = async () => {
        await checkEmailVerification();
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

                </header>
            </div>

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

            {/* Step 1: Create Account Form */}
            {!emailSent && (
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
                                    disabled={isCreating}
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
                                    disabled={isCreating}
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
                                disabled={isCreating}
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
                                disabled={isCreating}
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
                                    disabled={isCreating}
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
                                    disabled={isCreating}
                                    placeholder="Confirm password"
                                />
                                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={handleCreateAccount}
                            disabled={!canCreateAccount}
                            className="create-admin-button"
                        >
                            {isCreating ? 'Creating Account & Sending Email...' : 'Create Admin Account'}
                        </button>
                    </form>
                </div>
            )}

            {/* Step 2: Email Verification Section */}
            {emailSent && !accountCreated && (
                <div className="verification-section">
                    <h3>📧 Firebase Verification Email Sent!</h3>
                    <p>A verification email has been sent to: <strong>{formData.email}</strong></p>
                    <p>Please check your email (including spam/junk folder) and click the verification link.</p>

                    <div className="verification-flow">
                        <div className="flow-step">
                            <i className="fas fa-envelope-open-text"></i>
                            <div>
                                <strong>1. Check Your Email</strong>
                                <p>Look for an email from Firebase Authentication</p>
                            </div>
                        </div>
                        <div className="flow-step">
                            <i className="fas fa-mouse-pointer"></i>
                            <div>
                                <strong>2. Click Verification Link</strong>
                                <p>Click the link in the email to verify your account</p>
                            </div>
                        </div>
                        <div className="flow-step">
                            <i className="fas fa-check-circle"></i>
                            <div>
                                <strong>3. Complete Setup</strong>
                                <p>Come back here and click "Check Verification"</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="verification-actions">
                        <button 
                            onClick={handleCheckVerification}
                            disabled={!canCheckVerification}
                            className="check-verification-button"
                        >
                            {isCheckingVerification ? 'Checking Verification...' : 'Check Email Verification'}
                        </button>

                        {canResendEmail && (
                            <button
                                onClick={handleResendVerificationEmail}
                                disabled={isSendingVerification}
                                className="resend-verification-button"
                            >
                                {isSendingVerification ? 'Resending...' : 'Resend Verification Email'}
                            </button>
                        )}

                        <button 
                            onClick={handleStartOver}
                            className="start-over-button"
                        >
                            Start Over
                        </button>
                    </div>

                    <div className="verification-help">
                        <h4>📋 Troubleshooting</h4>
                        <ul>
                            <li>Check your spam/junk folder for the verification email</li>
                            <li>Make sure the email address is entered correctly</li>
                            <li>The verification email comes directly from Firebase</li>
                            <li>Click "Resend" if you don't receive the email within 5 minutes</li>
                            <li>After clicking the verification link, return here and click "Check Verification"</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Step 3: Success Section */}
            {accountCreated && createdAccount && (
                <div className="success-section">
                    <h3>🎉 Admin Account Created Successfully!</h3>
                    <p>The admin account for <strong>{createdAccount.email}</strong> has been created and email verified!</p>
                    <p>The admin can now login using their email and password.</p>
                    
                    <div className="success-details">
                        <div className="detail-item">
                            <i className="fas fa-user-shield"></i>
                            <span>Admin privileges have been granted</span>
                        </div>
                        <div className="detail-item">
                            <i className="fas fa-envelope-circle-check"></i>
                            <span>Email verification completed</span>
                        </div>
                        <div className="detail-item">
                            <i className="fas fa-key"></i>
                            <span>Account is ready for login</span>
                        </div>
                    </div>

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
// Updated UserAccountRow Component with separate action columns
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

            {/* FIXED: Separate action columns for pending approval */}
            {type === 'pending' && (
                <>
                    {/* Approve Column */}
                    <td>
                        <button
                            className="action-button approve-button"
                            onClick={() => AdminDashboardViewModel.approveNutritionist(user.id)}
                            disabled={AdminDashboardViewModel.isLoading}
                        >
                            Approve
                        </button>
                    </td>
                    {/* Reject Column */}
                    <td>
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
                </>
            )}

            {/* Keep the original single action column for 'all' type */}
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

// FIXED USER ACCOUNTS CONTENT WITH PROPER PAGINATION AND URL ROUTING
const UserAccountsContent = observer(({ activeUserAccountTab }) => {
    const navigate = useNavigate();
    const location = useLocation();

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

    // Determine current tab from URL or prop
    const getCurrentTab = () => {
        if (activeUserAccountTab) {
            const tabMap = {
                'all': 'ALL_ACCOUNTS',
                'pending': 'PENDING_APPROVAL',
                'createAdmin': 'CREATE_ADMIN'
            };
            return tabMap[activeUserAccountTab] || 'ALL_ACCOUNTS';
        }

        const pathname = location.pathname;
        if (pathname.includes('/user-accounts/pending')) return 'PENDING_APPROVAL';
        if (pathname.includes('/user-accounts/create-admin')) return 'CREATE_ADMIN';
        if (pathname.includes('/user-accounts/all')) return 'ALL_ACCOUNTS';
        return 'ALL_ACCOUNTS'; // default
    };

    const currentTab = getCurrentTab();

    // Update ViewModel tab when URL changes
    useEffect(() => {
        AdminDashboardViewModel.setActiveTab(currentTab);
    }, [currentTab]);

    useEffect(() => {
        AdminDashboardViewModel.fetchAccounts();
    }, [activeTab]);

    // Reset to page 1 when tab changes or data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm]);

    // Updated tab navigation handlers to use URL routing
    const handleTabNavigation = (tab) => {
        const routeMap = {
            'ALL_ACCOUNTS': '/admin/user-accounts/all',
            'PENDING_APPROVAL': '/admin/user-accounts/pending',
            'CREATE_ADMIN': '/admin/user-accounts/create-admin'
        };

        if (routeMap[tab]) {
            navigate(routeMap[tab]);
        }
    };

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
     const handleRejectNutritionist = async (userId, reasonParam) => {
        try {
            // Use the reason parameter if provided, otherwise fall back to state
            const finalReason = reasonParam || rejectionReason;
            
            console.log('Rejecting nutritionist:', userId, 'with reason:', finalReason);
            
            if (!finalReason || !finalReason.trim()) {
                alert('Please provide a reason for rejection.');
                return;
            }
            
            // Call the rejection method from AdminDashboardViewModel
            await AdminDashboardViewModel.rejectNutritionist(userId, finalReason.trim());
            
            // Close the modal and reset state
            setShowRejectionReasonModal(false);
            setSelectedUser(null);
            setRejectionReason('');
            
            // Refresh the data
            await AdminDashboardViewModel.fetchAccounts();
            
            alert('Nutritionist has been rejected and notification email sent!');
            
        } catch (error) {
            console.error('Error rejecting nutritionist:', error);
            alert(`Failed to reject nutritionist: ${error.message}`);
        }
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
                    onClick={() => handleTabNavigation('ALL_ACCOUNTS')}
                >
                    ALL ACCOUNTS
                </button>
                <button
                    className={`tab-button ${activeTab === 'PENDING_APPROVAL' ? 'active' : ''}`}
                    onClick={() => handleTabNavigation('PENDING_APPROVAL')}
                >
                    PENDING APPROVAL
                </button>
                <button
                    className={`tab-button ${activeTab === 'CREATE_ADMIN' ? 'active' : ''}`}
                    onClick={() => handleTabNavigation('CREATE_ADMIN')}
                >
                    CREATE ADMIN
                </button>
            </div>

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
                                            <th>Approve</th>
                                            <th>Reject</th>
                                        </>
                                    )}
                                    {activeTab === 'ALL_ACCOUNTS' && <th>Action</th>}
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
                                        <td colSpan={activeTab === 'ALL_ACCOUNTS' ? '6' : '7'} className="no-data-message">
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

            {showRejectionReasonModal && selectedUser && (
                <RejectionReasonModal
                    reason={rejectionReason}
                    setReason={(value) => setRejectionReason(value)}
                    onConfirm={(reasonFromModal) => {
                        // Handle both parameter and state-based reason
                        const finalReason = reasonFromModal || rejectionReason;
                        handleRejectNutritionist(selectedUser.id, finalReason);
                    }}
                    onClose={() => {
                        setShowRejectionReasonModal(false);
                        setSelectedUser(null);
                        setRejectionReason('');
                    }}
                />
            )}
        </>
    );
});

// AdminDashboard Main Component
const AdminDashboard = observer(({ onLogout, activeSection, activeMealPlanTab, activeUserAccountTab }) => {
    const location = useLocation();

    const getCurrentView = () => {
        if (activeSection) return activeSection;

        const pathname = location.pathname;
        if (pathname.includes('/admin/profile')) return 'myProfile';
        if (pathname.includes('/admin/user-accounts')) return 'userAccounts';
        if (pathname.includes('/admin/premium-accounts')) return 'premiumAccounts';
        if (pathname.includes('/admin/meal-plans') || pathname.includes('/admin/meal-plan-detail')) return 'mealPlans';
        if (pathname.includes('/admin/export-report')) return 'exportReport';
        if (pathname.includes('/admin/rewards')) return 'rewards';
        if (pathname.includes('/admin/edit-website')) return 'editWebsite';
        if (pathname.includes('/admin/user-feedbacks')) return 'userFeedbacks';
        return 'dashboard'; // default to dashboard
    };

    const currentView = getCurrentView();

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
            <AdminSidebar onLogout={onLogout} />
            <div className="admin-main-content">
                {currentView === 'myProfile' && <AdminProfile />}
                {currentView === 'dashboard' && <AdminStatDashboard />}
                {currentView === 'userAccounts' && <UserAccountsContent activeUserAccountTab={activeUserAccountTab} />}
                {currentView === 'premiumAccounts' && <PremiumPage />}
                {(currentView === 'mealPlans' || currentView === 'mealPlanDetail') && <AdminMealPlans activeMealPlanTab={activeMealPlanTab} />}
                {currentView === 'exportReport' && <AdminExportReport />}
                {currentView === 'rewards' && <AdminRewards />}
                {currentView === 'editWebsite' && <MarketingWebsiteEditorPage />}
                {currentView === 'userFeedbacks' && <UserFeedbacksPage />}
            </div>
        </div>
    );
});

export default AdminDashboard;

