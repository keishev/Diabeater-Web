import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite'; // Import observer for MobX
import './NutritionistDashboard.css';
import CreateMealPlan from './CreateMealPlan';
import NutritionistProfile from './NutritionistProfile';
import MealPlanDetail from './MealPlanDetail'; // Correct path for MealPlanDetail
import UpdateMealPlan from './UpdateMealPlan';
import NotificationList from './NotificationList';
import mealPlanViewModel from '../ViewModels/MealPlanViewModel'; // Import the MobX ViewModel
import AuthService from '../Services/AuthService';

// --- MealPlanCard component ---
// This component can remain largely the same, as it receives props
const MealPlanCard = ({ mealPlan, onClick, onUpdateClick, onDeleteClick, onApproveClick, isAdmin }) => {
    const displayStatus = mealPlan.status === 'UPLOADED' ? 'PUBLISHED' : mealPlan.status.replace(/_/g, ' ');
    const imageUrl = mealPlan.imageUrl || `/assetscopy/${mealPlan.imageFileName}`;

    const cardClassName = `meal-plan-card meal-plan-card--${mealPlan.status.toLowerCase()}`;

    // Determine if update/delete buttons should be disabled for nutritionists
    const isNutritionistActionDisabled = mealPlan.status === 'APPROVED' || mealPlan.status === 'PENDING_APPROVAL';

    return (
        <div className={cardClassName} onClick={() => onClick(mealPlan._id)}> {/* Pass ID to select for detail */}
            <img src={imageUrl} alt={mealPlan.name} className="meal-plan-image" />
            <div className="meal-plan-info">
                <div className="meal-plan-header-content">
                    <h3 className="meal-plan-name">{mealPlan.name}</h3>
                    <span className={`meal-plan-status ${mealPlan.status}`}>Status: {displayStatus}</span>
                </div>
                <span className="likes-count">
                    <i className="fa-solid fa-heart"></i> {mealPlan.likes || 0}
                </span>

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
                                UPDATE
                            </button>
                            <button
                                className="button-base delete-button"
                                onClick={(e) => { e.stopPropagation(); onDeleteClick(mealPlan._id, mealPlan.imageFileName); }}
                                disabled={isNutritionistActionDisabled}
                            >
                                DELETE
                            </button>
                        </>
                    )}
                    {/* Admin actions */}
                    {isAdmin && mealPlan.status === 'PENDING_APPROVAL' && (
                        <button className="button-base approve-button" onClick={(e) => { e.stopPropagation(); onApproveClick(mealPlan._id, 'APPROVED', mealPlan.authorId); }}>APPROVE</button>
                    )}
                    {isAdmin && mealPlan.status !== 'PENDING_APPROVAL' && (
                        <button className="button-base delete-button" onClick={(e) => { e.stopPropagation(); onDeleteClick(mealPlan._id, mealPlan.imageFileName); }}>DELETE</button>
                    )}
                    {isAdmin && mealPlan.status === 'APPROVED' && (
                        <button className="button-base admin-reject-button" onClick={(e) => { e.stopPropagation(); onApproveClick(mealPlan._id, 'REJECTED', mealPlan.authorId); }}>REJECT</button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MyMealPlansContent component ---
// This component needs to observe the ViewModel's state
const MyMealPlansContent = observer(({
    onSelectMealPlan, // Calls ViewModel action
    onUpdateMealPlan, // Calls ViewModel action
    onDeleteMealPlan, // Calls ViewModel action
    onApproveMealPlan, // Calls ViewModel action
    userRole
}) => {
    // Access MobX state and actions directly
    const {
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        allCategories,
        filteredMealPlans, // Use the computed property
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
                { id: 'APPROVED', name: 'PUBLISHED' },
                { id: 'PENDING_APPROVAL', name: 'PENDING VERIFICATION' },
                { id: 'REJECTED', name: 'REJECTED' },
                { id: 'UPLOADED', name: 'DRAFT/UNSUBMITTED' } // Nutritionist can have 'UPLOADED' plans
            ];
        }
    };

    const tabs = getTabs();

    // Use a local state for the active tab, but sync with ViewModel's adminActiveTab if admin
    const [localActiveTab, setLocalActiveTab] = useState(userRole === 'admin' ? adminActiveTab : 'UPLOADED');

    useEffect(() => {
        if (userRole === 'admin') {
            // Ensure localActiveTab always reflects adminActiveTab for admins
            setLocalActiveTab(adminActiveTab);
        } else {
            // For nutritionist, the initial tab needs to be set properly.
            // Default to 'UPLOADED' for nutritionists if no specific tab is selected.
            // This ensures a valid tab is always active.
            if (!tabs.some(tab => tab.id === localActiveTab)) {
                setLocalActiveTab('UPLOADED'); // Fallback to a valid default
            }
        }
    }, [userRole, adminActiveTab, tabs]);


    const handleTabChange = (tabId) => {
        setLocalActiveTab(tabId);
        if (userRole === 'admin') {
            // If it's an admin, update the ViewModel's adminActiveTab which triggers data re-fetch
            mealPlanViewModel.setAdminActiveTab(tabId);
        }
        // For nutritionists, filteredMealPlans computed property will handle the filtering based on activeTab
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
                <h1 className="page-title">MEAL PLANS</h1>
                <div className="search-controls">
                    <input
                        type="text"
                        placeholder="Search meal plans..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="category-dropdown-container">
                        <button
                            className="category-button"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        >
                            {selectedCategory || "Search by Category"}
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

            {loading && <p>Loading meal plans...</p>}
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

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
                            isAdmin={userRole === 'admin'}
                        />
                    ))
                ) : (
                    <p className="no-meal-plans-message">
                        No meal plans found for "{localActiveTab.replace(/_/g, ' ')}" with the current filters.
                    </p>
                )}
            </div>
        </>
    );
});


