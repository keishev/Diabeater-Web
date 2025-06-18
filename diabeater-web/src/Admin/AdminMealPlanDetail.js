// src/Admin/AdminMealPlanDetail.js
import React from 'react';
import './AdminMealPlanDetail.css';
import './AdminMealPlans.js';

// AdminMealPlanDetail now accepts mealPlan and onClose as props
const AdminMealPlanDetail = ({ mealPlan, onClose }) => {
    // No need for useParams or finding the mealPlan if it's passed directly

    if (!mealPlan) {
        // This case should ideally not happen if parent handles it correctly
        return (
            <div className="meal-detail-container">
                <h1 className="meal-detail-title">Error: Meal Plan data not provided.</h1>
                <button onClick={onClose} className="back-button">
                    Back to Meal Plans
                </button>
            </div>
        );
    }

    return (
        <div className="meal-detail-container">
            <div className="meal-detail-header">
                <h1 className="meal-detail-title">{mealPlan.name}</h1>
                <span className="meal-detail-author">By {mealPlan.author}</span>
                {/* Call onClose prop when X button is clicked */}
                <button className="close-detail-button" onClick={onClose}>
                    X
                </button>
            </div>

            <img
                src={`/assetscopy/${mealPlan.imageFileName}`}
                alt={mealPlan.name}
                className="meal-detail-image"
            />

            <div className="meal-detail-section">
                <h2 className="section-heading">Description</h2>
                <p className="section-content">{mealPlan.description}</p>
            </div>

            <div className="meal-detail-section">
                <h2 className="section-heading">Ingredients ({mealPlan.ingredients.length} serving)</h2>
                <ul className="ingredients-list">
                    {mealPlan.ingredients.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>

            <div className="meal-detail-section">
                <h2 className="section-heading">Nutrient Information</h2>
                <div className="nutrient-info-grid">
                    <div className="nutrient-circle-container">
                        <div className="nutrient-circle">
                            <span className="nutrient-value">{mealPlan.nutrientInfo.kcal}</span>
                            <span className="nutrient-unit">kcal</span>
                        </div>
                    </div>
                    <div className="nutrient-box">
                        <span className="nutrient-value">{mealPlan.nutrientInfo.carbs} g</span>
                        <span className="nutrient-label">Carbs</span>
                    </div>
                    <div className="nutrient-box">
                        <span className="nutrient-value">{mealPlan.nutrientInfo.protein} g</span>
                        <span className="nutrient-label">Protein</span>
                    </div>
                    <div className="nutrient-box">
                        <span className="nutrient-value">{mealPlan.nutrientInfo.fat} g</span>
                        <span className="nutrient-label">Fat</span>
                    </div>
                </div>
            </div>

            <div className="meal-detail-section">
                <h2 className="section-heading">Category</h2>
                <div className="category-tags">
                    {mealPlan.category.map((cat, index) => (
                        <span key={index} className="category-tag">{cat}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminMealPlanDetail;