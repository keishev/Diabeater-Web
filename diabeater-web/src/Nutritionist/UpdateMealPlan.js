import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import './UpdateMealPlan.css'; // Make sure this CSS file is correctly linked

const UpdateMealPlan = ({ mealPlan, onBack, onSave }) => {
    // Initialize form state with data from the mealPlan prop
    const [formData, setFormData] = useState({
        name: mealPlan?.name || '',
        // Initialize selectedCategories as an array from mealPlan.categories
        // or an empty array if mealPlan.categories is not present/empty
        selectedCategories: mealPlan?.categories || [],
        image: mealPlan?.image || '', // This will hold the URL or base64 if directly managed
        imageFile: null, // To hold the actual file object if a new one is selected
        description: mealPlan?.description || '',
        recipe: mealPlan?.recipe ? mealPlan.recipe.join('\n') : '', // Join array for textarea
        calories: mealPlan?.nutrientInfo?.calories || '',
        protein: mealPlan?.nutrientInfo?.protein || '',
        carbohydrates: mealPlan?.nutrientInfo?.carbs || '',
        fats: mealPlan?.nutrientInfo?.fat || '',
    });

    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false); // New state for dropdown
    const categoryDropdownRef = useRef(null); // Ref for click outside detection

    // Dummy categories as per the screenshot
    const categoryOptions = [ // Renamed to categoryOptions for clarity
        "Improved Energy",
        "Weight Loss",
        "Weight Management",
        "Heart Health",
        "Low Carb",
        "High Protein",
        "Gluten-Free",
        "Snack"
    ];

    useEffect(() => {
        // Effect for handling click outside to close dropdown
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
                image: mealPlan?.image || '', // Revert to original if no file selected
                imageFile: null,
            }));
        }
    };

    // New handler for category checkbox changes
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

    const handleSave = () => {
        const updatedMealPlan = {
            ...mealPlan, // Keep existing meal plan properties
            name: formData.name,
            categories: formData.selectedCategories, // Use the array of selected categories
            image: formData.image, // Use the updated image (either URL or base64 preview)
            description: formData.description,
            recipe: formData.recipe.split('\n').filter(line => line.trim() !== ''), // Split back to array
            nutrientInfo: {
                calories: parseInt(formData.calories) || 0,
                protein: parseInt(formData.protein) || 0,
                carbs: parseInt(formData.carbohydrates) || 0,
                fat: parseInt(formData.fats) || 0,
            },
        };
        console.log('Saving updated meal plan:', updatedMealPlan);
        if (onSave) {
            onSave(updatedMealPlan);
        }
        onBack(); // Go back to dashboard after saving (or show success message)
    };

    // Helper function to display selected categories on the button
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
                            <label>Category</label> {/* Label for the dropdown button */}
                            <div className="dropdown-checklist-container" ref={categoryDropdownRef}>
                                <button
                                    type="button" // Important: set type to button to prevent form submission
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
                        <div className="form-section upload-photo-section">
                            <label htmlFor="uploadPhoto" className="upload-photo-button">UPLOAD PHOTO</label>
                            <input
                                type="file"
                                id="uploadPhoto"
                                onChange={handleFileChange}
                                className="file-input"
                                style={{ display: 'none' }} // Hide default file input
                            />
                        </div>
                    </div>
                </div>

                <div className="right-column">
                    <div className="photo-display-area">
                        {formData.image ? (
                            <img src={formData.image} alt="Meal Preview" className="meal-display-image" />
                        ) : (
                            '/photo preview'
                        )}
                    </div>
                </div>
            </div>

            <div className="form-section">
                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="full-width-textarea"
                ></textarea>
            </div>

            <div className="form-section">
                <label htmlFor="recipe">Recipe</label>
                <textarea
                    id="recipe"
                    name="recipe"
                    value={formData.recipe}
                    onChange={handleChange}
                    rows="6"
                    className="full-width-textarea"
                ></textarea>
            </div>

            <h3>Nutrients Information</h3>
            <div className="nutrients-grid">
                <div className="nutrient-item">
                    <label class="nutrient-label" htmlFor="calories">Calories</label>
                    <input type="number" class="nutrient-input" id="calories" name="calories" value={formData.calories} onChange={handleChange} />
                    <span className="unit">kcal</span>
                </div>
                <div className="nutrient-item">
                    <label class="nutrient-label" htmlFor="protein">Protein</label>
                    <input type="number" class="nutrient-input" id="protein" name="protein" value={formData.protein} onChange={handleChange} />
                    <span className="unit">grams</span>
                </div>
                <div className="nutrient-item">
                    <label class="nutrient-label" htmlFor="carbohydrates">Carbohydrates</label>
                    <input type="number" class="nutrient-input" id="carbohydrates" name="carbohydrates" value={formData.carbohydrates} onChange={handleChange} />
                    <span className="unit">grams</span>
                </div>
                <div className="nutrient-item">
                    <label class="nutrient-label" htmlFor="fats">Fats</label>
                    <input type="number" class="nutrient-input" id="fats" name="fats" value={formData.fats} onChange={handleChange} />
                    <span className="unit">grams</span>
                </div>
            </div>

            <div className="form-actions">
                <button type="button" className="cancel-button" onClick={onBack}>cancel</button>
                <button type="button" className="save-button" onClick={handleSave}>save</button>
            </div>
        </div>
    );
};

export default UpdateMealPlan;