// src/Admin/UserFeedbacksPage.js
import React, { useState } from 'react';
import ConfirmationModal from './components/ConfirmationModal';
import SuccessModal from './components/SuccessModal'; // Import the new success modal
import './UserFeedbacksPage.css'; // Create this CSS file next

function UserFeedbacksPage() {
    // Hardcoded feedback data (in a real app, this would come from an API)
    const [feedbacks, setFeedbacks] = useState([
        {
            id: 1,
            name: "Beatrice Lim",
            feedback: "Simple, clean, and effective. Thank you for creating something so helpful for diabetics",
            status: "Approved" // 'Approved' or 'Pending'
        },
        {
            id: 2,
            name: "John Doe",
            feedback: "Please add more local foods to the food database.",
            status: "Pending"
        },
        {
            id: 3,
            name: "Rachel Allen",
            feedback: "Helpful, but would like to see more graphs and trends over time",
            status: "Pending"
        },
        {
            id: 4,
            name: "Beatrice Lim",
            feedback: "Simple, clean, and effective. Thank you for creating something so helpful for diabetics",
            status: "Approved"
        },
        // --- NEW FEEDBACK ENTRIES START HERE ---
        {
            id: 5,
            name: "Michael Chen",
            feedback: "The nutritionist support has been invaluable. Highly recommend the premium plan!",
            status: "Pending"
        },
        {
            id: 6,
            name: "Sophie Davis",
            feedback: "I love the gamification features! It makes managing my diabetes much more engaging.",
            status: "Pending"
        },
        {
            id: 7,
            name: "Chris Evans",
            feedback: "The meal plans are fantastic, very easy to follow and delicious recipes.",
            status: "Approved"
        },
        {
            id: 8,
            name: "Linda Wong",
            feedback: "User interface is intuitive, but sometimes data sync is a bit slow.",
            status: "Pending"
        },
        {
            id: 9,
            name: "Omar Sharif",
            feedback: "Great app for tracking glucose, detailed reports are very useful for my doctor.",
            status: "Approved"
        },
        {
            id: 10,
            name: "Grace Lee",
            feedback: "I wish there was a feature to connect with other users for peer support.",
            status: "Pending"
        },
        // --- NEW FEEDBACK ENTRIES END HERE ---
    ]);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedFeedbackId, setSelectedFeedbackId] = useState(null);

    const handleApproveClick = (id) => {
        setSelectedFeedbackId(id);
        setShowConfirmModal(true); // Show confirmation modal
    };

    const confirmPublish = () => {
        // Find the selected feedback and update its status
        setFeedbacks(prevFeedbacks =>
            prevFeedbacks.map(feedback =>
                feedback.id === selectedFeedbackId
                    ? { ...feedback, status: "Approved" }
                    : feedback
            )
        );
        setShowConfirmModal(false); // Close confirmation modal
        setShowSuccessModal(true); // Show success modal
        console.log(`Feedback ID ${selectedFeedbackId} has been published.`);
        // In a real application, you would send an API request here
        // to update the feedback status on the backend.
    };

    const cancelPublish = () => {
        setShowConfirmModal(false); // Close confirmation modal
        setSelectedFeedbackId(null);
    };

    const handleSuccessOk = () => {
        setShowSuccessModal(false); // Close success modal
        setSelectedFeedbackId(null);
    };

    return (
        <div className="user-feedbacks-page">
            <h1 className="feedbacks-main-title">USER FEEDBACK</h1>

            <div className="feedbacks-table-container">
                <table className="feedbacks-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Feedback</th>
                            <th>Publish to Website</th>
                        </tr>
                    </thead>
                    <tbody>
                        {feedbacks.map((feedback) => (
                            <tr key={feedback.id}>
                                <td>{feedback.name}</td>
                                <td>{feedback.feedback}</td>
                                <td className="publish-cell">
                                    {feedback.status === "Approved" ? (
                                        <span className="feedback-status approved">Approved</span>
                                    ) : (
                                        <button
                                            className="approve-button"
                                            onClick={() => handleApproveClick(feedback.id)}
                                        >
                                            Approve
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                message="Are you sure to publish this feedback to the marketing website??"
                onConfirm={confirmPublish}
                onCancel={cancelPublish}
                isVisible={showConfirmModal}
            />

            {/* Success Modal */}
            <SuccessModal
                message="Feedback has been published."
                onOk={handleSuccessOk}
                isVisible={showSuccessModal}
            />
        </div>
    );
}

export default UserFeedbacksPage;