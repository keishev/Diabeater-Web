// src/Admin/AdminMealPlans.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import MealPlanViewModel from '../ViewModels/MealPlanViewModel';
import AdminMealPlanDetail from './AdminMealPlanDetail';
import MealCategoryManagementModal from './MealCategoryManagementModal';
import './AdminMealPlans.css';

// Popular Section Component
const PopularSection = ({ title, mealPlans, onCardClick, emptyMessage = "No meal plans available" }) => {
    const displayPlans = mealPlans.slice(0, 3);
    const emptySlots = Math.max(0, 3 - displayPlans.length);

    return (
        <div className="popular-section">
            <h3 className="popular-section-title">{title}</h3>
            <div className="popular-section-grid">
                {displayPlans.map(plan => (
                    <div 
                        key={plan._id} 
                        className="popular-meal-card"
                        onClick={() => onCardClick(plan._id)}
                    >
                        <div className="popular-meal-image-wrapper">
                            <img
                                src={plan.imageUrl || `/assetscopy/${plan.imageFileName}`}
                                alt={plan.name}
                                className="popular-meal-image"
                            />
                            <div className="popular-meal-overlay">
                                <div className="popular-meal-stats">
                                    <span className="saves-count">
                                         <i className="fas fa-bookmark"></i> {plan.saveCount || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="popular-meal-info">
                            <h4 className="popular-meal-name">{plan.name}</h4>
                            <p className="popular-meal-author">by {plan.author || 'N/A'}</p>
                            {plan.categories && plan.categories.length > 0 && (
                                <div className="popular-meal-categories">
                                    {plan.categories.slice(0, 2).map((category, index) => (
                                        <span key={index} className="category-tag">{category}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {/* Empty slots */}
                {Array(emptySlots).fill().map((_, index) => (
                    <div key={`empty-${index}`} className="popular-meal-card empty-card">
                        <div className="empty-content">
                            <i className="fas fa-utensils empty-icon"></i>
                            <p className="empty-text">{emptyMessage}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminMealPlans = observer(({ activeMealPlanTab }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedPlanToReject, setSelectedPlanToReject] = useState(null);
    const [selectedRejectReason, setSelectedRejectReason] = useState('');
    const [otherReasonText, setOtherReasonText] = useState('');

    const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
    const [selectedPlanToApprove, setSelectedPlanToApprove] = useState(null);

    const [localLoading, setLocalLoading] = useState(false);

    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const categoryDropdownRef = useRef(null);

    const [showDetailView, setShowDetailView] = useState(false);

    const [showCategoryManagementModal, setShowCategoryManagementModal] = useState(false);

    // Destructure the computed counts from MealPlanViewModel
    const { searchTerm, selectedCategory, error, pendingCount, approvedCount, rejectedCount } = MealPlanViewModel;

    const rejectionReasons = [
        'Incomplete information provided',
        'Contains typos or spelling errors',
        'Contains allergens not declared',
        'Poor image quality',
        'Does not meet dietary guidelines',
        'Other (please specify)'
    ];

    useEffect(() => {
        // Fetch all admin meal plans on component mount to ensure all counts are available
        MealPlanViewModel.fetchAdminMealPlans(); // Fetch without a specific status filter
        MealPlanViewModel.fetchMealCategories();

        const handleClickOutside = (event) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
                setShowCategoryDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Determine current tab from URL or prop
    const getCurrentTab = () => {
        if (activeMealPlanTab) {
            const tabMap = {
                'popular': 'POPULAR',
                'pending': 'PENDING_APPROVAL',
                'approved': 'APPROVED',
                'rejected': 'REJECTED'
            };
            return tabMap[activeMealPlanTab] || 'POPULAR';
        }

        const pathname = location.pathname;
        if (pathname.includes('/meal-plans/pending')) return 'PENDING_APPROVAL';
        if (pathname.includes('/meal-plans/approved')) return 'APPROVED';
        if (pathname.includes('/meal-plans/rejected')) return 'REJECTED';
        if (pathname.includes('/meal-plan-detail')) return 'DETAIL_VIEW';
        return 'POPULAR'; // default
    };

    const currentTab = getCurrentTab();

    // Update ViewModel tab when URL changes
    useEffect(() => {
        if (currentTab !== 'DETAIL_VIEW') {
            MealPlanViewModel.setAdminActiveTab(currentTab);
        }
    }, [currentTab]);

    // Handle meal plan detail view from URL parameter
    useEffect(() => {
        if (params.mealPlanId && !showDetailView) {
            handleCardClick(params.mealPlanId);
        }
    }, [params.mealPlanId]);

    const handleApproveClick = useCallback((id, event) => {
        console.log('Approve clicked for plan:', id); // Debug log
        event.preventDefault();
        event.stopPropagation();
        setSelectedPlanToApprove(id);
        setShowApproveConfirmModal(true);
    }, []);

    const handleApproveConfirm = useCallback(async () => {
        setLocalLoading(true);
        try {
            const planToApprove = MealPlanViewModel.mealPlans.find(p => p._id === selectedPlanToApprove);
            if (!planToApprove) {
                throw new Error("Meal plan not found for approval.");
            }

            const authorId = planToApprove.authorId;
            const adminName = MealPlanViewModel.currentUserRole === 'admin' ? MealPlanViewModel.currentUserName : 'Admin';
            const adminId = MealPlanViewModel.currentUserId;

            await MealPlanViewModel.approveOrRejectMealPlan(selectedPlanToApprove, 'APPROVED', authorId, adminName, adminId);
            setShowApproveConfirmModal(false);
            setSelectedPlanToApprove(null);
            if (MealPlanViewModel.selectedMealPlanForDetail?._id === selectedPlanToApprove) {
                MealPlanViewModel.clearSelectedMealPlans();
                setShowDetailView(false);
            }
        } catch (err) {
            alert(MealPlanViewModel.error || 'Failed to approve meal plan. Please try again.');
        } finally {
            setLocalLoading(false);
        }
    }, [selectedPlanToApprove]);

    const handleApproveCancel = useCallback(() => {
        setShowApproveConfirmModal(false);
        setSelectedPlanToApprove(null);
    }, []);

    const handleRejectClick = useCallback((id, event) => {
        console.log('Reject clicked for plan:', id); // Debug log
        console.log('Event details:', event); // Debug log
        event.preventDefault();
        event.stopPropagation();
        
        setSelectedPlanToReject(id);
        setSelectedRejectReason('');
        setOtherReasonText('');
        setShowRejectModal(true);
        
        console.log('Modal should show now, showRejectModal:', true); // Debug log
    }, []);

    const handleReasonButtonClick = useCallback((reason) => {
        setSelectedRejectReason(reason);
        if (reason !== 'Other (please specify)') {
            setOtherReasonText('');
        }
    }, []);

    const handleRejectSubmit = useCallback(async () => {
        let finalReason = selectedRejectReason;

        if (!finalReason) {
            alert('Please select a rejection reason.');
            return;
        }

        if (finalReason === 'Other (please specify)') {
            if (!otherReasonText.trim()) {
                alert('Please type the reason for rejection.');
                return;
            }
            finalReason = otherReasonText.trim();
        }

        setLocalLoading(true);
        try {
            const planToReject = MealPlanViewModel.mealPlans.find(p => p._id === selectedPlanToReject);
            if (!planToReject) {
                throw new Error("Meal plan not found for rejection.");
            }

            const authorId = planToReject.authorId;
            const adminName = MealPlanViewModel.currentUserRole === 'admin' ? MealPlanViewModel.currentUserName : 'Admin';
            const adminId = MealPlanViewModel.currentUserId;

            await MealPlanViewModel.approveOrRejectMealPlan(selectedPlanToReject, 'REJECTED', authorId, adminName, adminId, finalReason);
            setShowRejectModal(false);
            setSelectedPlanToReject(null);
            setSelectedRejectReason('');
            setOtherReasonText('');
            if (MealPlanViewModel.selectedMealPlanForDetail?._id === selectedPlanToReject) {
                MealPlanViewModel.clearSelectedMealPlans();
                setShowDetailView(false);
            }
        } catch (err) {
            alert(MealPlanViewModel.error || 'Failed to reject meal plan. Please try again.');
        } finally {
            setLocalLoading(false);
        }
    }, [selectedPlanToReject, selectedRejectReason, otherReasonText]);

    const handleRejectCancel = useCallback(() => {
        setShowRejectModal(false);
        setSelectedPlanToReject(null);
        setSelectedRejectReason('');
        setOtherReasonText('');
    }, []);

    // Updated tab navigation handlers to use URL routing
    const handleTabNavigation = (tab) => {
        const routeMap = {
            'POPULAR': '/admin/meal-plans/popular',
            'PENDING_APPROVAL': '/admin/meal-plans/pending',
            'APPROVED': '/admin/meal-plans/approved',
            'REJECTED': '/admin/meal-plans/rejected'
        };

        if (routeMap[tab]) {
            navigate(routeMap[tab]);
        }
    };

    // Updated card click handler to navigate to detail URL
    const handleCardClick = useCallback(async (id) => {
        await MealPlanViewModel.loadMealPlanDetails(id);
        if (MealPlanViewModel.selectedMealPlanForDetail) {
            navigate(`/admin/meal-plan-detail/${id}`);
            setShowDetailView(true);
        }
    }, [navigate]);

    // Updated close detail handler to navigate back
    const handleCloseDetailView = useCallback(() => {
        MealPlanViewModel.clearSelectedMealPlans();
        setShowDetailView(false);
        // Navigate back to the current tab
        const currentTabRoute = {
            'POPULAR': '/admin/meal-plans/popular',
            'PENDING_APPROVAL': '/admin/meal-plans/pending',
            'APPROVED': '/admin/meal-plans/approved',
            'REJECTED': '/admin/meal-plans/rejected'
        }[MealPlanViewModel.adminActiveTab] || '/admin/meal-plans/popular';

        navigate(currentTabRoute);
    }, [navigate]);

    const handleOpenCategoryManagement = useCallback(() => {
        setShowCategoryManagementModal(true);
    }, []);

    const handleCloseCategoryManagement = useCallback(() => {
        setShowCategoryManagementModal(false);
        MealPlanViewModel.fetchMealCategories();
    }, []);

    // Show detail view if we're on detail route or if showDetailView is true
    if ((params.mealPlanId || showDetailView) && MealPlanViewModel.selectedMealPlanForDetail) {
        return (
            <AdminMealPlanDetail
                mealPlan={MealPlanViewModel.selectedMealPlanForDetail}
                onClose={handleCloseDetailView}
            />
        );
    }

    // Helper function to categorize popular meal plans
    const categorizePopularMealPlans = (mealPlans) => {
        // Filter only approved meal plans for popular sections
        const approvedPlans = mealPlans.filter(plan => plan.status === 'APPROVED');
        
        const categories = {
            topSaved: [...approvedPlans].sort((a, b) => (b.saveCount || b.likes || 0) - (a.saveCount || a.likes || 0)),
            highProtein: approvedPlans.filter(plan => 
                plan.categories?.some(cat => cat.toLowerCase().includes('protein')) ||
                plan.name?.toLowerCase().includes('protein') ||
                plan.description?.toLowerCase().includes('high protein')
            ).sort((a, b) => (b.saveCount || b.likes || 0) - (a.saveCount || a.likes || 0)),
            lowCarb: approvedPlans.filter(plan => 
                plan.categories?.some(cat => cat.toLowerCase().includes('low carb') || cat.toLowerCase().includes('keto')) ||
                plan.name?.toLowerCase().includes('low carb') ||
                plan.name?.toLowerCase().includes('keto') ||
                plan.description?.toLowerCase().includes('low carb')
            ).sort((a, b) => (b.saveCount || b.likes || 0) - (a.saveCount || a.likes || 0)),
            vegetarian: approvedPlans.filter(plan => 
                plan.categories?.some(cat => cat.toLowerCase().includes('vegetarian') || cat.toLowerCase().includes('vegan')) ||
                plan.name?.toLowerCase().includes('vegetarian') ||
                plan.name?.toLowerCase().includes('vegan')
            ).sort((a, b) => (b.saveCount || b.likes || 0) - (a.saveCount || a.likes || 0)),
            quickMeals: approvedPlans.filter(plan => 
                plan.categories?.some(cat => cat.toLowerCase().includes('quick') || cat.toLowerCase().includes('fast')) ||
                plan.name?.toLowerCase().includes('quick') ||
                plan.name?.toLowerCase().includes('fast') ||
                plan.name?.toLowerCase().includes('15 min') ||
                plan.name?.toLowerCase().includes('30 min')
            ).sort((a, b) => (b.saveCount || b.likes || 0) - (a.saveCount || a.likes || 0)),
            diabeticFriendly: approvedPlans.filter(plan => 
                plan.categories?.some(cat => cat.toLowerCase().includes('diabetic') || cat.toLowerCase().includes('sugar')) ||
                plan.name?.toLowerCase().includes('diabetic') ||
                plan.name?.toLowerCase().includes('sugar-free') ||
                plan.description?.toLowerCase().includes('diabetic')
            ).sort((a, b) => (b.saveCount || b.likes || 0) - (a.saveCount || a.likes || 0))
        };

        return categories;
    };

    // Debug log to check state
    console.log('showRejectModal state:', showRejectModal);
    console.log('selectedPlanToReject:', selectedPlanToReject);

    // Get categorized popular meal plans
    const popularCategories = categorizePopularMealPlans(MealPlanViewModel.mealPlans);

    return (
        <div className="admin-meal-plans-container">
            <div className="admin-meal-plans-header">
                <h1 className="admin-meal-plans-title">
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
                            onChange={(e) => MealPlanViewModel.setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="category-dropdown-container" ref={categoryDropdownRef}>
                        <button
                            className="category-button"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        >
                            <i className="fas fa-filter"></i>
                            {selectedCategory || "All Categories"}
                        </button>
                        {showCategoryDropdown && (
                            <div className="category-dropdown-menu">
                                <button className="dropdown-item" onClick={() => { MealPlanViewModel.setSelectedCategory(''); setShowCategoryDropdown(false); }}>
                                    <i className="fas fa-th-large"></i>
                                    All Categories
                                </button>
                                {MealPlanViewModel.allCategories.map((categoryName) => (
                                    <button
                                        key={categoryName}
                                        className={`dropdown-item ${selectedCategory === categoryName ? 'selected' : ''}`}
                                        onClick={() => {
                                            MealPlanViewModel.setSelectedCategory(categoryName);
                                            setShowCategoryDropdown(false);
                                        }}
                                    >
                                        <i className="fas fa-tag"></i>
                                        {categoryName}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        className="manage-categories-button"
                        onClick={handleOpenCategoryManagement}
                    >
                        <i className="fas fa-cog"></i>
                        Manage Categories
                    </button>
                </div>
            </div>

            {/* Admin Tab Navigation */}
            <div className="admin-status-tabs">
                <button
                    className={`tab-button ${MealPlanViewModel.adminActiveTab === 'POPULAR' ? 'active' : ''}`}
                    onClick={() => handleTabNavigation('POPULAR')}
                >
                    <i className="fas fa-star"></i>
                    Popular
                </button>
                <button
                    className={`tab-button ${MealPlanViewModel.adminActiveTab === 'PENDING_APPROVAL' ? 'active' : ''}`}
                    onClick={() => handleTabNavigation('PENDING_APPROVAL')}
                >
                    <i className="fas fa-clock"></i>
                    Pending ({pendingCount})
                </button>
                <button
                    className={`tab-button ${MealPlanViewModel.adminActiveTab === 'APPROVED' ? 'active' : ''}`}
                    onClick={() => handleTabNavigation('APPROVED')}
                >
                    <i className="fas fa-check"></i>
                    Approved ({approvedCount})
                </button>
                <button
                    className={`tab-button ${MealPlanViewModel.adminActiveTab === 'REJECTED' ? 'active' : ''}`}
                    onClick={() => handleTabNavigation('REJECTED')}
                >
                    <i className="fas fa-times"></i>
                    Rejected ({rejectedCount})
                </button>
            </div>

            {localLoading || MealPlanViewModel.loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Loading meal plans...</p>
                </div>
            ) : error ? (
                <div className="error-container">
                    <p className="error-message">
                        <i className="fas fa-exclamation-triangle"></i>
                        {error}
                    </p>
                </div>
            ) : (
                <>
                    {MealPlanViewModel.adminActiveTab === 'POPULAR' ? (
                        <div className="popular-content">
                            <PopularSection
                                title="🏆 Most Saved Meal Plans"
                                mealPlans={popularCategories.topSaved}
                                onCardClick={handleCardClick}
                                emptyMessage="No saved meal plans yet"
                            />
                            
                            <PopularSection
                                title="💪 High Protein Favorites"
                                mealPlans={popularCategories.highProtein}
                                onCardClick={handleCardClick}
                                emptyMessage="No high protein meals yet"
                            />
                            
                            <PopularSection
                                title="🥗 Low Carb Champions"
                                mealPlans={popularCategories.lowCarb}
                                onCardClick={handleCardClick}
                                emptyMessage="No low carb meals yet"
                            />
                            
                            <PopularSection
                                title="🌱 Vegetarian Hits"
                                mealPlans={popularCategories.vegetarian}
                                onCardClick={handleCardClick}
                                emptyMessage="No vegetarian meals yet"
                            />
                            
                            <PopularSection
                                title="⚡ Quick & Easy"
                                mealPlans={popularCategories.quickMeals}
                                onCardClick={handleCardClick}
                                emptyMessage="No quick meals yet"
                            />
                            
                            <PopularSection
                                title="🩺 Diabetic-Friendly"
                                mealPlans={popularCategories.diabeticFriendly}
                                onCardClick={handleCardClick}
                                emptyMessage="No diabetic-friendly meals yet"
                            />
                        </div>
                    ) : (
                        <div className="meal-plans-grid">
                            {MealPlanViewModel.filteredMealPlans.length > 0 ? (
                                MealPlanViewModel.filteredMealPlans.map(plan => (
                                    <div 
                                        key={plan._id} 
                                        className="meal-plan-card"
                                        onClick={() => handleCardClick(plan._id)}
                                    >
                                        <div className="meal-plan-image-container">
                                            <img
                                                src={plan.imageUrl || `/assetscopy/${plan.imageFileName}`}
                                                alt={plan.name}
                                                className="meal-plan-card-image"
                                            />
                                            <div className="status-badge">
                                                <span className={`status-indicator status-${plan.status.toLowerCase().replace('_', '-')}`}>
                                                    {plan.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="meal-plan-card-content">
                                            <div className="meal-plan-card-info">
                                                <h3 className="meal-plan-card-name">{plan.name}</h3>
                                                <p className="meal-plan-card-author">by {plan.author || 'N/A'}</p>
                                                {plan.saveCount && plan.saveCount > 0 && (
                                                    <p className="meal-plan-save-count">
                                                        <i className="fas fa-bookmark"></i> {plan.saveCount} saves
                                                    </p>
                                                )}
                                            </div>
                                            {plan.status === 'PENDING_APPROVAL' && (
                                                <div className="meal-plan-card-actions">
                                                    <button
                                                        className="approve-button"
                                                        onClick={(e) => handleApproveClick(plan._id, e)}
                                                        disabled={localLoading}
                                                    >
                                                        APPROVE
                                                    </button>
                                                    <button
                                                        className="reject-button"
                                                        onClick={(e) => handleRejectClick(plan._id, e)}
                                                        disabled={localLoading}
                                                    >
                                                        REJECT
                                                    </button>
                                                </div>
                                            )}
                                            {plan.status === 'REJECTED' && plan.rejectionReason && (
                                                <div className="rejection-info-container">
                                                    <p className="rejection-info">
                                                        <span className="rejection-label">Reason:</span>
                                                        {plan.rejectionReason}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-plans-container">
                                    <div className="no-plans-icon">📋</div>
                                    <p className="no-pending-plans-message">No meal plans matching your criteria for the selected status.</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

           {showRejectModal && (
  <div className="reject-modal-overlay">
    <div className="reject-modal-content">
      {/* Modal Header */}
      <div className="reject-modal-header">
        <h2 className="reject-modal-title">Reject Meal Plan</h2>
        <p className="modal-subtitle">Please select a reason for rejecting this meal plan</p>
      </div>

      {/* Modal Body */}
      <div className="reject-modal-body">
        <h3 className="reasons-section-title">Select Rejection Reason</h3>
        <div className="reasons-list">
          {rejectionReasons.map((reason, index) => (
            <button
              key={index}
              className={`reason-button ${selectedRejectReason === reason ? 'active' : ''}`}
              onClick={() => handleReasonButtonClick(reason)}
            >
              {reason}
            </button>
          ))}
        </div>

        {selectedRejectReason === 'Other (please specify)' && (
          <div className="other-reason-container">
            <label className="other-reason-label" htmlFor="other-reason">
              Please specify the reason:
            </label>
            <textarea
              id="other-reason"
              className="other-reason-input"
              placeholder="Please provide a detailed explanation for the rejection..."
              value={otherReasonText}
              onChange={(e) => setOtherReasonText(e.target.value)}
              rows="4"
              maxLength={500}
            />
            <div className="character-counter">
              <span>Be specific to help the user improve their submission</span>
              <span className={`character-count ${otherReasonText.length > 400 ? 'warning' : ''} ${otherReasonText.length >= 500 ? 'error' : ''}`}>
                {otherReasonText.length}/500
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="reject-modal-footer">
        <div className="modal-actions">
          <button 
            className="reject-cancel-button" 
            onClick={handleRejectCancel}
            disabled={localLoading}
          >
            Cancel
          </button>
          <button 
            className={`reject-submit-button ${localLoading ? 'loading' : ''}`}
            onClick={handleRejectSubmit} 
            disabled={localLoading || !selectedRejectReason || (selectedRejectReason === 'Other (please specify)' && !otherReasonText.trim())}
          >
            {localLoading ? 'Rejecting...' : 'Reject Meal Plan'}
          </button>
        </div>
      </div>
    </div>
  </div>
            )}

            {showApproveConfirmModal && (
                <div className="approve-modal-overlay" style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    zIndex: 9999 
                }}>
                    <div className="approve-modal-content" style={{ 
                        backgroundColor: 'white', 
                        padding: '20px', 
                        borderRadius: '8px', 
                        maxWidth: '400px', 
                        width: '90%',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h2 className="modal-title">Accept Meal Plan</h2>
                        <p>Are you sure you want to approve this meal plan?</p>
                        <div className="modal-actions" style={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            gap: '10px', 
                            marginTop: '20px' 
                        }}>
                            <button 
                                className="no-button" 
                                onClick={handleApproveCancel}
                                style={{
                                    padding: '10px 20px',
                                    border: '1px solid #ccc',
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                    borderRadius: '4px'
                                }}
                            >
                                No
                            </button>
                            <button 
                                className="yes-button" 
                                onClick={handleApproveConfirm} 
                                disabled={localLoading}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    backgroundColor: localLoading ? '#ccc' : '#28a745',
                                    color: 'white',
                                    cursor: localLoading ? 'not-allowed' : 'pointer',
                                    borderRadius: '4px'
                                }}
                            >
                                {localLoading ? 'Approving...' : 'Yes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MealCategoryManagementModal
                isOpen={showCategoryManagementModal}
                onClose={handleCloseCategoryManagement}
                mealPlanViewModel={MealPlanViewModel}
            />
        </div>
    );
});

export default AdminMealPlans;
