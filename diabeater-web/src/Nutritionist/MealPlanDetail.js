import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import mealPlanViewModel from '../ViewModels/MealPlanViewModel';
import './MealPlanDetail.css'; // Ensure this CSS file is correctly linked

const MealPlanDetail = observer(({ mealPlanId, onBack }) => {
    // When the component mounts or mealPlanId changes, load the details
    useEffect(() => {
        if (mealPlanId) {
            mealPlanViewModel.loadMealPlanDetails(mealPlanId);
        }
        // Clean up when component unmounts or mealPlanId changes
        return () => mealPlanViewModel.clearSelectedMealPlans();
    }, [mealPlanId]);

    const { selectedMealPlanForDetail, loading, error } = mealPlanViewModel;

    if (loading) {
        return <p className="detail-loading">Loading meal plan details...</p>;
    }

    if (error) {
        return <p className="detail-error">{error}</p>;
    }

    if (!selectedMealPlanForDetail) {
        return <p className="detail-message">Select a meal plan to see details.</p>;
    }

    const mealPlan = selectedMealPlanForDetail; // Use a shorter alias for convenience

    // Helper to render nutrient boxes
    const NutrientBox = ({ label, value, unit, type = 'square' }) => {
        // Only render if value is a valid number and not empty/null
        const numericValue = Number(value);
        if (isNaN(numericValue) || value === null || value === '') {
            return null;
        }

        const displayValue = numericValue % 1 === 0 ? numericValue.toFixed(0) : numericValue.toFixed(1);

        if (type === 'circle') {
            // For the calories circle, you might want to dynamically set the conic-gradient percentage
            // based on a max daily value, but for now, it's a static visual.
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

    return (
        <div className="meal-plan-detail-container">
                <div className="back-button-wrapper">
                    <button onClick={onBack} className="back-button">← Back to Dashboard</button>
                </div>

            <div className="detail-main-layout">
                {/* Left Column */}
                <div className="detail-left-column">
                    <div className="meal-header">
                        <h1 className="meal-title">{mealPlan.name}</h1>
                        <p className="meal-author">By {mealPlan.author || 'Unknown Author'}</p>
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
                            {mealPlan.generalNotes || 'No general notes available.'}
                        </p>
                    </div>
                </div>

                {/* Right Column */}
                <div className="detail-right-column">
                    <div className="detail-section ingredients-section">
                        <h2>Ingredients</h2>
                        <p className="pre-formatted-text">
                            {mealPlan.recipe || 'No ingredients listed.'}
                        </p>
                    </div>

                    <div className="detail-section preparation-section">
                        <h2>Preparation Steps</h2>
                        <p className="pre-formatted-text">
                            {mealPlan.preparationSteps || 'No preparation steps provided.'}
                        </p>
                    </div>

                    <div className="detail-section nutrients-section">
                        <h2>Nutrient Information</h2>
                        <div className="nutrients-display-grid">
                            <NutrientBox label="Calories" value={mealPlan.nutrients?.calories} unit="kcal" type="circle" />
                            {/* Basic Nutrients (squares) */}
                            <NutrientBox label="Protein" value={mealPlan.nutrients?.protein} unit="g" />
                            <NutrientBox label="Carbs" value={mealPlan.nutrients?.carbohydrates} unit="g" />
                            <NutrientBox label="Fats" value={mealPlan.nutrients?.fats} unit="g" />
                            {/* Advanced Nutrients (more squares) */}
                            <NutrientBox label="Sugar" value={mealPlan.nutrients?.sugar} unit="g" />
                            <NutrientBox label="Sat. Fat" value={mealPlan.nutrients?.saturatedFat} unit="g" />
                            <NutrientBox label="Unsat. Fat" value={mealPlan.nutrients?.unsaturatedFat} unit="g" />
                            <NutrientBox label="Cholesterol" value={mealPlan.nutrients?.cholesterol} unit="mg" />
                            <NutrientBox label="Sodium" value={mealPlan.nutrients?.sodium} unit="mg" />
                            <NutrientBox label="Potassium" value={mealPlan.nutrients?.potassium} unit="mg" />
                        </div>
                    </div>

                    <div className="detail-section category-buttons-section">
                        <h2>Category</h2>
                        <div className="category-buttons">
                            {/* Assuming category can be a single string or an array for futureproofing */}
                            {Array.isArray(mealPlan.category) ? (
                                mealPlan.category.map((cat, index) => (
                                    <span key={index} className="category-tag">{cat}</span>
                                ))
                            ) : mealPlan.category ? (
                                <span className="category-tag">{mealPlan.category}</span>
                            ) : (
                                <p>No categories assigned.</p>
                            )}
                        </div>
                    </div>

                    {/* Action buttons at the bottom right */}
                    <div className="detail-actions">
                        <button className="button-base delete-plan-button" onClick={() => {
                            if (window.confirm("Are you sure you want to delete this meal plan? This action cannot be undone.")) {
                                mealPlanViewModel.deleteMealPlan(mealPlan._id, mealPlan.imageFileName)
                                    .then(success => {
                                        if (success) onBack(); // Go back if deletion is successful
                                    })
                                    .catch(err => {
                                        console.error("Error deleting meal plan:", err);
                                        // ViewModel should handle error message, but can add local feedback too
                                    });
                            }
                        }}>DELETE PLAN</button>
                    </div>
                </div>
            </div>
            {/* Log Out button, if it's meant to be consistently at the bottom left */}
            {/* <div className="bottom-logout-button-wrapper">
                <button className="button-base bottom-logout-button">LOG OUT</button>
            </div> */}
        </div>
    );
});

export default MealPlanDetail;