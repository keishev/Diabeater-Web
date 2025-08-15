
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import './EditPremiumFeaturesModal.css';

const EditPremiumFeaturesModal = observer(({ isOpen, onClose, adminStatViewModel }) => {
    const [newFeatureName, setNewFeatureName] = useState('');
    const [editingFeatureName, setEditingFeatureName] = useState(null); 
    const [editFeatureNewName, setEditFeatureNewName] = useState(''); 

    
    useEffect(() => {
        if (isOpen) {
            setNewFeatureName('');
            setEditingFeatureName(null);
            setEditFeatureNewName('');
            adminStatViewModel.setError(null);
            adminStatViewModel.setSuccess(null);
        }
    }, [isOpen, adminStatViewModel]);

    if (!isOpen) {
        return null;
    }

    const handleCreateFeature = async (e) => {
        e.preventDefault();
        if (!newFeatureName.trim()) {
            adminStatViewModel.setError('Feature name cannot be empty.');
            return;
        }
        const result = await adminStatViewModel.createPremiumFeature(newFeatureName.trim());
        if (result.success) {
            setNewFeatureName('');
        }
    };

    const handleEditClick = (featureName) => {
        setEditingFeatureName(featureName);
        setEditFeatureNewName(featureName); 
        adminStatViewModel.setError(null); 
    };

    const handleUpdateFeature = async (e, oldFeatureName) => {
        e.preventDefault();
        if (!editFeatureNewName.trim()) {
            adminStatViewModel.setError('Feature name cannot be empty.');
            return;
        }
        if (editFeatureNewName.trim() === oldFeatureName) {
            adminStatViewModel.setSuccess('No change detected, feature name remains the same.');
            setEditingFeatureName(null);
            setEditFeatureNewName('');
            return;
        }

        const result = await adminStatViewModel.editPremiumFeature(oldFeatureName, editFeatureNewName.trim());
        if (result.success) {
            setEditingFeatureName(null); 
            setEditFeatureNewName('');
        }
    };

    const handleDeleteFeature = async (featureName) => {
        if (window.confirm(`Are you sure you want to delete the feature "${featureName}"?`)) {
            await adminStatViewModel.removePremiumFeature(featureName);
        }
    };

    const { premiumFeatures, loading, error, success } = adminStatViewModel;

    return (
        <div className="edit-modal-overlay">
            <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="edit-modal-close-button" onClick={onClose} disabled={loading}>
                    &times;
                </button>
                <h2 className="edit-modal-title">MANAGE PREMIUM FEATURES</h2>

                {loading && <p>Loading...</p>}
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                {/* Add New Feature Form */}
                <div className="add-feature-section">
                    <h3>Add New Feature</h3>
                    <form onSubmit={handleCreateFeature}>
                        <div className="form-group">
                            <label htmlFor="newFeatureName">Feature Name:</label>
                            <input
                                type="text"
                                id="newFeatureName"
                                value={newFeatureName}
                                onChange={(e) => setNewFeatureName(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="e.g., Advanced Analytics"
                            />
                        </div>
                        <button type="submit" disabled={loading}>Add Feature</button>
                    </form>
                </div>

                {/* Existing Features List */}
                <div className="existing-features-section">
                    <h3>Existing Premium Features</h3>
                    {premiumFeatures.length === 0 && !loading && <p>No premium features found.</p>}
                    <ul className="features-list">
                        {premiumFeatures.map((featureName, index) => (
                            <li key={featureName + index} className="feature-item"> {/* Use featureName + index as key as featureName itself might not be unique if not carefully controlled */}
                                {editingFeatureName === featureName ? (
                                    <form onSubmit={(e) => handleUpdateFeature(e, featureName)} className="edit-feature-form">
                                        <div className="form-group">
                                            <label htmlFor={`editFeatureNewName-${index}`}>Name:</label>
                                            <input
                                                type="text"
                                                id={`editFeatureNewName-${index}`}
                                                value={editFeatureNewName}
                                                onChange={(e) => setEditFeatureNewName(e.target.value)}
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                        <button type="submit" disabled={loading}>Update</button>
                                        <button type="button" onClick={() => { setEditingFeatureName(null); setEditFeatureNewName(''); }} className="cancel-button" disabled={loading}>Cancel</button>
                                    </form>
                                ) : (
                                    <>
                                        <span>{featureName}</span>
                                        <div className="feature-actions">
                                            <button onClick={() => handleEditClick(featureName)} disabled={loading}>Edit</button>
                                            <button onClick={() => handleDeleteFeature(featureName)} className="delete-button" disabled={loading}>Delete</button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="edit-modal-actions">
                    <button className="edit-cancel-button" onClick={onClose} disabled={loading}>Close</button>
                </div>
            </div>
        </div>
    );
});

export default EditPremiumFeaturesModal;