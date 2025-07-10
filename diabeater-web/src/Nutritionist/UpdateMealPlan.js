import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite'; // Import observer
import mealPlanViewModel from '../ViewModels/MealPlanViewModel'; // Import the ViewModel
import './UpdateMealPlan.css'; // Make sure this CSS file is correctly linked

const UpdateMealPlan = observer(({ mealPlan, onBack }) => { // Removed onSave prop
    // Initialize form state with data from the mealPlan prop
    const [formData, setFormData] = useState({
        name: mealPlan?.name || '',
        selectedCategories: mealPlan?.categories || [],
        // Use mealPlan.imageUrl for display if available, otherwise fallback to mealPlan.imageFileName
        // For actual file upload, imageFile will be set
        image: mealPlan?.imageUrl || (mealPlan?.imageFileName ? `/assetscopy/${mealPlan.imageFileName}` : ''),
        imageFile: null, // To hold the actual file object if a new one is selected
        description: mealPlan?.description || '',
        recipe: mealPlan?.recipe ? mealPlan.recipe.join('\n') : '', // Join array for textarea
        calories: mealPlan?.nutrientInfo?.calories || '',
        protein: mealPlan?.nutrientInfo?.protein || '',
        carbohydrates: mealPlan?.nutrientInfo?.carbs || '',
        fats: mealPlan?.nutrientInfo?.fat || '',
    });

    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef(null);

    // Dummy categories (these should ideally come from ViewModel if dynamic)
    const categoryOptions = [
        "Improved Energy",
        "Weight Loss",
        "Weight Management",
        "Heart Health",
        "Low Carb",
        "High Protein",
        "Gluten-Free",
        "Snack"
    ];

    // Effect for handling click outside to close dropdown
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    image: reader.result, // Set the image to base64 for preview
                    imageFile: file, // Store the actual file
                }));
            };
            reader.readAsDataURL(file);
        } else {
            setFormData(prev => ({
                ...prev,
                // Revert to original image URL if no new file is selected,
                // otherwise clear if it was a new upload that's now deselected.
                image: mealPlan?.imageUrl || (mealPlan?.imageFileName ? `/assetscopy/${mealPlan.imageFileName}` : ''),
                imageFile: null,
            }));
        }
    };

    const handleCategoryChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const newSelectedCategories = checked
                ? [...prev.selectedCategories, value]
                : prev.selectedCategories.filter(category => category !== value);
            return {
                ...prev,
                selectedCategories: newSelectedCategories
            };
        });
    };

    // Refactored handleSave to use mealPlanViewModel
    const handleSave = async () => {
        // Construct the payload for the update operation
        const updatedMealPlanData = {
            _id: mealPlan._id, // Essential: Pass the ID of the meal plan to update
            name: formData.name,
            categories: formData.selectedCategories,
            description: formData.description,
            recipe: formData.recipe.split('\n').filter(line => line.trim() !== ''),
            nutrientInfo: {
                calories: parseInt(formData.calories) || 0,
                protein: parseInt(formData.protein) || 0,
                carbs: parseInt(formData.carbohydrates) || 0,
                fat: parseInt(formData.fats) || 0,
            },
            // Only include imageFile if a new one was selected
            imageFile: formData.imageFile,
            // Pass original imageFileName for deletion if new image uploaded
            originalImageFileName: mealPlan?.imageFileName || null,
            // Pass current imageUrl if no new file is selected, to preserve it
            imageUrl: formData.imageFile ? null : formData.image // If imageFile is null, use current image state
        };

        console.log('Attempting to update meal plan with:', updatedMealPlanData);

        // Call the updateMealPlan action from the ViewModel
        await mealPlanViewModel.updateMealPlan(updatedMealPlanData);

        // Check ViewModel's success/error state after the operation
        if (mealPlanViewModel.success) {
            alert('Meal plan updated successfully!'); // Or use a nicer UI notification
            onBack(); // Go back to the dashboard
        } else if (mealPlanViewModel.error) {
            alert(`Error updating meal plan: ${mealPlanViewModel.error}`); // Display error
        }
    };

    const getCategoryButtonText = () => {
        if (formData.selectedCategories.length === 0) {
            return "Select Categories";
        } else if (formData.selectedCategories.length === 1) {
            return formData.selectedCategories[0];
        } else {
            return `${formData.selectedCategories.length} Categories Selected`;
        }
    };

    return (
        <div className="update-meal-plan-container">
            <header className="update-meal-plan-header">
                <h1 className="update-meal-plan-title">UPDATE MEAL PLAN</h1>
            </header>

            <div className="main-form-content">
                <div className="left-column">
                    <div className="form-section">
                        <label htmlFor="mealName">Meal Name</label>
                        <input
                            type="text"
                            id="mealName"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="meal-name-input"
                        />
                    </div>

                    <div className="form-row category-upload-row">
                        <div className="form-section category-section">
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
                                                    checked={formData.selectedCategories.includes(option)}
                                                    onChange={handleCategoryChange}
                                                />
                                                <label htmlFor={`category-${index}`}>{option}</label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-section image-upload-section">
                            <label htmlFor="mealImage">Meal Image</label>
                            <input
                                type="file"
                                id="mealImage"
                                name="imageFile"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="file-input"
                            />
                            {formData.image && (
                                <div className="image-preview-container">
                                    <img src={formData.image} alt="Meal Plan Preview" className="image-preview" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-section">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="description-textarea"
                            rows="4"
                        ></textarea>
                    </div>

                    <div className="form-section">
                        <label htmlFor="recipe">Recipe (Each step on a new line)</label>
                        <textarea
                            id="recipe"
                            name="recipe"
                            value={formData.recipe}
                            onChange={handleChange}
                            className="recipe-textarea"
                            rows="8"
                        ></textarea>
                    </div>
                </div>

                <div className="right-column">
                    <div className="nutrient-info-section">
                        <h2>Nutrient Information</h2>
                        <div className="nutrient-inputs">
                            <div className="nutrient-input-group">
                                <label htmlFor="calories">Calories (kcal)</label>
                                <input
                                    type="number"
                                    id="calories"
                                    name="calories"
                                    value={formData.calories}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>
                            <div className="nutrient-input-group">
                                <label htmlFor="protein">Protein (g)</label>
                                <input
                                    type="number"
                                    id="protein"
                                    name="protein"
                                    value={formData.protein}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>
                            <div className="nutrient-input-group">
                                <label htmlFor="carbohydrates">Carbohydrates (g)</label>
                                <input
                                    type="number"
                                    id="carbohydrates"
                                    name="carbohydrates"
                                    value={formData.carbohydrates}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>
                            <div className="nutrient-input-group">
                                <label htmlFor="fats">Fats (g)</label>
                                <input
                                    type="number"
                                    id="fats"
                                    name="fats"
                                    value={formData.fats}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="update-meal-plan-footer">
                <button type="button" className="back-button" onClick={onBack}>
                    BACK
                </button>
                <button type="button" className="save-button" onClick={handleSave} disabled={mealPlanViewModel.loading}>
                    {mealPlanViewModel.loading ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
            </footer>
        </div>
    );
});

export default UpdateMealPlan;