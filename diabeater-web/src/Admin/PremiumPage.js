// src/Pages/PremiumPage.js
import React, { useEffect, useState } from 'react'; // Import useState for local form management
import { observer } from 'mobx-react-lite';
import premiumStatViewModel from '../ViewModels/PremiumStatViewModel';

import UserDetailModal from './UserDetailModal';
import UserHistoryModal from './UserHistoryModal';

const PremiumPage = observer(() => {
    // Local state for price update input
    const [newPriceInput, setNewPriceInput] = useState('');
    // Local state for feature management inputs
    const [newFeatureName, setNewFeatureName] = useState('');
    const [editingFeature, setEditingFeature] = useState(null); // { oldName: '...', newName: '...' }

    useEffect(() => {
        premiumStatViewModel.loadPremiumData();
    }, []);

    // --- Handlers for Subscription Table (unchanged from last iteration) ---
    const handleSearchChange = (e) => {
        premiumStatViewModel.setSearchQuery(e.target.value);
    };

    const handleViewDetails = (user) => {
        premiumStatViewModel.openUserDetailModal(user);
    };

    const handleViewHistory = (user) => {
        premiumStatViewModel.openUserHistoryModal(user);
    };

    // --- Placeholder/Dummy handlers for UserDetailModal actions (from previous response) ---
    // You'll need to implement these in PremiumStatViewModel if they are relevant
    // or ensure UserDetailModal doesn't call them if not needed for premium page.
    const handleApproveNutritionist = (userId) => {
        alert(`Approve Nutritionist with ID: ${userId}`);
        // premiumStatViewModel.approveNutritionist(userId); // Example call
        premiumStatViewModel.closeUserDetailModal();
    };

    const handleOpenRejectReasonModal = () => {
        alert("Parent needs to open rejection reason modal. (Not implemented in VM for Premium page)");
        // premiumStatViewModel.openRejectionReasonPrompt(); // Example call
    };

    const handleConfirmRejectNutritionist = (userId, reason) => {
        alert(`Reject Nutritionist with ID: ${userId} for reason: ${reason}`);
        // premiumStatViewModel.rejectNutritionist(userId, reason); // Example call
        premiumStatViewModel.closeUserDetailModal();
    };

    const handleCancelRejectReasonModal = () => {
        alert("Parent needs to close rejection reason modal. (Not implemented in VM for Premium page)");
        // premiumStatViewModel.closeRejectionReasonPrompt(); // Example call
    };

    const handleViewDocument = (userId) => {
        alert(`View Document for User ID: ${userId}`);
        // premiumStatViewModel.viewUserDocument(userId); // Example call
    };

    // --- Handlers for Premium Price Management ---
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
            setNewPriceInput(''); // Clear input on success
        }
    };

    // --- Handlers for Premium Feature Management ---
    const handleAddFeature = async () => {
        if (!newFeatureName.trim()) {
            premiumStatViewModel.setError("Feature name cannot be empty.");
            return;
        }
        const result = await premiumStatViewModel.createPremiumFeature(newFeatureName.trim());
        if (result.success) {
            setNewFeatureName(''); // Clear input on success
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
            setEditingFeature(null); // Exit editing mode
        }
    };

    const handleCancelEditFeature = () => {
        setEditingFeature(null); // Exit editing mode
    };

    const handleDeleteFeature = async (featureName) => {
        if (window.confirm(`Are you sure you want to delete the feature "${featureName}"?`)) {
            await premiumStatViewModel.removePremiumFeature(featureName);
        }
    };

    // --- Loading and Error States (combined for general page) ---
    if (premiumStatViewModel.loading && premiumStatViewModel.allPremiumUserAccounts.length === 0) {
        return <div style={{ textAlign: 'center', padding: '20px' }}>Loading Premium Admin Data...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>Admin Dashboard - Premium Management</h1>

            {/* General Loading, Error, Success Messages */}
            {premiumStatViewModel.loading && premiumStatViewModel.allPremiumUserAccounts.length > 0 && <p style={{ color: 'blue' }}>Updating data...</p>}
            {premiumStatViewModel.error && <p style={{ color: 'red' }}>Error: {premiumStatViewModel.error}</p>}
            {premiumStatViewModel.success && <p style={{ color: 'green' }}>Success: {premiumStatViewModel.success}</p>}

            {/* --- Section 1: Subscriptions Overview (Table) --- */}
            <section style={{ marginBottom: '40px', border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
                <h2>Subscriptions Overview</h2>

                {/* Search Bar */}
                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="Search by email, name, or status"
                        value={premiumStatViewModel.searchQuery}
                        onChange={handleSearchChange}
                        style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '16px',
                            borderRadius: '5px',
                            border: '1px solid #ccc'
                        }}
                    />
                </div>

                {/* Subscription Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f2f2f2' }}>
                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Name</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Email</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Renewal Date</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Details</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>History</th>
                        </tr>
                    </thead>
                    <tbody>
                        {premiumStatViewModel.filteredPremiumUserAccounts.length > 0 ? (
                            premiumStatViewModel.filteredPremiumUserAccounts.map((user) => (
                                <tr key={user._id}>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.displayName}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.email}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                        <span style={{ color: user.displayStatus === 'active' ? 'green' : (user.displayStatus === 'cancelled' ? 'orange' : 'red') }}>
                                            ● {user.displayStatus.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.displayRenewalDate}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                        <button onClick={() => handleViewDetails(user)} style={{ padding: '5px 10px', cursor: 'pointer' }}>VIEW</button>
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                        <button onClick={() => handleViewHistory(user)} style={{ padding: '5px 10px', cursor: 'pointer' }}>VIEW</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No subscriptions found or matching your search.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            {/* --- Section 2: Premium Price Management --- */}
            <section style={{ marginBottom: '40px', border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
                <h2>Premium Price Management</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <p>Current Price: <strong>${premiumStatViewModel.premiumSubscriptionPrice.toFixed(2)}</strong></p>
                    <input
                        type="number"
                        step="0.01"
                        value={newPriceInput}
                        onChange={handlePriceChange}
                        placeholder="Enter new price"
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', width: '150px' }}
                    />
                    <button
                        onClick={handleUpdatePrice}
                        disabled={premiumStatViewModel.loading || newPriceInput === ''}
                        style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
                    >
                        {premiumStatViewModel.loading ? 'Updating...' : 'Update Price'}
                    </button>
                </div>
            </section>

            {/* --- Section 3: Premium Features Management --- */}
            <section style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
                <h2>Premium Features Management</h2>
                <div style={{ marginBottom: '20px' }}>
                    <h3>Add New Feature</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={newFeatureName}
                            onChange={(e) => setNewFeatureName(e.target.value)}
                            placeholder="New feature name"
                            style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', flexGrow: 1 }}
                        />
                        <button
                            onClick={handleAddFeature}
                            disabled={premiumStatViewModel.loading || newFeatureName === ''}
                            style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
                        >
                            {premiumStatViewModel.loading ? 'Adding...' : 'Add Feature'}
                        </button>
                    </div>
                </div>

                <h3>Current Features</h3>
                {premiumStatViewModel.premiumFeatures.length === 0 && !premiumStatViewModel.loading ? (
                    <p>No premium features defined yet.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {premiumStatViewModel.premiumFeatures.map((feature, index) => (
                            <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed #eee' }}>
                                {editingFeature && editingFeature.oldName === feature ? (
                                    <input
                                        type="text"
                                        value={editingFeature.newName}
                                        onChange={(e) => setEditingFeature({ ...editingFeature, newName: e.target.value })}
                                        style={{ flexGrow: 1, padding: '5px', borderRadius: '3px', border: '1px solid #ddd' }}
                                    />
                                ) : (
                                    <span>{feature}</span>
                                )}
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {editingFeature && editingFeature.oldName === feature ? (
                                        <>
                                            <button
                                                onClick={handleSaveEditFeature}
                                                disabled={premiumStatViewModel.loading || editingFeature.newName.trim() === ''}
                                                style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '3px' }}
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancelEditFeature}
                                                disabled={premiumStatViewModel.loading}
                                                style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px' }}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleEditFeatureClick(feature)}
                                                disabled={premiumStatViewModel.loading}
                                                style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '3px' }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFeature(feature)}
                                                disabled={premiumStatViewModel.loading}
                                                style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
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


            {/* --- Modals (positioned at the end for clean rendering logic) --- */}

            {premiumStatViewModel.isUserDetailModalOpen && (
                <UserDetailModal
                    user={premiumStatViewModel.selectedUser}
                    onClose={premiumStatViewModel.closeUserDetailModal}
                    // These props are here to satisfy UserDetailModal's prop types.
                    // If nutritionist actions are not part of PremiumPage's responsibility,
                    // consider refining UserDetailModal or its usage.
                    onApprove={handleApproveNutritionist}
                    onReject={handleOpenRejectReasonModal}
                    onConfirmReject={handleConfirmRejectNutritionist}
                    onCancelReject={handleCancelRejectReasonModal}
                    onViewDocument={handleViewDocument}
                    loading={premiumStatViewModel.loading} // Pass main loading state or specific modal loading
                    error={premiumStatViewModel.error} // Pass main error or specific modal error
                    success={premiumStatViewModel.success} // Pass main success or specific modal success
                    showRejectionReasonModal={false} // Assuming no rejection reason modal needed here for now
                    rejectionReason={''}
                    setRejectionReason={() => {}}
                />
            )}

            {premiumStatViewModel.isUserHistoryModalOpen && (
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