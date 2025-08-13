// src/components/UpdateMealPlan.js
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import mealPlanViewModel from '../ViewModels/MealPlanViewModel';
import './UpdateMealPlan.css';

const UpdateMealPlan = observer(({ mealPlan, onBack }) => {
    // Initialize form state with existing meal plan data
    const [mealName, setMealName] = useState('');
    const [categories, setCategories] = useState([]);
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

    // FIXED: More robust initialization logic
    useEffect(() => {
        if (mealPlan) {
            console.log('Initializing UpdateMealPlan with data:', mealPlan);
            console.log('🔍 Available properties:', Object.keys(mealPlan));
            console.log('📋 Full meal plan object:', mealPlan);
            console.log('📝 Recipe data:', mealPlan.recipe);
            console.log('👨‍🍳 Preparation steps:', mealPlan.preparationSteps);
            console.log('📋 Description:', mealPlan.description);
            console.log('📄 General notes:', mealPlan.generalNotes);
            
            // Check for alternative property names
            console.log('🔍 Checking alternatives:');
            console.log('ingredients:', mealPlan.ingredients);
            console.log('steps:', mealPlan.steps);
            console.log('instructions:', mealPlan.instructions);
            console.log('cookingSteps:', mealPlan.cookingSteps);
            console.log('recipeSteps:', mealPlan.recipeSteps);
            
            // Set basic info - always update when mealPlan changes
            setMealName(mealPlan.name || '');
            
            // Handle categories - support both formats
            let categoryArray = [];
            if (mealPlan.category) {
                if (Array.isArray(mealPlan.category)) {
                    categoryArray = mealPlan.category;
                } else if (typeof mealPlan.category === 'string') {
                    categoryArray = [mealPlan.category];
                }
            } else if (mealPlan.categories && Array.isArray(mealPlan.categories)) {
                categoryArray = mealPlan.categories;
            }
            setCategories(categoryArray);
            
            // Set image URL with fallbacks
            const existingImageUrl = mealPlan.imageUrl || 
                (mealPlan.imageFileName ? `/assetscopy/${mealPlan.imageFileName}` : '');
            setImageUrl(existingImageUrl);
            
            // Set text fields with fallbacks - FIXED: Use correct property names
            setDescription(mealPlan.description || '');
            setRecipe(mealPlan.ingredients || '');  // ✅ Changed from recipe to ingredients
            setPreparationSteps(mealPlan.steps || '');  // ✅ Changed from preparationSteps to steps
            setGeneralNotes(mealPlan.generalNotes || mealPlan.description || '');

            // Handle nutrients - support both old and new format
            let nutrientsData = {};
            if (mealPlan.nutrients && typeof mealPlan.nutrients === 'object') {
                // New format: nutrients object
                nutrientsData = mealPlan.nutrients;
            } else {
                // Old format: direct properties
                nutrientsData = {
                    calories: mealPlan.calories,
                    protein: mealPlan.protein,
                    carbohydrates: mealPlan.carbohydrates,
                    fats: mealPlan.fats,
                    sugar: mealPlan.sugar,
                    saturatedFat: mealPlan.saturatedFat,
                    unsaturatedFat: mealPlan.unsaturatedFat,
                    cholesterol: mealPlan.cholesterol,
                    sodium: mealPlan.sodium,
                    potassium: mealPlan.potassium
                };
            }

            // Basic Nutrients - ensure they're strings for input fields
            setCalories(nutrientsData.calories?.toString() || '');
            setProtein(nutrientsData.protein?.toString() || '');
            setCarbohydrates(nutrientsData.carbohydrates?.toString() || '');
            setFats(nutrientsData.fats?.toString() || '');

            // Advanced Nutrients
            setSugar(nutrientsData.sugar?.toString() || '');
            setSaturatedFat(nutrientsData.saturatedFat?.toString() || '');
            setUnsaturatedFat(nutrientsData.unsaturatedFat?.toString() || '');
            setCholesterol(nutrientsData.cholesterol?.toString() || '');
            setSodium(nutrientsData.sodium?.toString() || '');
            setPotassium(nutrientsData.potassium?.toString() || '');

            // Clear any previously selected image file
            setImageFile(null);
            
            console.log('Form initialized with:', {
                name: mealPlan.name,
                categories: categoryArray,
                nutrients: nutrientsData
            });
        }
    }, [mealPlan]); // Re-run whenever mealPlan changes

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
            // Create preview URL for new file
            const previewUrl = URL.createObjectURL(file);
            setImageUrl(previewUrl);
        } else {
            setImageFile(null);
            // Revert to original image
            const originalImageUrl = mealPlan?.imageUrl || 
                (mealPlan?.imageFileName ? `/assetscopy/${mealPlan?.imageFileName}` : '');
            setImageUrl(originalImageUrl);
        }
    };

    // ENHANCED: Better validation and error handling
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear previous errors
        mealPlanViewModel.setError('');

        // Validation
        const requiredFields = [];
        if (!mealName.trim()) requiredFields.push('Meal Name');
        if (categories.length === 0) requiredFields.push('At least one Category');
        if (!generalNotes.trim()) requiredFields.push('General Description & Notes');
        if (!recipe.trim()) requiredFields.push('Ingredients');
        if (!preparationSteps.trim()) requiredFields.push('Preparation Steps');
        if (!calories.trim()) requiredFields.push('Calories');
        if (!protein.trim()) requiredFields.push('Protein');
        if (!carbohydrates.trim()) requiredFields.push('Carbohydrates');
        if (!fats.trim()) requiredFields.push('Fats');

        if (requiredFields.length > 0) {
            mealPlanViewModel.setError(`Please fill in the following required fields: ${requiredFields.join(', ')}`);
            return;
        }

        // Validate numeric values
        const numericFields = [calories, protein, carbohydrates, fats];
        const optionalNumericFields = [sugar, saturatedFat, unsaturatedFat, cholesterol, sodium, potassium];
        
        for (const field of numericFields) {
            if (isNaN(Number(field)) || Number(field) < 0) {
                mealPlanViewModel.setError('Please enter valid positive numbers for all nutrient fields.');
                return;
            }
        }

        for (const field of optionalNumericFields) {
            if (field.trim() && (isNaN(Number(field)) || Number(field) < 0)) {
                mealPlanViewModel.setError('Please enter valid positive numbers for all optional nutrient fields.');
                return;
            }
        }

        const updatedMealPlanData = {
            _id: mealPlan._id,
            name: mealName.trim(),
            category: categories,
            categories: categories,
            description: generalNotes.trim(),
            ingredients: recipe.trim(),  // ✅ Changed from recipe to ingredients
            steps: preparationSteps.trim(),  // ✅ Changed from preparationSteps to steps
            generalNotes: generalNotes.trim(),

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

        console.log('Submitting updated meal plan:', updatedMealPlanData);

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

    // IMPROVED: Better loading states
    if (!mealPlan) {
        return (
            <div className="update-meal-plan-container">
                <p className="update-meal-plan-loading">Loading meal plan details for update...</p>
            </div>
        );
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
                                {allCategories && allCategories.map((categoryName) => (
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