// src/RewardModal.js
import React, { useState, useEffect } from 'react'; // Destructure useState and useEffect for cleaner code
import './RewardModal.css';

const RewardModal = ({ show, onClose, onConfirm, rewardData, rewardType, isEditing }) => {
    // --- Move ALL React Hooks to the top level, BEFORE any conditional returns ---

    // Determine what text to show for the "Reward" field and whether it's editable
    const rewardNameDisplay = rewardData?.name || rewardData?.reward || '';

    // Determine the label for the quantity/discount field
    const quantityLabel = rewardType === 'premium' ? 'Discount (%)' : 'Quantity';

    // Initialize state with props values.
    // These calls must always happen regardless of 'show' prop.
    const [currentQuantity, setCurrentQuantity] = useState(
        rewardType === 'premium' ? rewardData?.discount : rewardData?.quantity
    );
    const [currentPointsNeeded, setCurrentPointsNeeded] = useState(rewardData?.pointsNeeded);

    // useEffect to reset internal state when the modal is shown with new data (e.g., editing a different reward)
    // or when switching between add/edit modes.
    useEffect(() => {
        // Only update if the modal is actually going to be displayed OR if the rewardData changes
        // This ensures the internal state syncs with external props when the modal opens or content changes
        setCurrentQuantity(rewardType === 'premium' ? rewardData?.discount : rewardData?.quantity);
        setCurrentPointsNeeded(rewardData?.pointsNeeded);
    }, [rewardData, rewardType]); // Dependencies include rewardData and rewardType


    // --- Now, the conditional return can safely go here ---
    if (!show) {
        return null;
    }

    // Rest of your logic that depends on the modal being visible
    const modalTitle = isEditing ? 'Edit Reward' : 'Add Reward';
    const confirmButtonText = isEditing ? 'Update Reward' : 'Add Reward';

    const handleConfirmClick = () => {
        // Basic validation (you can expand this)
        if (!currentQuantity || currentPointsNeeded === '') {
            alert('Please enter both quantity/discount and points needed.');
            return;
        }
        // Ensure numeric inputs
        if (isNaN(parseFloat(currentQuantity)) || isNaN(parseInt(currentPointsNeeded, 10))) {
            alert('Quantity/Discount and Points Needed must be valid numbers.');
            return;
        }


        onConfirm({
            type: rewardType,
            id: rewardData?.id, // Only present for existing rewards (editing)
            name: rewardData?.name, // For basic rewards when adding/editing
            reward: rewardData?.reward, // For premium rewards when adding/editing
            quantity: parseFloat(currentQuantity), // Use quantity for both, convert if needed
            pointsNeeded: parseInt(currentPointsNeeded, 10),
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{modalTitle}</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label htmlFor="rewardName">Reward:</label>
                        <input
                            id="rewardName"
                            type="text"
                            className="modal-input read-only"
                            value={rewardNameDisplay}
                            readOnly
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="quantity">{quantityLabel}:</label>
                        <input
                            id="quantity"
                            type="number"
                            className="modal-input"
                            value={currentQuantity !== null ? currentQuantity : ''} // Handle null for initial empty state
                            onChange={(e) => setCurrentQuantity(e.target.value)}
                            placeholder={`Enter ${quantityLabel.toLowerCase()}`}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="pointsNeeded">Points Needed:</label>
                        <input
                            id="pointsNeeded"
                            type="number"
                            className="modal-input"
                            value={currentPointsNeeded !== null ? currentPointsNeeded : ''} // Handle null for initial empty state
                            onChange={(e) => setCurrentPointsNeeded(e.target.value)}
                            placeholder="Enter points needed"
                            required
                        />
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="cancel-button" onClick={onClose}>Cancel</button>
                    <button className="confirm-button" onClick={handleConfirmClick}>
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RewardModal;