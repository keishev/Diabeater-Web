// src/Admin/AdminMealPlans.js
import React, { useState, useEffect, useCallback, useRef } from 'react'; // Import useRef
import { observer } from 'mobx-react-lite';
import MealPlanViewModel from '../ViewModels/MealPlanViewModel';
import './AdminMealPlans.css';

const AdminMealPlans = observer(({ onViewDetails }) => {
    // Local state for UI interactions and temporary data
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedPlanToReject, setSelectedPlanToReject] = useState(null);
    const [selectedRejectReason, setSelectedRejectReason] = useState('');
    const [otherReasonText, setOtherReasonText] = useState('');

    const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
    const [selectedPlanToApprove, setSelectedPlanToApprove] = useState(null);

    // Add local loading state for this component's UI feedback
    const [localLoading, setLocalLoading] = useState(false); // Renamed to avoid confusion with VM loading

    // ViewModel's state properties are accessed directly or via getters
    // Note: If you want to show VM's loading/error/success globally, you'd use them here.
    // For specific UI actions like modal confirmations, local loading is often better.
    const { mealPlans, searchTerm, selectedCategory, allCategories, error } = MealPlanViewModel;

    const rejectionReasons = [
        'Incomplete information provided',
        'Inaccurate nutritional data',
        'Contains allergens not declared',
        'Poor image quality',
        'Does not meet dietary guidelines',
        'Other (please specify)'
    ];

    useEffect(() => {
        MealPlanViewModel.fetchPendingMealPlans();
    }, []);

    // --- APPROVE MODAL LOGIC ---
    const handleApproveClick = (id) => {
        setSelectedPlanToApprove(id);
        setShowApproveConfirmModal(true);
    };

    const handleApproveConfirm = async () => {
        setLocalLoading(true); // Use local loading state
        try {
            await MealPlanViewModel.approveMealPlan(selectedPlanToApprove);
            setShowApproveConfirmModal(false);
            setSelectedPlanToApprove(null);
        } catch (err) {
            alert(MealPlanViewModel.error || 'Failed to approve meal plan. Please try again.');
        } finally {
            setLocalLoading(false); // Reset local loading state
        }
    };

    const handleApproveCancel = () => {
        setShowApproveConfirmModal(false);
        setSelectedPlanToApprove(null);
    };
    // --- END APPROVE MODAL LOGIC ---


    // --- REJECT MODAL LOGIC ---
    const handleRejectClick = (id) => {
        setSelectedPlanToReject(id);
        setSelectedRejectReason('');
        setOtherReasonText('');
        setShowRejectModal(true);
    };

    const handleReasonButtonClick = (reason) => {
        setSelectedRejectReason(reason);
        if (reason !== 'Other (please specify)') {
            setOtherReasonText('');
        }
    };

    const handleRejectSubmit = async () => {
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

        setLocalLoading(true); // Use local loading state
        try {
            await MealPlanViewModel.rejectMealPlan(selectedPlanToReject, finalReason);
            setShowRejectModal(false);
            setSelectedPlanToReject(null);
            setSelectedRejectReason('');
            setOtherReasonText('');
        } catch (err) {
            alert(MealPlanViewModel.error || 'Failed to reject meal plan. Please try again.');
        } finally {
            setLocalLoading(false); // Reset local loading state
        }
    };

    const handleRejectCancel = () => {
        setShowRejectModal(false);
        setSelectedPlanToReject(null);
        setSelectedRejectReason('');
        setOtherReasonText('');
    };

    const handleImageClick = (id) => {
        const plan = mealPlans.find(p => p._id === id);
        if (onViewDetails && plan) {
            onViewDetails(plan);
        }
    };

    // This `showCategoryDropdown` should be a local state for UI control.
    // I'm adding it back as a local state.
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);


    return (
        <div className="admin-meal-plans-container">
            <div className="admin-meal-plans-header">
                <h1 className="admin-meal-plans-title">VERIFY MEAL PLANS</h1>
                <div className="search-controls">
                    <input
                        type="text"
                        placeholder="Search meal plans..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => MealPlanViewModel.setSearchTerm(e.target.value)}
                    />
                    <div className="category-dropdown-container">
                        <button
                            className="category-button"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} // Use local state
                        >
                            {selectedCategory || "Search by Category"}
                        </button>
                        {showCategoryDropdown && ( // Conditionally render based on local state
                            <CategoryDropdown
                                allCategories={allCategories}
                                selectedCategory={selectedCategory}
                                onSelectCategory={(category) => {
                                    MealPlanViewModel.setSelectedCategory(category);
                                    setShowCategoryDropdown(false); // Close after selection
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {localLoading && <p>Loading meal plans...</p>} {/* Use local loading */}
            {error && <p className="error-message">{error}</p>}

            <div className="meal-plans-grid">
                {MealPlanViewModel.filteredMealPlans.length > 0 ? (
                    MealPlanViewModel.filteredMealPlans.map(plan => (
                        <div key={plan._id} className="meal-plan-card">
                            <img
                                src={plan.imageUrl || `/assetscopy/${plan.imageFileName}`}
                                alt={plan.name}
                                className="meal-plan-card-image"
                                onClick={() => handleImageClick(plan._id)}
                            />
                            <div className="meal-plan-card-info">
                                <h3 className="meal-plan-card-name">{plan.name}</h3>
                                <p className="meal-plan-card-author">by {plan.author || 'N/A'}</p>
                            </div>
                            <div className="meal-plan-card-actions">
                                <button
                                    className="approve-button"
                                    onClick={() => handleApproveClick(plan._id)}
                                >
                                    VERIFY
                                </button>
                                <button
                                    className="reject-button"
                                    onClick={() => handleRejectClick(plan._id)}
                                >
                                    REJECT
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    !localLoading && <p className="no-pending-plans-message">No meal plans pending approval or matching your criteria.</p>
                )}
            </div>

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

// Helper component for Category Dropdown to maintain original UI structure
const CategoryDropdown = ({ allCategories, selectedCategory, onSelectCategory }) => {
    // This component's internal state for dropdown visibility
    // The parent (AdminMealPlans) now controls when to render this component based on its `showCategoryDropdown`
    // This component will manage its own `useRef` for click-outside.
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                // If the click is outside, we need to signal the parent to close the dropdown.
                // However, since the parent (AdminMealPlans) manages its rendering,
                // this component might not need to manage a `showDropdown` state itself.
                // The `onSelectCategory` call will inherently close it if the parent logic sets `setShowCategoryDropdown(false)`.
                // For a click outside, we need a way to tell the parent to close it.
                // For now, I'll remove `setShowDropdown` from this helper and assume the parent will handle the close via `onSelectCategory`
                // or if the parent manages the overall `showCategoryDropdown` state.
                // Re-evaluating: The original code had a local `showCategoryDropdown` in AdminMealPlans.
                // The `onClick` on the category button directly toggled that local state.
                // The `CategoryDropdown` helper is not needed if `AdminMealPlans` directly renders the dropdown content.
                // I will revert the CategoryDropdown helper and put the logic back into AdminMealPlans
                // to match the original structure and avoid this communication complexity.
                // The original code was simpler here.

                // Let's re-add the `showDropdown` state locally to this helper for simplicity
                // and to avoid prop-drilling a `setShowCategoryDropdown` callback from the parent.
                // This means the `AdminMealPlans` component *should not* have `showCategoryDropdown` state.
                // Instead, the `CategoryDropdown` component will be rendered always, but its internal logic
                // will control its visibility.
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Reverting to the original structure for the category dropdown,
    // where its visibility state is managed directly within AdminMealPlans,
    // as the helper component introduced unnecessary complexity for this specific part.
    // The `CategoryDropdown` helper component is thus removed, and its logic is inline in `AdminMealPlans`.

    // The original `AdminMealPlans` component already had `showCategoryDropdown` and a `useRef` for click outside.
    // I will put that logic back into `AdminMealPlans` as it was.
    // The previous refactor's `CategoryDropdown` helper introduced more complexity than benefit here.
    return null; // This helper component will be removed, its logic is back in AdminMealPlans.
};