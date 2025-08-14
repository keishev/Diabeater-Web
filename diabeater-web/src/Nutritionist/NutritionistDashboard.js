import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite'; // Import observer for MobX
import {Routes, Route, Link, useNavigate, useLocation, Navigate} from 'react-router-dom';
import './NutritionistDashboard.css';
import CreateMealPlan from './CreateMealPlan';
import NutritionistProfile from './NutritionistProfile';
import MealPlanDetail from './MealPlanDetail'; // Correct path for MealPlanDetail
import UpdateMealPlan from './UpdateMealPlan';
import NotificationList from './NotificationList';
import mealPlanViewModel from '../ViewModels/MealPlanViewModel'; // Import the MobX ViewModel
import AuthService from '../Services/AuthService'; // Assuming this provides current user data

// --- MealPlanCard component ---
// This component can remain largely the same, as it receives props
const MealPlanCard = ({ mealPlan, onClick, onUpdateClick, onDeleteClick, onApproveClick, onRejectClick, isAdmin }) => {
    // Determine the display status for clarity
    const displayStatus = mealPlan.status === 'UPLOADED' ? 'DRAFT / UNSUBMITTED' : mealPlan.status.replace(/_/g, ' ');
    // Use imageUrl from mealPlan data directly, fallback to a local asset path if needed
    const imageUrl = mealPlan.imageUrl || `/assetscopy/${mealPlan.imageFileName}`;

    const cardClassName = `meal-plan-card meal-plan-card--${mealPlan.status.toLowerCase().replace(/\s|\//g, '-')}`;

    // Determine if update/delete buttons should be disabled for nutritionists
    // Nutritionists can update/delete if it's PENDING_APPROVAL, REJECTED, or UPLOADED.
    // They cannot modify APPROVED plans.
    const isNutritionistActionDisabled = false; // Set to false to always enable for nutritionists

    return (
        <div className={cardClassName} onClick={() => onClick(mealPlan._id)}> {/* Pass ID to select for detail */}
            <div className="meal-plan-image-wrapper">
                <img src={imageUrl} alt={mealPlan.name} className="meal-plan-image" />
                <div className="meal-plan-overlay">
                    <div className="meal-plan-stats">
                        <span className="saves-count">
                            <i className="fas fa-bookmark"></i> {mealPlan.saveCount || 0}
                        </span>
                    </div>
                </div>
            </div>
            <div className="meal-plan-info">
                <div className="meal-plan-header-content">
                    <h3 className="nutritionist-meal-plan-name">{mealPlan.name}</h3>
                    <span className={`meal-plan-status ${mealPlan.status}`}>Status: {displayStatus}</span>
                </div>

                <div className="meal-plan-actions">
                    {/* Nutritionist actions: UPDATE and DELETE */}
                    {!isAdmin && (
                        <>
                            <button
                                className="button-base update-button"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevents the card's onClick from firing
                                    onUpdateClick(mealPlan._id);
                                }}
                                disabled={isNutritionistActionDisabled}
                            >
                                <i className="fas fa-edit"></i>
                                UPDATE
                            </button>
                            <button
                                className="button-base delete-button"
                                onClick={(e) => { e.stopPropagation(); onDeleteClick(mealPlan._id, mealPlan.imageFileName); }}
                                disabled={isNutritionistActionDisabled}
                            >
                                <i className="fas fa-trash"></i>
                                DELETE
                            </button>
                        </>
                    )}
                    {/* Admin actions */}
                    {isAdmin && mealPlan.status === 'PENDING_APPROVAL' && (
                        <>
                            <button className="button-base approve-button" onClick={(e) => { e.stopPropagation(); onApproveClick(mealPlan._id, 'APPROVED', mealPlan.authorId); }}>
                                <i className="fas fa-check"></i>
                                APPROVE
                            </button>
                            <button className="button-base admin-reject-button" onClick={(e) => { e.stopPropagation(); onRejectClick(mealPlan._id, 'REJECTED', mealPlan.authorId); }}>
                                <i className="fas fa-times"></i>
                                REJECT
                            </button>
                        </>
                    )}
                    {/* Admins can delete approved/rejected plans directly if needed, or modify behavior */}
                    {isAdmin && mealPlan.status !== 'PENDING_APPROVAL' && (
                        <button className="button-base delete-button" onClick={(e) => { e.stopPropagation(); onDeleteClick(mealPlan._id, mealPlan.imageFileName); }}>
                            <i className="fas fa-trash"></i>
                            DELETE
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MyMealPlansContent component ---
// This component needs to observe the ViewModel's state
const MyMealPlansContent = observer(({
    onSelectMealPlan, // Calls ViewModel action for detail view
    onUpdateMealPlan, // Calls ViewModel action for update view
    onDeleteMealPlan, // Calls ViewModel action for deletion
    onApproveMealPlan, // Calls ViewModel action for admin approval
    onRejectMealPlan, // Calls ViewModel action for admin rejection
    userRole
}) => {
    // Access MobX state and actions directly
    const {
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        allCategories,
        filteredMealPlans, // Use the computed property from ViewModel
        loading,
        error,
        success,
        adminActiveTab, // From ViewModel
        setAdminActiveTab // From ViewModel
    } = mealPlanViewModel;

    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Determine which tabs to show based on user role
    const getTabs = () => {
        if (userRole === 'admin') {
            return [
                { id: 'PENDING_APPROVAL', name: 'PENDING VERIFICATION' },
                { id: 'APPROVED', name: 'APPROVED' },
                { id: 'REJECTED', name: 'REJECTED' }
            ];
        } else { // Nutritionist
            return [
                { id: 'APPROVED', name: 'PUBLISHED' }, // This should be the default for nutritionist
                { id: 'PENDING_APPROVAL', name: 'PENDING VERIFICATION' },
                { id: 'REJECTED', name: 'REJECTED' },
                { id: 'UPLOADED', name: 'DRAFT / UNSUBMITTED' } // Nutritionist can have 'UPLOADED' plans
            ];
        }
    };

    const tabs = getTabs();

    // Initialize with 'APPROVED' for nutritionists or 'APPROVED' for admins
    // This ensures "Published" (nutritionist) or "Approved" (admin) is the default.
    const initialTabStatus = 'APPROVED';
    const [localActiveTab, setLocalActiveTab] = useState(initialTabStatus);

    // Effect to set the initial active tab and trigger the initial fetch
    // This useEffect will run once when the component mounts.
    useEffect(() => {
        // Set the initial tab directly in local state
        setLocalActiveTab(initialTabStatus);

        // Also ensure the ViewModel's adminActiveTab is set if user is admin,
        // as this property in the ViewModel dictates the data fetched for admins.
        if (userRole === 'admin') {
            mealPlanViewModel.setAdminActiveTab(initialTabStatus);
        }
        // For nutritionists, the ViewModel's initializeUser (called in parent)
        // should fetch all relevant plans, and `filteredMealPlans` will correctly
        // display 'APPROVED' ones when `localActiveTab` is 'APPROVED' (mapped to 'PUBLISHED').
    }, [userRole]); // Dependency on userRole ensures it runs when user role is determined

    // Effect to keep localActiveTab in sync with ViewModel's adminActiveTab for admins
    // This is still important if the adminActiveTab in ViewModel can be changed from elsewhere.
    useEffect(() => {
        if (userRole === 'admin' && adminActiveTab !== localActiveTab) {
            setLocalActiveTab(adminActiveTab);
        }
    }, [userRole, adminActiveTab, localActiveTab]);

    const handleTabChange = (tabId) => {
        setLocalActiveTab(tabId);
        if (userRole === 'admin') {
            // If it's an admin, update the ViewModel's adminActiveTab which triggers data re-fetch
            mealPlanViewModel.setAdminActiveTab(tabId);
        } else {
            // For nutritionists, the ViewModel's filteredMealPlans computed property will react
            // to the change in localActiveTab when it's used in the display logic.
            // No explicit fetch needed here, assuming the base data for the nutritionist
            // is already fetched or will be by ViewModel's 'filteredMealPlans' reaction.
        }
    };

    // The actual filtering for display should consider the localActiveTab
    // The ViewModel's filteredMealPlans computed property already handles search/category.
    // We just need to filter by the active status tab here.
    const displayedMealPlans = filteredMealPlans.filter(plan => {
        if (userRole === 'admin') {
            return plan.status === localActiveTab;
        } else { // Nutritionist
            // Map 'PUBLISHED' tab to 'APPROVED' status for nutritionist view
            const statusToMatch = localActiveTab === 'PUBLISHED' ? 'APPROVED' : localActiveTab;
            return plan.status === statusToMatch;
        }
    });

    return (
        <>
            <header className="header">
                <h1 className="nutri-dashboard-page-title">
                    <i className="fas fa-utensils"></i>
                    MEAL PLANS
                </h1>
                <div className="search-controls">
                    <div className="search-input-wrapper">
                        <i className="fas fa-search search-icon"></i>
                        <input
                            type="text"
                            placeholder="Search meal plans..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="category-dropdown-container">
                        <button
                            className="category-button"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        >
                            <i className="fas fa-filter"></i>
                            {selectedCategory || "All Categories"}
                           
                        </button>
                        {showCategoryDropdown && (
                            <div className="category-dropdown-content">
                                <button
                                    className="dropdown-item"
                                    onClick={() => {
                                        setSelectedCategory('');
                                        setShowCategoryDropdown(false);
                                    }}
                                >
                                    <i className="fas fa-th-large"></i>
                                    All Categories
                                </button>
                                {allCategories.map((category) => (
                                    <button
                                        key={category}
                                        className={`dropdown-item ${selectedCategory === category ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setShowCategoryDropdown(false);
                                        }}
                                    >
                                        <i className="fas fa-tag"></i>
                                        {category}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-button ${localActiveTab === tab.id ? 'active' : ''}`}
                        onClick={() => handleTabChange(tab.id)}
                    >
                        {tab.name}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading meal plans...</p>
                </div>
            )}
            {error && <div className="error-message"><i className="fas fa-exclamation-triangle"></i>{error}</div>}
            {success && <div className="success-message"><i className="fas fa-check-circle"></i>{success}</div>}

            <div className="meal-plans-grid">
                {displayedMealPlans.length > 0 ? (
                    displayedMealPlans.map(plan => (
                        <MealPlanCard
                            key={plan._id}
                            mealPlan={plan}
                            onClick={onSelectMealPlan}
                            onUpdateClick={onUpdateMealPlan} // This handler is called by MealPlanCard
                            onDeleteClick={onDeleteMealPlan}
                            onApproveClick={onApproveMealPlan}
                            onRejectClick={onRejectMealPlan} // Pass new reject handler
                            isAdmin={userRole === 'admin'}
                        />
                    ))
                ) : (
                    <div className="no-meal-plans-message">
                        <i className="fas fa-search"></i>
                        <h3>No meal plans found</h3>
                        <p>No meal plans found for "{localActiveTab.replace(/_/g, ' ')}" with the current filters.</p>
                    </div>
                )}
            </div>
        </>
    );
});


// --- Sidebar component ---
// This component does not need to be an observer, but receives props
// Fixed Sidebar component with better structure for notification badge
const Sidebar = observer(({ onLogout, userRole }) => {
    // Directly access unreadNotificationCount from the ViewModel
    const unreadCount = mealPlanViewModel.unreadNotificationCount;
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <div className="sidebar">
            <div className="logo">
                <img src="/assetscopy/blood_drop_logo.png" alt="DiaBeater Logo" />
                <span className="logo-text">DiaBeater</span>
            </div>
            <nav className="navigation">
                {userRole === 'nutritionist' && (
                    <Link 
                        to="/nutritionist/dashboard/profile"
                        className={`nav-item ${currentPath.includes('/profile') ? 'active' : ''}`}
                    >
                        <i className="fas fa-user"></i>
                        <span>My Profile</span>
                    </Link>
                )}
                <Link
                    to="/nutritionist/dashboard/meal-plans"
                    className={`nav-item ${currentPath.includes('/meal-plans') && !currentPath.includes('/create') ? 'active' : ''}`}
                >
                    <i className="fas fa-clipboard-list"></i>
                    <span>Meal Plans</span>
                </Link>
                {userRole === 'nutritionist' && (
                    <Link
                        to="/nutritionist/dashboard/create-meal-plan"
                        className={`nav-item ${currentPath.includes('/create-meal-plan') ? 'active' : ''}`}
                    >
                        <i className="fas fa-plus-circle"></i>
                        <span>Create Meal Plan</span>
                    </Link>
                )}
                {userRole === 'nutritionist' && (
                    <Link
                        to="/nutritionist/dashboard/notifications"
                        className={`nav-item ${currentPath.includes('/notifications') ? 'active' : ''}`}
                    >
                        <i className="fas fa-bell"></i>
                        <span>
                            Notifications
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
                        </span>
                    </Link>
                )}
            </nav>
            <button className="logout-button" onClick={onLogout}>
                <i className="fas fa-sign-out-alt"></i>
                <span>Log out</span>
            </button>
        </div>
    );
});

// --- NutritionistDashboard Main Component ---
const NutritionistDashboard = observer(({ onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Destructure properties and actions from the MobX ViewModel
    const {
        loading,
        error,
        success,
        unreadNotificationCount, // This will now properly reflect filtered notifications
        filteredNotifications, // Use filtered notifications instead of all notifications
        selectedMealPlanForDetail,
        selectedMealPlanForUpdate,
        currentUserId,
        currentUserRole,
        // Actions from ViewModel
        loadMealPlanDetails,
        selectMealPlanForUpdate,
        deleteMealPlan,
        approveOrRejectMealPlan,
        clearSelectedMealPlans,
        markNotificationAsRead,
        fetchNutritionistMealPlans,
        fetchAdminMealPlans
    } = mealPlanViewModel;
    
    // Effect to initialize user and fetch initial data through the ViewModel
    useEffect(() => {
        mealPlanViewModel.initializeUser(); // This will trigger initial data fetching based on role
        return () => {
            mealPlanViewModel.dispose(); // Clean up listeners on unmount
        };
    }, []); // Run once on mount

    // Redirect to meal-plans by default if at the root dashboard path
    useEffect(() => {
        if (location.pathname === '/nutritionist/dashboard' || location.pathname === '/admin/dashboard') {
            navigate(`${location.pathname}/meal-plans`, { replace: true });
        }
    }, [location.pathname, navigate]);

    // Handlers that call ViewModel actions
    const handleSelectMealPlan = (mealPlanId) => {
        loadMealPlanDetails(mealPlanId); // ViewModel fetches details and sets selectedMealPlanForDetail
        navigate(`${location.pathname.split('/').slice(0, 3).join('/')}/meal-plan-detail/${mealPlanId}`);
    };

    const handleUpdateMealPlan = (mealPlanId) => {
        // This is the crucial part: tell the ViewModel which meal plan to prepare for update.
        mealPlanViewModel.selectMealPlanForUpdate(mealPlanId); // Ensure this is called
        navigate(`${location.pathname.split('/').slice(0, 3).join('/')}/update-meal-plan/${mealPlanId}`);
    };

    const handleDeleteMealPlan = async (mealPlanId, imageFileName) => {
        if (window.confirm("Are you sure you want to delete this meal plan? This action cannot be undone.")) {
            const success = await deleteMealPlan(mealPlanId, imageFileName);
            if (success) {
                // If deletion was successful, the ViewModel's internal list is already updated.
                // Navigate back to meal plans if we're in detail view
                if (location.pathname.includes('/meal-plan-detail/')) {
                    navigate(`${location.pathname.split('/').slice(0, 3).join('/')}/meal-plans`);
                }
            }
        }
    };

    const handleApproveOrRejectMealPlan = async (mealPlanId, newStatus, authorId) => {
        const adminInfo = AuthService.getCurrentUser();
        const adminName = adminInfo?.name || adminInfo?.username || 'Admin';
        const adminId = adminInfo?.uid;

        if (!adminName || !adminId) {
            mealPlanViewModel.setError("Admin user data not available. Cannot perform action.");
            return;
        }

        const actionText = newStatus === 'APPROVED' ? 'approve' : 'reject';
        if (window.confirm(`Are you sure you want to ${actionText} this meal plan?`)) {
            let rejectionReason = null;
            if (newStatus === 'REJECTED') {
                rejectionReason = prompt("Please provide a reason for rejection (optional):");
            }
            await approveOrRejectMealPlan(mealPlanId, newStatus, authorId, adminName, adminId, rejectionReason);
            // ViewModel will re-fetch meal plans automatically after approval/rejection
        }
    };

    const handleBack = () => {
        clearSelectedMealPlans(); // Clear selected meal plans in ViewModel
        navigate(`${location.pathname.split('/').slice(0, 3).join('/')}/meal-plans`);
    };

    // Handler for when a new meal plan is successfully submitted (from CreateMealPlan)
    const handleMealPlanSubmitted = async () => {
        navigate(`${location.pathname.split('/').slice(0, 3).join('/')}/meal-plans`);
        // The ViewModel's createMealPlan method already triggers a re-fetch of meal plans,
        // so the list will refresh automatically.
    };

    // Handler for when an update is successfully completed (from UpdateMealPlan)
    const handleMealPlanUpdated = async () => {
        mealPlanViewModel.setSuccess('Meal plan updated successfully and sent for re-approval!');
        handleBack(); // Go back to myMealPlans view
        // The ViewModel's updateMealPlan method already triggers a re-fetch of meal plans,
        // so data in the list should automatically refresh.
    };

    const handleMarkNotificationAsRead = async (notificationId) => {
        await markNotificationAsRead(notificationId);
    };

    return (
        <div className="nutritionist-dashboard-page">
            <Sidebar
                onLogout={onLogout}
                userRole={currentUserRole}
            />
            <div className="main-content">
                {/* Global loading/error/success messages from ViewModel */}
                {loading && (
                    <div className="global-loading">
                        <div className="loading-spinner"></div>
                        <span>Loading...</span>
                    </div>
                )}
                {error && (
                    <div className="global-error">
                        <i className="fas fa-exclamation-circle"></i>
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="global-success">
                        <i className="fas fa-check-circle"></i>
                        <span>{success}</span>
                    </div>
                )}

                <Routes>
                    {currentUserRole === 'nutritionist' && (
                        <Route path="profile" element={<NutritionistProfile />} />
                    )}
                    
                    <Route path="meal-plans" element={
                        <MyMealPlansContent
                            onSelectMealPlan={handleSelectMealPlan}
                            onUpdateMealPlan={handleUpdateMealPlan}
                            onDeleteMealPlan={handleDeleteMealPlan}
                            onApproveMealPlan={handleApproveOrRejectMealPlan}
                            onRejectMealPlan={handleApproveOrRejectMealPlan}
                            userRole={currentUserRole}
                        />
                    } />
                    
                    {currentUserRole === 'nutritionist' && (
                        <Route path="create-meal-plan" element={
                            <CreateMealPlan onMealPlanSubmitted={handleMealPlanSubmitted} />
                        } />
                    )}
                    
                    <Route path="meal-plan-detail/:mealPlanId" element={
                        <MealPlanDetail
                            onBack={handleBack}
                            userRole={currentUserRole}
                            currentUserId={currentUserId}
                            onDeleteMealPlan={handleDeleteMealPlan}
                        />
                    } />
                    
                    <Route path="update-meal-plan/:mealPlanId" element={
                        selectedMealPlanForUpdate ? (
                            <UpdateMealPlan
                                mealPlan={selectedMealPlanForUpdate}
                                onBack={handleBack}
                            />
                        ) : (
                            <div>Loading meal plan data...</div>
                        )
                    } />
                    
                    {currentUserRole === 'nutritionist' && (
                        <Route path="notifications" element={
                            <NotificationList
                                notifications={filteredNotifications}
                                onMarkAsRead={handleMarkNotificationAsRead}
                            />
                        } />
                    )}
                    
                    <Route path="*" element={<Navigate to="meal-plans" replace />} />
                </Routes>
            </div>
        </div>
    );
});

export default NutritionistDashboard;