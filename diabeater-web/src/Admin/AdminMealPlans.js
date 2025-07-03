// src/Admin/AdminMealPlans.js
import React, { useState, useEffect, useCallback } from 'react';
import './AdminMealPlans.css';

// Firebase Imports
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore'; // Added addDoc and serverTimestamp
import { db } from '../firebase'; // Import db from your firebase.js

// apiService is no longer needed for notifications if you have no Node.js backend
// import apiService from '../Services/apiService';

const AdminMealPlans = ({ onViewDetails }) => {
    const [mealPlans, setMealPlans] = useState([]);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedPlanToReject, setSelectedPlanToReject] = useState(null);
    const [selectedRejectReason, setSelectedRejectReason] = useState('');
    const [otherReasonText, setOtherReasonText] = useState('');

    const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
    const [selectedPlanToApprove, setSelectedPlanToApprove] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [allCategories, setAllCategories] = useState([]);

    const rejectionReasons = [
        'Incomplete information provided',
        'Inaccurate nutritional data',
        'Contains allergens not declared',
        'Poor image quality',
        'Does not meet dietary guidelines',
        'Other (please specify)'
    ];

    const fetchMealPlansForAdmin = useCallback(async () => {
        try {
            console.log("AdminMealPlans: Fetching meal plans from Firestore for admin review...");
            const q = query(
                collection(db, 'meal_plans'),
                where('status', '==', 'PENDING_APPROVAL')
            );
            const querySnapshot = await getDocs(q);
            const fetchedMealPlans = querySnapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));

            setMealPlans(fetchedMealPlans);

            const categories = [...new Set(fetchedMealPlans.flatMap(plan => plan.categories || []))];
            setAllCategories(categories.sort());

            console.log("AdminMealPlans: Fetched pending meal plans:", fetchedMealPlans);
        } catch (error) {
            console.error('AdminMealPlans: Error fetching meal plans from Firestore:', error);
            setMealPlans([]);
            setAllCategories([]);
        }
    }, []);

    useEffect(() => {
        fetchMealPlansForAdmin();
    }, [fetchMealPlansForAdmin]);

    // --- APPROVE MODAL LOGIC ---
    const handleApproveClick = (id) => {
        setSelectedPlanToApprove(id);
        setShowApproveConfirmModal(true);
    };

    const handleApproveConfirm = async () => {
        try {
            console.log(`AdminMealPlans: Approving meal plan ${selectedPlanToApprove} in Firestore...`);
            const mealPlanRef = doc(db, 'meal_plans', selectedPlanToApprove);
            await updateDoc(mealPlanRef, { status: 'UPLOADED' });

            console.log(`Meal Plan ${selectedPlanToApprove} Approved in Firestore!`);
            setShowApproveConfirmModal(false);
            setSelectedPlanToApprove(null);

            const approvedPlanDoc = await getDoc(mealPlanRef);
            if (approvedPlanDoc.exists()) {
                const approvedPlanData = approvedPlanDoc.data();
                // ⭐ Create Approval Notification in Firestore
                await addDoc(collection(db, 'notifications'), {
                    recipientId: approvedPlanData.authorId,
                    type: 'mealPlanApproval',
                    message: `Your meal plan "${approvedPlanData.name}" has been APPROVED.`,
                    mealPlanId: approvedPlanDoc.id,
                    isRead: false,
                    timestamp: serverTimestamp() // Use Firestore server timestamp
                });
                console.log(`Approval notification created in Firestore for meal plan ${approvedPlanDoc.id}`);
            }

            fetchMealPlansForAdmin();

        } catch (error) {
            console.error('AdminMealPlans: Error approving meal plan or creating notification:', error);
            alert('Failed to approve meal plan. Please try again.');
            setShowApproveConfirmModal(false);
            setSelectedPlanToApprove(null);
        }
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

    const handleRejectSubmit = async () => {
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

        try {
            console.log(`AdminMealPlans: Rejecting meal plan ${selectedPlanToReject} in Firestore. Reason: ${finalReason}`);
            const mealPlanRef = doc(db, 'meal_plans', selectedPlanToReject);
            await updateDoc(mealPlanRef, { status: 'REJECTED', rejectionReason: finalReason });

            console.log(`Meal Plan ${selectedPlanToReject} Rejected in Firestore! Reason: ${finalReason}`);
            setShowRejectModal(false);
            setSelectedPlanToReject(null);
            setSelectedRejectReason('');
            setOtherReasonText('');

            const rejectedPlanDoc = await getDoc(mealPlanRef);
            if (rejectedPlanDoc.exists()) {
                const rejectedPlanData = rejectedPlanDoc.data();
                // ⭐ Create Rejection Notification in Firestore
                await addDoc(collection(db, 'notifications'), {
                    recipientId: rejectedPlanData.authorId,
                    type: 'mealPlanRejection',
                    message: `Your meal plan "${rejectedPlanData.name}" has been REJECTED. Reason: ${finalReason}`,
                    mealPlanId: rejectedPlanDoc.id,
                    rejectionReason: finalReason,
                    isRead: false,
                    timestamp: serverTimestamp() // Use Firestore server timestamp
                });
                console.log(`Rejection notification created in Firestore for meal plan ${rejectedPlanDoc.id}`);
            }

            fetchMealPlansForAdmin();

        } catch (error) {
            console.error('AdminMealPlans: Error rejecting meal plan or creating notification:', error);
            alert('Failed to reject meal plan. Please try again.');
            setShowRejectModal(false);
            setSelectedPlanToReject(null);
            setSelectedRejectReason('');
            setOtherReasonText('');
        }
    };

    const handleRejectCancel = () => {
        setShowRejectModal(false);
        setSelectedPlanToReject(null);
        setSelectedRejectReason('');
        setOtherReasonText('');
    };

    const handleImageClick = (id) => {
        console.log('Image clicked for ID:', id);
        const plan = mealPlans.find(p => p._id === id);
        if (onViewDetails && plan) {
            onViewDetails(plan);
        }
    };

    const filteredMealPlans = mealPlans.filter(plan => {
        const matchesSearchTerm = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (plan.author && plan.author.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === '' || (plan.categories && plan.categories.includes(selectedCategory));
        return matchesSearchTerm && matchesCategory;
    });

    return (
        <div className="admin-meal-plans-container">
            <div className="admin-meal-plans-header">
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
                        <div key={plan._id} className="meal-plan-card">
                            <img
                                src={plan.imageUrl || `/assetscopy/${plan.imageFileName}`}
                                alt={plan.name}
                                className="meal-plan-card-image"
                                onClick={() => handleImageClick(plan._id)}
                            />
                            <div className="meal-plan-card-info">
                                <h3 className="meal-plan-card-name">{plan.name}</h3>
                                <p className="meal-plan-card-author">by {plan.author || 'N/A'}</p>
                            </div>
                            <div className="meal-plan-card-actions">
                                <button
                                    className="approve-button"
                                    onClick={() => handleApproveClick(plan._id)}
                                >
                                    VERIFY
                                </button>
                                <button
                                    className="reject-button"
                                    onClick={() => handleRejectClick(plan._id)}
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

            {/* Rejection Reasons Modal */}
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

            {/* Approve Confirmation Modal */}
            {showApproveConfirmModal && (
                <div className="approve-modal-overlay">
                    <div className="approve-modal-content">
                        <h2 className="modal-title">Accept Meal Plan</h2>
                        <p>Are you sure you want to approve this meal plan?</p>
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

export default AdminMealPlans;