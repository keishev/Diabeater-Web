// src/Admin/UserFeedbacksPage.js
import React, { useState, useEffect } from 'react';
import ConfirmationModal from './components/ConfirmationModal';
import SuccessModal from './components/SuccessModal';
import useUserFeedbackViewModel from '../ViewModels/UserFeedbackViewModel'; // Adjust path
import './UserFeedbacksPage.css';

// Helper function to render stars
const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
        if (i < rating) {
            stars.push(<span key={i} className="star filled">&#9733;</span>); // Filled star
        } else {
            stars.push(<span key={i} className="star">&#9734;</span>); // Empty star
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
        approveFeedback,
        toggleDisplayOnMarketing,
        automateMarketingFeedbacks,
        fetchFeedbacks,
        retrackFeedback // Added to allow manual refresh
    } = useUserFeedbackViewModel();

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedFeedbackId, setSelectedFeedbackId] = useState(null);
    const [modalMessage, setModalMessage] = useState("");
    const [confirmAction, setConfirmAction] = useState(() => () => {}); // To store the function to execute on confirm

    const handleApproveClick = (id) => {
        setSelectedFeedbackId(id);
        setModalMessage("Are you sure to publish this feedback to the website?");
        setConfirmAction(() => async () => {
            const success = await approveFeedback(id);
            if (success) {
                setShowSuccessModal(true);
                setModalMessage("Feedback has been published.");
            } else {
                alert("Failed to publish feedback."); // Basic error handling
            }
        });
        setShowConfirmModal(true);
    };

    const handleRetrackClick = (id) => {
        setSelectedFeedbackId(id);
        setModalMessage("Are you sure you want to revert this feedback to an 'Inbox' status? This will also remove it from the marketing website.");
        setConfirmAction(() => async () => {
            const success = await retrackFeedback(id);
            if (success) {
                setShowSuccessModal(true);
                setModalMessage("Feedback status has been changed to 'Inbox' and removed from marketing.");
            } else {
                alert("Failed to retrack feedback.");
            }
        });
        setShowConfirmModal(true);
    };

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
                alert("Failed to update marketing status."); // Basic error handling
            }
        });
        setShowConfirmModal(true);
    };

    const handleAutomateMarketingClick = () => {
        setModalMessage("Are you sure you want to automatically select up to 3 five-star feedbacks for the marketing website?");
        setConfirmAction(() => async () => {
            const success = await automateMarketingFeedbacks();
            if (success) {
                setShowSuccessModal(true);
                setModalMessage("Automated marketing feedbacks updated.");
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
                    Automate Marketing Feedbacks (Max 3, 5-star only)
                </button>
                <div className="marketing-feedbacks-list">
                    {marketingFeedbacks.length > 0 ? (
                        marketingFeedbacks.map(feedback => (
                            <div key={feedback.id} className="marketing-feedback-item">
                                <p><strong>{feedback.userFirstName}</strong></p>
                                {renderStars(feedback.rating)}
                                <p>"{feedback.message}"</p>
                            </div>
                        ))
                    ) : (
                        <p>No 5-star feedbacks currently featured for marketing.</p>
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
                            <th>Status</th>
                            <th>Action</th>
                            <th>Display on Marketing</th>
                        </tr>
                    </thead>
                    <tbody>
                        {feedbacks.map((feedback) => (
                            <tr key={feedback.id}>
                                <td>{feedback.userFirstName}</td>
                                <td>{feedback.message}</td>
                                <td>{renderStars(feedback.rating)}</td>
                                <td>
                                    <span className={`feedback-status ${feedback.status.toLowerCase()}`}>
                                        {feedback.status}
                                    </span>
                                </td>
                                <td className="action-cell">
                                    {feedback.status === "Approved" ? (
                                        <button 
                                            className="retrack-button"
                                            onClick={() => handleRetrackClick(feedback.id)}
                                        >
                                            Retrack
                                        </button>
                                    ) : (
                                        <button
                                            className="approve-button"
                                            onClick={() => handleApproveClick(feedback.id)}
                                        >
                                            Approve
                                        </button>
                                    )}
                                </td>
                                <td className="publish-cell">
                                    <button
                                        className={`toggle-marketing-button ${feedback.displayOnMarketing ? 'active' : ''}`}
                                        onClick={() => handleToggleMarketingClick(feedback.id, feedback.displayOnMarketing)}
                                        disabled={feedback.status !== "Approved" || feedback.rating !== 5} // Only allow 5-star approved feedbacks
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