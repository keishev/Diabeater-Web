// Components for specific meal plan tabs
import React from 'react';

// Import the MealPlanCard component for reuse
const MealPlanCard = ({ mealPlan, onClick, onUpdateClick, onDeleteClick, isAdmin }) => {
    const displayStatus = mealPlan.status === 'UPLOADED' ? 'DRAFT / UNSUBMITTED' : mealPlan.status.replace(/_/g, ' ');
    const imageUrl = mealPlan.imageUrl || `/assetscopy/${mealPlan.imageFileName}`;
    const cardClassName = `meal-plan-card meal-plan-card--${mealPlan.status.toLowerCase().replace(/\s|\//g, '-')}`;

    return (
        <div className={cardClassName} onClick={() => onClick(mealPlan._id)}>
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
                    <button
                        className="button-base update-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdateClick(mealPlan._id);
                        }}
                    >
                        <i className="fas fa-edit"></i>
                        UPDATE
                    </button>
                    <button
                        className="button-base delete-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClick(mealPlan._id, mealPlan.imageFileName);
                        }}
                    >
                        <i className="fas fa-trash"></i>
                        DELETE
                    </button>
                </div>
            </div>
        </div>
    );
};
