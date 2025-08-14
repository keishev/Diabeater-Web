import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './NutritionistDashboard.css';
import CreateMealPlan from './CreateMealPlan';
import NutritionistProfile from './NutritionistProfile';
import MealPlanDetail from './MealPlanDetail';
import UpdateMealPlan from './UpdateMealPlan';
import NotificationList from './NotificationList';
import mealPlanViewModel from '../ViewModels/MealPlanViewModel';

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

// MyMealPlansContent component
const MyMealPlansContent = observer(({
    onSelectMealPlan, // Calls ViewModel action for detail view
    onUpdateMealPlan, // Calls ViewModel action for update view
    onDeleteMealPlan, // Calls ViewModel action for deletion
    onApproveMealPlan, // Calls ViewModel action for admin approval
    onRejectMealPlan, // Calls ViewModel action for admin rejection
    userRole
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        allCategories,
        filteredMealPlans,
        loading,
        error,
        success,
        adminActiveTab,
        setAdminActiveTab
    } = mealPlanViewModel;

    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Get current active tab from URL
    const getCurrentTabFromUrl = () => {
        const pathSegments = location.pathname.split('/');
        const currentTab = pathSegments[pathSegments.length - 1];

        // Map URL segments to status values
        const tabMapping = {
            'published': 'APPROVED',
            'pending': 'PENDING_APPROVAL',
            'rejected': 'REJECTED',
            'draft': 'UPLOADED'
        };

        return tabMapping[currentTab] || 'APPROVED';
    };

    const getTabs = () => {
        if (userRole === 'admin') {
            return [
                { id: 'PENDING_APPROVAL', name: 'PENDING VERIFICATION', path: 'pending' },
                { id: 'APPROVED', name: 'APPROVED', path: 'published' },
                { id: 'REJECTED', name: 'REJECTED', path: 'rejected' }
            ];
        } else { // Nutritionist
            return [
                { id: 'APPROVED', name: 'PUBLISHED', path: 'published' },
                { id: 'PENDING_APPROVAL', name: 'PENDING VERIFICATION', path: 'pending' },
                { id: 'REJECTED', name: 'REJECTED', path: 'rejected' },
                { id: 'UPLOADED', name: 'DRAFT / UNSUBMITTED', path: 'draft' }
            ];
        }
    };

    const tabs = getTabs();
    const currentActiveTab = getCurrentTabFromUrl();

    // Effect to sync with admin tab state when user is admin
    useEffect(() => {
        if (userRole === 'admin') {
            mealPlanViewModel.setAdminActiveTab(currentActiveTab);
        }
    }, [userRole, currentActiveTab]);

    const handleTabChange = (tabPath) => {
        navigate(`/nutritionist/meal-plans/${tabPath}`);
    };

    // Filter plans based on current active tab from URL
    const displayedMealPlans = filteredMealPlans.filter(plan => {
        if (userRole === 'admin') {
            return plan.status === currentActiveTab;
        } else { // Nutritionist
            return plan.status === currentActiveTab;
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
                        className={`tab-button ${currentActiveTab === tab.id ? 'active' : ''}`}
                        onClick={() => handleTabChange(tab.path)}
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
                            onUpdateClick={onUpdateMealPlan}
                            onDeleteClick={onDeleteMealPlan}
                            onApproveClick={onApproveMealPlan}
                            onRejectClick={onRejectMealPlan}
                            isAdmin={userRole === 'admin'}
                        />
                    ))
                ) : (
                    <div className="no-meal-plans-message">
                        <i className="fas fa-search"></i>
                        <h3>No meal plans found</h3>
                        <p>No meal plans found for "{currentActiveTab.replace(/_/g, ' ')}" with the current filters.</p>
                    </div>
                )}
            </div>
        </>
    );
});

