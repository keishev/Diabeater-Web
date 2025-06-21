import React, { useState } from 'react';
import './AdminMealPlans.css';

// Mock Data for Meal Plans - (Keep your existing DUMMY_MEAL_PLANS array here)
const DUMMY_MEAL_PLANS = [
    {
        id: 'mp1',
        name: 'Oatmeal and Strawberries',
        author: 'John Doe',
        imageFileName: 'oatmeal-and-strawberries.jpg',
        status: 'pending',
        description: 'A warm and comforting bowl of oatmeal topped with fresh, juicy strawberries. Perfect for a healthy start to your day.',
        ingredients: [
            '½ cup rolled oats',
            '1 cup water or milk',
            '½ cup fresh strawberries, sliced',
            '1 tbsp honey or maple syrup (optional)',
            'Pinch of salt'
        ],
        nutrientInfo: {
            kcal: 320,
            carbs: 50,
            protein: 14,
            fat: 7
        },
        category: ['Improved Energy', 'Healthy Breakfast']
    },
    {
        id: 'mp2',
        name: 'Overnight Oats with Blueberries',
        author: 'John Doe',
        imageFileName: 'overnight-oats-with-blueberries.jpg',
        status: 'pending',
        description: 'Start your day with a refreshing and nutritious jar of Blueberry Overnight Oats. This make-ahead breakfast is rich in fiber, antioxidants, and protein – perfect for busy mornings. Creamy oats soaked in almond milk are layered with juicy blueberries, Greek yogurt, and a touch of honey for natural sweetness. It’s a wholesome, satisfying meal that fuels your morning without any fuss.',
        ingredients: [
            '½ cup rolled oats',
            '¾ cup unsweetened almond milk (or milk of choice)',
            '¼ cup Greek yogurt',
            '1 tbsp chia seeds',
            '½ tsp vanilla extract',
            'Pinch of cinnamon (optional)',
            '½ cup fresh blueberries',
            '1 tbsp honey or maple syrup (optional)'
        ],
        nutrientInfo: {
            kcal: 320,
            carbs: 50,
            protein: 14,
            fat: 7
        },
        category: ['Improved Energy', 'Weight Loss']
    },
    {
        id: 'mp3',
        name: 'Grilled Salmon with Asparagus',
        author: 'Jane Smith',
        imageFileName: 'grilled-salmon-asparagus.jpg',
        status: 'approved',
        description: 'A lean and flavorful meal featuring perfectly grilled salmon and tender asparagus. Rich in omega-3 fatty acids and vitamins.',
        ingredients: [
            '6 oz salmon fillet',
            '1 bunch asparagus, trimmed',
            '1 tbsp olive oil',
            'Salt and black pepper to taste',
            'Lemon wedges for serving'
        ],
        nutrientInfo: {
            kcal: 450,
            carbs: 8,
            protein: 40,
            fat: 28
        },
        category: ['Heart Health', 'High Protein']
    },
    {
        id: 'mp4',
        name: 'Chicken and Vegetable Stir-fry',
        author: 'Michael Brown',
        imageFileName: 'chicken-vegetable-stir-fry.jpg',
        status: 'pending',
        description: 'A quick and colorful stir-fry packed with lean chicken breast and a variety of fresh vegetables. A great source of fiber and essential nutrients.',
        ingredients: [
            '8 oz chicken breast, sliced',
            '1 cup broccoli florets',
            '½ cup sliced carrots',
            '½ cup bell peppers (assorted colors), sliced',
            '2 tbsp soy sauce (low sodium)',
            '1 tbsp sesame oil',
            '1 tsp ginger, minced',
            '1 clove garlic, minced',
            '¼ cup chicken broth',
            'Brown rice for serving (optional)'
        ],
        nutrientInfo: {
            kcal: 380,
            carbs: 35,
            protein: 30,
            fat: 12
        },
        category: ['Balanced Meal', 'Quick & Easy']
    },
    {
        id: 'mp5',
        name: 'Lentil Soup with Whole Grain Bread',
        author: 'Emily White',
        imageFileName: 'lentil-soup.jpg',
        status: 'approved',
        description: 'A hearty and nutritious lentil soup, rich in plant-based protein and fiber, served with a slice of whole-grain bread. Ideal for a comforting and healthy lunch or dinner.',
        ingredients: [
            '1 cup brown or green lentils, rinsed',
            '4 cups vegetable broth',
            '1 onion, chopped',
            '2 carrots, diced',
            '2 celery stalks, diced',
            '1 can (14.5 oz) diced tomatoes',
            '1 tsp cumin',
            '½ tsp thyme',
            'Salt and pepper to taste',
            'Whole grain bread for serving'
        ],
        nutrientInfo: {
            kcal: 300,
            carbs: 55,
            protein: 18,
            fat: 4
        },
        category: ['Vegetarian', 'High Fiber']
    },
    {
        id: 'mp6',
        name: 'Quinoa Salad with Chickpeas',
        author: 'Chris Green',
        imageFileName: 'quinoa-chickpea-salad.jpg',
        status: 'pending',
        description: 'A refreshing and protein-packed quinoa salad featuring chickpeas, cucumbers, tomatoes, and a zesty lemon dressing. Perfect for a light lunch or side dish.',
        ingredients: [
            '1 cup cooked quinoa',
            '1 can (15 oz) chickpeas, rinsed and drained',
            '½ cucumber, diced',
            '½ cup cherry tomatoes, halved',
            '¼ cup red onion, finely chopped',
            '2 tbsp fresh parsley, chopped',
            '2 tbsp olive oil',
            'Juice of ½ lemon',
            'Salt and pepper to taste'
        ],
        nutrientInfo: {
            kcal: 350,
            carbs: 45,
            protein: 12,
            fat: 15
        },
        category: ['Vegan', 'Gluten-Free']
    },
    {
        id: 'mp7',
        name: 'Turkey Meatballs with Zucchini Noodles',
        author: 'David Lee',
        imageFileName: 'turkey-meatballs-zoodles.jpg',
        status: 'approved',
        description: 'Flavorful turkey meatballs served over a bed of fresh zucchini noodles, tossed in a light tomato sauce. A low-carb, high-protein alternative to traditional pasta dishes.',
        ingredients: [
            '1 lb ground turkey',
            '½ cup breadcrumbs (gluten-free if preferred)',
            '¼ cup milk',
            '1 egg',
            '¼ cup grated Parmesan cheese (optional)',
            '1 clove garlic, minced',
            '1 tbsp fresh parsley, chopped',
            'Salt and pepper to taste',
            '2 medium zucchini, spiralized',
            '1 cup marinara sauce'
        ],
        nutrientInfo: {
            kcal: 400,
            carbs: 15,
            protein: 35,
            fat: 20
        },
        category: ['Low Carb', 'High Protein']
    },
    {
        id: 'mp8',
        name: 'Spinach and Feta Omelette',
        author: 'Sarah Johnson',
        imageFileName: 'spinach-feta-omelette.jpg',
        status: 'pending',
        description: 'A quick and protein-rich omelette filled with fresh spinach and tangy feta cheese. Ideal for a healthy breakfast or light meal.',
        ingredients: [
            '3 large eggs',
            '½ cup fresh spinach',
            '¼ cup crumbled feta cheese',
            '1 tsp olive oil or butter',
            'Salt and pepper to taste'
        ],
        nutrientInfo: {
            kcal: 280,
            carbs: 5,
            protein: 20,
            fat: 20
        },
        category: ['Healthy Breakfast', 'Quick & Easy']
    },
    {
        id: 'mp9',
        name: 'Baked Cod with Roasted Vegetables',
        author: 'Tom Davis',
        imageFileName: 'baked-cod-vegetables.jpg',
        status: 'approved',
        description: 'A simple and healthy baked cod fillet served with a medley of roasted seasonal vegetables. Light, nutritious, and easy to prepare.',
        ingredients: [
            '6 oz cod fillet',
            '1 cup mixed vegetables (e.g., bell peppers, zucchini, onion), chopped',
            '1 tbsp olive oil',
            '½ tsp paprika',
            'Salt and black pepper to taste',
            'Lemon slice for garnish'
        ],
        nutrientInfo: {
            kcal: 350,
            carbs: 15,
            protein: 30,
            fat: 18
        },
        category: ['Heart Health', 'Low Calorie']
    },
    {
        id: 'mp10',
        name: 'Sweet Potato and Black Bean Burger',
        author: 'Anna Kim',
        imageFileName: 'sweet-potato-black-bean-burger.jpg',
        status: 'pending',
        description: 'A delicious and satisfying vegetarian burger made with sweet potato and black beans, served on a whole-wheat bun with fresh toppings.',
        ingredients: [
            '1 medium sweet potato, cooked and mashed',
            '1 can (15 oz) black beans, rinsed and mashed',
            '¼ cup breadcrumbs',
            '¼ cup finely chopped onion',
            '1 clove garlic, minced',
            '1 tsp chili powder',
            '½ tsp cumin',
            'Salt and pepper to taste',
            'Whole-wheat bun',
            'Lettuce, tomato, avocado for topping'
        ],
        nutrientInfo: {
            kcal: 420,
            carbs: 60,
            protein: 15,
            fat: 12
        },
        category: ['Vegetarian', 'Plant-Based']
    },
    {
        id: 'mp11',
        name: 'Greek Yogurt with Berries and Nuts',
        author: 'Peter Wilson',
        imageFileName: 'greek-yogurt-berries.jpg',
        status: 'approved',
        description: 'A quick, protein-rich snack or breakfast featuring creamy Greek yogurt topped with a mix of fresh berries and crunchy nuts. Packed with probiotics and antioxidants.',
        ingredients: [
            '1 cup plain Greek yogurt',
            '½ cup mixed berries (strawberries, blueberries, raspberries)',
            '2 tbsp mixed nuts (almonds, walnuts), chopped',
            '1 tsp honey or maple syrup (optional)'
        ],
        nutrientInfo: {
            kcal: 250,
            carbs: 25,
            protein: 25,
            fat: 8
        },
        category: ['Healthy Snack', 'High Protein']
    },
    {
        id: 'mp12',
        name: 'Whole Wheat Pasta with Pesto and Cherry Tomatoes',
        author: 'Laura Adams',
        imageFileName: 'pasta-pesto-cherry-tomatoes.jpg',
        status: 'pending',
        description: 'A simple and fresh pasta dish using whole wheat pasta, vibrant pesto, and sweet cherry tomatoes. A quick vegetarian meal.',
        ingredients: [
            '1 cup whole wheat pasta (uncooked)',
            '¼ cup pesto',
            '1 cup cherry tomatoes, halved',
            '2 tbsp grated Parmesan cheese (optional)',
            'Fresh basil for garnish'
        ],
        nutrientInfo: {
            kcal: 400,
            carbs: 55,
            protein: 15,
            fat: 15
        },
        category: ['Vegetarian', 'Quick & Easy']
    }
];

