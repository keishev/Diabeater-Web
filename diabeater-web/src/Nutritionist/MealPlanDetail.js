import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import mealPlanViewModel from '../ViewModels/MealPlanViewModel';
import './MealPlanDetail.css';

const MealPlanDetail = observer(({ mealPlanId, onBack }) => {
    useEffect(() => {
        if (mealPlanId) {
            mealPlanViewModel.loadMealPlanDetails(mealPlanId);
        }
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

    const mealPlan = selectedMealPlanForDetail;

    // Helper to render nutrient boxes
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
                        <p className="meal-author">
                            By {mealPlan.author && !mealPlan.author.includes('@') 
                                ? mealPlan.author 
                                : mealPlan.author 
                                    ? mealPlan.author.split('@')[0].split(/[._-]/).map(part => 
                                        part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
                                    : 'Unknown Author'
                            }
                        </p>
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
                            {/* Fixed: Use description instead of generalNotes */}
                            {mealPlan.description || 'No general notes available.'}
                        </p>
                    </div>

                    <div className="detail-section ingredients-section">
                        <h2>Ingredients</h2>
                        <p className="pre-formatted-text">
                            {/* Fixed: Use ingredients instead of recipe */}
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
                            {/* Fixed: Access nutrients directly from mealPlan instead of nested object */}
                            <NutrientBox label="Calories" value={mealPlan.calories} unit="kcal" type="circle" />
                            <NutrientBox label="Protein" value={mealPlan.protein} unit="g" />
                            <NutrientBox label="Carbs" value={mealPlan.carbohydrates} unit="g" />
                            <NutrientBox label="Fats" value={mealPlan.fats} unit="g" />
                            <NutrientBox label="Sugar" value={mealPlan.sugar} unit="g" />
                            <NutrientBox label="Sat. Fat" value={mealPlan.saturatedFat} unit="g" />
                            <NutrientBox label="Unsat. Fat" value={mealPlan.unsaturatedFat} unit="g" />
                            <NutrientBox label="Cholesterol" value={mealPlan.cholesterol} unit="mg" />
                            <NutrientBox label="Sodium" value={mealPlan.sodium} unit="mg" />
                            <NutrientBox label="Potassium" value={mealPlan.potassium} unit="mg" />
                        </div>
                    </div>

                    <div className="detail-section category-buttons-section">
                        <h2>Category</h2>
                        <div className="category-buttons">
                            {/* Fixed: Use categories array instead of category */}
                            {Array.isArray(mealPlan.categories) ? (
                                mealPlan.categories.map((cat, index) => (
                                    <span key={index} className="category-tag">{cat}</span>
                                ))
                            ) : mealPlan.category ? (
                                <span className="category-tag">{mealPlan.category}</span>
                            ) : (
                                <p>No categories assigned.</p>
                            )}
                        </div>
                    </div>

                    <div className="detail-actions">
                        <button className="button-base delete-plan-button" onClick={() => {
                            if (window.confirm("Are you sure you want to delete this meal plan? This action cannot be undone.")) {
                                mealPlanViewModel.deleteMealPlan(mealPlan._id, mealPlan.imageFileName)
                                    .then(success => {
                                        if (success) onBack();
                                    })
                                    .catch(err => {
                                        console.error("Error deleting meal plan:", err);
                                    });
                            }
                        }}>DELETE PLAN</button>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default MealPlanDetail;