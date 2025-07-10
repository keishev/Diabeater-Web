// src/Nutritionist/MealPlanDetail.js
import React from 'react';
import { observer } from 'mobx-react-lite';
import mealPlanViewModel from '../ViewModels/MealPlanViewModel';
import './MealPlanDetail.css';

const MealPlanDetail = observer(({ onBack, userRole, currentUserId, onDeleteMealPlan }) => {
    const { selectedMealPlanForDetail, loading, error } = mealPlanViewModel;

    const handleDeleteClick = async () => {
        if (!selectedMealPlanForDetail) return;
        if (window.confirm("Are you sure you want to delete this meal plan? This action cannot be undone.")) {
            const success = await onDeleteMealPlan(selectedMealPlanForDetail._id, selectedMealPlanForDetail.imageFileName);
            if (success) {
                onBack(); // Go back after successful deletion
            }
        }
    };

    if (loading) {
        return (
            <div className="meal-plan-detail-container">
                <button onClick={onBack} className="back-button">← Back to Meal Plans</button>
                <p>Loading meal plan details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="meal-plan-detail-container">
                <button onClick={onBack} className="back-button">← Back to Meal Plans</button>
                <p className="error-message">Error: {error}</p>
            </div>
        );
    }

    if (!selectedMealPlanForDetail) {
        return (
            <div className="meal-plan-detail-container">
                <button onClick={onBack} className="back-button">← Back to Meal Plans</button>
                <p>No meal plan selected for detail.</p>
            </div>
        );
    }

    const mealPlan = selectedMealPlanForDetail;

    const isNutritionistAuthor = userRole === 'nutritionist' && mealPlan.authorId === currentUserId;
    const canDelete = isNutritionistAuthor || userRole === 'admin';

    return (
        <div className="meal-plan-detail-container">
            <button onClick={onBack} className="back-button">← Back to Meal Plans</button>
            <div className="meal-plan-detail-card">
                <img
                    src={mealPlan.imageUrl || `/assetscopy/${mealPlan.imageFileName}`}
                    alt={mealPlan.name}
                    className="meal-plan-detail-image"
                />
                <div className="meal-plan-detail-info">
                    <h2 className="meal-plan-detail-name">{mealPlan.name}</h2>
                    {mealPlan.author && <p className="meal-plan-detail-author">by {mealPlan.author}</p>}

                    <div className="meal-plan-detail-section">
                        <h3>Description</h3>
                        <p className="meal-plan-detail-description">{mealPlan.description}</p>
                    </div>

                    {/* FIX HERE: Ensure mealPlan.ingredients is an array before mapping */}
                    {(mealPlan.ingredients || []).length > 0 && (
                        <div className="meal-plan-detail-section">
                            <h3>Ingredients:</h3>
                            <ul>
                                {(mealPlan.ingredients || []).map((ingredient, index) => (
                                    <li key={index}>
                                        {ingredient.quantity} {ingredient.unit} {ingredient.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* FIX HERE: Ensure mealPlan.instructions is an array before mapping */}
                    {(mealPlan.instructions || []).length > 0 && (
                        <div className="meal-plan-detail-section">
                            <h3>Instructions:</h3>
                            <ol>
                                {(mealPlan.instructions || []).map((instruction, index) => (
                                    <li key={index}>{instruction}</li>
                                ))}
                            </ol>
                        </div>
                    )}

                    <div className="meal-plan-detail-section">
                        <h3>Nutrient Information</h3>
                        <div className="meal-plan-detail-macros">
                            <div className="macro-item">
                                <div className="macro-circle calories">
                                    <span className="macro-value">{mealPlan.calories || 0}</span>
                                    <span className="macro-unit">cal</span>
                                </div>
                            </div>
                            <div className="macro-item">
                                <div className="macro-square">
                                    <span>{mealPlan.carbs || 0} g</span>
                                    <span>Carbs</span>
                                </div>
                            </div>
                            <div className="macro-item">
                                <div className="macro-square">
                                    <span>{mealPlan.protein || 0} g</span>
                                    <span>Protein</span>
                                </div>
                            </div>
                            <div className="macro-item">
                                <div className="macro-square">
                                    <span>{mealPlan.fat || 0} g</span>
                                    <span>Fat</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FIX HERE: Ensure mealPlan.categories is an array before mapping */}
                    {(mealPlan.categories || []).length > 0 && (
                        <div className="meal-plan-detail-section">
                            <h3>Category</h3>
                            <div className="meal-plan-detail-categories-list">
                                {(mealPlan.categories || []).map((category, index) => (
                                    <span key={index} className="meal-plan-detail-category-tag">
                                        {category}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {canDelete && (
                        <div className="meal-plan-detail-actions">
                            <button className="delete-button" onClick={handleDeleteClick}>
                                DELETE MEAL PLAN
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default MealPlanDetail;