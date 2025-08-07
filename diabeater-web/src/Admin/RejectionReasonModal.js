// src/Admin/RejectionReasonModal.js
import React, { useState } from 'react';

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

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Select Rejection Reason</h3>
                
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
                        value={customReason}
                        onChange={(e) => handleCustomReasonChange(e.target.value)}
                        placeholder="Please specify the reason for rejection..."
                        rows="4"
                        style={{ 
                            width: '100%', 
                            marginTop: '10px',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                )}

                <div className="modal-actions" style={{ marginTop: '15px' }}>
                    <button 
                        onClick={handleConfirm} 
                        disabled={!getFinalReason().trim()}
                        style={{
                            backgroundColor: getFinalReason().trim() ? '#dc3545' : '#ccc',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: getFinalReason().trim() ? 'pointer' : 'not-allowed',
                            marginRight: '10px'
                        }}
                    >
                        Confirm Rejection
                    </button>
                    <button 
                        onClick={onClose}
                        style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejectionReasonModal;