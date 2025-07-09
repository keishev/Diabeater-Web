// src/CreateMealPlan.js
import React, { useState, useEffect, useRef } from 'react';
import MealPlanViewModel from '../ViewModels/MealPlanViewModel'; // Import the ViewModel

import './CreateMealPlan.css'; // Assuming this CSS exists and is suitable

const CreateMealPlan = ({ onMealPlanSubmitted }) => {
    // State variables for basic meal plan details
    const [mealName, setMealName] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [uploadPhoto, setUploadPhoto] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

    // ⭐ NEW STATE FOR SPLIT DESCRIPTION ⭐
    const [ingredients, setIngredients] = useState('');
    const [steps, setSteps] = useState('');
    const [generalDescription, setGeneralDescription] = useState(''); // Renamed from 'description'

    // State for basic nutritionals
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbohydrates, setCarbohydrates] = useState('');
    const [fats, setFats] = useState('');

    // ⭐ NEW STATE FOR PREMIUM NUTRITIONALS ⭐
    const [sugar, setSugar] = useState('');
    const [saturatedFat, setSaturatedFat] = useState('');
    const [unsaturatedFat, setUnsaturatedFat] = useState('');
    const [cholesterol, setCholesterol] = useState('');
    const [sodium, setSodium] = useState('');
    const [potassium, setPotassium] = useState('');

    // UI related states
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const categoryOptions = [
        'Improved Energy',
        'Weight Loss',
        'Weight Management',
        'Heart Health',
        'Low Carb',
        'High Protein',
        'Gluten-Free',
        'Snack',
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
                setIsCategoryDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadPhoto(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        } else {
            setUploadPhoto(null);
            setImagePreviewUrl(null);
        }
    };

    useEffect(() => {
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    const handleCategoryChange = (e) => {
        const { value, checked } = e.target;
        setSelectedCategories(prev => {
            if (checked) {
                return [...prev, value];
            } else {
                return prev.filter(category => category !== value);
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // ⭐ UPDATED mealPlanData structure ⭐
        const mealPlanData = {
            name: mealName,
            categories: selectedCategories,
            // Split description fields
            ingredients,
            steps,
            description: generalDescription, // Use the new general description field
            // Basic nutritionals
            calories: parseFloat(calories),
            protein: parseFloat(protein),
            carbohydrates: parseFloat(carbohydrates),
            fats: parseFloat(fats),
            // Premium nutritionals (always send, backend/display logic handles premium unlock)
            sugar: sugar ? parseFloat(sugar) : null, // Send null if empty
            saturatedFat: saturatedFat ? parseFloat(saturatedFat) : null,
            unsaturatedFat: unsaturatedFat ? parseFloat(unsaturatedFat) : null,
            cholesterol: cholesterol ? parseFloat(cholesterol) : null,
            sodium: sodium ? parseFloat(sodium) : null,
            potassium: potassium ? parseFloat(potassium) : null,
        };

        try {
            const result = await MealPlanViewModel.createMealPlan(mealPlanData, uploadPhoto);
            if (result) {
                setSuccess('Meal Plan created successfully and sent for approval!');
                if (onMealPlanSubmitted) {
                    onMealPlanSubmitted();
                }
                // Reset form fields
                setMealName('');
                setSelectedCategories([]);
                setUploadPhoto(null);
                setImagePreviewUrl(null);
                setIngredients(''); // Reset new fields
                setSteps('');
                setGeneralDescription('');
                setCalories('');
                setProtein('');
                setCarbohydrates('');
                setFats('');
                setSugar(''); // Reset premium fields
                setSaturatedFat('');
                setUnsaturatedFat('');
                setCholesterol('');
                setSodium('');
                setPotassium('');
            } else {
                setError(MealPlanViewModel.error); // Get error message from ViewModel
            }
        } catch (err) {
            setError(err.message); // Catch any unexpected errors during the call
        } finally {
            setLoading(false);
        }
    };

    const getCategoryButtonText = () => {
        if (selectedCategories.length === 0) {
            return "Select Categories";
        } else if (selectedCategories.length === 1) {
            return selectedCategories[0];
        } else {
            return `${selectedCategories.length} Categories Selected`;
        }
    };

    return (
        <div className="create-meal-plan-content">
            <h2 className="page-title">CREATE MEAL PLAN</h2>
            <form onSubmit={handleSubmit} className="meal-plan-form">
                <div className="form-row-top">
                    <div className="form-group meal-name">
                        <label htmlFor="meal-name">Meal Name</label>
                        <input
                            type="text"
                            id="meal-name"
                            placeholder="Scrambled Eggs With Spinach"
                            value={mealName}
                            onChange={(e) => setMealName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group upload-photo">
                        <input
                            type="file"
                            id="upload-photo"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        {imagePreviewUrl ? (
                            <div className="uploaded-image-preview">
                                <img src={imagePreviewUrl} alt="Meal Preview" className="meal-thumbnail" />
                                <label htmlFor="upload-photo" className="change-photo-button">
                                    Change Picture
                                </label>
                            </div>
                        ) : (
                            <label htmlFor="upload-photo" className="upload-photo-button initial">
                                Upload Picture
                            </label>
                        )}
                    </div>

                    <div className="form-group category">
                        <label>Category</label>
                        <div className="dropdown-checklist-container" ref={categoryDropdownRef}>
                            <button
                                type="button"
                                className={`dropdown-toggle-button ${isCategoryDropdownOpen ? 'open' : ''}`}
                                onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
                            >
                                {getCategoryButtonText()}
                                <span className="dropdown-arrow"></span>
                            </button>
                            {isCategoryDropdownOpen && (
                                <div className="category-checklist">
                                    {categoryOptions.map((option, index) => (
                                        <div key={index} className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                id={`category-${index}`}
                                                name="category"
                                                value={option}
                                                checked={selectedCategories.includes(option)}
                                                onChange={handleCategoryChange}
                                            />
                                            <label htmlFor={`category-${index}`}>{option}</label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ⭐ NEW: Split Description Fields ⭐ */}
                <h3 className="create-meal-section-title">Meal Details</h3>
                <div className="form-group">
                    <label htmlFor="ingredients">Ingredients</label>
                    <textarea
                        id="ingredients"
                        rows="5"
                        placeholder="List all ingredients, e.g., 2 large eggs, 1 cup spinach, 1 tbsp olive oil."
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        required
                    ></textarea>
                </div>

                <div className="form-group">
                    <label htmlFor="steps">Preparation Steps</label>
                    <textarea
                        id="steps"
                        rows="5"
                        placeholder="Provide step-by-step instructions, e.g., 1. Heat oil in pan. 2. Sauté spinach. 3. Add eggs."
                        value={steps}
                        onChange={(e) => setSteps(e.target.value)}
                        required
                    ></textarea>
                </div>

                <div className="form-group">
                    <label htmlFor="general-description">General Description & Notes</label>
                    <textarea
                        id="general-description"
                        rows="3"
                        placeholder="Add allergen warnings (e.g., contains dairy), portion size, storage notes, or a general overview of the meal."
                        value={generalDescription}
                        onChange={(e) => setGeneralDescription(e.target.value)}
                    ></textarea>
                </div>

                <h3 className="create-meal-section-title">Nutrients Information</h3>
                <div className="nutrients-grid">
                    <div className="nutrient-item">
                        <label htmlFor="calories" className="nutrient-label">Calories</label>
                        <input
                            type="number"
                            id="calories"
                            value={calories}
                            onChange={(e) => setCalories(e.target.value)}
                            placeholder="0"
                            min="0"
                            required
                        />
                        <span className="unit">kcal</span>
                    </div>

                    <div className="nutrient-item">
                        <label htmlFor="protein" className="nutrient-label">Protein</label>
                        <input
                            type="number"
                            id="protein"
                            value={protein}
                            onChange={(e) => setProtein(e.target.value)}
                            placeholder="0"
                            min="0"
                            required
                        />
                        <span className="unit">grams</span>
                    </div>

                    <div className="nutrient-item">
                        <label htmlFor="carbohydrates" className="nutrient-label">Carbohydrates</label>
                        <input
                            type="number"
                            id="carbohydrates"
                            value={carbohydrates}
                            onChange={(e) => setCarbohydrates(e.target.value)}
                            placeholder="0"
                            min="0"
                            required
                        />
                        <span className="unit">grams</span>
                    </div>

                    <div className="nutrient-item">
                        <label htmlFor="fats" className="nutrient-label">Fats</label>
                        <input
                            type="number"
                            id="fats"
                            value={fats}
                            onChange={(e) => setFats(e.target.value)}
                            placeholder="0"
                            min="0"
                            required
                        />
                        <span className="unit">grams</span>
                    </div>
                </div>

                {/* ⭐ NEW: Premium Nutritional Information (always shown for input, display logic for premium unlock) ⭐ */}
                <h3 className="create-meal-section-title">Advanced Nutrients (Optional)</h3>
                <div className="nutrients-grid premium-nutrients">
                    <div className="nutrient-item">
                        <label htmlFor="sugar" className="nutrient-label">Sugar</label>
                        <input
                            type="number"
                            id="sugar"
                            value={sugar}
                            onChange={(e) => setSugar(e.target.value)}
                            placeholder="0"
                            min="0"
                        />
                        <span className="unit">grams</span>
                    </div>
                    <div className="nutrient-item">
                        <label htmlFor="saturatedFat" className="nutrient-label">Saturated Fat</label>
                        <input
                            type="number"
                            id="saturatedFat"
                            value={saturatedFat}
                            onChange={(e) => setSaturatedFat(e.target.value)}
                            placeholder="0"
                            min="0"
                        />
                        <span className="unit">grams</span>
                    </div>
                    <div className="nutrient-item">
                        <label htmlFor="unsaturatedFat" className="nutrient-label">Unsaturated Fat</label>
                        <input
                            type="number"
                            id="unsaturatedFat"
                            value={unsaturatedFat}
                            onChange={(e) => setUnsaturatedFat(e.target.value)}
                            placeholder="0"
                            min="0"
                        />
                        <span className="unit">grams</span>
                    </div>
                    <div className="nutrient-item">
                        <label htmlFor="cholesterol" className="nutrient-label">Cholesterol</label>
                        <input
                            type="number"
                            id="cholesterol"
                            value={cholesterol}
                            onChange={(e) => setCholesterol(e.target.value)}
                            placeholder="0"
                            min="0"
                        />
                        <span className="unit">mg</span>
                    </div>
                    <div className="nutrient-item">
                        <label htmlFor="sodium" className="nutrient-label">Sodium</label>
                        <input
                            type="number"
                            id="sodium"
                            value={sodium}
                            onChange={(e) => setSodium(e.target.value)}
                            placeholder="0"
                            min="0"
                        />
                        <span className="unit">mg</span>
                    </div>
                    <div className="nutrient-item">
                        <label htmlFor="potassium" className="nutrient-label">Potassium</label>
                        <input
                            type="number"
                            id="potassium"
                            value={potassium}
                            onChange={(e) => setPotassium(e.target.value)}
                            placeholder="0"
                            min="0"
                        />
                        <span className="unit">mg</span>
                    </div>
                </div>


                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <button type="submit" className="create-button" disabled={loading}>
                    {loading ? 'Creating...' : '+ CREATE'}
                </button>
            </form>
        </div>
    );
};

export default CreateMealPlan;