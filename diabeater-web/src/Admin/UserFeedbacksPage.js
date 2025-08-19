import React, { useState, useEffect } from 'react';
import ConfirmationModal from './components/ConfirmationModal';
import SuccessModal from './components/SuccessModal';
import useUserFeedbackViewModel from '../ViewModels/UserFeedbackViewModel'; 
import './UserFeedbacksPage.css';

const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
        if (i < rating) {
            stars.push(<span key={i} className="star filled">&#9733;</span>); 
        } else {
            stars.push(<span key={i} className="star">&#9734;</span>); 
        }
    }
    return <div className="stars-container">{stars}</div>;
};

function UserFeedbacksPage() {
    const {
        feedbacks,
        marketingFeedbacks,
        loading,
        error,
        toggleDisplayOnMarketing,
        automateMarketingFeedbacks,
        fetchFeedbacks
    } = useUserFeedbackViewModel();

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedFeedbackId, setSelectedFeedbackId] = useState(null);
    const [modalMessage, setModalMessage] = useState("");
    const [confirmAction, setConfirmAction] = useState(() => () => {}); 

    const handleToggleMarketingClick = (id, currentDisplayStatus) => {
        setSelectedFeedbackId(id);
        setModalMessage(
            currentDisplayStatus
                ? "Are you sure you want to remove this feedback from the marketing website?"
                : "Are you sure you want to feature this feedback on the marketing website?"
        );
        setConfirmAction(() => async () => {
            const success = await toggleDisplayOnMarketing(id, currentDisplayStatus);
            if (success) {
                setShowSuccessModal(true);
                setModalMessage(
                    currentDisplayStatus
                        ? "Feedback removed from marketing."
                        : "Feedback featured on marketing."
                );
            } else {
                alert("Failed to update marketing status."); 
            }
        });
        setShowConfirmModal(true);
    };

    const handleAutomateMarketingClick = () => {
        setModalMessage("Are you sure you want to automatically feature up to 3 five-star compliment feedbacks on the marketing website?");
        setConfirmAction(() => async () => {
            const success = await automateMarketingFeedbacks();
            if (success) {
                setShowSuccessModal(true);
                setModalMessage("Automated marketing feedbacks featured successfully.");
            } else {
                alert("Failed to automate marketing feedbacks.");
            }
        });
        setShowConfirmModal(true);
    };

    const confirmActionAndCloseModal = () => {
        confirmAction();
        setShowConfirmModal(false);
    };

    const cancelAction = () => {
        setShowConfirmModal(false);
        setSelectedFeedbackId(null);
    };

    const handleSuccessOk = () => {
        setShowSuccessModal(false);
        setSelectedFeedbackId(null);
    };

    if (loading) {
        return <div className="user-feedbacks-page">Loading feedbacks...</div>;
    }

    if (error) {
        return <div className="user-feedbacks-page error">Error: {error.message}</div>;
    }

    return (
        <div className="user-feedbacks-page">
            <h1 className="feedbacks-main-title">USER FEEDBACK</h1>

            <div className="marketing-section">
                <h2>Featured Marketing Feedbacks</h2>
                <button
                    className="automate-marketing-button"
                    onClick={handleAutomateMarketingClick}
                >
                    Auto-Feature 5-Star Compliment Feedbacks (Max 3)
                </button>
                <div className="marketing-feedbacks-list">
                    {marketingFeedbacks.length > 0 ? (
                        marketingFeedbacks.map(feedback => (
                            <div key={feedback.id} className="marketing-feedback-item">
                                <p><strong>{feedback.userFirstName}</strong></p>
                                {renderStars(feedback.rating)}
                                <p>"{feedback.message}"</p>
                                <p><small>Category: {feedback.category || 'N/A'}</small></p>
                            </div>
                        ))
                    ) : (
                        <p>No 5-star compliment feedbacks currently featured for marketing.</p>
                    )}
                </div>
            </div>

            <div className="feedbacks-table-container">
                <table className="feedbacks-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Feedback</th>
                            <th>Rating</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Display on Marketing</th>
                        </tr>
                    </thead>
                    <tbody>
                        {feedbacks.map((feedback) => (
                            <tr key={feedback.id}>
                                <td>{feedback.userFirstName}</td>
                                <td>{feedback.message}</td>
                                <td>{renderStars(feedback.rating)}</td>
                                <td>{feedback.category || 'N/A'}</td>
                                <td>{feedback.status || 'N/A'}</td>
                                <td className="publish-cell">
                                    <button
                                        className={`toggle-marketing-button ${feedback.displayOnMarketing ? 'active' : ''}`}
                                        onClick={() => handleToggleMarketingClick(feedback.id, feedback.displayOnMarketing)}
                                        disabled={

                                            (!feedback.displayOnMarketing && marketingFeedbacks.length >= 3)
                                        }
                                        title={
                                            (!feedback.displayOnMarketing && marketingFeedbacks.length >= 3)
                                                ? "Maximum 3 feedbacks can be featured"
                                                : ""
                                        }
                                    >
                                        {feedback.displayOnMarketing ? "Remove from Marketing" : "Feature on Marketing"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                message={modalMessage}
                onConfirm={confirmActionAndCloseModal}
                onCancel={cancelAction}
                isVisible={showConfirmModal}
            />

            {/* Success Modal */}
            <SuccessModal
                message={modalMessage}
                onOk={handleSuccessOk}
                isVisible={showSuccessModal}
            />
        </div>
    );
}

export default UserFeedbacksPage;