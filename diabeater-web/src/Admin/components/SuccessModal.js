// src/Admin/components/SuccessModal.js
import React from 'react';
import './SuccessModal.css'; // Create this CSS file next

function SuccessModal({ message, onOk, isVisible }) {
    if (!isVisible) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content success-modal">
                <p className="modal-message">{message}</p>
                <button onClick={onOk} className="modal-button success-ok">OK</button>
            </div>
        </div>
    );
}

export default SuccessModal;