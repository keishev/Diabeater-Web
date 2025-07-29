// src/Components/MealCategoryManagementModal.js
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import './MealCategoryManagementModal.css'; // Create this CSS file

const MealCategoryManagementModal = observer(({ isOpen, onClose, mealPlanViewModel }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDescription, setNewCategoryDescription] = useState('');
    const [newCategoryIdField, setNewCategoryIdField] = useState(''); // For the internal categoryId field

    const [editingCategory, setEditingCategory] = useState(null); // Stores the category being edited
    const [editCategoryName, setEditCategoryName] = useState('');
    const [editCategoryDescription, setEditCategoryDescription] = useState('');
    const [editCategoryIdField, setEditCategoryIdField] = useState('');

    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState('');

    // Fetch categories when modal opens
    useEffect(() => {
        if (isOpen) {
            mealPlanViewModel.fetchMealCategories();
            setModalError('');
            // Reset new category form
            setNewCategoryName('');
            setNewCategoryDescription('');
            setNewCategoryIdField('');
            // Reset editing state
            setEditingCategory(null);
            setEditCategoryName('');
            setEditCategoryDescription('');
            setEditCategoryIdField('');
        }
    }, [isOpen, mealPlanViewModel]);

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalError('');
        try {
            await mealPlanViewModel.createMealCategory({
                categoryName: newCategoryName,
                categoryDescription: newCategoryDescription,
                // Only include categoryId if it's truly a separate unique identifier you're providing
                // If it's the Firestore doc ID, it will be assigned by the service.
                categoryId: newCategoryIdField || undefined // Pass if provided, otherwise undefined
            });
            setNewCategoryName('');
            setNewCategoryDescription('');
            setNewCategoryIdField('');
        } catch (error) {
            setModalError('Failed to add category: ' + error.message);
        } finally {
            setModalLoading(false);
        }
    };

    const handleEditClick = (category) => {
        setEditingCategory(category);
        setEditCategoryName(category.categoryName);
        setEditCategoryDescription(category.categoryDescription);
        setEditCategoryIdField(category.categoryId || ''); // Populate with existing categoryId if present
        setModalError('');
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        if (!editingCategory) return;

        setModalLoading(true);
        setModalError('');
        try {
            await mealPlanViewModel.updateMealCategory(editingCategory.id, {
                categoryName: editCategoryName,
                categoryDescription: editCategoryDescription,
                categoryId: editCategoryIdField || undefined
            });
            setEditingCategory(null); // Exit edit mode
            setEditCategoryName('');
            setEditCategoryDescription('');
            setEditCategoryIdField('');
        } catch (error) {
            setModalError('Failed to update category: ' + error.message);
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm('Are you sure you want to delete this category? This cannot be undone.')) {
            setModalLoading(true);
            setModalError('');
            try {
                await mealPlanViewModel.deleteMealCategory(id);
            } catch (error) {
                setModalError('Failed to delete category: ' + error.message);
            } finally {
                setModalLoading(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="category-modal-overlay">
            <div className="category-modal-content">
                <h2 className="modal-title">Manage Meal Plan Categories</h2>
                {modalLoading && <p>Loading...</p>}
                {modalError && <p className="error-message">{modalError}</p>}

                {/* Create New Category Form */}
                <div className="create-category-section">
                    <h3>Create New Category</h3>
                    <form onSubmit={handleCreateCategory}>
                        <div className="form-group">
                            <label htmlFor="newCategoryName">Category Name:</label>
                            <input
                                type="text"
                                id="newCategoryName"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="newCategoryDescription">Description:</label>
                            <textarea
                                id="newCategoryDescription"
                                value={newCategoryDescription}
                                onChange={(e) => setNewCategoryDescription(e.target.value)}
                                rows="3"
                                required
                            ></textarea>
                        </div>
                         <div className="form-group">
                            <label htmlFor="newCategoryIdField">Internal Category ID (Optional):</label>
                            <input
                                type="text"
                                id="newCategoryIdField"
                                value={newCategoryIdField}
                                onChange={(e) => setNewCategoryIdField(e.target.value)}
                                placeholder="Auto-generated if left empty"
                            />
                        </div>
                        <button type="submit" disabled={modalLoading}>Add Category</button>
                    </form>
                </div>

                {/* Existing Categories List */}
                <div className="existing-categories-section">
                    <h3>Existing Categories</h3>
                    {mealPlanViewModel.loadingCategories ? (
                        <p>Loading categories...</p>
                    ) : (
                        <ul className="category-list">
                            {mealPlanViewModel.allCategoriesWithDetails.length === 0 ? (
                                <p>No categories found.</p>
                            ) : (
                                mealPlanViewModel.allCategoriesWithDetails.map(category => (
                                    <li key={category.id} className="category-item">
                                        {editingCategory?.id === category.id ? (
                                            <form onSubmit={handleUpdateCategory} className="edit-form">
                                                <div className="form-group">
                                                    <label htmlFor={`editName-${category.id}`}>Name:</label>
                                                    <input
                                                        type="text"
                                                        id={`editName-${category.id}`}
                                                        value={editCategoryName}
                                                        onChange={(e) => setEditCategoryName(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor={`editDesc-${category.id}`}>Description:</label>
                                                    <textarea
                                                        id={`editDesc-${category.id}`}
                                                        value={editCategoryDescription}
                                                        onChange={(e) => setEditCategoryDescription(e.target.value)}
                                                        rows="2"
                                                        required
                                                    ></textarea>
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor={`editIdField-${category.id}`}>Internal ID:</label>
                                                    <input
                                                        type="text"
                                                        id={`editIdField-${category.id}`}
                                                        value={editCategoryIdField}
                                                        onChange={(e) => setEditCategoryIdField(e.target.value)}
                                                    />
                                                </div>
                                                <button type="submit" disabled={modalLoading}>Update</button>
                                                <button type="button" onClick={() => setEditingCategory(null)} className="cancel-button">Cancel</button>
                                            </form>
                                        ) : (
                                            <>
                                                <div>
                                                    <strong>{category.categoryName}</strong> ({category.id})
                                                    <p>{category.categoryDescription}</p>
                                                    {category.categoryId && <p>Internal ID: {category.categoryId}</p>}
                                                </div>
                                                <div className="category-actions">
                                                    <button onClick={() => handleEditClick(category)} disabled={modalLoading}>Edit</button>
                                                    <button onClick={() => handleDeleteCategory(category.id)} disabled={modalLoading} className="delete-button">Delete</button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))
                            )}
                        </ul>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="close-button" onClick={onClose} disabled={modalLoading}>Close</button>
                </div>
            </div>
        </div>
    );
});

export default MealCategoryManagementModal;