// --- Sidebar component ---
// This component does not need to be an observer, but receives props
const Sidebar = ({ currentView, onNavigate, unreadCount, onLogout, userRole }) => {
    return (
        <div className="sidebar">
            <div className="logo">
                <img src="/assetscopy/blood_drop_logo.png" alt="DiaBeater Logo" />
                <span className="logo-text">DiaBeater</span>
            </div>
            <nav className="navigation">
                {userRole === 'nutritionist' && (
                    <div
                        className={`nav-item ${currentView === 'nutritionistProfile' ? 'active' : ''}`}
                        onClick={() => onNavigate('nutritionistProfile')}
                    >
                        <i className="fas fa-user"></i>
                        <span>My Profile</span>
                    </div>
                )}
                <div
                    className={`nav-item ${currentView === 'myMealPlans' ? 'active' : ''}`}
                    onClick={() => onNavigate('myMealPlans')}
                >
                    <i className="fas fa-clipboard-list"></i>
                    <span>Meal Plans</span>
                </div>
                {userRole === 'nutritionist' && (
                    <div
                        className={`nav-item ${currentView === 'createMealPlan' ? 'active' : ''}`}
                        onClick={() => onNavigate('createMealPlan')}
                    >
                        <i className="fas fa-plus-circle"></i>
                        <span>Create Meal Plan</span>
                    </div>
                )}
                {userRole === 'nutritionist' && (
                    <div
                        className={`nav-item ${currentView === 'notifications' ? 'active' : ''}`}
                        onClick={() => onNavigate('notifications')}
                    >
                        <i className="fas fa-bell"></i>
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                            <span className="notification-badge">{unreadCount}</span>
                        )}
                    </div>
                )}
            </nav>
            <button className="logout-button" onClick={onLogout}>Log out</button>
        </div>
    );
};


