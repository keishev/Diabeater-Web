// src/Admin/EditSubscriptionModal.js
import React, { useState, useEffect } from 'react';
import './EditSubscriptionModal.css'; // We'll create this CSS next

const EditSubscriptionModal = ({ isOpen, onClose, initialPrice, onSave }) => {
    const [price, setPrice] = useState(initialPrice);

    // Update internal price state if initialPrice prop changes (e.g., when modal is opened for a new value)
    useEffect(() => {
        setPrice(initialPrice);
    }, [initialPrice]);

    if (!isOpen) {
        return null;
    }

    const handleSave = () => {
        onSave(parseFloat(price)); // Convert to number before saving
        onClose();
    };

    const handleCancel = () => {
        setPrice(initialPrice); // Reset price to initial value on cancel
        onClose();
    };

    return (
        <div className="edit-modal-overlay" onClick={handleCancel}>
            <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="edit-modal-close-button" onClick={handleCancel}>
                    &times;
                </button>
                <h2 className="edit-modal-title">EDIT SUBSCRIPTION</h2>
                <div className="edit-modal-body">
                    <div className="edit-info-row">
                        <span className="edit-label">Name</span>
                        <span className="edit-value">Premium User</span> {/* As seen in image_c74358.png */}
                    </div>
                    <div className="edit-info-row">
                        <span className="edit-label">Price</span>
                        <input
                            type="number"
                            step="0.01" // Allows decimal values for price
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="edit-price-input"
                        />
                        <span className="edit-currency"> $</span> {/* Added currency symbol next to input */}
                    </div>
                </div>
                <div className="edit-modal-actions">
                    <button className="edit-save-button" onClick={handleSave}>Save</button>
                    <button className="edit-cancel-button" onClick={handleCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default EditSubscriptionModal;