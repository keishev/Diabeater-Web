import React, { useState, useEffect } from 'react';
import './NutritionistDashboard.css';
import CreateMealPlan from './CreateMealPlan';
import NutritionistProfile from './NutritionistProfile';
import MealPlanDetail from './MealPlanDetail';
import UpdateMealPlan from './UpdateMealPlan';

// Mock data for demonstration purposes. This will be hardcoded as requested.
const initialMealPlans = [
    {
        id: '1',
        name: 'Eggplant Sicilian Pasta',
        image: '/assetscopy/eggplant-pasta.jpg', // Ensure path is correct in your project
        likes: '203',
        status: 'UPLOADED',
        author: 'By John Doe', // Assuming a default author for now
        description: `A rich and flavorful pasta dish featuring tender eggplant, ripe tomatoes, basil, and a hint of spice. This hearty meal is perfect for a satisfying dinner.`,
        recipe: [
            '1 large eggplant, diced',
            '2 cups crushed tomatoes',
            '1/2 cup fresh basil, chopped',
            '2 cloves garlic, minced',
            '1/4 cup Parmesan cheese, grated',
            '8 oz pasta of choice',
            '2 tbsp olive oil',
            'Salt and pepper to taste',
            'Pinch of red pepper flakes (optional)'
        ],
        preparation: `1. Heat olive oil in a large pan over medium heat. Add eggplant and cook until tender, about 8-10 minutes.
2. Add minced garlic and red pepper flakes (if using), cook for 1 
minute until fragrant.
3. Stir in crushed tomatoes and bring to a simmer. Cook for 15-20 minutes, allowing flavors to meld.
4. Meanwhile, cook pasta according to package directions. Drain, reserving 1/2 cup pasta water.
5. Add cooked pasta, fresh basil, and Parmesan cheese to the sauce. Toss to combine.
6. If sauce is too thick, add reserved pasta water a little at a time until desired consistency is reached. Serve hot.`,
        allergens: 'Contains gluten (pasta), dairy (Parmesan)',
        portionSize: '2-3 servings',
        storage: 'Store leftovers in an airtight container in the refrigerator for up to 3 days.',
        nutrientInfo: {
            calories: 320,
            carbs: 45,
            protein: 10,
            fat: 12
        },
        categories: ['Weight Management', 'Heart Health']
    },
    {
        id: '2',
        name: 'Low Carb French Fries',
        image: '/assetscopy/low-carb-fries.jpg', // Ensure path is correct
        likes: '1.3k',
        status: 'UPLOADED',
        author: 'By Jane Smith',
        description: `Crispy and delicious "fries" made from daikon radish, offering a low-carb alternative to traditional french fries. Perfect as a side or snack.`,
        recipe: [
            '1 large daikon radish, peeled and cut into fries',
            '1 tbsp olive oil',
            '1 tsp garlic powder',
            '1/2 tsp paprika',
            'Salt and pepper to taste'
        ],
        preparation: `1. Preheat oven to 400°F (200°C).
2. In a bowl, toss daikon fries with olive oil, garlic powder, paprika, salt, and pepper.
3. Spread fries in a single layer on a baking sheet.
4. Bake for 25-30 minutes, flipping halfway, until golden brown and crispy. Serve immediately.`,
        allergens: 'None',
        portionSize: '2 servings',
        storage: 'Best consumed fresh. Can be stored in an airtight container for 1-2 days, but may lose crispiness.',
        nutrientInfo: {
            calories: 150,
            carbs: 10,
            protein: 2,
            fat: 12
        },
        categories: ['Low Carb', 'Snack']
    },
    {
        id: '3',
        name: 'Low Carb French Fries', // Example of duplicate, might have different variations
        image: '/assetscopy/low-carb-fries-2.jpg', // Ensure path is correct
        likes: '1k',
        status: 'PENDING_APPROVAL', // Changed status for demonstration
        author: 'By Sarah Lee',
        description: `Another variation of low-carb fries, this time using jicama for a slightly different texture and flavor. Great for guilt-free snacking.`,
        recipe: [
            '1 medium jicama, peeled and cut into fries',
            '1 tbsp avocado oil',
            '1/2 tsp chili powder',
            '1/4 tsp cumin',
            'Salt to taste'
        ],
        preparation: `1. Preheat oven to 425°F (220°C).
2. Toss jicama fries with avocado oil, chili powder, cumin, and salt.
3. Arrange on a baking sheet and bake for 20-25 minutes, or until tender-crisp and slightly browned.`,
        allergens: 'None',
        portionSize: '2 servings',
        storage: 'Store in refrigerator for up to 3 days. Reheat in oven or air fryer for best texture.',
        nutrientInfo: {
            calories: 120,
            carbs: 12,
            protein: 1,
            fat: 8
        },
        categories: ['Low Carb', 'Snack']
    },
    {
        id: '4',
        name: 'Oven-Fried Pork Chops',
        image: '/assetscopy/pork-chops.jpg', // Ensure path is correct
        likes: '445',
        status: 'UPLOADED',
        author: 'By Michael Brown',
        description: `Crispy on the outside, juicy on the inside, these oven-fried pork chops offer a healthier alternative to deep-frying without sacrificing flavor.`,
        recipe: [
            '2 boneless pork chops',
            '1/2 cup almond flour',
            '1 egg, beaten',
            '1 tsp smoked paprika',
            '1/2 tsp garlic powder',
            'Salt and pepper to taste',
            '2 tbsp olive oil'
        ],
        preparation: `1. Preheat oven to 400°F (200°C).
2. Pat pork chops dry. In a shallow dish, combine almond flour, smoked paprika, garlic powder, salt, and pepper.
3. Dip each pork chop in the beaten egg, then dredge in the almond flour mixture, pressing to coat.
4. Heat olive oil in an oven-safe skillet over medium-high heat. Sear pork chops for 2-3 minutes per side until golden brown.
5. Transfer skillet to the preheated oven and bake for 10-15 minutes, or until internal temperature reaches 145°F (63°C). Let rest before serving.`,
        allergens: 'Contains eggs, nuts (almond flour)',
        portionSize: '2 servings',
        storage: 'Store in an airtight container in the refrigerator for up to 3 days. Reheat gently to avoid drying out.',
        nutrientInfo: {
            calories: 400,
            carbs: 8,
            protein: 40,
            fat: 25
        },
        categories: ['High Protein', 'Gluten-Free']
    },
    {
        id: '5',
        name: 'Chopped Salad with Basil & Mozzarella',
        image: '/assetscopy/chopped-salad.jpg', // Ensure path is correct
        likes: '1.6k',
        status: 'UPLOADED',
        author: 'By John Doe', // Assuming the author from the detail image
        description: `A refreshing and nutritious chopped salad featuring cherry tomatoes, cucumbers, red onions, fresh basil leaves, and cubed mozzarella cheese, lightly tossed in extra virgin olive oil and balsamic vinegar.`,
        recipe: [
            '1 cup cherry tomatoes, halved',
            '1 cup cucumber, diced',
            '¼ red onion, thinly sliced',
            '½ cup fresh mozzarella, cubed',
            '8-10 fresh basil leaves, torn',
            '1 tbsp olive oil',
            '1 tsp balsamic vinegar',
            'Salt and pepper to taste'
        ],
        preparation: `Combine all ingredients in a large bowl and gently toss to coat. Serve chilled.`,
        allergens: 'Contains dairy (mozzarella)',
        portionSize: 'Serves 1-2 as a light meal or side.',
        storage: 'Best consumed fresh. If storing, refrigerate for up to 24 hours in an airtight container.',
        nutrientInfo: {
            calories: 280,
            carbs: 10,
            protein: 12,
            fat: 8
        },
        categories: ['Improved Energy', 'Weight Loss']
    },
];

