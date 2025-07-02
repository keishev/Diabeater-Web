// src/Admin/RejectionReasonModal.js
import React from 'react';

const RejectionReasonModal = ({ reason, setReason, onConfirm, onClose }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Enter Rejection Reason</h3>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for rejecting this nutritionist..."
                    rows="4"
                    style={{ width: '100%', marginBottom: '10px' }}
                ></textarea>
                <div className="modal-actions">
                    <button onClick={onConfirm} disabled={!reason.trim()}>Confirm</button>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default RejectionReasonModal;