const Sidebar = observer(({ onLogout, userRole }) => {
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
                        to="/nutritionist/profile"
                        className={`nav-item ${currentPath.includes('/profile') ? 'active' : ''}`}
                    >
                        <i className="fas fa-user"></i>
                        <span>My Profile</span>
                    </Link>
                )}
                <Link
                    to="/nutritionist/meal-plans/published"
                    className={`nav-item ${currentPath.includes('/meal-plans') && !currentPath.includes('/create') ? 'active' : ''}`}
                >
                    <i className="fas fa-clipboard-list"></i>
                    <span>Meal Plans</span>
                </Link>
                {userRole === 'nutritionist' && (
                    <Link
                        to="/nutritionist/create-meal-plan"
                        className={`nav-item ${currentPath.includes('/create-meal-plan') ? 'active' : ''}`}
                    >
                        <i className="fas fa-plus-circle"></i>
                        <span>Create Meal Plan</span>
                    </Link>
                )}
                {userRole === 'nutritionist' && (
                    <Link
                        to="/nutritionist/notifications"
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

const NutritionistDashboard = observer(({ onLogout, activeTab }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Destructure properties and actions from the MobX ViewModel
    const {
        loading,
        error,
        success,
        filteredNotifications,
        selectedMealPlanForUpdate,
        currentUserId,
        currentUserRole,
        loadMealPlanDetails,
        deleteMealPlan,
        approveOrRejectMealPlan,
        clearSelectedMealPlans,
        markNotificationAsRead
    } = mealPlanViewModel;
    
    useEffect(() => {
        mealPlanViewModel.initializeUser();
        return () => {
            mealPlanViewModel.dispose();
        };
    }, []); // Run once on mount

    // Handlers that call ViewModel actions
    const handleSelectMealPlan = (mealPlanId) => {
        loadMealPlanDetails(mealPlanId);
        navigate(`/nutritionist/meal-plan-detail/${mealPlanId}`);
    };

    const handleUpdateMealPlan = (mealPlanId) => {
        mealPlanViewModel.selectMealPlanForUpdate(mealPlanId);
        navigate(`/nutritionist/update-meal-plan/${mealPlanId}`);
    };

    const handleDeleteMealPlan = async (mealPlanId, imageFileName) => {
        if (window.confirm("Are you sure you want to delete this meal plan? This action cannot be undone.")) {
            const success = await deleteMealPlan(mealPlanId, imageFileName);
            if (success) {
                // Navigate back to the current tab after deletion
                const currentTab = location.pathname.split('/').pop();
                if (['published', 'pending', 'rejected', 'draft'].includes(currentTab)) {
                    navigate(`/nutritionist/meal-plans/${currentTab}`);
                } else {
                    navigate('/nutritionist/meal-plans/published');
                }
            }
        }
    };

    const handleBack = () => {
        clearSelectedMealPlans();
        navigate('/nutritionist/meal-plans/published');
    };

    const handleMealPlanSubmitted = async () => {
        navigate('/nutritionist/meal-plans/pending'); // Navigate to pending after creating
    };

    const handleMarkNotificationAsRead = async (notificationId) => {
        await markNotificationAsRead(notificationId);
    };

    // Render content based on activeTab
    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <NutritionistProfile />;
            case 'published':
                return (
                    <MyMealPlansContent
                        onSelectMealPlan={handleSelectMealPlan}
                        onUpdateMealPlan={handleUpdateMealPlan}
                        onDeleteMealPlan={handleDeleteMealPlan}
                        onApproveMealPlan={approveOrRejectMealPlan}
                        onRejectMealPlan={approveOrRejectMealPlan}
                        userRole={currentUserRole}
                    />
                );
            case 'pending':
                return (
                    <MyMealPlansContent
                        onSelectMealPlan={handleSelectMealPlan}
                        onUpdateMealPlan={handleUpdateMealPlan}
                        onDeleteMealPlan={handleDeleteMealPlan}
                        onApproveMealPlan={approveOrRejectMealPlan}
                        onRejectMealPlan={approveOrRejectMealPlan}
                        userRole={currentUserRole}
                    />
                );
            case 'rejected':
                return (
                    <MyMealPlansContent
                        onSelectMealPlan={handleSelectMealPlan}
                        onUpdateMealPlan={handleUpdateMealPlan}
                        onDeleteMealPlan={handleDeleteMealPlan}
                        onApproveMealPlan={approveOrRejectMealPlan}
                        onRejectMealPlan={approveOrRejectMealPlan}
                        userRole={currentUserRole}
                    />
                );
            case 'draft':
                return (
                    <MyMealPlansContent
                        onSelectMealPlan={handleSelectMealPlan}
                        onUpdateMealPlan={handleUpdateMealPlan}
                        onDeleteMealPlan={handleDeleteMealPlan}
                        onApproveMealPlan={approveOrRejectMealPlan}
                        onRejectMealPlan={approveOrRejectMealPlan}
                        userRole={currentUserRole}
                    />
                );
            case 'create':
                return (
                    <CreateMealPlan onMealPlanSubmitted={handleMealPlanSubmitted} />
                );
            case 'notifications':
                return (
                    <NotificationList
                        notifications={filteredNotifications}
                        onMarkAsRead={handleMarkNotificationAsRead}
                    />
                );
            case 'detail':
                return (
                    <MealPlanDetail
                        onBack={handleBack}
                        userRole={currentUserRole}
                        currentUserId={currentUserId}
                        onDeleteMealPlan={handleDeleteMealPlan}
                    />
                );
            case 'update':
                return selectedMealPlanForUpdate ? (
                    <UpdateMealPlan
                        mealPlan={selectedMealPlanForUpdate}
                        onBack={handleBack}
                    />
                ) : (
                    <div>Loading meal plan data...</div>
                );
            default:
                return (
                    <MyMealPlansContent
                        onSelectMealPlan={handleSelectMealPlan}
                        onUpdateMealPlan={handleUpdateMealPlan}
                        onDeleteMealPlan={handleDeleteMealPlan}
                        onApproveMealPlan={approveOrRejectMealPlan}
                        onRejectMealPlan={approveOrRejectMealPlan}
                        userRole={currentUserRole}
                    />
                );
        }
    };

    return (
        <div className="nutritionist-dashboard-page">
            <Sidebar
                onLogout={onLogout}
                userRole={currentUserRole}
            />
            <div className="main-content">
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

                {renderContent()}
            </div>
        </div>
    );
});

export default NutritionistDashboard;
