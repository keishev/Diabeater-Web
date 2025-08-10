// src/components/UpdateMealPlan.js
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import mealPlanViewModel from '../ViewModels/MealPlanViewModel';
import './UpdateMealPlan.css';

const UpdateMealPlan = observer(({ mealPlan, onBack }) => {
    // Initialize form state with existing meal plan data
    const [mealName, setMealName] = useState('');
    const [categories, setCategories] = useState([]); // Changed to array for multiple categories
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [description, setDescription] = useState('');
    const [recipe, setRecipe] = useState('');
    const [preparationSteps, setPreparationSteps] = useState('');
    const [generalNotes, setGeneralNotes] = useState('');

    // Basic Nutrients
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbohydrates, setCarbohydrates] = useState('');
    const [fats, setFats] = useState('');

    // Advanced Nutrients
    const [sugar, setSugar] = useState('');
    const [saturatedFat, setSaturatedFat] = useState('');
    const [unsaturatedFat, setUnsaturatedFat] = useState('');
    const [cholesterol, setCholesterol] = useState('');
    const [sodium, setSodium] = useState('');
    const [potassium, setPotassium] = useState('');

    // Loading state for form initialization
    const [isInitialized, setIsInitialized] = useState(false);

    // Effect to populate form fields when mealPlan prop changes
    useEffect(() => {
        if (mealPlan && !isInitialized) {
            console.log('Initializing form with meal plan data:', mealPlan);
            
            setMealName(mealPlan.name || '');
            
            // Handle categories - convert to array if it's a string
            if (mealPlan.category) {
                if (Array.isArray(mealPlan.category)) {
                    setCategories(mealPlan.category);
                } else {
                    // If category is a string, convert to array
                    setCategories([mealPlan.category]);
                }
            } else if (mealPlan.categories) {
                setCategories(mealPlan.categories);
            } else {
                setCategories([]);
            }
            
            // Set image URL
            const existingImageUrl = mealPlan.imageUrl || 
                (mealPlan.imageFileName ? `/assetscopy/${mealPlan.imageFileName}` : '');
            setImageUrl(existingImageUrl);
            
            // Set text fields
            setDescription(mealPlan.description || '');
            setRecipe(mealPlan.recipe || '');
            setPreparationSteps(mealPlan.preparationSteps || '');
            setGeneralNotes(mealPlan.generalNotes || mealPlan.description || ''); // Fallback to description if generalNotes doesn't exist

            // Basic Nutrients
            const nutrients = mealPlan.nutrients || {};
            setCalories(nutrients.calories?.toString() || '');
            setProtein(nutrients.protein?.toString() || '');
            setCarbohydrates(nutrients.carbohydrates?.toString() || '');
            setFats(nutrients.fats?.toString() || '');

            // Advanced Nutrients
            setSugar(nutrients.sugar?.toString() || '');
            setSaturatedFat(nutrients.saturatedFat?.toString() || '');
            setUnsaturatedFat(nutrients.unsaturatedFat?.toString() || '');
            setCholesterol(nutrients.cholesterol?.toString() || '');
            setSodium(nutrients.sodium?.toString() || '');
            setPotassium(nutrients.potassium?.toString() || '');

            // Clear any previously selected image file
            setImageFile(null);
            setIsInitialized(true);
        }
    }, [mealPlan, isInitialized]);

    // Handle category checkbox changes
    const handleCategoryChange = (categoryName, isChecked) => {
        setCategories(prevCategories => {
            if (isChecked) {
                // Add category if not already present
                return prevCategories.includes(categoryName) 
                    ? prevCategories 
                    : [...prevCategories, categoryName];
            } else {
                // Remove category
                return prevCategories.filter(cat => cat !== categoryName);
            }
        });
    };

    // Handle image file selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImageUrl(URL.createObjectURL(file));
        } else {
            setImageFile(null);
            // Revert to original image
            const originalImageUrl = mealPlan?.imageUrl || 
                (mealPlan?.imageFileName ? `/assetscopy/${mealPlan?.imageFileName}` : '');
            setImageUrl(originalImageUrl);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!mealName || categories.length === 0 || !generalNotes || !recipe || !preparationSteps || !calories || !protein || !carbohydrates || !fats) {
            mealPlanViewModel.setError('Please fill in all required fields (Meal Name, at least one Category, Meal Details, and Basic Nutrients).');
            return;
        }

        const updatedMealPlanData = {
            _id: mealPlan._id,
            name: mealName,
            category: categories, // Send as array
            categories: categories, // Also send as categories for compatibility
            description: generalNotes, // Map generalNotes to description for backend compatibility
            recipe: recipe,
            preparationSteps: preparationSteps,
            generalNotes: generalNotes,

            nutrients: {
                calories: Number(calories) || 0,
                protein: Number(protein) || 0,
                carbohydrates: Number(carbohydrates) || 0,
                fats: Number(fats) || 0,
                sugar: Number(sugar) || 0,
                saturatedFat: Number(saturatedFat) || 0,
                unsaturatedFat: Number(unsaturatedFat) || 0,
                cholesterol: Number(cholesterol) || 0,
                sodium: Number(sodium) || 0,
                potassium: Number(potassium) || 0,
            },
        };

        const success = await mealPlanViewModel.updateMealPlan({
            ...updatedMealPlanData,
            imageFile: imageFile,
            originalImageFileName: mealPlan.imageFileName || ''
        });

        if (success) {
            onBack();
        }
    };

    const { loading, error, success, allCategories } = mealPlanViewModel;

    if (!mealPlan) {
        return <p>Loading meal plan details for update...</p>;
    }

    if (!isInitialized) {
        return <p>Initializing form with existing data...</p>;
    }

    return (
        <div className="update-meal-plan-container">
            <header className="update-meal-plan-header">
                <h1 className="update-meal-plan-page-title">UPDATE MEAL PLAN</h1>
                <p className="update-meal-plan-subtitle">Editing: {mealPlan.name}</p>
            </header>

            {loading && <p className="update-meal-plan-form-message update-meal-plan-loading-message">Updating meal plan...</p>}
            {error && <p className="update-meal-plan-form-message update-meal-plan-error-message">{error}</p>}
            {success && <p className="update-meal-plan-form-message update-meal-plan-success-message">{success}</p>}

            <form onSubmit={handleSubmit} className="update-meal-plan-form">
                <div className="update-meal-plan-sections-wrapper">
                    {/* Left Section */}
                    <div className="update-meal-plan-section-left">
                        <div className="update-meal-plan-form-group">
                            <label htmlFor="mealName">Meal Name *</label>
                            <input
                                type="text"
                                id="mealName"
                                value={mealName}
                                onChange={(e) => setMealName(e.target.value)}
                                className="update-meal-plan-form-input"
                                placeholder="Enter meal name"
                                required
                            />
                        </div>

                        <div className="update-meal-plan-form-group">
                            <label>Categories * (Select at least one)</label>
                            <div className="update-meal-plan-categories-container">
                                {allCategories.map((categoryName) => (
                                    <div key={categoryName} className="update-meal-plan-category-item">
                                        <label className="update-meal-plan-category-label">
                                            <input
                                                type="checkbox"
                                                checked={categories.includes(categoryName)}
                                                onChange={(e) => handleCategoryChange(categoryName, e.target.checked)}
                                                className="update-meal-plan-category-checkbox"
                                            />
                                            <span className="update-meal-plan-category-text">{categoryName}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            {categories.length > 0 && (
                                <div className="update-meal-plan-selected-categories">
                                    <strong>Selected:</strong> {categories.join(', ')}
                                </div>
                            )}
                        </div>

                        <div className="update-meal-plan-form-group update-meal-plan-upload-photo-group">
                            <label htmlFor="uploadPhoto">Upload Photo</label>
                            <input
                                type="file"
                                id="uploadPhoto"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="update-meal-plan-form-input-file"
                            />
                            {imageUrl && (
                                <div className="update-meal-plan-image-preview">
                                    <img src={imageUrl} alt="Meal Plan Preview" />
                                    <p className="update-meal-plan-image-filename">
                                        {imageFile ? `New: ${imageFile.name}` : 'Current image'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <h3 className="update-meal-plan-section-title">Meal Details</h3>
                        <div className="update-meal-plan-form-group">
                            <label htmlFor="recipe">Ingredients *</label>
                            <textarea
                                id="recipe"
                                value={recipe}
                                onChange={(e) => setRecipe(e.target.value)}
                                className="update-meal-plan-form-textarea"
                                rows="6"
                                placeholder="List all ingredients, e.g., 2 large eggs, 1 cup spinach, 1 tbsp olive oil."
                                required
                            ></textarea>
                        </div>

                        <div className="update-meal-plan-form-group">
                            <label htmlFor="preparationSteps">Preparation Steps *</label>
                            <textarea
                                id="preparationSteps"
                                value={preparationSteps}
                                onChange={(e) => setPreparationSteps(e.target.value)}
                                className="update-meal-plan-form-textarea"
                                rows="6"
                                placeholder="Provide step-by-step instructions, e.g., 1. Heat oil in pan. 2. Sauté spinach. 3. Add eggs."
                                required
                            ></textarea>
                        </div>

                        <div className="update-meal-plan-form-group">
                            <label htmlFor="generalNotes">General Description & Notes *</label>
                            <textarea
                                id="generalNotes"
                                value={generalNotes}
                                onChange={(e) => setGeneralNotes(e.target.value)}
                                className="update-meal-plan-form-textarea"
                                rows="4"
                                placeholder="Add allergen warnings, portion size, storage notes, or general meal overview."
                                required
                            ></textarea>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="update-meal-plan-section-right">
                        <h3 className="update-meal-plan-section-title">Basic Nutrients Information *</h3>
                        <div className="update-meal-plan-nutrients-grid update-meal-plan-basic-nutrients">
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="calories">Calories *</label>
                                <input
                                    type="number"
                                    id="calories"
                                    value={calories}
                                    onChange={(e) => setCalories(e.target.value)}
                                    className="update-meal-plan-form-input-short"
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                    required
                                />
                                <span className="update-meal-plan-nutrient-unit">kcal</span>
                            </div>
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="protein">Protein *</label>
                                <input
                                    type="number"
                                    id="protein"
                                    value={protein}
                                    onChange={(e) => setProtein(e.target.value)}
                                    className="update-meal-plan-form-input-short"
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                    required
                                />
                                <span className="update-meal-plan-nutrient-unit">g</span>
                            </div>
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="carbohydrates">Carbohydrates *</label>
                                <input
                                    type="number"
                                    id="carbohydrates"
                                    value={carbohydrates}
                                    onChange={(e) => setCarbohydrates(e.target.value)}
                                    className="update-meal-plan-form-input-short"
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                    required
                                />
                                <span className="update-meal-plan-nutrient-unit">g</span>
                            </div>
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="fats">Fats *</label>
                                <input
                                    type="number"
                                    id="fats"
                                    value={fats}
                                    onChange={(e) => setFats(e.target.value)}
                                    className="update-meal-plan-form-input-short"
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                    required
                                />
                                <span className="update-meal-plan-nutrient-unit">g</span>
                            </div>
                        </div>

                        <h3 className="update-meal-plan-section-title update-meal-plan-advanced-nutrients-title">
                            Advanced Nutrients (Optional)
                        </h3>
                        <div className="update-meal-plan-nutrients-grid update-meal-plan-advanced-nutrients">
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="sugar">Sugar</label>
                                <input
                                    type="number"
                                    id="sugar"
                                    value={sugar}
                                    onChange={(e) => setSugar(e.target.value)}
                                    className="update-meal-plan-form-input-short"
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                />
                                <span className="update-meal-plan-nutrient-unit">g</span>
                            </div>
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="saturatedFat">Saturated Fat</label>
                                <input
                                    type="number"
                                    id="saturatedFat"
                                    value={saturatedFat}
                                    onChange={(e) => setSaturatedFat(e.target.value)}
                                    className="update-meal-plan-form-input-short"
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                />
                                <span className="update-meal-plan-nutrient-unit">g</span>
                            </div>
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="unsaturatedFat">Unsaturated Fat</label>
                                <input
                                    type="number"
                                    id="unsaturatedFat"
                                    value={unsaturatedFat}
                                    onChange={(e) => setUnsaturatedFat(e.target.value)}
                                    className="update-meal-plan-form-input-short"
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                />
                                <span className="update-meal-plan-nutrient-unit">g</span>
                            </div>
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="cholesterol">Cholesterol</label>
                                <input
                                    type="number"
                                    id="cholesterol"
                                    value={cholesterol}
                                    onChange={(e) => setCholesterol(e.target.value)}
                                    className="update-meal-plan-form-input-short"
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                />
                                <span className="update-meal-plan-nutrient-unit">mg</span>
                            </div>
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="sodium">Sodium</label>
                                <input
                                    type="number"
                                    id="sodium"
                                    value={sodium}
                                    onChange={(e) => setSodium(e.target.value)}
                                    className="update-meal-plan-form-input-short"
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                />
                                <span className="update-meal-plan-nutrient-unit">mg</span>
                            </div>
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="potassium">Potassium</label>
                                <input
                                    type="number"
                                    id="potassium"
                                    value={potassium}
                                    onChange={(e) => setPotassium(e.target.value)}
                                    className="update-meal-plan-form-input-short"
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                />
                                <span className="update-meal-plan-nutrient-unit">mg</span>
                            </div>
                        </div>

                        <div className="update-meal-plan-form-actions">
                            <button 
                                type="submit" 
                                className="update-meal-plan-button-base update-meal-plan-save-button"
                                disabled={loading}
                            >
                                {loading ? 'SAVING...' : 'SAVE CHANGES'}
                            </button>
                            <button 
                                type="button" 
                                className="update-meal-plan-button-base update-meal-plan-cancel-button" 
                                onClick={onBack}
                                disabled={loading}
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
});

export default UpdateMealPlan;