// src/Nutritionist/MealPlanDetail.js
import React from 'react';
import './MealPlanDetail.css';

const MealPlanDetail = ({ mealPlan, onBack }) => {
    if (!mealPlan) {
        return <p>Meal plan not found.</p>;
    }

    // Ensure nutrientInfo exists and has default values to prevent errors if data is missing
    const nutrientInfo = mealPlan.nutrientInfo || {
        calories: 'N/A',
        carbs: 'N/A',
        protein: 'N/A',
        fat: 'N/A',
    };

    return (
        <div className="meal-detail-page">
            <header className="meal-detail-header">
                <button className="back-button" onClick={onBack}>
                    <i className="fas fa-arrow-left"></i> Back to Meal Plans
                </button>
                <h1 className="meal-detail-title">{mealPlan.name}</h1>
                <span className="meal-detail-author">{mealPlan.author}</span>
            </header>

            <div className="meal-detail-image-container">
                <img src={mealPlan.image} alt={mealPlan.name} className="meal-detail-main-image" />
                <span className="meal-detail-likes-count">{mealPlan.likes}</span>
            </div>

            <div className="meal-detail-section">
                <h2>Description</h2>
                <p>{mealPlan.description}</p>
                <h3>Recipe:</h3>
                <ul>
                    {/* Check if mealPlan.recipe exists and is an array before mapping */}
                    {mealPlan.recipe && Array.isArray(mealPlan.recipe) && mealPlan.recipe.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>

            <div className="meal-detail-section">
                <h2>Preparation:</h2>
                <p>{mealPlan.preparation}</p>
            </div>

            {/* Container for Allergens and Nutrient Information to be side-by-side */}
            <div className="allergens-nutrients-section-wrapper">

                {/* Allergens, Portion Size, and Storage Section (Left Column) */}
                <div className="meal-detail-section allergens-info-section">
                    <h3>Allergens:</h3>
                    <p>{mealPlan.allergens}</p>
                    <h3>Portion Size:</h3>
                    <p>{mealPlan.portionSize}</p>
                    <h3>Storage:</h3>
                    <p>{mealPlan.storage}</p>
                </div>

                {/* NEW NUTRIENT INFORMATION DISPLAY (Right Column) */}
                <div className="meal-detail-section nutrient-info-section">
                    <h2>Nutrient Information</h2>
                    <div className="nutrients-display-container"> {/* Renamed for display, not input */}
                        {/* Calories Circle Display */}
                        <div className="nutrient-circle-display-wrapper">
                            <div className="nutrient-display-circle">
                                <span className="nutrient-value-kcal">{nutrientInfo.calories}</span>
                                <span className="nutrient-unit-kcal">kcal</span>
                            </div>
                        </div>

                        {/* Rectangular Nutrient Displays */}
                        <div className="nutrient-rectangular-display-wrapper">
                            <div className="nutrient-display-card">
                                <span className="nutrient-label-text">carbs</span>
                                <span className="nutrient-value-g">{nutrientInfo.carbs}g</span>
                            </div>
                            <div className="nutrient-display-card">
                                <span className="nutrient-label-text">fats</span>
                                <span className="nutrient-value-g">{nutrientInfo.fat}g</span>
                            </div>
                            <div className="nutrient-display-card">
                                <span className="nutrient-label-text">protein</span>
                                <span className="nutrient-value-g">{nutrientInfo.protein}g</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div> {/* End of allergens-nutrients-section-wrapper */}

            <div className="meal-detail-section">
                <h2>Category</h2>
                <div className="category-tags">
                    {mealPlan.categories.map((category, index) => (
                        <span key={index} className="category-tag">{category}</span>
                    ))}
                </div>
            </div>

            <div className="meal-detail-actions">
                <button className="delete-plan-button">DELETE PLAN</button>
            </div>
        </div>
    );
};

export default MealPlanDetail;