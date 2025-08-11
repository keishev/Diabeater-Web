// src/Admin/RejectionReasonModal.js
import React, { useState } from 'react';
import './RejectionReasonModal.css';

const RejectionReasonModal = ({ reason, setReason, onConfirm, onClose }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');

    const predefinedReasons = [
        'Invalid or expired certification',
        'Incomplete application information',
        'Certificate does not meet requirements',
        'Unable to verify credentials',
        'Application does not meet eligibility criteria'
    ];

    const handleReasonChange = (value) => {
        setSelectedReason(value);
        if (value === 'custom') {
            setReason(customReason);
        } else {
            setReason(value);
        }
    };

    const handleCustomReasonChange = (value) => {
        setCustomReason(value);
        if (selectedReason === 'custom') {
            setReason(value);
        }
    };

    const handleConfirm = () => {
        const finalReason = selectedReason === 'custom' ? customReason : selectedReason;
        if (finalReason.trim()) {
            onConfirm();
        }
    };

    const getFinalReason = () => {
        return selectedReason === 'custom' ? customReason : selectedReason;
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div 
            className="modal-overlay" 
            onClick={handleOverlayClick}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
        >
            <div className="modal-content" role="dialog" aria-labelledby="modal-title" aria-modal="true">
                <h3 id="modal-title">Select Rejection Reason</h3>
                
                <div className="rejection-reasons-container">
                    {predefinedReasons.map((reasonOption, index) => (
                        <div key={index} className="reason-option">
                            <input
                                type="radio"
                                id={`reason-${index}`}
                                name="rejectionReason"
                                value={reasonOption}
                                checked={selectedReason === reasonOption}
                                onChange={(e) => handleReasonChange(e.target.value)}
                            />
                            <label htmlFor={`reason-${index}`}>{reasonOption}</label>
                        </div>
                    ))}
                    
                    <div className="reason-option">
                        <input
                            type="radio"
                            id="reason-custom"
                            name="rejectionReason"
                            value="custom"
                            checked={selectedReason === 'custom'}
                            onChange={(e) => handleReasonChange(e.target.value)}
                        />
                        <label htmlFor="reason-custom">Other (specify below)</label>
                    </div>
                </div>

                {selectedReason === 'custom' && (
                    <textarea
                        className="custom-reason-textarea"
                        value={customReason}
                        onChange={(e) => handleCustomReasonChange(e.target.value)}
                        placeholder="Please specify the reason for rejection..."
                        rows="4"
                        aria-label="Custom rejection reason"
                    />
                )}

                <div className="modal-actions">
                    <button 
                        className="confirm-btn"
                        onClick={handleConfirm} 
                        disabled={!getFinalReason().trim()}
                        aria-label={`Confirm rejection${getFinalReason().trim() ? `: ${getFinalReason()}` : ''}`}
                    >
                        Confirm Rejection
                    </button>
                    <button 
                        className="cancel-btn"
                        onClick={onClose}
                        aria-label="Cancel rejection"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejectionReasonModal;