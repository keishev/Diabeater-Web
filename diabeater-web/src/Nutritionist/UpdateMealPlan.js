// src/components/UpdateMealPlan.js (or wherever you keep it)
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import mealPlanViewModel from '../ViewModels/MealPlanViewModel';
import './UpdateMealPlan.css'; // Assuming you have a CSS file for styling

const UpdateMealPlan = observer(({ mealPlan, onBack }) => {
    // Initialize form state with existing meal plan data
    const [mealName, setMealName] = useState('');
    const [category, setCategory] = useState(''); // Assuming single category selection for simplicity
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState(''); // To display current image or new preview
    const [description, setDescription] = useState('');
    const [recipe, setRecipe] = useState(''); // Assuming recipe is multiline text - for 'Ingredients' field
    const [preparationSteps, setPreparationSteps] = useState(''); // For 'Preparation Steps' field
    const [generalNotes, setGeneralNotes] = useState(''); // For 'General Description & Notes' field

    // Basic Nutrients
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbohydrates, setCarbohydrates] = useState('');
    const [fats, setFats] = useState('');

    // Advanced Nutrients (Optional) - NEW FIELDS
    const [sugar, setSugar] = useState('');
    const [saturatedFat, setSaturatedFat] = useState('');
    const [unsaturatedFat, setUnsaturatedFat] = useState('');
    const [cholesterol, setCholesterol] = useState('');
    const [sodium, setSodium] = useState('');
    const [potassium, setPotassium] = useState('');

    // Effect to populate form fields when mealPlan prop changes
    useEffect(() => {
        if (mealPlan) {
            setMealName(mealPlan.name || '');
            setCategory(mealPlan.category || '');
            // Prioritize imageUrl if available, otherwise construct from imageFileName
            setImageUrl(mealPlan.imageUrl || (mealPlan.imageFileName ? `/assetscopy/${mealPlan.imageFileName}` : ''));
            setDescription(mealPlan.description || ''); // This now maps to 'General Description & Notes'
            setRecipe(mealPlan.recipe || ''); // This maps to 'Ingredients'
            setPreparationSteps(mealPlan.preparationSteps || ''); // Assuming this field exists in your data
            setGeneralNotes(mealPlan.generalNotes || ''); // Assuming this field exists in your data

            // Basic Nutrients
            setCalories(mealPlan.nutrients?.calories || '');
            setProtein(mealPlan.nutrients?.protein || '');
            setCarbohydrates(mealPlan.nutrients?.carbohydrates || '');
            setFats(mealPlan.nutrients?.fats || '');

            // Advanced Nutrients - Initialization
            setSugar(mealPlan.nutrients?.sugar || '');
            setSaturatedFat(mealPlan.nutrients?.saturatedFat || '');
            setUnsaturatedFat(mealPlan.nutrients?.unsaturatedFat || '');
            setCholesterol(mealPlan.nutrients?.cholesterol || '');
            setSodium(mealPlan.nutrients?.sodium || '');
            setPotassium(mealPlan.nutrients?.potassium || '');

            // Clear any previously selected image file when a new mealPlan is loaded
            setImageFile(null);
        }
    }, [mealPlan]);

    // Handle image file selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImageUrl(URL.createObjectURL(file)); // For image preview
        } else {
            setImageFile(null);
            // Revert to original image if user clears selection
            setImageUrl(mealPlan?.imageUrl || (mealPlan?.imageFileName ? `/assetscopy/${mealPlan?.imageFileName}` : ''));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation for required fields (adjust as per your actual requirements)
        if (!mealName || !category || !description || !recipe || !preparationSteps || !calories || !protein || !carbohydrates || !fats) {
            mealPlanViewModel.setError('Please fill in all required fields (Meal Name, Category, Meal Details, Nutrients Information).');
            return;
        }

        const updatedMealPlanData = {
            _id: mealPlan._id, // Crucial: Send the ID for the update operation
            name: mealName,
            category: category,
            description: description, // General Description & Notes
            recipe: recipe, // Ingredients
            preparationSteps: preparationSteps, // New field for Preparation Steps
            generalNotes: generalNotes, // New field for General Notes

            nutrients: {
                calories: Number(calories),
                protein: Number(protein),
                carbohydrates: Number(carbohydrates),
                fats: Number(fats),
                // Advanced Nutrients - Include them, even if empty/0
                sugar: Number(sugar) || 0,
                saturatedFat: Number(saturatedFat) || 0,
                unsaturatedFat: Number(unsaturatedFat) || 0,
                cholesterol: Number(cholesterol) || 0,
                sodium: Number(sodium) || 0,
                potassium: Number(potassium) || 0,
            },
            // The ViewModel's updateMealPlan method will handle the image file and status.
        };

        // Call the ViewModel's update method
        const success = await mealPlanViewModel.updateMealPlan({
            ...updatedMealPlanData,
            imageFile: imageFile,
            originalImageFileName: mealPlan.imageFileName || ''
        });

        if (success) {
            // ViewModel already sets success message. Navigate back.
            onBack(); // Go back to the meal plans list
        } else {
            // Error message already set by ViewModel if update failed
            // Stay on the form to allow user to correct issues
        }
    };

    // Access ViewModel's state for loading/error/success messages
    const { loading, error, success, allCategories } = mealPlanViewModel;

    if (!mealPlan) {
        return <p>Loading meal plan details for update...</p>;
    }

    return (
        <div className="update-meal-plan-container">
            <header className="update-meal-plan-header">
                <h1 className="update-meal-plan-page-title">UPDATE MEAL PLAN</h1>
            </header>

            {loading && <p className="update-meal-plan-form-message update-meal-plan-loading-message">Updating meal plan...</p>}
            {error && <p className="update-meal-plan-form-message update-meal-plan-error-message">{error}</p>}
            {success && <p className="update-meal-plan-form-message update-meal-plan-success-message">{success}</p>}

            <form onSubmit={handleSubmit} className="update-meal-plan-form">
                <div className="update-meal-plan-sections-wrapper">
                    {/* Left Section: Meal Name, Category, Photo */}
                    <div className="update-meal-plan-section-left">
                        <div className="update-meal-plan-form-group">
                            <label htmlFor="mealName">Meal Name</label>
                            <input
                                type="text"
                                id="mealName"
                                value={mealName}
                                onChange={(e) => setMealName(e.target.value)}
                                className="update-meal-plan-form-input"
                                required
                            />
                        </div>

                        <div className="update-meal-plan-form-group">
                            <label htmlFor="category">Category</label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="update-meal-plan-form-input"
                                required
                            >
                                <option value="">Select a category</option>
                                {allCategories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
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
                                        {imageFile ? imageFile.name : (mealPlan.imageFileName || 'Existing image')}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Meal Details section - Ingredients, Preparation Steps, General Description & Notes */}
                        <h3 className="update-meal-plan-section-title">Meal Details</h3>
                        <div className="update-meal-plan-form-group">
                            <label htmlFor="recipe">Ingredients</label>
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
                            <label htmlFor="preparationSteps">Preparation Steps</label>
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
                            <label htmlFor="generalNotes">General Description & Notes</label>
                            <textarea
                                id="generalNotes"
                                value={generalNotes}
                                onChange={(e) => setGeneralNotes(e.target.value)}
                                className="update-meal-plan-form-textarea"
                                rows="4"
                                placeholder="Add allergen warnings (e.g., contains dairy), portion size, storage notes, or a general overview of the meal."
                                required
                            ></textarea>
                        </div>
                    </div>

                    {/* Right Section: Nutrients Information */}
                    <div className="update-meal-plan-section-right">
                        <h3 className="update-meal-plan-section-title">Nutrients Information</h3>
                        <div className="update-meal-plan-nutrients-grid update-meal-plan-basic-nutrients">
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="calories">Calories</label>
                                <input
                                    type="number"
                                    id="calories"
                                    value={calories}
                                    onChange={(e) => setCalories(e.target.value)}
                                    className="update-meal-plan-form-input-short"
                                    required
                                />
                                <span className="update-meal-plan-nutrient-unit">kcal</span>
                            </div>
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="protein">Protein</label>
                                <input
                                    type="number"
                                    id="protein"
                                    value={protein}
                                    onChange={(e) => setProtein(e.target.value)}
                                    className="update-meal-plan-form-input-short"
                                    required
                                />
                                <span className="update-meal-plan-nutrient-unit">grams</span>
                            </div>
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="carbohydrates">Carbohydrates</label>
                                <input
                                    type="number"
                                    id="carbohydrates"
                                    value={carbohydrates}
                                    onChange={(e) => setCarbohydrates(e.target.value)}
                                    className="update-meal-plan-form-input-short"
                                    required
                                />
                                <span className="update-meal-plan-nutrient-unit">grams</span>
                            </div>
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="fats">Fats</label>
                                <input
                                    type="number"
                                    id="fats"
                                    value={fats}
                                    onChange={(e) => setFats(e.target.value)}
                                    className="update-meal-plan-form-input-short"
                                    required
                                />
                                <span className="update-meal-plan-nutrient-unit">grams</span>
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
                                />
                                <span className="update-meal-plan-nutrient-unit">grams</span>
                            </div>
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="saturatedFat">Saturated Fat</label>
                                <input
                                    type="number"
                                    id="saturatedFat"
                                    value={saturatedFat}
                                    onChange={(e) => setSaturatedFat(e.target.value)}
                                    className="update-meal-plan-form-input-short"
                                />
                                <span className="update-meal-plan-nutrient-unit">grams</span>
                            </div>
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="unsaturatedFat">Unsaturated Fat</label>
                                <input
                                    type="number"
                                    id="unsaturatedFat"
                                    value={unsaturatedFat}
                                    onChange={(e) => setUnsaturatedFat(e.target.value)}
                                    className="update-meal-plan-form-input-short"
                                />
                                <span className="update-meal-plan-nutrient-unit">grams</span>
                            </div>
                            <div className="update-meal-plan-form-group update-meal-plan-nutrient-group">
                                <label htmlFor="cholesterol">Cholesterol</label>
                                <input
                                    type="number"
                                    id="cholesterol"
                                    value={cholesterol}
                                    onChange={(e) => setCholesterol(e.target.value)}
                                    className="update-meal-plan-form-input-short"
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
                                />
                                <span className="update-meal-plan-nutrient-unit">mg</span>
                            </div>
                        </div>
                        <div className="update-meal-plan-form-actions">
                    <button type="submit" className="update-meal-plan-button-base update-meal-plan-save-button">
                        SAVE
                    </button>
                    <button 
                        type="button" 
                        className="update-meal-plan-button-base update-meal-plan-cancel-button" 
                        onClick={onBack}
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