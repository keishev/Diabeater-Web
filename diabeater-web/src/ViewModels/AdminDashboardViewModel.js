// src/ViewModels/AdminDashboardViewModel.js
import { makeAutoObservable, runInAction } from 'mobx';
import { getAuth } from 'firebase/auth';
import nutritionistApplicationRepository from '../Repositories/NutritionistApplicationRepository';
import userAccountsViewModel from './UserAccountsViewModel';
import premiumAccountsViewModelInstance from './PremiumAccountsViewModel';

class AdminDashboardViewModel {
    // State for pending nutritionist applications
    pendingAccounts = [];

    // Overall dashboard UI state
    activeTab = 'ALL_ACCOUNTS';
    currentView = 'dashboard';

    // Modals and selected user state
    selectedUser = null;
    showUserDetailModal = false;
    showRejectionReasonModal = false;
    rejectionReason = '';

    // Loading and error states
    isLoading = false;
    error = '';

    userAccountsVM = userAccountsViewModel;
    premiumAccountsVM = premiumAccountsViewModelInstance;

    constructor() {
        makeAutoObservable(this);
    }

    // Helper method to format dates consistently
    formatDate(timestamp, format = 'short') {
        if (!timestamp) return 'N/A';
        
        let date;
        if (timestamp && typeof timestamp.toDate === 'function') {
            // Firestore Timestamp
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else {
            return 'N/A';
        }

        if (isNaN(date.getTime())) {
            return 'N/A';
        }

        if (format === 'short') {
            return date.toLocaleDateString('en-SG', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } else if (format === 'long') {
            return date.toLocaleDateString('en-SG', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
        
        return date.toLocaleDateString('en-SG');
    }

    // --- State Setters ---
    setPendingAccounts = (accounts) => {
        this.pendingAccounts = accounts;
    }

    setActiveTab = (tab) => {
        this.activeTab = tab;
    }

    setCurrentView = (view) => {
        this.currentView = view;
        if (view === 'userAccounts') {
            this.userAccountsVM.fetchAccounts();
        } else if (view === 'premiumAccounts') {
            this.premiumAccountsVM.fetchPremiumUsers();
        }
    }

    setSelectedUser = (user) => {
        this.selectedUser = user;
        this.error = '';
        this.rejectionReason = '';
    }

    setShowUserDetailModal = (value) => {
        this.showUserDetailModal = value;
        if (!value) {
            this.selectedUser = null;
            this.setError('');
        }
    }

    setShowRejectionReasonModal = (value) => {
        this.showRejectionReasonModal = value;
        if (!value) {
            this.rejectionReason = '';
        }
    }

    setRejectionReason = (reason) => {
        this.rejectionReason = reason;
    }

    setLoading = (value) => {
        this.isLoading = value;
    }

    setError = (message) => {
        this.error = message;
    }

    // --- Computed Properties ---
    get filteredPendingAccounts() {
        const lowerCaseSearchTerm = this.userAccountsVM.searchTerm.toLowerCase();
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
    fetchAccounts = async () => {
        this.setLoading(true);
        this.setError('');
        try {
            const allNutritionistsFromFirestore = await nutritionistApplicationRepository.getAllNutritionists() || [];

            runInAction(() => {
                const pending = allNutritionistsFromFirestore
                    .filter(n => n.status === 'pending')
                    .map(n => ({
                        ...n,
                        id: n.id,
                        name: `${n.firstName} ${n.lastName}`,
                        // Use appliedDate first, then fallback to createdAt
                        appliedDate: this.formatDate(n.appliedDate || n.createdAt, 'short'),
                        signedUpAt: this.formatDate(n.appliedDate || n.createdAt, 'long') // For display in modal
                    }));
                this.setPendingAccounts(pending);
            });

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
     * Updates Firestore, sets custom claims, and sends approval email.
     */
    approveNutritionist = async (userId) => {
        if (!userId) {
            this.setError("Invalid user ID");
            return;
        }

        this.setLoading(true);
        this.setError('');
        
        try {
            // Check admin authentication
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                console.error("APPROVE_NUTRITIONIST_CALL: No user logged in.");
                this.setError("Failed to approve: No user logged in. Please log in.");
                alert("Please log in as an administrator to approve.");
                return;
            }

            // Verify admin privileges
            const idTokenResult = await user.getIdTokenResult(true);
            if (idTokenResult.claims.admin !== true) {
                console.warn("APPROVE_NUTRITIONIST_CALL: User is not an admin. Access denied.");
                this.setError("Access Denied: You must be an administrator to approve accounts.");
                alert("Access Denied: You must be an administrator to approve accounts.");
                return;
            }

            console.log(`Admin ${user.uid} attempting to approve nutritionist ${userId}`);

            // Call the repository method which handles database updates and email sending
            const result = await nutritionistApplicationRepository.approveNutritionist(userId);
            
            runInAction(() => {
                // Remove from pending accounts
                this.setPendingAccounts(this.pendingAccounts.filter(u => u.id !== userId));
                // Refresh all accounts to show the updated status
                this.userAccountsVM.fetchAccounts();
                // Close modals
                this.setShowUserDetailModal(false);
                this.setSelectedUser(null);
            });

            // Show success message
            const successMessage = result.emailSent 
                ? "Nutritionist account has been approved and notification email sent!"
                : "Nutritionist account has been approved! (Note: Email notification may have failed)";
            alert(successMessage);
            
            console.log("Nutritionist approved successfully:", userId, result);
            
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
     * Updates Firestore, removes user account, and sends rejection email.
     */
    rejectNutritionist = async (userId) => {
        if (!userId) {
            this.setError("Invalid user ID");
            return;
        }

        if (!this.rejectionReason.trim()) {
            this.setError("Please provide a reason for rejection");
            alert("Please provide a reason for rejection");
            return;
        }

        this.setLoading(true);
        this.setError('');
        
        try {
            // Check admin authentication
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                console.error("REJECT_NUTRITIONIST_CALL: No user logged in.");
                this.setError("Failed to reject: No user logged in. Please log in.");
                alert("Please log in as an administrator to reject.");
                return;
            }

            // Verify admin privileges
            const idTokenResult = await user.getIdTokenResult(true);
            if (idTokenResult.claims.admin !== true) {
                console.warn("REJECT_NUTRITIONIST_CALL: User is not an admin. Access denied.");
                this.setError("Access Denied: You must be an administrator to reject accounts.");
                alert("Access Denied: You must be an administrator to reject accounts.");
                return;
            }

            console.log(`Admin ${user.uid} attempting to reject nutritionist ${userId} with reason: ${this.rejectionReason}`);

            // Call the repository method which handles database updates and email sending
            const result = await nutritionistApplicationRepository.rejectNutritionist(userId, this.rejectionReason);
            
            runInAction(() => {
                // Remove from pending accounts
                this.setPendingAccounts(this.pendingAccounts.filter(u => u.id !== userId));
                // Refresh all accounts (though the user should be deleted)
                this.userAccountsVM.fetchAccounts();
                // Close modals and reset form
                this.setShowRejectionReasonModal(false);
                this.setShowUserDetailModal(false);
                this.setRejectionReason('');
                this.setSelectedUser(null);
            });

            // Show success message
            const successMessage = result.emailSent 
                ? "Nutritionist account has been rejected and notification email sent!"
                : "Nutritionist account has been rejected! (Note: Email notification may have failed)";
            alert(successMessage);
            
            console.log("Nutritionist rejected successfully:", userId, result);
            
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
    viewCertificate = async (userId) => {
        if (!userId) {
            this.setError("Invalid user ID");
            return;
        }

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
    checkAdminStatus = async () => {
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