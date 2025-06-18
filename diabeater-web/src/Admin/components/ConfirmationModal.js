// src/Admin/components/ConfirmationModal.js
import React from 'react';
import './ConfirmationModal.css'; // Create this CSS file next

function ConfirmationModal({ message, onConfirm, onCancel, isVisible }) {
    if (!isVisible) {
        return null; // Don't render anything if the modal is not visible
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    <button onClick={onConfirm} className="modal-button confirm">Yes</button>
                    <button onClick={onCancel} className="modal-button cancel">Cancel</button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;