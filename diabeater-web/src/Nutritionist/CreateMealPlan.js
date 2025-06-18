import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import './CreateMealPlan.css'; // Make sure this CSS file is created

const CreateMealPlan = () => {
    const [mealName, setMealName] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]); // Array for multiple categories
    const [uploadPhoto, setUploadPhoto] = useState(null); // To hold the File object
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // To hold the URL for image src
    const [description, setDescription] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbohydrates, setCarbohydrates] = useState('');
    const [fats, setFats] = useState('');

    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false); // New state for dropdown
    const categoryDropdownRef = useRef(null); // Ref for click outside detection

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

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadPhoto(file);
            setImagePreviewUrl(URL.createObjectURL(file)); // Create a URL for the image preview
        } else {
            // If no file is selected (e.g., user cancels file dialog), clear both
            setUploadPhoto(null);
            setImagePreviewUrl(null);
        }
    };

    // Cleanup function for object URL to prevent memory leaks
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
                return [...prev, value]; // Add category if checked
            } else {
                return prev.filter(category => category !== value); // Remove category if unchecked
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real application, you would send this data to your backend API
        const mealPlanData = {
            mealName,
            categories: selectedCategories, // Now an array
            description,
            calories: parseFloat(calories),
            protein: parseFloat(protein),
            carbohydrates: parseFloat(carbohydrates),
            fats: parseFloat(fats),
            // For photo, you'd typically upload the file separately or send as FormData
            uploadPhoto: uploadPhoto ? uploadPhoto.name : null,
        };
        console.log('New Meal Plan Data:', mealPlanData);
        alert('Meal Plan Created! (Check console for data)');

        // Optional: Reset form after submission
        setMealName('');
        setSelectedCategories([]);
        setUploadPhoto(null);
        setImagePreviewUrl(null); // Clear image preview on reset
        setDescription('');
        setCalories('');
        setProtein('');
        setCarbohydrates('');
        setFats('');
    };

    // Helper function to display selected categories on the button
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
                    {/* Meal Name Input */}
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

                    {/* Upload Photo Section - Initially the button, then the preview and change button */}
                    <div className="form-group upload-photo">

                        <input
                            type="file"
                            id="upload-photo"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }} // Hidden file input
                        />
                        {imagePreviewUrl ? (
                            <div className="uploaded-image-preview">
                                <img src={imagePreviewUrl} alt="Meal Preview" className="meal-thumbnail" />
                                {/* Label targets the hidden file input to allow changing */}
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
                        <label>Category</label> {/* No htmlFor needed for the main label */}
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

                <div className="form-group description">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        rows="5"
                        placeholder="Include the recipe, preparation method, allergen warnings (e.g., contains nuts or dairy), portion size, and storage notes."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    ></textarea>
                </div>

                <h3 className="create-meal-section-title">Nutrients Information</h3>
                <div className="nutrients-grid">
                    {/* Calories Input */}
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

                    {/* Protein Input */}
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

                    {/* Carbohydrates Input */}
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

                    {/* Fats Input */}
                    <div className="nutrient-item">
                        <label htmlFor="fats" className="nutrient-label"> Fats</label>
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

                <button type="submit" className="create-button">
                    + CREATE
                </button>
            </form>
        </div>
    );
};

export default CreateMealPlan;