const AdminMealPlans = ({ onViewDetails }) => {
    const [mealPlans, setMealPlans] = useState(DUMMY_MEAL_PLANS);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedPlanToReject, setSelectedPlanToReject] = useState(null);
    const [selectedRejectReason, setSelectedRejectReason] = useState('');
    const [otherReasonText, setOtherReasonText] = useState('');

    const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
    const [selectedPlanToApprove, setSelectedPlanToApprove] = useState(null);

    // New state for search and category filter
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    const rejectionReasons = [
        'Incomplete information provided',
        'Inaccurate nutritional data',
        'Contains allergens not declared',
        'Poor image quality',
        'Does not meet dietary guidelines',
        'Other (please specify)'
    ];

    // Collect all unique categories from DUMMY_MEAL_PLANS
    const allCategories = Array.from(new Set(
        DUMMY_MEAL_PLANS.flatMap(plan => plan.category || [])
    )).sort();


    // --- APPROVE MODAL LOGIC ---
    const handleApproveClick = (id) => {
        setSelectedPlanToApprove(id);
        setShowApproveConfirmModal(true);
    };

    const handleApproveConfirm = () => {
        setMealPlans(prevPlans =>
            prevPlans.map(plan =>
                plan.id === selectedPlanToApprove ? { ...plan, status: 'approved' } : plan
            )
        );
        console.log(`Meal Plan ${selectedPlanToApprove} Approved!`);
        // In a real app, send API call to approve
        setShowApproveConfirmModal(false);
        setSelectedPlanToApprove(null);
    };

    const handleApproveCancel = () => {
        setShowApproveConfirmModal(false);
        setSelectedPlanToApprove(null);
    };
    // --- END APPROVE MODAL LOGIC ---


    // --- REJECT MODAL LOGIC ---
    const handleRejectClick = (id) => {
        setSelectedPlanToReject(id);
        setSelectedRejectReason('');
        setOtherReasonText('');
        setShowRejectModal(true);
    };

    const handleReasonButtonClick = (reason) => {
        setSelectedRejectReason(reason);
        if (reason !== 'Other (please specify)') {
            setOtherReasonText('');
        }
    };

    const handleRejectSubmit = () => {
        let finalReason = selectedRejectReason;

        if (!finalReason) {
            alert('Please select a rejection reason.');
            return;
        }

        if (finalReason === 'Other (please specify)') {
            if (!otherReasonText.trim()) {
                alert('Please type the reason for rejection.');
                return;
            }
            finalReason = otherReasonText.trim();
        }

        setMealPlans(prevPlans =>
            prevPlans.map(plan =>
                plan.id === selectedPlanToReject ? { ...plan, status: 'rejected', rejectionReason: finalReason } : plan
            )
        );
        console.log(`Meal Plan ${selectedPlanToReject} Rejected! Reason: ${finalReason}`);
        setShowRejectModal(false);
        setSelectedPlanToReject(null);
        setSelectedRejectReason('');
        setOtherReasonText('');
    };

    const handleRejectCancel = () => {
        setShowRejectModal(false);
        setSelectedPlanToReject(null);
        setSelectedRejectReason('');
        setOtherReasonText('');
    };
    // --- END REJECT MODAL LOGIC ---


    const handleImageClick = (id) => {
        console.log('Image clicked for ID:', id);
        if (onViewDetails) {
            onViewDetails(id);
        }
    };

    // Filtered meal plans based on status, search term, and category
    const filteredMealPlans = mealPlans.filter(plan => {
        const matchesStatus = plan.status === 'pending';
        const matchesSearchTerm = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  plan.author.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === '' || (plan.category && plan.category.includes(selectedCategory));

        return matchesStatus && matchesSearchTerm && matchesCategory;
    });

    return (
        <div className="admin-meal-plans-container">
            <div className="admin-meal-plans-header"> {/* New div for header content */}
                <h1 className="admin-meal-plans-title">VERIFY MEAL PLANS</h1>
                <div className="search-controls">
                    <input
                        type="text"
                        placeholder="Search meal plans..."
                        className="search-input"
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
            </div>

            <div className="meal-plans-grid">
                {filteredMealPlans.length > 0 ? (
                    filteredMealPlans.map(plan => (
                        <div key={plan.id} className="meal-plan-card">
                            <img
                                src={`/assetscopy/${plan.imageFileName}`}
                                alt={plan.name}
                                className="meal-plan-card-image"
                                onClick={() => handleImageClick(plan.id)}
                            />
                            <div className="meal-plan-card-info">
                                <h3 className="meal-plan-card-name">{plan.name}</h3>
                                <p className="meal-plan-card-author">by {plan.author}</p>
                            </div>
                            <div className="meal-plan-card-actions">
                                <button
                                    className="approve-button"
                                    onClick={() => handleApproveClick(plan.id)}
                                >
                                    VERIFY
                                </button>
                                <button
                                    className="reject-button"
                                    onClick={() => handleRejectClick(plan.id)}
                                >
                                    REJECT
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-pending-plans-message">No meal plans pending approval or matching your criteria.</p>
                )}
            </div>

            {/* Rejection Reasons Modal (Existing) */}
            {showRejectModal && (
                <div className="reject-modal-overlay">
                    <div className="reject-modal-content">
                        <h2 className="modal-title">Reason for Rejection</h2>
                        <div className="reasons-list">
                            {rejectionReasons.map((reason, index) => (
                                <button
                                    key={index}
                                    className={`reason-button ${selectedRejectReason === reason ? 'active' : ''}`}
                                    onClick={() => handleReasonButtonClick(reason)}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>

                        {selectedRejectReason === 'Other (please specify)' && (
                            <textarea
                                className="other-reason-input"
                                placeholder="Type your reason here..."
                                value={otherReasonText}
                                onChange={(e) => setOtherReasonText(e.target.value)}
                                rows="3"
                            />
                        )}

                        <div className="modal-actions">
                            <button className="cancel-button" onClick={handleRejectCancel}>
                                Cancel
                            </button>
                            <button className="submit-button" onClick={handleRejectSubmit}>
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Confirmation Modal (Existing) */}
            {showApproveConfirmModal && (
                <div className="approve-modal-overlay">
                    <div className="approve-modal-content">
                        <h2 className="modal-title">Accept Meal Plan</h2>
                        <div className="modal-actions">
                            <button className="no-button" onClick={handleApproveCancel}>
                                No
                            </button>
                            <button className="yes-button" onClick={handleApproveConfirm}>
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export { DUMMY_MEAL_PLANS };
export default AdminMealPlans;