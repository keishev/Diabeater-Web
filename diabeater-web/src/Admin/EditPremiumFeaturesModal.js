// src/Admin/EditPremiumFeaturesModal.js
import React, { useState, useEffect } from 'react';
import './EditPremiumFeaturesModal.css'; // New CSS file for this modal

// Define all possible premium features. This list should ideally come from a central config
// or be fetched from the database if they are dynamic and not tied to a specific plan type.
// For now, based on your provided list:
const ALL_PREMIUM_FEATURES = [
    "Partner support system",
    "Barcode & meal photo scanning",
    "AI meal insights & glucose prediction",
    "Nutritionist-approved meal plans",
    "Reports & export sharing",
    "Correlation graphs",
];

const EditPremiumFeaturesModal = ({ isOpen, onClose, initialFeatures, onSave }) => {
    const [selectedFeatures, setSelectedFeatures] = useState([]);

    // Update internal state when initialFeatures prop changes (e.g., when modal opens)
    useEffect(() => {
        setSelectedFeatures(initialFeatures || []);
    }, [initialFeatures]);

    if (!isOpen) {
        return null;
    }

    const handleCheckboxChange = (feature) => {
        setSelectedFeatures(prevSelected => {
            if (prevSelected.includes(feature)) {
                return prevSelected.filter(f => f !== feature);
            } else {
                return [...prevSelected, feature];
            }
        });
    };

    const handleSave = () => {
        onSave(selectedFeatures);
        onClose();
    };

    const handleCancel = () => {
        setSelectedFeatures(initialFeatures || []); // Reset to initial state on cancel
        onClose();
    };

    return (
        <div className="edit-modal-overlay" onClick={handleCancel}>
            <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="edit-modal-close-button" onClick={handleCancel}>
                    &times;
                </button>
                <h2 className="edit-modal-title">EDIT PREMIUM FEATURES</h2>
                <div className="edit-modal-body">
                    <p className="edit-modal-description">Select features to include in the Premium Plan:</p>
                    <div className="features-checklist">
                        {ALL_PREMIUM_FEATURES.map((feature, index) => (
                            <label key={index} className="feature-checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={selectedFeatures.includes(feature)}
                                    onChange={() => handleCheckboxChange(feature)}
                                />
                                {feature}
                            </label>
                        ))}
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

export default EditPremiumFeaturesModal;