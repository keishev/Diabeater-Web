import React, { useState, useEffect } from 'react';
import './RewardModal.css'; // Ensure this CSS file exists for modal styling

const RewardModal = ({ show, onClose, onConfirm, rewardData, rewardType, isEditing }) => {
    const [quantity, setQuantity] = useState('');
    const [pointsNeeded, setPointsNeeded] = useState('');

    useEffect(() => {
        if (rewardData) {
            setQuantity(rewardData.quantity || '');
            setPointsNeeded(rewardData.pointsNeeded || '');
        } else {
            // Reset fields when opening for a new reward
            setQuantity('');
            setPointsNeeded('');
        }
    }, [rewardData, show]); // Reset when modal shows or rewardData changes

    const handleConfirmClick = () => {
        const parsedQuantity = parseInt(quantity, 10);
        const parsedPoints = parseInt(pointsNeeded, 10);

        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            alert('Quantity must be a positive number.');
            return;
        }
        if (isNaN(parsedPoints) || parsedPoints < 0) { // Points can be 0, if not needed
            alert('Points Needed must be a non-negative number.');
            return;
        }

        onConfirm({
            ...rewardData, // Keep existing reward properties (like id, name/reward)
            quantity: parsedQuantity,
            pointsNeeded: parsedPoints,
            type: rewardType // Pass the type back to the parent for handling
        });
        onClose(); // Close modal after confirming
    };

    if (!show) return null;

    const modalTitle = isEditing ? 'Edit Reward' : 'Add Reward Into App';

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{modalTitle}</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Selected Reward</label>
                        <input type="text" value={rewardData?.name || rewardData?.reward || ''} readOnly />
                    </div>
                    <div className="form-group">
                        <label>For User</label>
                        <input type="text" value={rewardType === 'basic' ? 'Basic' : 'Premium'} readOnly />
                    </div>
                    <div className="form-group">
                        <label htmlFor="quantity">Quantity</label>
                        <input
                            type="number"
                            id="quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter quantity"
                            min="1"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="pointsNeeded">Points Needed</label>
                        <input
                            type="number"
                            id="pointsNeeded"
                            value={pointsNeeded}
                            onChange={(e) => setPointsNeeded(e.target.value)}
                            placeholder="Enter points required"
                            min="0" // Assuming points can be 0 for some rewards
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="cancel-button" onClick={onClose}>Cancel</button>
                    <button className="confirm-button" onClick={handleConfirmClick}>Confirm</button>
                </div>
            </div>
        </div>
    );
};

export default RewardModal;