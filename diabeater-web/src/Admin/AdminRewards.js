import React, { useState } from 'react';
import RewardModal from './RewardModal';
import './AdminRewards.css';
import './RewardModal.css';

const AdminRewards = () => {
    const [basicUserExpanded, setBasicUserExpanded] = useState(true);
    const [premiumUserExpanded, setPremiumUserExpanded] = useState(true);

    const [showRewardModal, setShowRewardModal] = useState(false);
    const [currentRewardForModal, setCurrentRewardForModal] = useState(null);
    const [modalUserType, setModalUserType] = useState(null);
    const [isModalEditing, setIsModalEditing] = useState(false);

    // Dummy data for available basic user rewards (items that can be added)
    const availableBasicRewards = [
        { id: 'b1', name: 'Glucose Prediction' },
        { id: 'b2', name: 'View Graph Correlation' },
        { id: 'b3', name: 'Meal Logging with Photo' },
        { id: 'b4', name: 'Meal Logging with Barcode Scanning' },
        { id: 'b5', name: 'Glucose Logging with Device Photo' },
        { id: 'b6', name: 'Log Meal Plan into Diary' },
    ];

    // Dummy data for available premium user rewards (items that can be added)
    const availablePremiumRewards = [
        { id: 'p1', reward: 'Subscription Discount' },
        { id: 'p2', reward: 'Premium Content Access' },
        { id: 'p3', reward: 'Exclusive Recipe Pack' },
    ];

    // State to hold the rewards that have been "uploaded" or configured
    const [configuredBasicRewards, setConfiguredBasicRewards] = useState([
        { id: 'configured-b1', name: 'Glucose Prediction', quantity: 1, pointsNeeded: 0 },
        { id: 'configured-b2', name: 'View Graph Correlation', quantity: 3, pointsNeeded: 3 }, // Added for testing based on your screenshot
    ]);
    const [configuredPremiumRewards, setConfiguredPremiumRewards] = useState([
        { id: 'configured-p1', reward: 'Subscription Discount', discount: 10, pointsNeeded: 199 }, // Updated dummy data
    ]);

    const handleOpenModalToAdd = (reward, type) => {
        setModalUserType(type);
        // For adding, initialize quantity and pointsNeeded to empty for new input
        setCurrentRewardForModal({ ...reward, quantity: '', pointsNeeded: '' });
        setIsModalEditing(false);
        setShowRewardModal(true);
    };

    const handleOpenModalToEdit = (reward, type) => {
        setModalUserType(type);
        // For editing, ensure 'quantity' in modal refers to 'discount' for premium, otherwise 'quantity'
        setCurrentRewardForModal({
            ...reward,
            // When editing, 'quantity' in the modal represents the discount for premium rewards
            quantity: type === 'premium' ? reward.discount : reward.quantity,
            // 'pointsNeeded' is directly applicable to both
        });
        setIsModalEditing(true);
        setShowRewardModal(true);
    };


    const handleDeleteReward = (id, type) => {
        if (window.confirm('Are you sure you want to delete this reward?')) {
            if (type === 'basic') {
                setConfiguredBasicRewards(prev => prev.filter(r => r.id !== id));
            } else if (type === 'premium') {
                setConfiguredPremiumRewards(prev => prev.filter(r => r.id !== id));
            }
            alert('Reward deleted successfully!');
        }
    };

    const handleConfirmReward = (updatedReward) => {
        const { type, ...rewardData } = updatedReward;

        if (type === 'basic') {
            if (isModalEditing) {
                setConfiguredBasicRewards(prev =>
                    prev.map(r => r.id === rewardData.id ? { ...r, quantity: rewardData.quantity, pointsNeeded: rewardData.pointsNeeded } : r)
                );
                alert(`Basic Reward "${rewardData.name}" updated!`);
            } else {
                // Ensure a new unique ID and correct property ('name') for basic
                const newId = `configured-b-${Date.now()}`;
                const rewardToAdd = { id: newId, name: rewardData.name, quantity: rewardData.quantity, pointsNeeded: rewardData.pointsNeeded };
                // Prevent adding duplicate rewards based on name
                const isAlreadyAdded = configuredBasicRewards.some(r => r.name === rewardToAdd.name);
                if (!isAlreadyAdded) {
                    setConfiguredBasicRewards(prev => [...prev, rewardToAdd]);
                    alert(`Basic Reward "${rewardData.name}" added!`);
                } else {
                    alert(`Basic Reward "${rewardData.name}" is already configured.`);
                }
            }
        } else if (type === 'premium') {
            if (isModalEditing) {
                setConfiguredPremiumRewards(prev =>
                    prev.map(r => r.id === rewardData.id ? { ...r, discount: rewardData.quantity, pointsNeeded: rewardData.pointsNeeded } : r)
                );
                alert('Premium Reward updated successfully!');
            } else {
                // Ensure a new unique ID and correct property ('reward') for premium
                const newId = `configured-p-${Date.now()}`;
                const rewardToAdd = { id: newId, reward: rewardData.reward, discount: rewardData.quantity, pointsNeeded: rewardData.pointsNeeded };
                // Prevent adding duplicate rewards based on reward name
                const isAlreadyAdded = configuredPremiumRewards.some(r => r.reward === rewardToAdd.reward);
                if (!isAlreadyAdded) {
                    setConfiguredPremiumRewards(prev => [...prev, rewardToAdd]);
                    alert(`Premium Reward "${rewardData.reward}" added!`);
                } else {
                    alert(`Premium Reward "${rewardData.reward}" is already configured.`);
                }
            }
        }
        handleCloseModal();
    };

    const handleCloseModal = () => {
        setShowRewardModal(false);
        setCurrentRewardForModal(null);
        setModalUserType(null);
        setIsModalEditing(false);
    };

    // Helper to filter out already configured rewards from available lists
    const getFilteredAvailableRewards = (availableList, configuredList, keyName) => {
        return availableList.filter(
            availableItem => !configuredList.some(configuredItem => configuredItem[keyName] === availableItem[keyName])
        );
    };

    const filteredAvailableBasicRewards = getFilteredAvailableRewards(availableBasicRewards, configuredBasicRewards, 'name');
    const filteredAvailablePremiumRewards = getFilteredAvailableRewards(availablePremiumRewards, configuredPremiumRewards, 'reward');


    return (
        <div className="admin-rewards-container">
            <header className="admin-header">
                <h1 className="admin-page-title">REWARDS</h1>
            </header>

            <div className="rewards-content">
                <h2 className="rewards-section-title">IN-APP REWARDS</h2>

                {/* Basic User Section */}
                <div className="reward-category-card">
                    <div className="reward-category-header" onClick={() => setBasicUserExpanded(!basicUserExpanded)}>
                        <h3>Basic User</h3>
                        <span className="add-rewards-text">Add rewards into the app</span>
                        <i className={`fa-solid ${basicUserExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i> {/* FA6 class */}
                    </div>
                    {basicUserExpanded && (
                        <div className="reward-category-body">
                            <h4 className="rewards-subheader">Available Rewards:</h4>
                            {filteredAvailableBasicRewards.length > 0 ? (
                                filteredAvailableBasicRewards.map((reward) => (
                                    <div key={reward.id} className="reward-item clickable-reward-item">
                                        <span>{reward.name}</span>
                                        <button className="add-reward-button" onClick={() => handleOpenModalToAdd(reward, 'basic')}>
                                            <i className="fa-solid fa-plus"></i> {/* FA6 class */}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data-message">All available basic rewards have been configured.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Basic User Configured Rewards (Always visible, outside of the dropdown logic) */}
                <h4 className="rewards-subheader configured-rewards-header">Configured Rewards (Basic User):</h4>
                {configuredBasicRewards.length > 0 ? (
                    <table className="rewards-table">
                        <thead>
                            <tr>
                                <th>Reward</th>
                                <th>Quantity</th>
                                <th>Points Needed</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {configuredBasicRewards.map((reward) => (
                                <tr key={reward.id}>
                                    <td>{reward.name}</td>
                                    <td>{reward.quantity}</td>
                                    <td>{reward.pointsNeeded}</td>
                                    <td>
                                        {/* Basic User: ADDING Edit action here */}
                                        <i
                                            className="fa-solid fa-pen-to-square edit-icon" // FA6 class
                                            onClick={() => handleOpenModalToEdit(reward, 'basic')}
                                        ></i>
                                        <i
                                            className="fa-solid fa-trash-can delete-icon" // FA6 class
                                            onClick={() => handleDeleteReward(reward.id, 'basic')}
                                        ></i>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-data-message">No basic rewards configured yet.</p>
                )}


                {/* Premium User Section */}
                <div className="reward-category-card">
                    <div className="reward-category-header" onClick={() => setPremiumUserExpanded(!premiumUserExpanded)}>
                        <h3>Premium User</h3>
                        <span className="add-rewards-text">Add rewards into the app</span>
                        <i className={`fa-solid ${premiumUserExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i> {/* FA6 class */}
                    </div>
                    {premiumUserExpanded && (
                        <div className="reward-category-body">
                            <h4 className="rewards-subheader">Available Rewards:</h4>
                            {filteredAvailablePremiumRewards.length > 0 ? (
                                filteredAvailablePremiumRewards.map((reward) => (
                                    <div key={reward.id} className="reward-item clickable-reward-item">
                                        <span>{reward.reward}</span>
                                        <button className="add-reward-button" onClick={() => handleOpenModalToAdd(reward, 'premium')}>
                                            <i className="fa-solid fa-plus"></i> {/* FA6 class */}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data-message">All available premium rewards have been configured.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Premium User Configured Rewards (Always visible, outside of the dropdown logic) */}
                <h4 className="rewards-subheader configured-rewards-header">Configured Rewards (Premium User):</h4>
                <table className="rewards-table">
                    <thead>
                        <tr>
                            <th>Discount (%)</th>
                            <th>Reward</th>
                            <th>Points Needed</th> {/* Changed from 'Number of Redemption' */}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {configuredPremiumRewards.length > 0 ? (
                            configuredPremiumRewards.map((reward) => (
                                <tr key={reward.id}>
                                    <td>{reward.discount}</td>
                                    <td>{reward.reward}</td>
                                    <td>{reward.pointsNeeded}</td>
                                    <td>
                                        {/* Premium User: Edit and Delete actions */}
                                        <i
                                            className="fa-solid fa-pen-to-square edit-icon" // FA6 class
                                            onClick={() => handleOpenModalToEdit(reward, 'premium')}
                                        ></i>
                                        <i
                                            className="fa-solid fa-trash-can delete-icon" // FA6 class
                                            onClick={() => handleDeleteReward(reward.id, 'premium')}
                                        ></i>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="no-data-message">No premium rewards configured yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <RewardModal
                show={showRewardModal}
                onClose={handleCloseModal}
                onConfirm={handleConfirmReward}
                rewardData={currentRewardForModal}
                rewardType={modalUserType}
                isEditing={isModalEditing}
            />
        </div>
    );
};

export default AdminRewards;