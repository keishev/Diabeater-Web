import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'; // Import doc, getDoc
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import app from '../firebase'; // Ensure this path is correct
import AuthService from '../Services/AuthService'; // Import AuthService to get current user name

import './CreateMealPlan.css';

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

const CreateMealPlan = ({ onMealPlanSubmitted }) => {
    const [mealName, setMealName] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [uploadPhoto, setUploadPhoto] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [description, setDescription] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbohydrates, setCarbohydrates] = useState('');
    const [fats, setFats] = useState('');

    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef(null);

    const [loading, setLoading] = useState(false); // New state for loading
    const [error, setError] = useState('');     // New state for errors
    const [success, setSuccess] = useState(''); // New state for success message

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

        const user = auth.currentUser; // Get current Firebase Auth user
        const nutritionistInfo = AuthService.getCurrentUser(); // Get user info from localStorage (AuthService)

        if (!user || !nutritionistInfo || nutritionistInfo.role !== 'nutritionist') {
            setError('You must be logged in as an approved nutritionist to create a meal plan.');
            setLoading(false);
            return;
        }

        try {
            let imageUrl = '';
            let imageFileName = '';

            if (uploadPhoto) {
                // 1. Upload image to Firebase Storage
                imageFileName = `${Date.now()}_${uploadPhoto.name}`;
                const storageRef = ref(storage, `meal_plan_images/${imageFileName}`);
                const snapshot = await uploadBytes(storageRef, uploadPhoto);
                imageUrl = await getDownloadURL(snapshot.ref);
            } else {
                setError('Please upload a meal plan image.');
                setLoading(false);
                return;
            }

            // Get the nutritionist's actual name from Firestore user_accounts (more reliable than localStorage for initial fetch)
            // This ensures the `author` field is accurate.
            const userDocRef = doc(db, 'user_accounts', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            const userData = userDocSnap.exists() ? userDocSnap.data() : {};
            const actualNutritionistName = userData.name || userData.username || user.email; // Fallback to email

            // 2. Save meal plan data to Firestore
            const mealPlanData = {
                name: mealName,
                categories: selectedCategories,
                description,
                calories: parseFloat(calories),
                protein: parseFloat(protein),
                carbohydrates: parseFloat(carbohydrates),
                fats: parseFloat(fats),
                imageUrl: imageUrl,       // Stored direct image URL
                imageFileName: imageFileName, // Stored original file name
                author: actualNutritionistName, // Nutritionist's display name
                authorId: user.uid,         // Nutritionist's UID (for filtering)
                status: 'PENDING_APPROVAL', // Initial status set here
                likes: 0,
                createdAt: serverTimestamp(), // Firestore timestamp
            };

            await addDoc(collection(db, 'meal_plans'), mealPlanData);

            setSuccess('Meal Plan Created Successfully!');
            console.log('New Meal Plan Data Saved to Firestore:', mealPlanData);

            // Notify parent component (NutritionistDashboard) to re-fetch meal plans
            if (onMealPlanSubmitted) {
                onMealPlanSubmitted();
            }

            // Reset form fields
            setMealName('');
            setSelectedCategories([]);
            setUploadPhoto(null);
            setImagePreviewUrl(null);
            setDescription('');
            setCalories('');
            setProtein('');
            setCarbohydrates('');
            setFats('');

        } catch (err) {
            console.error('Error creating meal plan:', err);
            setError('Failed to create meal plan: ' + err.message);
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