
import React, { useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import mealPlanViewModel from '../ViewModels/MealPlanViewModel';
import './AdminMealPlanDetail.css';

const AdminMealPlanDetail = observer(({ mealPlan, onClose }) => {
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRejectReason, setSelectedRejectReason] = useState('');
    const [otherReasonText, setOtherReasonText] = useState('');
    const [localLoading, setLocalLoading] = useState(false);

    const rejectionReasons = [
        'Incomplete information provided',
        'Inaccurate nutritional data',
        'Contains allergens not declared',
        'Poor image quality',
        'Does not meet dietary guidelines',
        'Other (please specify)'
    ];

    if (!mealPlan) {
        return (
            <div className="meal-detail-container">
                <h1 className="meal-detail-title">Error: Meal Plan data not provided.</h1>
                <button onClick={onClose} className="back-button">
                    Back to Meal Plans
                </button>
            </div>
        );
    }

    const NutrientBox = ({ label, value, unit, type = 'square' }) => {
        const numericValue = Number(value);
        if (isNaN(numericValue) || value === null || value === '') {
            return null;
        }

        const displayValue = numericValue % 1 === 0 ? numericValue.toFixed(0) : numericValue.toFixed(1);

        if (type === 'circle') {
            return (
                <div className="nutrient-circle">
                    <span className="nutrient-value">{displayValue} {unit}</span>
                    <span className="nutrient-label">{label}</span>
                </div>
            );
        }
        return (
            <div className="nutrient-square">
                <span className="nutrient-value">{displayValue} {unit}</span>
                <span className="nutrient-label">{label}</span>
            </div>
        );
    };

    const handleApprove = useCallback(async () => {
        const confirmed = await window.showConfirm({
            title: "Approve Meal Plan",
            message: `Are you sure you want to approve "${mealPlan.name}"?`,
            confirmText: "Yes, Approve",
            cancelText: "Cancel",
            type: "info"
        });

        if (!confirmed) {
            return;
        }

        setLocalLoading(true);
        try {
            const success = await mealPlanViewModel.approveOrRejectMealPlan(
                mealPlan._id,
                'APPROVED',
                mealPlan.authorId,
                mealPlanViewModel.currentUserName,
                mealPlanViewModel.currentUserId
            );
            if (success) {
                onClose();
            }
        } catch (err) {
            console.error("Failed to approve meal plan from detail view:", err);


            const errorMessage = mealPlanViewModel.error || 'Failed to approve meal plan.';
            if (window.showError) {
                window.showError(errorMessage);
            } else {
                alert(errorMessage);
            }
        } finally {
            setLocalLoading(false);
        }
    }, [mealPlan, onClose]);

    const handleRejectClick = useCallback(() => {
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
            const success = await mealPlanViewModel.approveOrRejectMealPlan(
                mealPlan._id,
                'REJECTED',
                mealPlan.authorId,
                mealPlanViewModel.currentUserName,
                mealPlanViewModel.currentUserId,
                finalReason
            );
            if (success) {
                onClose();
            }
            setShowRejectModal(false);
        } catch (err) {
            console.error("Failed to reject meal plan from detail view:", err);
            alert(mealPlanViewModel.error || 'Failed to reject meal plan.');
        } finally {
            setLocalLoading(false);
        }
    }, [mealPlan, selectedRejectReason, otherReasonText, onClose]);

    const handleRejectCancel = useCallback(() => {
        setShowRejectModal(false);
        setSelectedRejectReason('');
        setOtherReasonText('');
    }, []);


    const categoriesToDisplay = Array.isArray(mealPlan.categories)
        ? mealPlan.categories
        : (typeof mealPlan.category === 'string' ? [mealPlan.category] : []);

    return (
        <div className="meal-plan-detail-container">
            <div className="back-button-wrapper">
                <button onClick={onClose} className="back-button">← Back to Meal Plans</button>
            </div>

            <div className="detail-main-layout">
                {/* Left Column */}
                <div className="detail-left-column">
                    <div className="meal-header">
                        <h1 className="meal-title">{mealPlan.name}</h1>
                        <p className="meal-author">By {mealPlan.author || 'Unknown Author'}</p>
                        <p className="meal-status">Status: {mealPlan.status}</p>
                        {mealPlan.status === 'REJECTED' && mealPlan.rejectionReason && (
                            <p className="rejection-info">Rejection Reason: {mealPlan.rejectionReason}</p>
                        )}
                    </div>

                    <div className="detail-image-wrapper">
                        {mealPlan.imageUrl ? (
                            <img src={mealPlan.imageUrl} alt={mealPlan.name} className="detail-image" />
                        ) : (
                            <div className="no-image-placeholder">No Image Available</div>
                        )}
                    </div>

                    <div className="detail-section general-description-section">
                        <h2>General Description & Notes</h2>
                        <p className="pre-formatted-text">
                            {mealPlan.description || 'No general description available.'}
                        </p>
                    </div>

                    <div className="detail-section ingredients-section">
                        <h2>Ingredients</h2>
                        <p className="pre-formatted-text">
                            {mealPlan.ingredients || 'No ingredients listed.'}
                        </p>
                    </div>

                    <div className="detail-section preparation-section">
                        <h2>Preparation Steps</h2>
                        <p className="pre-formatted-text">
                            {/* Fixed: Use steps instead of preparationSteps */}
                            {mealPlan.steps || 'No preparation steps provided.'}
                        </p>
                    </div>
                </div>

                {/* Right Column */}
                <div className="detail-right-column">

                    <div className="detail-section nutrients-section">
                        <h2>Nutrient Information</h2>
                        <div className="nutrients-display-grid">
                            <NutrientBox label="Calories" value={mealPlan.nutrients.calories} unit="kcal" type="circle" />
                            <NutrientBox label="Protein" value={mealPlan.nutrients.protein} unit="g" />
                            <NutrientBox label="Carbs" value={mealPlan.nutrients.carbohydrates} unit="g" />
                            <NutrientBox label="Fats" value={mealPlan.nutrients.fats} unit="g" />
                            <NutrientBox label="Sugar" value={mealPlan.nutrients.sugar} unit="g" />
                            <NutrientBox label="Sat. Fat" value={mealPlan.nutrients.saturatedFat} unit="g" />
                            <NutrientBox label="Unsat. Fat" value={mealPlan.nutrients.unsaturatedFat} unit="g" />
                            <NutrientBox label="Cholesterol" value={mealPlan.nutrients.cholesterol} unit="mg" />
                            <NutrientBox label="Sodium" value={mealPlan.nutrients.sodium} unit="mg" />
                            <NutrientBox label="Potassium" value={mealPlan.nutrients.potassium} unit="mg" />
                        </div>
                    </div>

                    <div className="detail-section category-buttons-section">
                        <h2>Category</h2>
                        <div className="category-buttons">
                            {categoriesToDisplay.length > 0 ? (
                                categoriesToDisplay.map((cat, index) => (
                                    <span key={index} className="category-tag">{cat}</span>
                                ))
                            ) : (
                                <p>No categories assigned.</p>
                            )}
                        </div>
                    </div>

                    {/* Admin Action buttons */}
                    {mealPlan.status === 'PENDING_APPROVAL' && (
                        <div className="detail-actions admin-actions">
                            <button className="button-base meal-detail-approve-button" onClick={handleApprove} disabled={localLoading}>
                                APPROVE
                            </button>
                            <button className="button-base meal-detail-reject-button" onClick={handleRejectClick} disabled={localLoading}>
                                REJECT
                            </button>
                        </div>
                    )}

                    {(mealPlan.status === 'APPROVED' || mealPlan.status === 'REJECTED') && (
                        <div className="detail-actions admin-actions">

                        </div>
                    )}
                </div>
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
                            <button className="cancel-button" onClick={handleRejectCancel} disabled={localLoading}>
                                Cancel
                            </button>
                            <button className="submit-button" onClick={handleRejectSubmit} disabled={localLoading || !selectedRejectReason}>
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default AdminMealPlanDetail;