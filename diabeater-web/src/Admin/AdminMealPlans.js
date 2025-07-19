// src/Admin/AdminMealPlans.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import MealPlanViewModel from '../ViewModels/MealPlanViewModel';
import AdminMealPlanDetail from './AdminMealPlanDetail'; // Import the detail component
import './AdminMealPlans.css';

const AdminMealPlans = observer(() => { // Removed onViewDetails prop as it's self-contained now
    // Local state for UI interactions and temporary data
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedPlanToReject, setSelectedPlanToReject] = useState(null);
    const [selectedRejectReason, setSelectedRejectReason] = useState('');
    const [otherReasonText, setOtherReasonText] = useState('');

    const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
    const [selectedPlanToApprove, setSelectedPlanToApprove] = useState(null);

    // Local loading state for this component's UI feedback
    const [localLoading, setLocalLoading] = useState(false);

    // Local state for Category Dropdown visibility
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const categoryDropdownRef = useRef(null); // Ref for click-outside functionality

    // Local state to manage showing the detail view
    const [showDetailView, setShowDetailView] = useState(false);
    // MealPlanViewModel.selectedMealPlanForDetail will hold the actual data

    // ViewModel's state properties are accessed directly or via getters
    const { searchTerm, selectedCategory, allCategories, error } = MealPlanViewModel;

    const rejectionReasons = [
        'Incomplete information provided',
        'Inaccurate nutritional data',
        'Contains allergens not declared',
        'Poor image quality',
        'Does not meet dietary guidelines',
        'Other (please specify)'
    ];

    // Effect to fetch initial meal plans and handle click outside for category dropdown
    useEffect(() => {
        // ⭐ FIX: Call fetchAdminMealPlans with 'PENDING_APPROVAL' ⭐
        MealPlanViewModel.fetchAdminMealPlans('PENDING_APPROVAL');

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

    // --- APPROVE MODAL LOGIC ---
    const handleApproveClick = useCallback((id) => {
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
            // After successful action, ensure detail view is closed if it was open for this plan
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
    // --- END APPROVE MODAL LOGIC ---

    // --- REJECT MODAL LOGIC ---
    const handleRejectClick = useCallback((id) => {
        setSelectedPlanToReject(id);
        setSelectedRejectReason('');
        setOtherReasonText('');
        setShowRejectModal(true);
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
            // After successful action, ensure detail view is closed if it was open for this plan
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

    // --- Detail View Logic ---
    const handleViewDetailsClick = useCallback(async (id) => {
        await MealPlanViewModel.loadMealPlanDetails(id); // Fetch details into the ViewModel
        if (MealPlanViewModel.selectedMealPlanForDetail) {
            setShowDetailView(true); // Show the detail component if data is loaded
        }
    }, []);

    const handleCloseDetailView = useCallback(() => {
        MealPlanViewModel.clearSelectedMealPlans(); // Clear the selected plan in ViewModel
        setShowDetailView(false); // Hide the detail component
    }, []);

    // --- Render Logic ---
    if (showDetailView && MealPlanViewModel.selectedMealPlanForDetail) {
        // If showDetailView is true and we have a selected plan, render the detail component
        return (
            <AdminMealPlanDetail
                mealPlan={MealPlanViewModel.selectedMealPlanForDetail}
                onClose={handleCloseDetailView}
            />
        );
    }

    // Otherwise, render the main AdminMealPlans list
    return (
        <div className="admin-meal-plans-container">
            <div className="admin-meal-plans-header">
                <h1 className="admin-meal-plans-title">VERIFY MEAL PLANS</h1>
                {/* Admin Tab Navigation */}
                <div className="admin-status-tabs">
                    <button
                        className={`tab-button ${MealPlanViewModel.adminActiveTab === 'PENDING_APPROVAL' ? 'active' : ''}`}
                        onClick={() => MealPlanViewModel.setAdminActiveTab('PENDING_APPROVAL')}
                    >
                        Pending ({MealPlanViewModel.mealPlans.filter(p => p.status === 'PENDING_APPROVAL').length})
                    </button>
                    <button
                        className={`tab-button ${MealPlanViewModel.adminActiveTab === 'APPROVED' ? 'active' : ''}`}
                        onClick={() => MealPlanViewModel.setAdminActiveTab('APPROVED')}
                    >
                        Approved ({MealPlanViewModel.mealPlans.filter(p => p.status === 'APPROVED').length})
                    </button>
                    <button
                        className={`tab-button ${MealPlanViewModel.adminActiveTab === 'REJECTED' ? 'active' : ''}`}
                        onClick={() => MealPlanViewModel.setAdminActiveTab('REJECTED')}
                    >
                        Rejected ({MealPlanViewModel.mealPlans.filter(p => p.status === 'REJECTED').length})
                    </button>
                </div>
                <div className="search-controls">
                    <input
                        type="text"
                        placeholder="Search meal plans..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => MealPlanViewModel.setSearchTerm(e.target.value)}
                    />
                    <div className="category-dropdown-container" ref={categoryDropdownRef}>
                        <button
                            className="category-button"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        >
                            {selectedCategory || "Search by Category"}
                        </button>
                        {showCategoryDropdown && (
                            <div className="category-dropdown-menu">
                                <button className="dropdown-item" onClick={() => { MealPlanViewModel.setSelectedCategory(''); setShowCategoryDropdown(false); }}>
                                    All Categories
                                </button>
                                {allCategories.map((category, index) => (
                                    <button
                                        key={index}
                                        className={`dropdown-item ${selectedCategory === category ? 'selected' : ''}`}
                                        onClick={() => {
                                            MealPlanViewModel.setSelectedCategory(category);
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
            </div>

            {localLoading || MealPlanViewModel.loading ? (
                <p>Loading meal plans...</p>
            ) : error ? (
                <p className="error-message">{error}</p>
            ) : (
                <div className="meal-plans-grid">
                    {MealPlanViewModel.filteredMealPlans.length > 0 ? (
                        MealPlanViewModel.filteredMealPlans.map(plan => (
                            <div key={plan._id} className="meal-plan-card">
                                <img
                                    src={plan.imageUrl || `/assetscopy/${plan.imageFileName}`}
                                    alt={plan.name}
                                    className="meal-plan-card-image"
                                    onClick={() => handleViewDetailsClick(plan._id)}
                                />
                                <div className="meal-plan-card-info">
                                    <h3 className="meal-plan-card-name">{plan.name}</h3>
                                    <p className="meal-plan-card-author">by {plan.author || 'N/A'}</p>
                                    <p className="meal-plan-card-status">Status: {plan.status}</p>
                                </div>
                                <div className="meal-plan-card-actions">
                                    {plan.status === 'PENDING_APPROVAL' && (
                                        <>
                                            <button
                                                className="approve-button"
                                                onClick={() => handleApproveClick(plan._id)}
                                                disabled={localLoading}
                                            >
                                                APPROVE
                                            </button>
                                            <button
                                                className="reject-button"
                                                onClick={() => handleRejectClick(plan._id)}
                                                disabled={localLoading}
                                            >
                                                REJECT
                                            </button>
                                        </>
                                    )}
                                    {plan.status === 'REJECTED' && plan.rejectionReason && (
                                        <p className="rejection-info">Reason: {plan.rejectionReason}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-pending-plans-message">No meal plans matching your criteria for the selected status.</p>
                    )}
                </div>
            )}

            {/* Rejection Reasons Modal */}
            {showRejectModal && (
                <div className="reject-modal-overlay">
                    <div className="reject-modal-content">
                        <h2 className="modal-title">Reason for Rejection</h2>
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
                            <textarea
                                className="other-reason-input"
                                placeholder="Type your reason here..."
                                value={otherReasonText}
                                onChange={(e) => setOtherReasonText(e.target.value)}
                                rows="3"
                            />
                        )}

                        <div className="modal-actions">
                            <button className="cancel-button" onClick={handleRejectCancel}>
                                Cancel
                            </button>
                            <button className="submit-button" onClick={handleRejectSubmit} disabled={localLoading}>
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Confirmation Modal */}
            {showApproveConfirmModal && (
                <div className="approve-modal-overlay">
                    <div className="approve-modal-content">
                        <h2 className="modal-title">Accept Meal Plan</h2>
                        <p>Are you sure you want to approve this meal plan?</p>
                        <div className="modal-actions">
                            <button className="no-button" onClick={handleApproveCancel}>
                                No
                            </button>
                            <button className="yes-button" onClick={handleApproveConfirm} disabled={localLoading}>
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default AdminMealPlans;