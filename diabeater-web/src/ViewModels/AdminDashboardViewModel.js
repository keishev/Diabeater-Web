import { makeAutoObservable, runInAction } from 'mobx';
import { getAuth } from 'firebase/auth';
import nutritionistApplicationRepository from '../Repositories/NutritionistApplicationRepository';
import UserRepository from '../Repositories/UserRepository'; // Still needed if used directly within this VM, though not explicitly called here
import UserAccountsViewModel from './UserAccountsViewModel'; 

/**
 * AdminDashboardViewModel
 * Manages the overall state and logic for the admin dashboard.
 * It now delegates general user account management (fetching, searching, suspending)
 * to the UserAccountsViewModel. It retains responsibility for nutritionist-specific
 * approvals and rejections, and overall dashboard navigation.
 */
class AdminDashboardViewModel {
    // State for pending nutritionist applications
    pendingAccounts = [];

    // Overall dashboard UI state
    activeTab = 'ALL_ACCOUNTS'; // Controls which tab is active: 'ALL_ACCOUNTS' or 'PENDING_APPROVAL'
    currentView = 'dashboard'; // Can be used for larger navigation within the admin panel

    // Modals and selected user state
    selectedUser = null;
    showUserDetailModal = false;
    showRejectionReasonModal = false;
    rejectionReason = ''; // For nutritionist rejection

    // Loading and error states
    isLoading = false; // General loading state for dashboard operations
    error = '';

    // Delegate for all user accounts management
    userAccountsVM = UserAccountsViewModel;

    constructor() {
        makeAutoObservable(this);
        // Initialize UserAccountsViewModel to fetch all users on startup, or when needed
        // this.userAccountsVM.fetchAccounts(); // Can be called here or in a React useEffect
    }

    // --- State Setters ---
    setPendingAccounts(accounts) {
        this.pendingAccounts = accounts;
    }

    setActiveTab(tab) {
        this.activeTab = tab;
    }

    setCurrentView(view) {
        this.currentView = view;
        // When navigating to userAccounts view, ensure latest data is fetched
        if (view === 'userAccounts') {
            this.userAccountsVM.fetchAccounts();
        }
    }

    setSelectedUser(user) {
        this.selectedUser = user;
        this.error = ''; // Clear previous errors
        this.rejectionReason = ''; // Clear previous rejection reason
    }

    setShowUserDetailModal(value) {
        this.showUserDetailModal = value;
        if (!value) {
            this.selectedUser = null; // Clear selected user when modal closes
            this.setError(''); // Clear any modal-related errors
        }
    }

    setShowRejectionReasonModal(value) {
        this.showRejectionReasonModal = value;
        if (!value) {
            this.rejectionReason = ''; // Clear rejection reason when modal closes
        }
    }

    setRejectionReason(reason) {
        this.rejectionReason = reason;
    }

    setLoading(value) {
        this.isLoading = value;
    }

    setError(message) {
        this.error = message;
    }

    // --- Computed Properties ---
    get filteredPendingAccounts() {
        const lowerCaseSearchTerm = this.userAccountsVM.searchTerm.toLowerCase(); // Use the search term from UserAccountsViewModel
        return this.pendingAccounts.filter(user =>
            (user.firstName?.toLowerCase().includes(lowerCaseSearchTerm) ||
             user.lastName?.toLowerCase().includes(lowerCaseSearchTerm) ||
             user.email.toLowerCase().includes(lowerCaseSearchTerm))
        );
    }

    /**
     * Fetches both pending nutritionist accounts and all general user accounts.
     * The latter is delegated to UserAccountsViewModel.
     */
    fetchAccounts = async () => { // Converted to arrow function
        this.setLoading(true);
        this.setError('');
        try {
            // Fetch pending nutritionist accounts
            const allNutritionistsFromFirestore = await nutritionistApplicationRepository.getAllNutritionists() || [];

            runInAction(() => {
                const pending = allNutritionistsFromFirestore.filter(n => n.status === 'pending').map(n => ({
                    ...n,
                    id: n.id, // Assuming 'id' is part of the nutritionist data
                    name: `${n.firstName} ${n.lastName}`,
                    // Ensure 'createdAt' is a Date object or convert it if it's a string
                    appliedDate: n.createdAt ? 
                                 (new Date(n.createdAt)).toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' }) : 
                                 'N/A',
                }));
                this.setPendingAccounts(pending);
            });

            // Trigger fetch for all general user accounts via UserAccountsViewModel
            await this.userAccountsVM.fetchAccounts();

        } catch (error) {
            console.error("Error fetching accounts in AdminDashboardViewModel:", error);
            this.setError(`Failed to fetch accounts: ${error.message}`);
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }

    /**
     * Approves a pending nutritionist.
     * Updates Firestore, sets custom claims, and revokes tokens.
     */
    approveNutritionist = async (userId) => { // Converted to arrow function
        this.setLoading(true);
        this.setError('');
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                console.error("APPROVE_NUTRITIONIST_CALL: No user logged in.");
                this.setError("Failed to approve: No user logged in. Please log in.");
                alert("Please log in as an administrator to approve.");
                return;
            }

            const idTokenResult = await user.getIdTokenResult(true); // Force refresh token
            if (idTokenResult.claims.admin !== true) {
                console.warn("APPROVE_NUTRITIONIST_CALL: User is not an admin. Access denied.");
                this.setError("Access Denied: You must be an administrator to approve accounts.");
                alert("Access Denied: You must be an administrator to approve accounts.");
                return;
            }

            const result = await nutritionistApplicationRepository.approveNutritionist(userId);
            runInAction(() => {
                this.setPendingAccounts(this.pendingAccounts.filter(u => u.id !== userId));
                // Re-fetch all accounts in UserAccountsViewModel to reflect the status change
                this.userAccountsVM.fetchAccounts();
                this.setShowUserDetailModal(false);
                alert("Nutritionist account has been approved!");
            });
            console.log("Approved nutritionist:", userId, result);
        } catch (error) {
            console.error("Error approving nutritionist:", error);
            this.setError(`Failed to approve: ${error.message}`);
            alert(`Failed to approve user: ${error.message}`);
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }

