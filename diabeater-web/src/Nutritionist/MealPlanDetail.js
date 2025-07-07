// src/Nutritionist/MealPlanDetail.js
import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import mealPlanViewModel from '../ViewModels/MealPlanViewModel'; // Directly import the singleton
import './MealPlanDetail.css';

const MealPlanDetail = observer(({ onBack, userRole, currentUserId }) => {
    // Destructure directly from the ViewModel
    const { loading, error, selectedMealPlanForDetail, loadMealPlanDetails, deleteMealPlan } = mealPlanViewModel;

    useEffect(() => {
        // No direct fetching here, assuming selectedMealPlanForDetail is set by parent via ViewModel action.
        // If this component were to be directly navigated to via a route with an ID,
        // you would pass that ID as a prop and use it to call loadMealPlanDetails.
        // E.g., const { mealPlanId } = useParams();
        // useEffect(() => { if (mealPlanId) mealPlanViewModel.loadMealPlanDetails(mealPlanId); }, [mealPlanId]);
    }, []);

    const handleDeleteClick = async () => {
        if (!selectedMealPlanForDetail) return;
        const success = await deleteMealPlan(selectedMealPlanForDetail._id, selectedMealPlanForDetail.imageFileName);
        if (success) {
            onBack();
        }
    };

    if (loading) {
        return <div className="loading-message">Loading meal plan details...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    if (!selectedMealPlanForDetail) {
        return <div className="no-detail-selected">No meal plan selected for detail.</div>;
    }

    const isNutritionistAuthor = userRole === 'nutritionist' && currentUserId === selectedMealPlanForDetail.authorId;
    const isAdmin = userRole === 'admin';

    return (
        <div className="meal-plan-detail-overlay">
            <div className="meal-plan-detail-content">
                <button className="back-button" onClick={onBack}>← Back to Meal Plans</button>
                <div className="detail-header">
                    <h2>{selectedMealPlanForDetail.name}</h2>
                    {selectedMealPlanForDetail.author && (
                        <p className="detail-author">By: {selectedMealPlanForDetail.author}</p>
                    )}
                    <p className="detail-status">Status: <span>{selectedMealPlanForDetail.status}</span></p>
                    {selectedMealPlanForDetail.rejectionReason && (
                         <p className="detail-rejection-reason">Rejection Reason: <span>{selectedMealPlanForDetail.rejectionReason}</span></p>
                    )}
                </div>

                <div className="detail-body">
                    {selectedMealPlanForDetail.imageUrl && (
                        <img src={selectedMealPlanForDetail.imageUrl} alt={selectedMealPlanForDetail.name} className="detail-image" />
                    )}

                    <div className="detail-sections">
                        <section className="detail-section">
                            <h3>Description</h3>
                            <p>{selectedMealPlanForDetail.description}</p>
                        </section>

                        <section className="detail-section">
                            <h3>Categories</h3>
                            <p>{selectedMealPlanForDetail.categories && selectedMealPlanForDetail.categories.join(', ')}</p>
                        </section>

                        <section className="detail-section">
                            <h3>Target Calories</h3>
                            <p>{selectedMealPlanForDetail.targetCalories} kcal</p>
                        </section>

                        <section className="detail-section">
                            <h3>Meal Types</h3>
                            <ul>
                                {selectedMealPlanForDetail.mealType && selectedMealPlanForDetail.mealType.map((type, index) => (
                                    <li key={index}>{type}</li>
                                ))}
                            </ul>
                        </section>

                        <section className="detail-section">
                            <h3>Ingredients</h3>
                            <ul>
                                {selectedMealPlanForDetail.ingredients && selectedMealPlanForDetail.ingredients.map((ingredient, index) => (
                                    <li key={index}>{ingredient}</li>
                                ))}
                            </ul>
                        </section>

                        <section className="detail-section">
                            <h3>Instructions</h3>
                            <ol>
                                {selectedMealPlanForDetail.instructions && selectedMealPlanForDetail.instructions.map((instruction, index) => (
                                    <li key={index}>{instruction}</li>
                                ))}
                            </ol>
                        </section>
                    </div>
                </div>

                {(isNutritionistAuthor || isAdmin) && (selectedMealPlanForDetail.status !== 'APPROVED') && (
                    <div className="detail-actions">
                        {(isNutritionistAuthor && selectedMealPlanForDetail.status !== 'APPROVED') && (
                            <button
                                className="delete-button"
                                onClick={handleDeleteClick}
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Delete Meal Plan'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

export default MealPlanDetail;