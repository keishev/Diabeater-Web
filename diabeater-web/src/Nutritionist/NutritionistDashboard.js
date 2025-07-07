/* src/NutritionistDashboard.js */
import React, { useState, useEffect, useCallback } from 'react';
import './NutritionistDashboard.css';
import CreateMealPlan from './CreateMealPlan';
import NutritionistProfile from './NutritionistProfile';
import MealPlanDetail from './MealPlanDetail';
import UpdateMealPlan from './UpdateMealPlan';
import NotificationList from './NotificationList';

// Firebase Imports
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    onSnapshot,
    orderBy,
    serverTimestamp,
    addDoc // <--- Add this import
} from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import app from '../firebase'; // Your Firebase app instance
import AuthService from '../Services/AuthService';
const db = getFirestore(app);
const storage = getStorage(app);

// --- MealPlanCard component ---
const MealPlanCard = ({ mealPlan, onClick, onUpdateClick, onDeleteClick, onApproveClick, isAdmin }) => {
    // Determine displayed status: "UPLOADED" becomes "PUBLISHED" for the nutritionist view,
    // but actual status is used for internal logic (like showing "Approve" button).
    const displayStatus = mealPlan.status === 'UPLOADED' ? 'PUBLISHED' : mealPlan.status.replace(/_/g, ' ');
    const imageUrl = mealPlan.imageUrl || `/assetscopy/${mealPlan.imageFileName}`;

    // 🎯 NEW: Dynamic class based on mealPlan.status
    const cardClassName = `meal-plan-card meal-plan-card--${mealPlan.status.toLowerCase()}`;

    return (
        <div className={cardClassName} onClick={() => onClick(mealPlan)}> {/* Use the dynamic class here */}
            <img src={imageUrl} alt={mealPlan.name} className="meal-plan-image" />
            <div className="meal-plan-info">
                {/* 🎯 NEW: Wrapper for title and status */}
                <div className="meal-plan-header-content">
                    <h3 className="meal-plan-name">{mealPlan.name}</h3>
                    <span className={`meal-plan-status ${mealPlan.status}`}>Status: {displayStatus}</span>
                </div>

                {/* 🎯 NEW: Likes count directly inside meal-plan-info, perhaps above actions */}
                <span className="likes-count">
                    <i className="fa-solid fa-heart"></i> {mealPlan.likes || 0}
                </span>

                <div className="meal-plan-actions">
                    {/* Conditional rendering for nutritionist actions (update/delete) */}
                    {(mealPlan.status === 'UPLOADED' || mealPlan.status === 'REJECTED') && !isAdmin && (
                        <>
                            <button className="button-base update-button" onClick={(e) => { e.stopPropagation(); onUpdateClick(mealPlan); }}>UPDATE</button>
                            <button className="button-base delete-button" onClick={(e) => { e.stopPropagation(); onDeleteClick(mealPlan._id, mealPlan.imageFileName); }}>DELETE</button>
                        </>
                    )}
                    {/* Conditional rendering for admin actions (approve/reject/delete) */}
                    {isAdmin && mealPlan.status === 'PENDING_APPROVAL' && (
                        <button className="button-base approve-button" onClick={(e) => { e.stopPropagation(); onApproveClick(mealPlan._id, 'APPROVED', mealPlan.authorId); }}>APPROVE</button>
                    )}
                    {isAdmin && mealPlan.status !== 'PENDING_APPROVAL' && ( // Admins can delete any plan (even uploaded/approved ones if needed)
                            <button className="button-base delete-button" onClick={(e) => { e.stopPropagation(); onDeleteClick(mealPlan._id, mealPlan.imageFileName); }}>DELETE</button>
                    )}
                    {isAdmin && mealPlan.status === 'APPROVED' && (
                            <button className="button-base admin-reject-button" onClick={(e) => { e.stopPropagation(); onApproveClick(mealPlan._id, 'REJECTED', mealPlan.authorId); }}>REJECT</button>
                    )}
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
    onApproveMealPlan,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    showCategoryDropdown,
    setShowCategoryDropdown,
    allCategories,
    userRole
}) => {
    // Determine which tabs to show based on user role
    const getTabs = () => {
        if (userRole === 'admin') {
            return [
                { id: 'PENDING_APPROVAL', name: 'PENDING VERIFICATION' },
                { id: 'APPROVED', name: 'APPROVED' },
                { id: 'REJECTED', name: 'REJECTED' }
            ];
        } else { // Nutritionist
            return [
                { id: 'UPLOADED', name: 'PUBLISHED' },
                { id: 'PENDING_APPROVAL', name: 'PENDING VERIFICATION' },
                { id: 'REJECTED', name: 'REJECTED' }
            ];
        }
    };

    const tabs = getTabs();

    const filteredByTab = mealPlans.filter(plan => {
        // Admins see "APPROVED" instead of "UPLOADED" in their approved tab
        if (userRole === 'admin' && activeTab === 'APPROVED') {
            return plan.status === 'UPLOADED'; // Admins manage "UPLOADED" as "APPROVED"
        }
        return plan.status === activeTab;
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
                <h1 className="page-title">MEAL PLANS</h1>
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
            </header>

            <div className="tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.name}
                    </button>
                ))}
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
                            onApproveClick={onApproveMealPlan} // Pass the approve handler
                            isAdmin={userRole === 'admin'} // Pass isAdmin prop
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
const Sidebar = ({ currentView, onNavigate, unreadCount, onLogout, userRole }) => {
    return (
        <div className="sidebar">
            <div className="logo">
                <img src="/assetscopy/blood_drop_logo.png" alt="DiaBeater Logo" />
                <span className="logo-text">DiaBeater</span>
            </div>
            <nav className="navigation">
                {userRole === 'nutritionist' && (
                    <div
                        className={`nav-item ${currentView === 'nutritionistProfile' ? 'active' : ''}`}
                        onClick={() => onNavigate('nutritionistProfile')}
                    >
                        <i className="fas fa-user"></i>
                        <span>My Profile</span>
                    </div>
                )}
                <div
                    className={`nav-item ${currentView === 'myMealPlans' ? 'active' : ''}`}
                    onClick={() => onNavigate('myMealPlans')}
                >
                    <i className="fas fa-clipboard-list"></i>
                    <span>Meal Plans</span> {/* Renamed for broader use */}
                </div>
                {userRole === 'nutritionist' && (
                    <div
                        className={`nav-item ${currentView === 'createMealPlan' ? 'active' : ''}`}
                        onClick={() => onNavigate('createMealPlan')}
                    >
                        <i className="fas fa-plus-circle"></i>
                        <span>Create Meal Plan</span>
                    </div>
                )}
                {userRole === 'nutritionist' && ( // Only nutritionists get notifications for their plans
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
                )}
            </nav>
            <button className="logout-button" onClick={onLogout}>Log out</button>
        </div>
    );
};


