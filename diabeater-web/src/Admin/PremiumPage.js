import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import premiumStatViewModel from '../ViewModels/PremiumStatViewModel';

import UserDetailModal from './UserDetailModal';
import UserHistoryModal from '../Admin/UserHistoryModal';
import '../Admin/PremiumPage.css';

const PremiumPage = observer(() => {
    
    const [newPriceInput, setNewPriceInput] = useState('');
    
    const [newFeatureName, setNewFeatureName] = useState('');
    const [editingFeature, setEditingFeature] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const accountsPerPage = 10;

    useEffect(() => {
        premiumStatViewModel.loadPremiumData();
    }, []);

    // Reset to first page when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [premiumStatViewModel.searchQuery]);

    
    const handleSearchChange = (e) => {
        premiumStatViewModel.setSearchQuery(e.target.value);
    };

    const handleViewDetails = (user) => {
        console.log("[PremiumPage] Opening user detail modal for:", user);
        premiumStatViewModel.openUserDetailModal(user);
    };

    const handleViewHistory = async (user) => {
        console.log("[PremiumPage] Opening user history modal for:", user);
        await premiumStatViewModel.openUserHistoryModal(user);
    };

    
    const handleApproveNutritionist = (userId) => {
        alert(`Approve Nutritionist with ID: ${userId}`);
        premiumStatViewModel.closeUserDetailModal();
    };

    const handleOpenRejectReasonModal = () => {
        alert("Parent needs to open rejection reason modal. (Not implemented in VM for Premium page)");
    };

    const handleConfirmRejectNutritionist = (userId, reason) => {
        alert(`Reject Nutritionist with ID: ${userId} for reason: ${reason}`);
        premiumStatViewModel.closeUserDetailModal();
    };

    const handleCancelRejectReasonModal = () => {
        alert("Parent needs to close rejection reason modal. (Not implemented in VM for Premium page)");
    };

    const handleViewDocument = (userId) => {
        alert(`View Document for User ID: ${userId}`);
    };

    
    const handlePriceChange = (e) => {
        setNewPriceInput(e.target.value);
    };

    const handleUpdatePrice = async () => {
        const price = parseFloat(newPriceInput);
        if (isNaN(price) || price <= 0) {
            premiumStatViewModel.setError("Please enter a valid positive price.");
            return;
        }
        const result = await premiumStatViewModel.updatePremiumSubscriptionPrice(price);
        if (result.success) {
            setNewPriceInput('');
        }
    };

    
    const handleAddFeature = async () => {
        if (!newFeatureName.trim()) {
            premiumStatViewModel.setError("Feature name cannot be empty.");
            return;
        }
        const result = await premiumStatViewModel.createPremiumFeature(newFeatureName.trim());
        if (result.success) {
            setNewFeatureName('');
        }
    };

    const handleEditFeatureClick = (feature) => {
        setEditingFeature({ oldName: feature, newName: feature });
    };

    const handleSaveEditFeature = async () => {
        if (!editingFeature || !editingFeature.newName.trim()) {
            premiumStatViewModel.setError("New feature name cannot be empty.");
            return;
        }
        const result = await premiumStatViewModel.editPremiumFeature(editingFeature.oldName, editingFeature.newName.trim());
        if (result.success) {
            setEditingFeature(null);
        }
    };

    const handleCancelEditFeature = () => {
        setEditingFeature(null);
    };

   const handleDeleteFeature = async (featureName) => {
    const confirmed = await window.showConfirm({
        title: "Delete Feature",
        message: `Are you sure you want to delete the feature "${featureName}"?`,
        confirmText: "Yes, Delete",
        cancelText: "Cancel",
        type: "danger"
    });

    if (confirmed) {
        await premiumStatViewModel.removePremiumFeature(featureName);
    }
};

    // Pagination calculations
    const totalAccounts = premiumStatViewModel.filteredPremiumUserAccounts.length;
    const totalPages = Math.ceil(totalAccounts / accountsPerPage);
    const startIndex = (currentPage - 1) * accountsPerPage;
    const endIndex = startIndex + accountsPerPage;
    const currentAccounts = premiumStatViewModel.filteredPremiumUserAccounts.slice(startIndex, endIndex);

    // Pagination handlers
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }
        return pageNumbers;
    };

    
    console.log("PremiumPage render - Modal states:", {
        isUserDetailModalOpen: premiumStatViewModel.isUserDetailModalOpen,
        isUserHistoryModalOpen: premiumStatViewModel.isUserHistoryModalOpen,
        selectedUser: premiumStatViewModel.selectedUser ? {
            _id: premiumStatViewModel.selectedUser._id,
            email: premiumStatViewModel.selectedUser.email
        } : null,
        userSubscriptionHistoryLength: premiumStatViewModel.userSubscriptionHistory?.length || 0,
        loadingHistory: premiumStatViewModel.loadingHistory,
        historyError: premiumStatViewModel.historyError
    });

    
    if (premiumStatViewModel.loading && premiumStatViewModel.allPremiumUserAccounts.length === 0) {
        return <div className="premium-loading-message">Loading Premium Admin Data...</div>;
    }

    return (
        <div className="premium-page-container">
            <h1 className="premium-page-title">PREMIUM MANAGEMENT</h1>

            {/* General Loading, Error, Success Messages */}
            <div className="premium-status-messages">
                {premiumStatViewModel.loading && premiumStatViewModel.allPremiumUserAccounts.length > 0 && 
                    <div className="premium-loading-message">Updating data...</div>
                }
                {premiumStatViewModel.error && 
                    <div className="premium-error-message">Error: {premiumStatViewModel.error}</div>
                }
                {premiumStatViewModel.success && 
                    <div className="premium-success-message">Success: {premiumStatViewModel.success}</div>
                }
            </div>

            {/* --- Section 1: Subscriptions Overview (Table) --- */}
            <section className="premium-section">
                <h2 className="premium-section-title">Subscriptions Overview</h2>

                {/* Search Bar */}
                <div className="premium-search-container">
                    <input
                        type="text"
                        placeholder="Search by email, name, or status"
                        value={premiumStatViewModel.searchQuery}
                        onChange={handleSearchChange}
                        className="premium-search-input"
                    />
                </div>

                {/* Results Summary */}
                {totalAccounts > 0 && (
                    <div className="premium-results-summary">
                        Showing {startIndex + 1}-{Math.min(endIndex, totalAccounts)} of {totalAccounts} accounts
                    </div>
                )}

                {/* Subscription Table */}
                <div className="premium-table-container">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Renewal Date</th>
                                <th>Details</th>
                                <th>History</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentAccounts.length > 0 ? (
                                currentAccounts.map((user) => (
                                    <tr key={user._id}>
                                        <td>{user.displayName}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`premium-status-indicator premium-status-${user.displayStatus}`}>
                                                {user.displayStatus.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>{user.displayRenewalDate}</td>
                                        <td>
                                            <button 
                                                onClick={() => handleViewDetails(user)} 
                                                className="premium-action-button premium-view-details-button"
                                            >
                                                VIEW DETAILS
                                            </button>
                                        </td>
                                        <td>
                                            <button 
                                                onClick={() => handleViewHistory(user)} 
                                                className="premium-action-button premium-view-history-button"
                                                disabled={premiumStatViewModel.loadingHistory}
                                            >
                                                {premiumStatViewModel.loadingHistory ? 'Loading...' : 'VIEW HISTORY'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="premium-no-subscriptions">
                                        No subscriptions found or matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="premium-pagination">
                        <button 
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            className="premium-pagination-button premium-pagination-prev"
                        >
                            Previous
                        </button>
                        
                        <div className="premium-pagination-numbers">
                            {getPageNumbers().map((pageNum) => (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`premium-pagination-button premium-pagination-number ${
                                        currentPage === pageNum ? 'active' : ''
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="premium-pagination-button premium-pagination-next"
                        >
                            Next
                        </button>
                    </div>
                )}
            </section>

            {/* --- Section 2: Premium Price Management --- */}
            <section className="premium-section">
                <h2 className="premium-section-title">Premium Price Management</h2>
                <div className="premium-price-management">
                    <div className="premium-current-price">
                        Current Price: <strong>${premiumStatViewModel.premiumSubscriptionPrice.toFixed(2)}</strong>
                    </div>
                    <input
                        type="number"
                        step="0.01"
                        value={newPriceInput}
                        onChange={handlePriceChange}
                        placeholder="Enter new price"
                        className="premium-price-input"
                    />
                    <button
                        onClick={handleUpdatePrice}
                        disabled={premiumStatViewModel.loading || newPriceInput === ''}
                        className="premium-update-price-button"
                    >
                        {premiumStatViewModel.loading ? 'Updating...' : 'Update Price'}
                    </button>
                </div>
            </section>

            {/* --- Section 3: Premium Features Management --- */}
            <section className="premium-section">
                <h2 className="premium-section-title">Premium Features Management</h2>
                <div>
                    <h3 className="premium-section-subtitle">Add New Feature</h3>
                    <div className="premium-add-feature-container">
                        <input
                            type="text"
                            value={newFeatureName}
                            onChange={(e) => setNewFeatureName(e.target.value)}
                            placeholder="New feature name"
                            className="premium-feature-input"
                        />
                        <button
                            onClick={handleAddFeature}
                            disabled={premiumStatViewModel.loading || newFeatureName === ''}
                            className="premium-add-feature-button"
                        >
                            {premiumStatViewModel.loading ? 'Adding...' : 'Add Feature'}
                        </button>
                    </div>
                </div>

                <h3 className="premium-section-subtitle">Current Features</h3>
                {premiumStatViewModel.premiumFeatures.length === 0 && !premiumStatViewModel.loading ? (
                    <div className="premium-no-features">No premium features defined yet.</div>
                ) : (
                    <ul className="premium-features-list">
                        {premiumStatViewModel.premiumFeatures.map((feature, index) => (
                            <li key={index} className="premium-feature-item">
                                {editingFeature && editingFeature.oldName === feature ? (
                                    <input
                                        type="text"
                                        value={editingFeature.newName}
                                        onChange={(e) => setEditingFeature({ ...editingFeature, newName: e.target.value })}
                                        className="premium-feature-edit-input"
                                    />
                                ) : (
                                    <span className="premium-feature-name">{feature}</span>
                                )}
                                <div className="premium-feature-actions">
                                    {editingFeature && editingFeature.oldName === feature ? (
                                        <>
                                            <button
                                                onClick={handleSaveEditFeature}
                                                disabled={premiumStatViewModel.loading || editingFeature.newName.trim() === ''}
                                                className="premium-feature-button premium-save-button"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancelEditFeature}
                                                disabled={premiumStatViewModel.loading}
                                                className="premium-feature-button premium-cancel-button"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleEditFeatureClick(feature)}
                                                disabled={premiumStatViewModel.loading}
                                                className="premium-feature-button premium-edit-button"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFeature(feature)}
                                                disabled={premiumStatViewModel.loading}
                                                className="premium-feature-button premium-delete-button"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* --- Modals --- */}
            {premiumStatViewModel.isUserDetailModalOpen && premiumStatViewModel.selectedUser && (
                <UserDetailModal
                    user={premiumStatViewModel.selectedUser}
                    onClose={premiumStatViewModel.closeUserDetailModal}
                    onApprove={handleApproveNutritionist}
                    onReject={handleOpenRejectReasonModal}
                    onConfirmReject={handleConfirmRejectNutritionist}
                    onCancelReject={handleCancelRejectReasonModal}
                    onViewDocument={handleViewDocument}
                    loading={premiumStatViewModel.loading}
                    error={premiumStatViewModel.error}
                    success={premiumStatViewModel.success}
                    showRejectionReasonModal={false}
                    rejectionReason={''}
                    setRejectionReason={() => {}}
                />
            )}

            {/* Debug: Show what we're checking for UserHistoryModal - fixed to show actual values */}
            {console.log("UserHistoryModal render check:", {
                isOpen: premiumStatViewModel.isUserHistoryModalOpen,
                hasUser: !!premiumStatViewModel.selectedUser,
                userEmail: premiumStatViewModel.selectedUser?.email || 'no user',
                shouldRender: premiumStatViewModel.isUserHistoryModalOpen && !!premiumStatViewModel.selectedUser
            })}

            {premiumStatViewModel.isUserHistoryModalOpen && premiumStatViewModel.selectedUser && (
                <UserHistoryModal
                    user={premiumStatViewModel.selectedUser}
                    history={premiumStatViewModel.userSubscriptionHistory}
                    loading={premiumStatViewModel.loadingHistory}
                    error={premiumStatViewModel.historyError}
                    onClose={premiumStatViewModel.closeUserHistoryModal}
                />
            )}
        </div>
    );
});

export default PremiumPage;