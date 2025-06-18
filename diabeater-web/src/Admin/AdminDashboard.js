// src/Admin/AdminDashboard.js
import React, { useState } from 'react';
import './AdminDashboard.css'; // Your main layout CSS
import './AdminStatDashboard.css'; // Add this line for dashboard-specific styles
import UserDetailModal from './UserDetailModal';
import AdminProfile from './AdminProfile';
import AdminStatDashboard from './AdminStatDashboard'; // Ensure this is imported
import AdminMealPlans from './AdminMealPlans';
import AdminMealPlanDetail from './AdminMealPlanDetail'; // This might be used inside AdminMealPlans, not directly here
import AdminExportReport from './AdminExportReport';
import MarketingWebsiteEditorPage from './MarketingWebsiteEditorPage'; // <--- NEW: Import the Marketing Editor Page
import UserFeedbacksPage from './UserFeedbacksPage';


// Mock data - Ensure your existing mock data includes all fields you need for ALL_ACCOUNTS
const initialUserAccounts = [
    { id: '1', name: 'John Doe', email: 'johndoe@gmail.com', accountType: 'System Admin', status: 'Active', userSince: '01/01/2025', uid: 'ADMN001' },
    { id: '2', name: 'Matilda Swayne', email: 'matildaswayne@gmail.com', accountType: 'Premium User', status: 'Active', userSince: '01/01/2025', uid: 'PREM002' },
    { id: '3', name: 'David Brown', email: 'david.b@gmail.com', accountType: 'Premium User', status: 'Active', userSince: '02/05/2025', uid: 'PREM003' },
    { id: '4', name: 'Timothy Young', email: 'timothy_young@gmail.com', accountType: 'Basic User', status: 'Active', userSince: '04/05/2025', uid: 'BASIC004' },
    { id: '5', name: 'Rachel Allen', email: 'rachelallen@gmail.com', accountType: 'Premium User', status: 'Inactive', userSince: '05/05/2025', uid: 'PREM005' },
    { id: '6', name: 'Andrew Gonzales', email: 'andrew_gonzales@gmail.com', accountType: 'Premium User', status: 'Inactive', userSince: '05/05/2025', uid: 'PREM006' },
    { id: '7', name: 'Steven Walker', email: 'stevenwalker.2@gmail.com', accountType: 'Premium User', status: 'Active', userSince: '06/05/2025', uid: 'PREM007' },
    { id: '8', name: 'Jason Scott', email: 'jasonscott231@gmail.com', accountType: 'Basic User', status: 'Active', userSince: '07/05/2025', uid: 'BASIC008' },
    { id: '9', name: 'Ryan Mitchell', email: 'ryan.mitchell@gmail.com', accountType: 'Basic User', status: 'Active', userSince: '07/05/2025', uid: 'BASIC009' },
    { id: '10', name: 'Rebecca Perez', email: 'rebecca_perez3@gmail.com', accountType: 'Nutritionist', status: 'Active', userSince: '08/05/2025', uid: 'NUTR10' },
];

// NEW MOCK DATA FOR PENDING APPROVAL ACCOUNTS
const pendingApprovalAccounts = [
    { id: '11', name: 'Samantha Joe', email: 'samantha@gmail.com', status: 'Active', renewalDate: '01/02/2025' },
    { id: '12', name: 'Matilda Swayne', email: 'matildaswayne@gmail.com', status: 'Active', renewalDate: '01/03/2025' },
    { id: '13', name: 'David Brown', email: 'david.b@gmail.com', status: 'Active', renewalDate: '02/03/2025' },
    { id: '14', name: 'Timothy Young', email: 'timothy_young@gmail.com', status: 'Active', renewalDate: '04/01/2025' },
    { id: '15', name: 'Rachel Allen', email: 'rachelallen@gmail.com', status: 'Active', renewalDate: '05/04/2025' },
    { id: '16', name: 'Andrew Gonzales', email: 'andrew_gonzales@gmail.com', status: 'Cancelled', renewalDate: '05/03/2025' },
    { id: '17', name: 'Steven Walker', email: 'stevenwalker.2@gmail.com', status: 'Active', renewalDate: '06/02/2025' },
    { id: '18', name: 'Jason Scott', email: 'jasonscott231@gmail.com', status: 'Expired', renewalDate: '07/04/2025' },
    { id: '19', name: 'Ryan Mitchell', email: 'ryan.mitchell@gmail.com', status: 'Active', renewalDate: '07/04/2025' },
    { id: '20', name: 'Beatrice Lim', email: 'beatrice_lim23@gmail.com', status: 'Active', renewalDate: '01/05/2025' },
];


