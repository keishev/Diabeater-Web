import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import MealPlanViewModel from '../ViewModels/MealPlanViewModel'; 

import './CreateMealPlan.css';

const CreateMealPlan = observer(({ onMealPlanSubmitted }) => {
    const [mealName, setMealName] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [uploadPhoto, setUploadPhoto] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

    const [ingredients, setIngredients] = useState('');
    const [steps, setSteps] = useState('');
    const [generalDescription, setGeneralDescription] = useState('');

    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbohydrates, setCarbohydrates] = useState('');
    const [fats, setFats] = useState('');

    const [sugar, setSugar] = useState('');
    const [saturatedFat, setSaturatedFat] = useState('');
    const [unsaturatedFat, setUnsaturatedFat] = useState('');
    const [cholesterol, setCholesterol] = useState('');
    const [sodium, setSodium] = useState('');
    const [potassium, setPotassium] = useState('');

    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Get categories from ViewModel instead of hardcoded options
    const {
        allCategories,
        loadingCategories,
        categoryError,
        fetchMealCategories
    } = MealPlanViewModel;

    // Fetch categories when component mounts
    useEffect(() => {
        // Fetch categories if they haven't been loaded yet
        if (allCategories.length === 0 && !loadingCategories) {
            fetchMealCategories();
        }
    }, []);

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

        const mealPlanData = {
            name: mealName,
            categories: selectedCategories,
            ingredients,
            steps,
            description: generalDescription,
            calories: parseFloat(calories),
            protein: parseFloat(protein),
            carbohydrates: parseFloat(carbohydrates),
            fats: parseFloat(fats),
            sugar: sugar ? parseFloat(sugar) : null, 
            saturatedFat: saturatedFat ? parseFloat(saturatedFat) : null,
            unsaturatedFat: unsaturatedFat ? parseFloat(unsaturatedFat) : null,
            cholesterol: cholesterol ? parseFloat(cholesterol) : null,
            sodium: sodium ? parseFloat(sodium) : null,
            potassium: potassium ? parseFloat(potassium) : null,
        };

        try {
            const result = await MealPlanViewModel.createMealPlan(mealPlanData, uploadPhoto);
            if (result) {
                if (onMealPlanSubmitted) {
                    onMealPlanSubmitted();
                }
                
                // Reset form
                setMealName('');
                setSelectedCategories([]);
                setUploadPhoto(null);
                setImagePreviewUrl(null);
                setIngredients(''); 
                setSteps('');
                setGeneralDescription('');
                setCalories('');
                setProtein('');
                setCarbohydrates('');
                setFats('');
                setSugar(''); 
                setSaturatedFat('');
                setUnsaturatedFat('');
                setCholesterol('');
                setSodium('');
                setPotassium('');
            } else {
                setError(MealPlanViewModel.error); 
            }
        } catch (err) {
            setError(err.message); 
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

    // Show loading state for categories
    const renderCategoryDropdown = () => {
        if (loadingCategories) {
            return (
                <div className="create-meal-plan-category-loading">
                    <span>Loading categories...</span>
                </div>
            );
        }

        if (categoryError) {
            return (
                <div className="create-meal-plan-category-error">
                    <span>Error loading categories: {categoryError}</span>
                    <button 
                        type="button" 
                        onClick={fetchMealCategories}
                        className="create-meal-plan-retry-button"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        if (allCategories.length === 0) {
            return (
                <div className="create-meal-plan-no-categories">
                    <span>No categories available</span>
                    <button 
                        type="button" 
                        onClick={fetchMealCategories}
                        className="create-meal-plan-retry-button"
                    >
                        Refresh
                    </button>
                </div>
            );
        }

        return (
            <div className="create-meal-plan-category-checklist">
                {allCategories.map((option, index) => (
                    <div key={index} className="create-meal-plan-checkbox-item">
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
        );
    };

    return (
        <div className="create-meal-plan-content">
            <h2 className="create-meal-plan-page-title">CREATE MEAL PLAN</h2>
            <form onSubmit={handleSubmit} className="create-meal-plan-form">
                <div className="create-meal-plan-form-row-top">
                    <div className="create-meal-plan-form-group create-meal-plan-meal-name">
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

                    <div className="create-meal-plan-form-group create-meal-plan-upload-photo">
                        <input
                            type="file"
                            id="upload-photo"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        {imagePreviewUrl ? (
                            <div className="create-meal-plan-uploaded-image-preview">
                                <img src={imagePreviewUrl} alt="Meal Preview" className="create-meal-plan-meal-thumbnail" />
                                <label htmlFor="upload-photo" className="create-meal-plan-change-photo-button">
                                    Change Picture
                                </label>
                            </div>
                        ) : (
                            <label htmlFor="upload-photo" className="create-meal-plan-upload-photo-button create-meal-plan-initial">
                                Upload Picture
                            </label>
                        )}
                    </div>

                    <div className="create-meal-plan-form-group create-meal-plan-category">
                        <label>Category</label>
                        <div className="create-meal-plan-dropdown-checklist-container" ref={categoryDropdownRef}>
                            <button
                                type="button"
                                className={`create-meal-plan-dropdown-toggle-button ${isCategoryDropdownOpen ? 'create-meal-plan-open' : ''}`}
                                onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
                                disabled={loadingCategories}
                            >
                                {loadingCategories ? "Loading..." : getCategoryButtonText()}
                                <span className="create-meal-plan-dropdown-arrow"></span>
                            </button>
                            {isCategoryDropdownOpen && renderCategoryDropdown()}
                        </div>
                    </div>
                </div>

                <h3 className="create-meal-plan-section-title">Meal Details</h3>
                <div className="create-meal-plan-form-group">
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

                <div className="create-meal-plan-form-group">
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

                <div className="create-meal-plan-form-group create-meal-plan-description">
                    <label htmlFor="general-description">General Description & Notes</label>
                    <textarea
                        id="general-description"
                        rows="3"
                        placeholder="Add allergen warnings (e.g., contains dairy), portion size, storage notes, or a general overview of the meal."
                        value={generalDescription}
                        onChange={(e) => setGeneralDescription(e.target.value)}
                    ></textarea>
                </div>

                <h3 className="create-meal-plan-section-title">Nutrients Information</h3>
                <div className="create-meal-plan-nutrients-grid">
                    <div className="create-meal-plan-nutrient-item">
                        <label htmlFor="calories" className="create-meal-plan-nutrient-label">Calories</label>
                        <input
                            type="number"
                            id="calories"
                            value={calories}
                            onChange={(e) => setCalories(e.target.value)}
                            placeholder="0"
                            min="0"
                            required
                        />
                        <span className="create-meal-plan-unit">kcal</span>
                    </div>

                    <div className="create-meal-plan-nutrient-item">
                        <label htmlFor="protein" className="create-meal-plan-nutrient-label">Protein</label>
                        <input
                            type="number"
                            id="protein"
                            value={protein}
                            onChange={(e) => setProtein(e.target.value)}
                            placeholder="0"
                            min="0"
                            required
                        />
                        <span className="create-meal-plan-unit">grams</span>
                    </div>

                    <div className="create-meal-plan-nutrient-item">
                        <label htmlFor="carbohydrates" className="create-meal-plan-nutrient-label">Carbohydrates</label>
                        <input
                            type="number"
                            id="carbohydrates"
                            value={carbohydrates}
                            onChange={(e) => setCarbohydrates(e.target.value)}
                            placeholder="0"
                            min="0"
                            required
                        />
                        <span className="create-meal-plan-unit">grams</span>
                    </div>

                    <div className="create-meal-plan-nutrient-item">
                        <label htmlFor="fats" className="create-meal-plan-nutrient-label">Fats</label>
                        <input
                            type="number"
                            id="fats"
                            value={fats}
                            onChange={(e) => setFats(e.target.value)}
                            placeholder="0"
                            min="0"
                            required
                        />
                        <span className="create-meal-plan-unit">grams</span>
                    </div>
                </div>

                <h3 className="create-meal-plan-section-title">Advanced Nutrients (Optional)</h3>
                <div className="create-meal-plan-nutrients-grid create-meal-plan-premium-nutrients">
                    <div className="create-meal-plan-nutrient-item">
                        <label htmlFor="sugar" className="create-meal-plan-nutrient-label">Sugar</label>
                        <input
                            type="number"
                            id="sugar"
                            value={sugar}
                            onChange={(e) => setSugar(e.target.value)}
                            placeholder="0"
                            min="0"
                        />
                        <span className="create-meal-plan-unit">grams</span>
                    </div>
                    <div className="create-meal-plan-nutrient-item">
                        <label htmlFor="saturatedFat" className="create-meal-plan-nutrient-label">Saturated Fat</label>
                        <input
                            type="number"
                            id="saturatedFat"
                            value={saturatedFat}
                            onChange={(e) => setSaturatedFat(e.target.value)}
                            placeholder="0"
                            min="0"
                        />
                        <span className="create-meal-plan-unit">grams</span>
                    </div>
                    <div className="create-meal-plan-nutrient-item">
                        <label htmlFor="unsaturatedFat" className="create-meal-plan-nutrient-label">Unsaturated Fat</label>
                        <input
                            type="number"
                            id="unsaturatedFat"
                            value={unsaturatedFat}
                            onChange={(e) => setUnsaturatedFat(e.target.value)}
                            placeholder="0"
                            min="0"
                        />
                        <span className="create-meal-plan-unit">grams</span>
                    </div>
                    <div className="create-meal-plan-nutrient-item">
                        <label htmlFor="cholesterol" className="create-meal-plan-nutrient-label">Cholesterol</label>
                        <input
                            type="number"
                            id="cholesterol"
                            value={cholesterol}
                            onChange={(e) => setCholesterol(e.target.value)}
                            placeholder="0"
                            min="0"
                        />
                        <span className="create-meal-plan-unit">mg</span>
                    </div>
                    <div className="create-meal-plan-nutrient-item">
                        <label htmlFor="sodium" className="create-meal-plan-nutrient-label">Sodium</label>
                        <input
                            type="number"
                            id="sodium"
                            value={sodium}
                            onChange={(e) => setSodium(e.target.value)}
                            placeholder="0"
                            min="0"
                        />
                        <span className="create-meal-plan-unit">mg</span>
                    </div>
                    <div className="create-meal-plan-nutrient-item">
                        <label htmlFor="potassium" className="create-meal-plan-nutrient-label">Potassium</label>
                        <input
                            type="number"
                            id="potassium"
                            value={potassium}
                            onChange={(e) => setPotassium(e.target.value)}
                            placeholder="0"
                            min="0"
                        />
                        <span className="create-meal-plan-unit">mg</span>
                    </div>
                </div>

                {error && <p className="create-meal-plan-error-message">{error}</p>}

                <button type="submit" className="create-meal-plan-create-button" disabled={loading || loadingCategories}>
                    {loading ? 'Creating...' : '+ CREATE'}
                </button>
            </form>
        </div>
    );
});

export default CreateMealPlan;