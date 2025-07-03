import React, { useState, useEffect, useCallback } from 'react';
import './NutritionistDashboard.css';
import CreateMealPlan from './CreateMealPlan';
import NutritionistProfile from './NutritionistProfile';
import MealPlanDetail from './MealPlanDetail';
import UpdateMealPlan from './UpdateMealPlan';
import NotificationList from './NotificationList'; // Ensure this file is updated as well, as discussed

// Firebase Imports
import { getFirestore, collection, query, where, getDocs, doc, deleteDoc, updateDoc, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import app from '../firebase'; // Your Firebase app instance
import AuthService from '../Services/AuthService';

const db = getFirestore(app);
const storage = getStorage(app);

// --- MealPlanCard component ---
const MealPlanCard = ({ mealPlan, onClick, onUpdateClick, onDeleteClick }) => {
    const displayStatus = mealPlan.status === 'UPLOADED' ? 'PUBLISHED' : mealPlan.status.replace(/_/g, ' ');
    const imageUrl = mealPlan.imageUrl || `/assetscopy/${mealPlan.imageFileName}`;

    return (
        <div className="meal-plan-card" onClick={() => onClick(mealPlan)}>
            <img src={imageUrl} alt={mealPlan.name} className="meal-plan-image" />
            <div className="meal-plan-info">
                <h3 className="meal-plan-name">{mealPlan.name}</h3>
                <div className="meal-plan-actions">
                    {(mealPlan.status === 'UPLOADED' || mealPlan.status === 'REJECTED') && (
                        <button className="update-button" onClick={(e) => { e.stopPropagation(); onUpdateClick(mealPlan); }}>UPDATE</button>
                    )}
                    <button className="delete-button" onClick={(e) => { e.stopPropagation(); onDeleteClick(mealPlan._id, mealPlan.imageFileName); }}>DELETE</button>
                    <span className="meal-plan-status">Status: {displayStatus}</span>
                    <span className="likes-count">
                        <i className="fa-solid fa-heart"></i> {mealPlan.likes || 0}
                    </span>
                </div>
            </div>
        </div>
    );
};



// --- MyMealPlansContent component ---
const MyMealPlansContent = ({
    mealPlans,
    activeTab,
    setActiveTab,
    onSelectMealPlan,
    onUpdateMealPlan,
    onDeleteMealPlan,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    showCategoryDropdown,
    setShowCategoryDropdown,
    allCategories
}) => {
    const filteredByTab = mealPlans.filter(plan => {
        if (activeTab === 'UPLOADED') {
            return plan.status === 'UPLOADED';
        } else if (activeTab === 'PENDING_APPROVAL') {
            return plan.status === 'PENDING_APPROVAL';
        } else if (activeTab === 'REJECTED') {
            return plan.status === 'REJECTED';
        }
        return false;
    });

    const filteredAndSearchedMealPlans = filteredByTab.filter(plan => {
        const matchesSearchTerm = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (plan.author && plan.author.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === '' || (plan.categories && plan.categories.includes(selectedCategory));

        return matchesSearchTerm && matchesCategory;
    });

    return (
        <>
            <header className="header">
                <h1 className="page-title">MY MEAL PLANS</h1>
                <div className="search-controls">
                    <input
                        type="text"
                        placeholder="Search your meal plans..."
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
            </header>

            <div className="tabs">
                <button
                    className={`tab-button ${activeTab === 'UPLOADED' ? 'active' : ''}`}
                    onClick={() => setActiveTab('UPLOADED')}
                >
                    PUBLISHED
                </button>
                <button
                    className={`tab-button ${activeTab === 'PENDING_APPROVAL' ? 'active' : ''}`}
                    onClick={() => setActiveTab('PENDING_APPROVAL')}
                >
                    PENDING VERIFICATION
                </button>
                <button
                    className={`tab-button ${activeTab === 'REJECTED' ? 'active' : ''}`}
                    onClick={() => setActiveTab('REJECTED')}
                >
                    REJECTED
                </button>
            </div>

            <div className="meal-plans-grid">
                {filteredAndSearchedMealPlans.length > 0 ? (
                    filteredAndSearchedMealPlans.map(plan => (
                        <MealPlanCard
                            key={plan._id}
                            mealPlan={plan}
                            onClick={onSelectMealPlan}
                            onUpdateClick={onUpdateMealPlan}
                            onDeleteClick={onDeleteMealPlan}
                        />
                    ))
                ) : (
                    <p className="no-meal-plans-message">
                        No meal plans found for "{activeTab.replace(/_/g, ' ')}" with the current filters.
                    </p>
                )}
            </div>
        </>
    );
};



// --- Sidebar component ---
const Sidebar = ({ currentView, onNavigate, unreadCount, onLogout }) => {
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
                <div
                    className={`nav-item ${currentView === 'notifications' ? 'active' : ''}`}
                    onClick={() => onNavigate('notifications')}
                >
                    <i className="fas fa-bell"></i>
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <span className="notification-badge">{unreadCount}</span>
                    )}
                </div>
            </nav>
            <button className="logout-button" onClick={onLogout}>Log out</button>
        </div>
    );
};