// --- NutritionistDashboard Main Component ---
const NutritionistDashboard = observer(({ onLogout }) => { // Make the main component an observer
    const [currentView, setCurrentView] = useState('myMealPlans');

    // Destructure properties and actions from the MobX ViewModel
    const {
        loading,
        error,
        success,
        unreadNotificationCount,
        notifications,
        selectedMealPlanForDetail, // Get the selected meal plan for detail view
        selectedMealPlanForUpdate, // Get the selected meal plan for update view
        currentUserId,
        currentUserRole,
        // Actions from ViewModel
        loadMealPlanDetails,
        selectMealPlanForUpdate, // This action sets selectedMealPlanForUpdate
        deleteMealPlan,
        approveOrRejectMealPlan,
        clearSelectedMealPlans,
        markNotificationAsRead,
        fetchNutritionistMealPlans, // To re-fetch after a submit
        fetchAdminMealPlans // To re-fetch after a submit
    } = mealPlanViewModel;

    // Effect to initialize user and fetch initial data through the ViewModel
    useEffect(() => {
        mealPlanViewModel.initializeUser(); // This will trigger initial data fetching based on role
        return () => {
            mealPlanViewModel.dispose(); // Clean up listeners on unmount
        };
    }, []); // Run once on mount

    // Handlers that call ViewModel actions
    const handleSelectMealPlan = (mealPlanId) => {
        loadMealPlanDetails(mealPlanId); // ViewModel fetches details and sets selectedMealPlanForDetail
        setCurrentView('mealPlanDetail');
    };

    const handleUpdateMealPlan = (mealPlanId) => {
        // This is the crucial part: set the view to 'updateMealPlan'
        // and also tell the ViewModel which meal plan to prepare for update.
        mealPlanViewModel.selectMealPlanForUpdate(mealPlanId); // Ensure this is called
        setCurrentView('updateMealPlan');
    };

    const handleDeleteMealPlan = async (mealPlanId, imageFileName) => {
        if (window.confirm("Are you sure you want to delete this meal plan? This action cannot be undone.")) {
            const success = await deleteMealPlan(mealPlanId, imageFileName);
            if (success) {
                // If deletion was successful, navigate back to the list
                setCurrentView('myMealPlans');
            }
        }
    };

    const handleApproveOrRejectMealPlan = async (mealPlanId, newStatus, authorId) => {
        const adminName = AuthService.getCurrentUser()?.name || AuthService.getCurrentUser()?.username || 'Admin';
        const adminId = AuthService.getCurrentUser()?.uid;

        if (!adminName || !adminId) {
            alert("Admin user data not available. Cannot perform action.");
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
        setCurrentView('myMealPlans');
        // No explicit fetch here, as ViewModel might handle refreshing data based on active tab
        // However, if the data in the current tab might have changed due to external actions,
        // you might want to trigger a refresh. For now, rely on MobX reactivity.
    };

    const handleMealPlanSubmitted = async () => {
        setCurrentView('myMealPlans');
        // Refresh the meal plans after submission
        if (currentUserRole === 'admin') {
            await fetchAdminMealPlans(mealPlanViewModel.adminActiveTab);
        } else {
            await fetchNutritionistMealPlans(currentUserId);
        }
        mealPlanViewModel.setSuccess('Meal plan submitted successfully!');
    };

    // Handler for when an update is successfully completed
    const handleMealPlanUpdated = async () => {
        mealPlanViewModel.setSuccess('Meal plan updated successfully!');
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
                currentView={currentView}
                onNavigate={setCurrentView}
                unreadCount={unreadNotificationCount}
                onLogout={onLogout}
                userRole={currentUserRole}
            />
            <div className="main-content">
                {currentView === 'nutritionistProfile' && currentUserRole === 'nutritionist' && <NutritionistProfile />}

                {currentView === 'myMealPlans' && (
                    <MyMealPlansContent
                        onSelectMealPlan={handleSelectMealPlan}
                        onUpdateMealPlan={handleUpdateMealPlan} // This handler is called by MealPlanCard
                        onDeleteMealPlan={handleDeleteMealPlan}
                        onApproveMealPlan={handleApproveOrRejectMealPlan}
                        userRole={currentUserRole}
                    />
                )}

                {currentView === 'createMealPlan' && currentUserRole === 'nutritionist' && (
                    <CreateMealPlan onMealPlanSubmitted={handleMealPlanSubmitted} />
                )}

                {currentView === 'mealPlanDetail' && (
                    // MealPlanDetail now observes the ViewModel directly, no need to pass mealPlan prop
                    <MealPlanDetail
                        onBack={handleBack}
                        userRole={currentUserRole}
                        currentUserId={currentUserId}
                        onDeleteMealPlan={handleDeleteMealPlan} // Pass to allow deletion from detail view
                    />
                )}

                {/* This is the target component for the "UPDATE" button */}
                {currentView === 'updateMealPlan' && selectedMealPlanForUpdate && (
                    <UpdateMealPlan
                        mealPlan={selectedMealPlanForUpdate} // Pass the selected meal plan for update
                        onBack={handleBack}
                        onMealPlanUpdated={handleMealPlanUpdated} // Pass the new handler
                    />
                )}

                {currentView === 'notifications' && currentUserRole === 'nutritionist' && (
                    <NotificationList
                        notifications={notifications}
                        onMarkAsRead={handleMarkNotificationAsRead}
                    />
                )}
            </div>
        </div>
    );
});

export default NutritionistDashboard;