// Admin Sidebar Component
const AdminSidebar = ({ currentView, onNavigate }) => {
    // Assuming onLogout is passed down from App.js to AdminDashboard,
    // and then to AdminSidebar if you want to handle it from App.js's state.
    // If not, this hardcoded window.location.href works but bypasses React state.
    const handleLogout = () => {
        window.location.href = '/login'; // This will refresh the page and go to login
        // Alternatively, if onLogout is passed as a prop: onLogout();
    };

    return (
        <div className="admin-sidebar">
            <div className="logo">
                <img src="/assetscopy/blood_drop_logo.png" alt="DiaBeater Logo" />
                <span className="logo-text">DiaBeater</span>
            </div>
            <nav className="navigation">
                <div
                    className={`nav-item ${currentView === 'myProfile' ? 'active' : ''}`}
                    onClick={() => onNavigate('myProfile')}
                >
                    <i className="fas fa-user"></i>
                    <span>My Profile</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
                    onClick={() => onNavigate('dashboard')}
                >
                    <i className="fas fa-home"></i>
                    <span>Dashboard</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'userAccounts' ? 'active' : ''}`}
                    onClick={() => onNavigate('userAccounts')}
                >
                    <i className="fas fa-users"></i>
                    <span>User Accounts</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'mealPlans' ? 'active' : ''}`}
                    onClick={() => onNavigate('mealPlans')}
                >
                    <i className="fas fa-clipboard-list"></i>
                    <span>Meal Plans</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'exportReport' ? 'active' : ''}`}
                    onClick={() => onNavigate('exportReport')}
                >
                    <i className="fas fa-file-export"></i>
                    <span>Export Report</span>
                </div>
                {/* <--- NEW: Add Nav Item for Marketing Website Editor */}
                <div
                    className={`nav-item ${currentView === 'editWebsite' ? 'active' : ''}`}
                    onClick={() => onNavigate('editWebsite')}
                >
                    <i className="fas fa-globe"></i> {/* Globe icon */}
                    <span>Edit Website</span>
                </div>
                <div
    className={`nav-item ${currentView === 'userFeedbacks' ? 'active' : ''}`}
    onClick={() => onNavigate('userFeedbacks')}
>
    <i className="fas fa-comments"></i> {/* You might need to install and use Font Awesome for this icon */}
    <span>User Feedbacks</span>
</div>
                {/* END NEW Nav Item */}
            </nav>
            <button className="logout-button" onClick={handleLogout}>Log out</button>
        </div>
    );
};

// User Account Table Row Component - Now handles rendering based on account type
const UserAccountRow = ({ user, onAction, onNameClick, type }) => {
    const statusClass = user.status === 'Active' ? 'status-active' : (user.status === 'Inactive' || user.status === 'Cancelled' || user.status === 'Expired' ? 'status-inactive' : '');

    return (
        <tr>
            <td>
                <span className="user-name-clickable" onClick={() => onNameClick(user)}>
                    <i className="fas fa-user-circle user-icon"></i>{user.name}
                </span>
            </td>
            <td>{user.email}</td>
            {type === 'all' && <td>{user.accountType}</td>} {/* Render Account Type only for 'all' tab */}
            <td className={statusClass}>
                <span className="status-dot"></span>{user.status}
            </td>
            {type === 'all' && <td>{user.userSince}</td>} {/* Render User Since only for 'all' tab */}
            {type === 'pending' && <td>{user.renewalDate}</td>} {/* Render Renewal Date only for 'pending' tab */}
            {type === 'pending' && ( // Render Documents and Transactions only for 'pending' tab
                <>
                    <td><button className="doc-action-button view-button">VIEW</button></td>
                    <td><button className="action-button view-button">VIEW</button></td>
                </>
            )}
            {type === 'all' && ( // Render Action button only for 'all' tab
                <td>
                    <button
                        className={`action-button ${user.status === 'Active' ? 'suspend-button' : 'unsuspend-button'}`}
                        onClick={() => onAction(user.id, user.status)}
                    >
                        {user.status === 'Active' ? 'Suspend' : 'Unsuspend'}
                    </button>
                </td>
            )}
        </tr>
    );
};

// User Accounts Content Component - MANAGE MODAL STATE AND TAB CONTENT HERE
const UserAccountsContent = () => {
    const [accounts, setAccounts] = useState(initialUserAccounts);
    const [pendingAccounts, setPendingAccounts] = useState(pendingApprovalAccounts); // Use NEW mock data
    const [activeTab, setActiveTab] = useState('ALL_ACCOUNTS');
    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const handleAction = (userId, currentStatus) => {
        setAccounts(prevAccounts =>
            prevAccounts.map(user =>
                user.id === userId
                    ? { ...user, status: currentStatus === 'Active' ? 'Inactive' : 'Active' }
                    : user
            )
        );
        console.log(`Action: User ${userId} status changed to ${currentStatus === 'Active' ? 'Inactive' : 'Active'}`);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // Filter logic for ALL ACCOUNTS
    const filteredAllAccounts = accounts.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter logic for PENDING APPROVAL ACCOUNTS
    const filteredPendingAccounts = pendingAccounts.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (user) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    return (
        <>
            <div className="admin-dashboard-main-content-area">
                <header className="admin-header">
                    <h1 className="admin-page-title">USER ACCOUNTS</h1>
                    <div className="admin-search-bar">
                        <input
                            type="text"
                            placeholder="Search by username, email, or name"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                        <i className="fas fa-search"></i>
                    </div>
                </header>
            </div>

            <div className="admin-tabs">
                <button
                    className={`tab-button ${activeTab === 'ALL_ACCOUNTS' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ALL_ACCOUNTS')}
                >
                    ALL ACCOUNTS
                </button>
                <button
                    className={`tab-button ${activeTab === 'PENDING_APPROVAL' ? 'active' : ''}`}
                    onClick={() => setActiveTab('PENDING_APPROVAL')}
                >
                    PENDING APPROVAL
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            {activeTab === 'ALL_ACCOUNTS' && <th>Account Type</th>} {/* Conditional Header */}
                            <th>Status</th>
                            {activeTab === 'ALL_ACCOUNTS' && <th>User Since</th>} {/* Conditional Header */}
                            {activeTab === 'PENDING_APPROVAL' && <th>Renewal Date</th>} {/* Conditional Header */}
                            {activeTab === 'PENDING_APPROVAL' && <th>Documents</th>} {/* Conditional Header */}
                            {activeTab === 'PENDING_APPROVAL' && <th>Transactions</th>} {/* Conditional Header */}
                            {activeTab === 'ALL_ACCOUNTS' && <th>Action</th>} {/* Conditional Header */}
                        </tr>
                    </thead>
                    <tbody>
                        {activeTab === 'ALL_ACCOUNTS' && filteredAllAccounts.length > 0 ? (
                            filteredAllAccounts.map(user => (
                                <UserAccountRow
                                    key={user.id}
                                    user={user}
                                    onAction={handleAction}
                                    onNameClick={handleOpenModal}
                                    type="all" // Pass type to row component
                                />
                            ))
                        ) : activeTab === 'PENDING_APPROVAL' && filteredPendingAccounts.length > 0 ? ( // Use filteredPendingAccounts
                            filteredPendingAccounts.map(user => (
                                <UserAccountRow
                                    key={user.id}
                                    user={user}
                                    onAction={handleAction} // Still pass, though not used for current actions in 'pending'
                                    onNameClick={handleOpenModal}
                                    type="pending" // Pass type to row component
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={activeTab === 'ALL_ACCOUNTS' ? '6' : '5'} className="no-data-message"> {/* Adjust colspan */}
                                    {activeTab === 'ALL_ACCOUNTS' ? 'No user accounts found.' : 'No accounts pending approval.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="pagination">
                    <button>&lt;</button>
                    <span>Page 1/5</span>
                    <button>&gt;</button>
                </div>
            </div>

            {showModal && (
                <UserDetailModal
                    user={selectedUser}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};


// AdminDashboard Main Component
const AdminDashboard = () => {
    // Set initial view to 'dashboard' or 'userAccounts' based on your preference.
    // 'myProfile' might be a good default too.
    const [currentView, setCurrentView] = useState('dashboard');

    return (
        <div className="admin-dashboard-page">
            <AdminSidebar currentView={currentView} onNavigate={setCurrentView} />
            <div className="admin-main-content">
                {currentView === 'myProfile' && <AdminProfile />}
                {currentView === 'dashboard' && <AdminStatDashboard />}
                {currentView === 'userAccounts' && <UserAccountsContent />}
                {currentView === 'mealPlans' && <AdminMealPlans />}
                {currentView === 'exportReport' && <AdminExportReport />}
                {currentView === 'editWebsite' && <MarketingWebsiteEditorPage />} {/* <--- NEW: Render MarketingWebsiteEditorPage */}
                {currentView === 'userFeedbacks' && <UserFeedbacksPage />}
            </div>
        </div>
    );
};

export default AdminDashboard;