// --- NutritionistDashboard Main Component ---
const NutritionistDashboard = ({ onLogout }) => {
    const [mealPlans, setMealPlans] = useState([]);
    const [activeTab, setActiveTab] = useState('PENDING_APPROVAL');
    const [currentView, setCurrentView] = useState('myMealPlans');
    const [selectedMealPlan, setSelectedMealPlan] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    const [notifications, setNotifications] = useState([]);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

    const [allCategories, setAllCategories] = useState([]);

    const [currentNutritionistId, setCurrentNutritionistId] = useState(null);
    const [currentNutritionistName, setCurrentNutritionistName] = useState(null);

    // Effect to get the current user's data from AuthService on component mount
    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user && user.role === 'nutritionist') {
            setCurrentNutritionistId(user.uid);
            setCurrentNutritionistName(user.name);
            console.log("Nutritionist ID from AuthService:", user.uid);
            console.log("Nutritionist Name from AuthService:", user.name);
        } else {
            console.warn("No nutritionist user data found in localStorage or user is not a nutritionist. Logging out or redirecting.");
            onLogout();
        }
    }, [onLogout]);

    // Function to fetch meal plans from Firestore for the current nutritionist
    const fetchMealPlans = useCallback(async () => {
        if (!currentNutritionistId) {
            console.warn("Cannot fetch meal plans: Nutritionist ID is not available yet.");
            return;
        }

        console.log(`Fetching meal plans from Firestore for Nutritionist ID: ${currentNutritionistId}`);

        try {
            const q = query(
                collection(db, 'meal_plans'),
                where('authorId', '==', currentNutritionistId)
            );
            const querySnapshot = await getDocs(q);
            const fetchedMealPlans = querySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));

            setMealPlans(fetchedMealPlans);
            const categories = [...new Set(fetchedMealPlans.flatMap(plan => plan.categories || []))];
            setAllCategories(categories);
            console.log("Meal plans fetched from Firestore:", fetchedMealPlans);
        } catch (error) {
            console.error('Error fetching meal plans from Firestore:', error);
            setMealPlans([]);
        }
    }, [currentNutritionistId]);

    // Effect to fetch and listen to Firestore notifications
    useEffect(() => {
        if (!currentNutritionistId) {
            console.warn("Cannot set up notification listener: Nutritionist ID is not available yet.");
            return;
        }

        console.log(`NutritionistDashboard: Setting up notification listener for ${currentNutritionistId}`);
        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('recipientId', '==', currentNutritionistId),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const fetchedNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotifications(fetchedNotifications);
            const unread = fetchedNotifications.filter(notif => !notif.isRead).length;
            setUnreadNotificationCount(unread);
            console.log("NutritionistDashboard: Fetched real-time notifications:", fetchedNotifications);
        }, (error) => {
            console.error("NutritionistDashboard: Error listening to notifications:", error);
            // This error indicates a missing index. You must create it in your Firebase console.
        });

        // Cleanup the listener on component unmount or when currentNutritionistId changes
        return () => {
            console.log("NutritionistDashboard: Unsubscribing from notifications listener.");
            unsubscribe();
        };
    }, [currentNutritionistId]);

    // Effect to trigger fetching when currentNutritionistId is set
    useEffect(() => {
        if (currentNutritionistId) {
            fetchMealPlans();
        }
    }, [currentNutritionistId, fetchMealPlans]);

    // --- CRUD Handlers ---

    const handleSelectMealPlan = (mealPlan) => {
        setSelectedMealPlan(mealPlans.find(plan => plan._id === mealPlan._id));
        setCurrentView('mealPlanDetail');
    };

    const handleUpdateMealPlan = (mealPlan) => {
        setSelectedMealPlan(mealPlans.find(plan => plan._id === mealPlan._id));
        setCurrentView('updateMealPlan');
    };

    const handleDeleteMealPlan = async (mealPlanId, imageFileName) => {
        if (!window.confirm("Are you sure you want to delete this meal plan? This action cannot be undone.")) {
            return;
        }

        try {
            if (imageFileName) {
                const imageRef = ref(storage, `meal_plan_images/${imageFileName}`);
                await deleteObject(imageRef);
                console.log(`Image ${imageFileName} deleted from Storage.`);
            }

            await deleteDoc(doc(db, 'meal_plans', mealPlanId));
            console.log(`Meal plan ${mealPlanId} deleted from Firestore.`);

            setMealPlans(prevPlans => prevPlans.filter(plan => plan._id !== mealPlanId));
            alert('Meal plan deleted successfully!');
        } catch (error) {
            console.error('Error deleting meal plan:', error);
            alert('Failed to delete meal plan: ' + error.message);
        }
    };

    const handleBack = () => {
        setSelectedMealPlan(null);
        setCurrentView('myMealPlans');
        fetchMealPlans();
    };

    const handleMealPlanSubmitted = () => {
        setCurrentView('myMealPlans');
        setActiveTab('PENDING_APPROVAL');
        fetchMealPlans();
    };

    // Function to mark a notification as read (DIRECTLY WITH FIRESTORE)
    const handleMarkNotificationAsRead = async (notificationId) => {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
            console.log(`Notification ${notificationId} marked as read in Firestore.`);
            // The onSnapshot listener will automatically update the state, no manual state update needed here for notifications
        } catch (error) {
            console.error('Error marking notification as read in Firestore:', error);
            alert('Failed to mark notification as read.');
        }
    };

    return (
        <div className="nutritionist-dashboard-page">
            <Sidebar
                currentView={currentView}
                onNavigate={setCurrentView}
                unreadCount={unreadNotificationCount}
                onLogout={onLogout}
            />
            <div className="main-content">
                {currentView === 'nutritionistProfile' && <NutritionistProfile />}

                {currentView === 'myMealPlans' && (
                    <MyMealPlansContent
                        mealPlans={mealPlans}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        onSelectMealPlan={handleSelectMealPlan}
                        onUpdateMealPlan={handleUpdateMealPlan}
                        onDeleteMealPlan={handleDeleteMealPlan}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        showCategoryDropdown={showCategoryDropdown}
                        setShowCategoryDropdown={setShowCategoryDropdown}
                        allCategories={allCategories}
                    />
                )}

                {currentView === 'createMealPlan' && (
                    <CreateMealPlan onMealPlanSubmitted={handleMealPlanSubmitted} />
                )}

                {currentView === 'mealPlanDetail' && selectedMealPlan && (
                    <MealPlanDetail
                        mealPlan={selectedMealPlan}
                        onBack={handleBack}
                    />
                )}

                {currentView === 'updateMealPlan' && selectedMealPlan && (
                    <UpdateMealPlan
                        mealPlan={selectedMealPlan}
                        onBack={handleBack}
                    />
                )}

                {currentView === 'notifications' && (
                    <NotificationList
                        notifications={notifications}
                        onMarkAsRead={handleMarkNotificationAsRead}
                    />
                )}
            </div>
        </div>
    );
};

export default NutritionistDashboard;