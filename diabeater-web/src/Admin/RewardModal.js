
import React, { useState, useEffect } from 'react';
import './RewardModal.css';

const RewardModal = ({ show, onClose, onConfirm, rewardData, rewardType, isEditing }) => {
    
    const rewardNameDisplay = rewardData?.name || rewardData?.reward || '';

    
    const quantityLabel = rewardType === 'premium' ? 'Discount (%)' : 'Quantity';

    const [currentQuantity, setCurrentQuantity] = useState(
        rewardType === 'premium'
            ? rewardData?.discount ?? ''
            : rewardData?.quantity ?? ''
    );

    const [currentPointsNeeded, setCurrentPointsNeeded] = useState(
        rewardData?.pointsNeeded ?? ''
    );

    
    
    useEffect(() => {
        setCurrentQuantity(
            rewardType === 'premium'
                ? rewardData?.discount ?? ''
                : rewardData?.quantity ?? ''
        );
        setCurrentPointsNeeded(rewardData?.pointsNeeded ?? '');
    }, [rewardData, rewardType]);


    
    if (!show) {
        return null;
    }
    console.log('RewardModal rendered');

    
    const handleOverlayClick = (e) => {
        if (e.target.classList.contains('reward-modal-overlay')) {
            onClose();
        }
    };

    const modalTitle = isEditing ? 'Edit Reward' : 'Add Reward';
    const confirmButtonText = isEditing ? 'Update Reward' : 'Add Reward';

    const handleConfirmClick = () => {
        
        if (!currentQuantity || currentPointsNeeded === '') {
            alert('Please enter both quantity/discount and points needed.');
            return;
        }
        
        if (isNaN(parseFloat(currentQuantity)) || isNaN(parseInt(currentPointsNeeded, 10))) {
            alert('Quantity/Discount and Points Needed must be valid numbers.');
            return;
        }


        onConfirm({
            type: rewardType,
            id: rewardData?.id, 
            name: rewardData?.name, 
            reward: rewardData?.reward, 
            quantity: parseFloat(currentQuantity), 
            pointsNeeded: parseInt(currentPointsNeeded, 10),
        });
    };

    return (
        <div className="reward-modal-overlay" onClick={handleOverlayClick}>
            <div className="reward-modal-content">
                <div className="reward-modal-header">
                    <h2 className="reward-modal-title">{modalTitle}</h2>
                    <button className="reward-modal-close-button" onClick={onClose} aria-label="Close">&times;</button>
                </div>
                <div className="reward-modal-body">
                    <div className="reward-modal-form-group reward-modal-row">
                        <label htmlFor="rewardName" className="reward-modal-label">Selected Reward:</label>
                        <input
                            id="rewardName"
                            type="text"
                            className="reward-modal-input reward-modal-read-only reward-modal-input-right"
                            value={rewardNameDisplay}
                            readOnly
                        />
                    </div>
                    <div className="reward-modal-form-group reward-modal-row">
                        <label htmlFor="quantity" className="reward-modal-label">{quantityLabel}:</label>
                        <input
                            id="quantity"
                            type="number"
                            className="reward-modal-input reward-modal-input-right"
                            value={currentQuantity !== null ? currentQuantity : ''}
                            onChange={(e) => setCurrentQuantity(e.target.value)}
                            placeholder={`Enter ${quantityLabel.toLowerCase()}`}
                            required
                        />
                    </div>
                    <div className="reward-modal-form-group reward-modal-row">
                        <label htmlFor="pointsNeeded" className="reward-modal-label">Points Needed:</label>
                        <input
                            id="pointsNeeded"
                            type="number"
                            className="reward-modal-input reward-modal-input-right"
                            value={currentPointsNeeded !== null ? currentPointsNeeded : ''}
                            onChange={(e) => setCurrentPointsNeeded(e.target.value)}
                            placeholder="Enter points needed"
                            required
                        />
                    </div>
                </div>
                <div className="reward-modal-actions">
                    <button className="reward-modal-cancel-button" onClick={onClose}>Cancel</button>
                    <button className="reward-modal-confirm-button" onClick={handleConfirmClick}>
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RewardModal;