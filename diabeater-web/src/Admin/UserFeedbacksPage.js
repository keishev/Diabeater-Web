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

    // ENHANCED: Updated automation message
    const handleAutomateMarketingClick = () => {
        setModalMessage(
            "Are you sure you want to automatically select and approve up to 3 five-star feedbacks for the marketing website? " +
            "This will:\n" +
            "• Auto-approve selected 5-star feedbacks\n" +
            "• Feature them on the marketing website\n" +
            "• Remove any existing marketing features\n" +
            "• Select from unique users only"
        );
        setConfirmAction(() => async () => {
            const success = await automateMarketingFeedbacks();
            if (success) {
                setShowSuccessModal(true);
                setModalMessage("Automated marketing feedbacks updated successfully! Selected feedbacks have been auto-approved and featured on the marketing website.");
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
                <div className="automation-section">
                    <button
                        className="automate-marketing-button enhanced"
                        onClick={handleAutomateMarketingClick}
                    >
                        🚀 Smart Auto-Select & Approve for Marketing
                    </button>
                    <p className="automation-description">
                        Automatically selects up to 3 unique users with 5-star ratings, 
                        approves their feedback, and features them on the marketing website.
                    </p>
                </div>
                <div className="marketing-feedbacks-list">
                    {marketingFeedbacks.length > 0 ? (
                        marketingFeedbacks.map(feedback => (
                            <div key={feedback.id} className="marketing-feedback-item">
                                <div className="feedback-header">
                                    <strong>{feedback.userFirstName}</strong>
                                    <span className="auto-approved-badge">✓ Auto-Approved</span>
                                </div>
                                {renderStars(feedback.rating)}
                                <p className="feedback-message">"{feedback.message}"</p>
                                <div className="feedback-meta">
                                    <span className="status-badge">{feedback.status}</span>
                                    <span className="marketing-badge">Featured on Marketing</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-marketing-feedbacks">
                            <p>No feedbacks currently featured for marketing.</p>
                            <p className="suggestion">Use the Smart Auto-Select button above to automatically feature the best 5-star feedbacks!</p>
                        </div>
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
                            <tr key={feedback.id} className={feedback.displayOnMarketing ? 'featured-row' : ''}>
                                <td>
                                    {feedback.userFirstName}
                                    {feedback.displayOnMarketing && <span className="featured-indicator">⭐</span>}
                                </td>
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
                                        title={feedback.rating !== 5 ? "Only 5-star feedbacks can be featured" : ""}
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