    /**
     * Rejects a pending nutritionist.
     * Updates Firestore, removes/modifies custom claims, and revokes tokens.
     */
    rejectNutritionist = async (userId) => { // Converted to arrow function
        this.setLoading(true);
        this.setError('');
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                console.error("REJECT_NUTRITIONIST_CALL: No user logged in.");
                this.setError("Failed to reject: No user logged in. Please log in.");
                alert("Please log in as an administrator to reject.");
                return;
            }

            const idTokenResult = await user.getIdTokenResult(true); // Force refresh token
            if (idTokenResult.claims.admin !== true) {
                console.warn("REJECT_NUTRITIONIST_CALL: User is not an admin. Access denied.");
                this.setError("Access Denied: You must be an administrator to reject accounts.");
                alert("Access Denied: You must be an administrator to reject accounts.");
                return;
            }

            const result = await nutritionistApplicationRepository.rejectNutritionist(userId, this.rejectionReason);
            runInAction(() => {
                this.setPendingAccounts(this.pendingAccounts.filter(u => u.id !== userId));
                // Re-fetch all accounts in UserAccountsViewModel to reflect the status change
                this.userAccountsVM.fetchAccounts();
                this.setShowRejectionReasonModal(false);
                this.setShowUserDetailModal(false);
                this.setRejectionReason('');
                alert("Nutritionist account has been rejected!");
            });
            console.log("Rejected nutritionist:", userId, result);
        } catch (error) {
            console.error("Error rejecting nutritionist:", error);
            this.setError(`Failed to reject: ${error.message}`);
            alert(`Failed to reject user: ${error.message}`);
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }

    /**
     * Fetches a signed URL for a nutritionist's certificate from Firebase Storage.
     */
    viewCertificate = async (userId) => { // Converted to arrow function
        this.setLoading(true);
        this.setError('');
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                console.error("VIEW_CERTIFICATE_CALL: No user logged in.");
                this.setError("Failed to fetch certificate: No user logged in. Please log in.");
                alert("Please log in to view the certificate.");
                return;
            }

            const idTokenResult = await user.getIdTokenResult(true);
            if (idTokenResult.claims.admin !== true) {
                console.warn("VIEW_CERTIFICATE_CALL: User is not an admin. Access denied.");
                this.setError("Access Denied: You must be an administrator to view this certificate.");
                alert("Access Denied: You must be an administrator to view this certificate.");
                return;
            }

            const url = await nutritionistApplicationRepository.getNutritionistCertificateUrl(userId);
            if (url) {
                window.open(url, '_blank');
            } else {
                this.setError("Certificate URL not found.");
                alert("Certificate URL not found for this user.");
            }
        } catch (error) {
            console.error("Error fetching certificate URL:", error);
            this.setError(`Failed to fetch certificate: ${error.message}`);
            alert(`Failed to fetch certificate: ${error.message}`);
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }

    /**
     * Checks if the currently logged-in user has admin claims.
     * Useful for conditional rendering of admin-only UI elements.
     */
    checkAdminStatus = async () => { // Converted to arrow function
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                console.log("AdminDashboardViewModel: No user logged in.");
                return false;
            }

            const idTokenResult = await user.getIdTokenResult(true);
            if (idTokenResult.claims.admin === true) {
                console.log("AdminDashboardViewModel: User is authenticated as an admin.");
                return true;
            } else {
                console.log("AdminDashboardViewModel: User does not have admin claims.", idTokenResult.claims);
                return false;
            }
        } catch (error) {
            console.error("AdminDashboardViewModel: Error checking admin status:", error);
            return false;
        }
    }
}

export default new AdminDashboardViewModel();