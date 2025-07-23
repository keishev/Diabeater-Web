// src/AdminRewards.js
import React, { useState, useEffect, useCallback } from 'react';
import RewardModal from './RewardModal';
import './AdminRewards.css';
import './RewardModal.css';

// Import the ViewModel instance
import adminRewardsViewModel from '../ViewModels/AdminRewardsViewModel';

const AdminRewards = () => {
    // UI state (collapsed/expanded sections, modal visibility)
    const [basicUserExpanded, setBasicUserExpanded] = useState(true);
    const [premiumUserExpanded, setPremiumUserExpanded] = useState(true);

    const [showRewardModal, setShowRewardModal] = useState(false);
    const [currentRewardForModal, setCurrentRewardForModal] = useState(null);
    const [modalUserType, setModalUserType] = useState(null);
    const [isModalEditing, setIsModalEditing] = useState(false);

    // Data states (will be populated from ViewModel)
    const [availableBasicRewards, setAvailableBasicRewards] = useState([]);
    const [availablePremiumRewards, setAvailablePremiumRewards] = useState([]);
    const [configuredBasicRewards, setConfiguredBasicRewards] = useState([]);
    const [configuredPremiumRewards, setConfiguredPremiumRewards] = useState([]);

    // Loading and error states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Function to fetch all rewards from the ViewModel
    const fetchAllRewards = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all data using the ViewModel's methods
            const availableBasic = await adminRewardsViewModel.getAvailableBasicRewards();
            const availablePremium = await adminRewardsViewModel.getAvailablePremiumRewards();
            const configuredBasic = await adminRewardsViewModel.getConfiguredBasicRewards();
            const configuredPremium = await adminRewardsViewModel.getConfiguredPremiumRewards();

            // Update local component state
            setAvailableBasicRewards(availableBasic);
            setAvailablePremiumRewards(availablePremium);
            setConfiguredBasicRewards(configuredBasic);
            setConfiguredPremiumRewards(configuredPremium);

        } catch (err) {
            console.error("Error fetching rewards:", err);
            setError(err.message || "Failed to load rewards. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    // useEffect to run fetchAllRewards on component mount
    useEffect(() => {
        fetchAllRewards();
    }, [fetchAllRewards]);

    const handleOpenModalToAdd = (reward, type) => {
        setCurrentRewardForModal({
            id: reward.id, 
            name: reward.name,
            reward: reward.name, 
            quantity: '', 
            discount: '', 
            pointsNeeded: '',
            featureKey: reward.featureKey,
            description: reward.description,
        });

        setModalUserType(type);
        setIsModalEditing(false);
        setShowRewardModal(true);
    };

    const handleOpenModalToEdit = (reward, type) => {
        setModalUserType(type);
        setCurrentRewardForModal({
            ...reward,
            quantity: type === 'premium' ? reward.discount : reward.quantity,
            reward: type === 'premium' ? reward.reward : reward.name,
            description: reward.description,
        });
        setIsModalEditing(true);
        setShowRewardModal(true);
    };

    const handleDeleteReward = async (id, type) => {
        if (window.confirm('Are you sure you want to delete this reward?')) {
            setLoading(true);
            setError(null);
            try {
                await adminRewardsViewModel.deleteReward(id, type);
                alert('Reward deleted successfully!');
                await fetchAllRewards(); // Re-fetch all data 
            } catch (err) {
                console.error("Error deleting reward:", err);
                setError(err.message || "Failed to delete reward.");
                alert(err.message || "Failed to delete reward.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleConfirmReward = async (updatedReward) => {
        const { type, ...rewardData } = updatedReward;
        setLoading(true);
        setError(null);
        try {
            if (isModalEditing) {
                if (type === 'basic') {
                     await adminRewardsViewModel.updateReward(rewardData.id, 'basic', {
                        quantity: rewardData.quantity,
                        pointsNeeded: rewardData.pointsNeeded
                    });
                } else if (type === 'premium') {
                     await adminRewardsViewModel.updateReward(rewardData.id, 'premium', {
                        discount: rewardData.quantity, 
                        pointsNeeded: rewardData.pointsNeeded
                    });
                }
                alert(`Reward updated successfully!`);
            } else {
                // For adding a new reward from available list
                // We pass the name/reward and the quantity/discount and points needed from the modal.
                if (type === 'basic') {
                    await adminRewardsViewModel.addReward({
                        name: rewardData.name, // Original name from AvailableReward
                        quantity: rewardData.quantity,
                        pointsNeeded: rewardData.pointsNeeded,
                        featureKey: currentRewardForModal.featureKey,
                        description: currentRewardForModal.description,
                    }, 'basic');
                } else if (type === 'premium') {
                    await adminRewardsViewModel.addReward({
                        reward: rewardData.reward, // Original reward name from AvailableReward (used for premium type)
                        discount: rewardData.quantity, // quantity from modal is discount for premium
                        pointsNeeded: rewardData.pointsNeeded,
                        featureKey: currentRewardForModal.featureKey,
                        description: currentRewardForModal.description,
                    }, 'premium');
                }
                alert(`${rewardData.name || rewardData.reward} added successfully!`);
            }
            handleCloseModal();
            await fetchAllRewards(); // Re-fetch all data to update UI
        } catch (err) {
            console.error("Error confirming reward:", err);
            setError(err.message || "Failed to confirm reward.");
            alert(err.message || "Failed to confirm reward.");
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowRewardModal(false);
        setCurrentRewardForModal(null);
        setModalUserType(null);
        setIsModalEditing(false);
    };

    return (
        <div className="admin-rewards-container">
            <header className="admin-header">
                <h1 className="admin-page-title">REWARDS</h1>
            </header>

            <div className="rewards-content">
                <h2 className="rewards-section-title">IN-APP REWARDS</h2>

                {loading && <p className="loading-message">Loading rewards...</p>}
                {error && <p className="error-message">{error}</p>}

                {/* Basic User Section */}
                <div className="reward-category-card">
                    <div className="reward-category-header" onClick={() => setBasicUserExpanded(!basicUserExpanded)}>
                        <h3>Basic User</h3>
                        <span className="add-rewards-text">Add rewards into the app</span>
                        <i className={`fa-solid ${basicUserExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                    </div>
                    {basicUserExpanded && (
                        <div className="reward-category-body">
                            <h4 className="rewards-subheader">Available Rewards:</h4>
                            {loading ? (
                                <p>Loading available basic rewards...</p>
                            ) : availableBasicRewards.length > 0 ? (
                                availableBasicRewards.map((reward) => (
                                    <div key={reward.id} className="reward-item clickable-reward-item">
                                        <span>{reward.name}</span>
                                        <button className="add-reward-button" onClick={() => handleOpenModalToAdd(reward, 'basic')}>
                                            <i className="fa-solid fa-plus"></i>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data-message">No basic reward templates available.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Basic User Configured Rewards */}
                <h4 className="rewards-subheader configured-rewards-header">Configured Rewards (Basic User):</h4>
                {loading ? (
                    <p>Loading configured basic rewards...</p>
                ) : configuredBasicRewards.length > 0 ? (
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
                                        <i
                                            className="fa-solid fa-pen-to-square edit-icon"
                                            onClick={() => handleOpenModalToEdit(reward, 'basic')}
                                        ></i>
                                        <i
                                            className="fa-solid fa-trash-can delete-icon"
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
                        <i className={`fa-solid ${premiumUserExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                    </div>
                    {premiumUserExpanded && (
                        <div className="reward-category-body">
                            <h4 className="rewards-subheader">Available Rewards:</h4>
                            {loading ? (
                                <p>Loading available premium rewards...</p>
                            ) : availablePremiumRewards.length > 0 ? (
                                availablePremiumRewards.map((reward) => (
                                    <div key={reward.id} className="reward-item clickable-reward-item">
                                        <span>{reward.name}</span> {/* Use reward.name (from AvailableReward) */}
                                        <button className="add-reward-button" onClick={() => handleOpenModalToAdd(reward, 'premium')}>
                                            <i className="fa-solid fa-plus"></i>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data-message">No premium reward templates available.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Premium User Configured Rewards */}
                <h4 className="rewards-subheader configured-rewards-header">Configured Rewards (Premium User):</h4>
                {loading ? (
                    <p>Loading configured premium rewards...</p>
                ) : configuredPremiumRewards.length > 0 ? (
                    <table className="rewards-table">
                        <thead>
                            <tr>
                                <th>Discount (%)</th>
                                <th>Reward</th>
                                <th>Points Needed</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {configuredPremiumRewards.map((reward) => (
                                <tr key={reward.id}>
                                    <td>{reward.discount}</td>
                                    <td>{reward.reward}</td> {/* Use reward.reward (from PremiumReward) */}
                                    <td>{reward.pointsNeeded}</td>
                                    <td>
                                        <i
                                            className="fa-solid fa-pen-to-square edit-icon"
                                            onClick={() => handleOpenModalToEdit(reward, 'premium')}
                                        ></i>
                                        <i
                                            className="fa-solid fa-trash-can delete-icon"
                                            onClick={() => handleDeleteReward(reward.id, 'premium')}
                                        ></i>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-data-message">No premium rewards configured yet.</p>
                )}
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