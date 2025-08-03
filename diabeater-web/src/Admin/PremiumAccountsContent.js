// src/Components/PremiumAccountsContent.js

import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import AdminDashboardViewModel from '../ViewModels/AdminDashboardViewModel';
// import adminStatViewModel from '../ViewModels/AdminStatViewModel'; // Not needed for minimal setup

const PremiumAccountsContent = observer(() => {
    // Access the premiumAccountsVM from the main AdminDashboardViewModel
    const { premiumAccountsVM } = AdminDashboardViewModel;
    const { premiumUsers, searchTerm, isLoading, error } = premiumAccountsVM;

    useEffect(() => {
        // Fetch premium users when this component mounts
        premiumAccountsVM.fetchPremiumUsers();
    }, [premiumAccountsVM]); // Depend on premiumAccountsVM to re-fetch if it changes (though it's a singleton)

    return (
        <>
            <div className="admin-dashboard-main-content-area">
                <header className="admin-header">
                    <h1 className="admin-page-title">PREMIUM ACCOUNTS</h1>
                    <div className="admin-search-bar">
                        <input
                            type="text"
                            placeholder="Search by username, email, or name"
                            value={searchTerm}
                            onChange={(e) => premiumAccountsVM.setSearchTerm(e.target.value)}
                        />
                        <i className="fas fa-search"></i>
                    </div>
                </header>
            </div>

            {isLoading && <p className="loading-message">Loading premium accounts...</p>}
            {error && <p className="error-message">{error}</p>}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Premium Start Date</th>
                            <th>Premium End Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {premiumUsers.length > 0 ? (
                            premiumUsers.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <i className="fas fa-user-circle user-icon"></i>
                                        {`${user.firstName} ${user.lastName}`}
                                    </td>
                                    <td>{user.email}</td>
                                    <td>{user.premiumStartDate ? new Date(user.premiumStartDate).toLocaleDateString() : 'N/A'}</td>
                                    <td>{user.premiumEndDate ? new Date(user.premiumEndDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className={user.status === 'Active' ? 'status-active' : 'status-inactive'}>
                                        <span className="status-dot"></span>{user.status}
                                    </td>
                                    <td>
                                        {/* Placeholder for future actions */}
                                        <button className="action-button view-button" disabled>View Details</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="no-data-message">
                                    {isLoading ? '' : 'No premium accounts found.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="pagination">
                    <button>&lt;</button>
                    <span>Page 1/1</span> {/* Placeholder for pagination */}
                    <button>&gt;</button>
                </div>
            </div>
        </>
    );
});

export default PremiumAccountsContent;