// Extract all unique categories from the initial meal plans
const allCategories = [...new Set(initialMealPlans.flatMap(plan => plan.categories))];

// Extracted MealPlanCard for clarity
const MealPlanCard = ({ mealPlan, onClick, onUpdateClick }) => {
    return (
        <div className="meal-plan-card" onClick={() => onClick(mealPlan)}>
            <img src={mealPlan.image} alt={mealPlan.name} className="meal-plan-image" />
            <div className="meal-plan-info">
                <h3 className="meal-plan-name">{mealPlan.name}</h3>
                <div className="meal-plan-actions">
                    <button className="update-button" onClick={(e) => { e.stopPropagation(); onUpdateClick(mealPlan); }}>UPDATE</button>
                    {/* NEW: Add a heart icon next to the likes count */}
                    <span className="likes-count">
                        <i className="fa-solid fa-heart"></i> {mealPlan.likes}
                    </span>
                </div>
            </div>
        </div>
    );
};

// New component for My Meal Plans content
const MyMealPlansContent = ({
    mealPlans,
    activeTab,
    setActiveTab,
    onSelectMealPlan,
    onUpdateMealPlan,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    showCategoryDropdown,
    setShowCategoryDropdown,
    allCategories // Pass allCategories down
}) => {

    const filteredAndSearchedMealPlans = mealPlans.filter(plan => {
        const matchesSearchTerm = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  plan.author.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === '' || (plan.categories && plan.categories.includes(selectedCategory));
        const matchesTabStatus = plan.status === activeTab;

        return matchesSearchTerm && matchesCategory && matchesTabStatus;
    });

    return (
        <>
            <header className="header">
                <h1 className="page-title">MY MEAL PLANS</h1>
                {/* Wrap search bar and category dropdown in a new container */}
                <div className="search-controls"> {/* Using the provided .search-controls class */}
                    <input
                        type="text"
                        placeholder="Search your meal plans..."
                        className="search-input" // Apply the new search-input class
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="category-dropdown-container">
                        <button
                            className="category-button"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        >
                            {selectedCategory || "Search by Category"}
                        </button>
                        {showCategoryDropdown && (
                            <div className="category-dropdown-content">
                                <button
                                    className="dropdown-item"
                                    onClick={() => {
                                        setSelectedCategory('');
                                        setShowCategoryDropdown(false);
                                    }}
                                >
                                    All Categories
                                </button>
                                {allCategories.map((category) => (
                                    <button
                                        key={category}
                                        className={`dropdown-item ${selectedCategory === category ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setShowCategoryDropdown(false);
                                        }}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="tabs">
                <button
                    className={`tab-button ${activeTab === 'UPLOADED' ? 'active' : ''}`}
                    onClick={() => setActiveTab('UPLOADED')}
                >
                    UPLOADED
                </button>
                <button
                    className={`tab-button ${activeTab === 'PENDING_APPROVAL' ? 'active' : ''}`}
                    onClick={() => setActiveTab('PENDING_APPROVAL')}
                >
                    PENDING APPROVAL
                </button>
            </div>

            <div className="meal-plans-grid">
                {filteredAndSearchedMealPlans.length > 0 ? (
                    filteredAndSearchedMealPlans.map(plan => (
                        <MealPlanCard
                            key={plan.id}
                            mealPlan={plan}
                            onClick={onSelectMealPlan}
                            onUpdateClick={onUpdateMealPlan}
                        />
                    ))
                ) : (
                    <p className="no-meal-plans-message">
                        No meal plans found for "{activeTab}" with the current filters.
                    </p>
                )}
            </div>
        </>
    );
};


// Modified Sidebar component to accept currentView and onNavigate
const Sidebar = ({ currentView, onNavigate }) => {
    const handleLogout = () => {
        // In a real application, you would also clear authentication tokens/session here
        // e.g., localStorage.removeItem('authToken');
        // Then redirect to the login page
        window.location.href = '/login';
    };

    return (
        <div className="sidebar">
            <div className="logo">
                <img src="/assetscopy/blood_drop_logo.png" alt="DiaBeater Logo" />
                <span className="logo-text">DiaBeater</span>
            </div>
            <nav className="navigation">
                <div
                    className={`nav-item ${currentView === 'nutritionistProfile' ? 'active' : ''}`}
                    onClick={() => onNavigate('nutritionistProfile')}
                >
                    <i className="fas fa-user"></i>
                    <span>My Profile</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'myMealPlans' ? 'active' : ''}`}
                    onClick={() => onNavigate('myMealPlans')}
                >
                    <i className="fas fa-clipboard-list"></i>
                    <span>My Meal Plans</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'createMealPlan' ? 'active' : ''}`}
                    onClick={() => onNavigate('createMealPlan')}
                >
                    <i className="fas fa-plus-circle"></i>
                    <span>Create Meal Plan</span>
                </div>
            </nav>
            <button className="logout-button" onClick={handleLogout}>Log out</button>
        </div>
    );
};


const NutritionistDashboard = () => {
    const [mealPlans, setMealPlans] = useState(initialMealPlans);
    const [activeTab, setActiveTab] = useState('UPLOADED');
    const [currentView, setCurrentView] = useState('myMealPlans'); // Default view
    const [selectedMealPlan, setSelectedMealPlan] = useState(null); // To hold the meal plan for detail/update view
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);


    useEffect(() => {
        // Fetch meal plans from an API here in a real app
    }, []);

    // Function to handle clicking on a meal plan card (for detail view)
    const handleSelectMealPlan = (mealPlan) => {
        setSelectedMealPlan(mealPlan);
        setCurrentView('mealPlanDetail'); // Change view to show meal plan detail
    };

    // Function to handle clicking the "UPDATE" button on a meal plan card
    const handleUpdateMealPlan = (mealPlan) => {
        setSelectedMealPlan(mealPlan);
        setCurrentView('updateMealPlan'); // Change view to the update meal plan form
    };

    // Function to go back from meal plan detail or update view
    const handleBack = () => {
        setSelectedMealPlan(null);
        setCurrentView('myMealPlans'); // Go back to the meal plans list
    };

    return (
        <div className="nutritionist-dashboard-page">
            <Sidebar currentView={currentView} onNavigate={setCurrentView} />
            <div className="main-content">
                {currentView === 'nutritionistProfile' && <NutritionistProfile />}

                {currentView === 'myMealPlans' && (
                    <MyMealPlansContent
                        mealPlans={mealPlans}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        onSelectMealPlan={handleSelectMealPlan}
                        onUpdateMealPlan={handleUpdateMealPlan}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        showCategoryDropdown={showCategoryDropdown}
                        setShowCategoryDropdown={setShowCategoryDropdown}
                        allCategories={allCategories} // Pass allCategories
                    />
                )}

                {currentView === 'createMealPlan' && (
                    <CreateMealPlan />
                )}

                {/* Render MealPlanDetail component if a meal plan is selected for detail view */}
                {currentView === 'mealPlanDetail' && selectedMealPlan && (
                    <MealPlanDetail
                        mealPlan={selectedMealPlan}
                        onBack={handleBack}
                    />
                )}

                {/* Render UpdateMealPlan component if a meal plan is selected for update view */}
                {currentView === 'updateMealPlan' && selectedMealPlan && (
                    <UpdateMealPlan
                        mealPlan={selectedMealPlan}
                        onBack={handleBack}
                    />
                )}
            </div>
        </div>
    );
};

export default NutritionistDashboard;