// --- NutritionistDashboard Main Component ---
const NutritionistDashboard = ({ onLogout }) => {
    const [mealPlans, setMealPlans] = useState([]);
    // Default tab for nutritionists is PUBLISHED, for admins is PENDING_APPROVAL
    const [activeTab, setActiveTab] = useState('PENDING_APPROVAL'); // Changed default for admin-centric view
    const [currentView, setCurrentView] = useState('myMealPlans');
    const [selectedMealPlan, setSelectedMealPlan] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    const [notifications, setNotifications] = useState([]);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

    const [allCategories, setAllCategories] = useState([]);

    const [currentUserId, setCurrentUserId] = useState(null); // Use general userId
    const [currentUserRole, setCurrentUserRole] = useState(null); // Store user role
    const [currentUserName, setCurrentUserName] = useState(null);

    // Effect to get the current user's data from AuthService on component mount
    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUserId(user.uid);
            setCurrentUserRole(user.role);
            setCurrentUserName(user.name || user.username || user.email); // Fallback for name
            console.log("Current User ID from AuthService:", user.uid);
            console.log("Current User Role from AuthService:", user.role);

            // Set initial active tab based on role
            if (user.role === 'admin') {
                setActiveTab('PENDING_APPROVAL');
            } else {
                setActiveTab('UPLOADED');
            }

        } else {
            console.warn("No user data found in localStorage. Logging out or redirecting.");
            onLogout();
        }
    }, [onLogout]);

    // Function to fetch meal plans from Firestore based on user role
    const fetchMealPlans = useCallback(async () => {
        if (!currentUserId || !currentUserRole) {
            console.warn("Cannot fetch meal plans: User ID or Role is not available yet.");
            return;
        }

        console.log(`Fetching meal plans from Firestore for User ID: ${currentUserId}, Role: ${currentUserRole}`);

        try {
            let q;
            if (currentUserRole === 'admin') {
                // Admins see all meal plans
                q = query(collection(db, 'meal_plans'));
            } else {
                // Nutritionists see only their own meal plans
                q = query(
                    collection(db, 'meal_plans'),
                    where('authorId', '==', currentUserId)
                );
            }

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
    }, [currentUserId, currentUserRole]);

    // Effect to fetch and listen to Firestore notifications
    useEffect(() => {
        if (!currentUserId || currentUserRole !== 'nutritionist') {
            console.warn("Notifications are only for nutritionists. Skipping listener setup.");
            setNotifications([]);
            setUnreadNotificationCount(0);
            return;
        }

        console.log(`Setting up notification listener for nutritionist: ${currentUserId}`);
        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('recipientId', '==', currentUserId),
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
            console.log("Fetched real-time notifications:", fetchedNotifications);
        }, (error) => {
            console.error("Error listening to notifications:", error);
        });

        return () => {
            console.log("Unsubscribing from notifications listener.");
            unsubscribe();
        };
    }, [currentUserId, currentUserRole]);


    // Effect to trigger fetching when currentUserId or currentUserRole is set
    useEffect(() => {
        if (currentUserId && currentUserRole) {
            fetchMealPlans();
        }
    }, [currentUserId, currentUserRole, fetchMealPlans]); // Dependency array includes fetchMealPlans

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

            // Also delete any associated notifications
            const notificationsQuery = query(
                collection(db, 'notifications'),
                where('mealPlanId', '==', mealPlanId)
            );
            const notificationSnapshot = await getDocs(notificationsQuery);
            notificationSnapshot.docs.forEach(async (nDoc) => {
                await deleteDoc(doc(db, 'notifications', nDoc.id));
                console.log(`Deleted associated notification: ${nDoc.id}`);
            });

            setMealPlans(prevPlans => prevPlans.filter(plan => plan._id !== mealPlanId));
            alert('Meal plan deleted successfully!');
        } catch (error) {
            console.error('Error deleting meal plan:', error);
            alert('Failed to delete meal plan: ' + error.message);
        }
    };

    const handleApproveOrRejectMealPlan = async (mealPlanId, newStatus, authorId) => {
        if (!currentUserId || currentUserRole !== 'admin') {
            alert('Only administrators can approve/reject meal plans.');
            return;
        }

        const actionText = newStatus === 'APPROVED' ? 'approve' : 'reject';
        if (!window.confirm(`Are you sure you want to ${actionText} this meal plan?`)) {
            return;
        }

        try {
            const mealPlanRef = doc(db, 'meal_plans', mealPlanId);
            await updateDoc(mealPlanRef, {
                status: newStatus,
                adminApprovedBy: currentUserName, // Store admin's name
                adminApprovedById: currentUserId, // Store admin's UID
                approvedAt: serverTimestamp()
            });
            console.log(`Meal plan ${mealPlanId} status updated to ${newStatus}.`);

            // Send notification to the meal plan author
            await addDoc(collection(db, 'notifications'), {
                recipientId: authorId,
                type: 'MEAL_PLAN_STATUS_UPDATE',
                message: `Your meal plan "${mealPlans.find(p => p._id === mealPlanId)?.name}" has been ${newStatus === 'APPROVED' ? 'approved' : 'rejected'}.`,
                isRead: false,
                timestamp: serverTimestamp(),
                mealPlanId: mealPlanId, // Link to the meal plan
                status: newStatus, // Include status for specific handling in notifications
                adminId: currentUserId, // Admin who took action
                adminName: currentUserName // Admin's name
            });
            console.log(`Notification sent to nutritionist ${authorId}.`);

            alert(`Meal plan ${actionText}d successfully!`);
            fetchMealPlans(); // Re-fetch meal plans to update the list
        } catch (error) {
            console.error(`Error ${actionText}ing meal plan:`, error);
            alert(`Failed to ${actionText} meal plan: ` + error.message);
        }
    };


    const handleBack = () => {
        setSelectedMealPlan(null);
        setCurrentView('myMealPlans');
        fetchMealPlans(); // Re-fetch data when navigating back
    };

    const handleMealPlanSubmitted = () => {
        setCurrentView('myMealPlans');
        setActiveTab('PENDING_APPROVAL'); // New plans go to pending
        fetchMealPlans(); // Re-fetch meal plans including the new one
    };

    // Function to mark a notification as read (DIRECTLY WITH FIRESTORE)
    const handleMarkNotificationAsRead = async (notificationId) => {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
            console.log(`Notification ${notificationId} marked as read in Firestore.`);
            // The onSnapshot listener will automatically update the state
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
                userRole={currentUserRole}
            />
            <div className="main-content">
                {currentView === 'nutritionistProfile' && currentUserRole === 'nutritionist' && <NutritionistProfile />}

                {currentView === 'myMealPlans' && (
                    <MyMealPlansContent
                        mealPlans={mealPlans}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        onSelectMealPlan={handleSelectMealPlan}
                        onUpdateMealPlan={handleUpdateMealPlan}
                        onDeleteMealPlan={handleDeleteMealPlan}
                        onApproveMealPlan={handleApproveOrRejectMealPlan} // Pass to content component
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        showCategoryDropdown={showCategoryDropdown}
                        setShowCategoryDropdown={setShowCategoryDropdown}
                        allCategories={allCategories}
                        userRole={currentUserRole} // Pass user role
                    />
                )}

                {currentView === 'createMealPlan' && currentUserRole === 'nutritionist' && (
                    <CreateMealPlan onMealPlanSubmitted={handleMealPlanSubmitted} />
                )}

                {currentView === 'mealPlanDetail' && selectedMealPlan && (
                    <MealPlanDetail
                        mealPlan={selectedMealPlan}
                        onBack={handleBack}
                        userRole={currentUserRole} // Pass user role to detail component if needed
                    />
                )}

                {currentView === 'updateMealPlan' && selectedMealPlan && (
                    <UpdateMealPlan
                        mealPlan={selectedMealPlan}
                        onBack={handleBack}
                    />
                )}

                {currentView === 'notifications' && currentUserRole === 'nutritionist' && (
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