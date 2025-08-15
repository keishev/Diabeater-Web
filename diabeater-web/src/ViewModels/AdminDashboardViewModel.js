
import { makeAutoObservable, runInAction } from 'mobx';
import { getAuth } from 'firebase/auth';
import nutritionistApplicationRepository from '../Repositories/NutritionistApplicationRepository';
import userAccountsViewModel from './UserAccountsViewModel';
import premiumAccountsViewModelInstance from './PremiumAccountsViewModel';

class AdminDashboardViewModel {
    
    pendingAccounts = [];

    
    activeTab = 'ALL_ACCOUNTS';
    currentView = 'dashboard';

    
    selectedUser = null;
    showUserDetailModal = false;
    showRejectionReasonModal = false;
    rejectionReason = '';

    
    isLoading = false;
    error = '';

    userAccountsVM = userAccountsViewModel;
    premiumAccountsVM = premiumAccountsViewModelInstance;

    constructor() {
        makeAutoObservable(this);
    }

    
    formatDate(timestamp, format = 'short') {
        if (!timestamp) return 'N/A';
        
        let date;
        if (timestamp && typeof timestamp.toDate === 'function') {
            
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

    
   
get filteredPendingAccounts() {
    const lowerCaseSearchTerm = this.userAccountsVM.searchTerm.toLowerCase();
    
    return this.pendingAccounts.filter(user => {
        
        const fullName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`.toLowerCase()
            : '';
        
        
        const reverseName = user.firstName && user.lastName 
            ? `${user.lastName} ${user.firstName}`.toLowerCase()
            : '';
        
        
        return (
            
            (user.firstName?.toLowerCase().includes(lowerCaseSearchTerm)) ||
            
            (user.lastName?.toLowerCase().includes(lowerCaseSearchTerm)) ||
            
            fullName.includes(lowerCaseSearchTerm) ||
      
            reverseName.includes(lowerCaseSearchTerm) ||
       
            (user.email?.toLowerCase().includes(lowerCaseSearchTerm))
        );
    });
}

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
                        
                        appliedDate: this.formatDate(n.appliedDate || n.createdAt, 'short'),
                        signedUpAt: this.formatDate(n.appliedDate || n.createdAt, 'long') 
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

   approveNutritionist = async (userId) => {
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
            console.error("APPROVE_NUTRITIONIST_CALL: No user logged in.");
            this.setError("Failed to approve: No user logged in. Please log in.");
            
            const errorMessage = "Please log in as an administrator to approve.";
            if (window.showError) {
                window.showError(errorMessage);
            } else {
                alert(errorMessage); 
            }
            return;
        }

   
        const idTokenResult = await user.getIdTokenResult(true);
        if (idTokenResult.claims.admin !== true) {
            console.warn("APPROVE_NUTRITIONIST_CALL: User is not an admin. Access denied.");
            this.setError("Access Denied: You must be an administrator to approve accounts.");
            
            const errorMessage = "Access Denied: You must be an administrator to approve accounts.";
            if (window.showError) {
                window.showError(errorMessage);
            } else {
                alert(errorMessage); 
            }
            return;
        }

        console.log(`Admin ${user.uid} attempting to approve nutritionist ${userId}`);

   
        const result = await nutritionistApplicationRepository.approveNutritionist(userId);
        
        runInAction(() => {
 
            this.setPendingAccounts(this.pendingAccounts.filter(u => u.id !== userId));
          
            this.userAccountsVM.fetchAccounts();
   
            this.setShowUserDetailModal(false);
            this.setSelectedUser(null);
        });

    
        const successMessage = result.emailSent 
            ? "Nutritionist account has been approved and notification email sent!"
            : "Nutritionist account has been approved! (Note: Email notification may have failed)";
        
        if (window.showSuccess) {
            window.showSuccess(successMessage);
        } else {
            alert(successMessage);
        }
        
        console.log("Nutritionist approved successfully:", userId, result);
        
    } catch (error) {
        console.error("Error approving nutritionist:", error);
        this.setError(`Failed to approve: ${error.message}`);
        
        const errorMessage = `Failed to approve user: ${error.message}`;
        if (window.showError) {
            window.showError(errorMessage);
        } else {
            alert(errorMessage); 
        }
    } finally {
        runInAction(() => {
            this.setLoading(false);
        });
    }
}

rejectNutritionist = async (userId) => {
    if (!userId) {
        this.setError("Invalid user ID");
        return;
    }

    if (!this.rejectionReason.trim()) {
        this.setError("Please provide a reason for rejection");
        
        const errorMessage = "Please provide a reason for rejection";
        if (window.showError) {
            window.showError(errorMessage);
        } else {
            alert(errorMessage);
        }
        return;
    }

    this.setLoading(true);
    this.setError('');
    
    try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            console.error("REJECT_NUTRITIONIST_CALL: No user logged in.");
            this.setError("Failed to reject: No user logged in. Please log in.");
            
            const errorMessage = "Please log in as an administrator to reject.";
            if (window.showError) {
                window.showError(errorMessage);
            } else {
                alert(errorMessage); 
            }
            return;
        }
        const idTokenResult = await user.getIdTokenResult(true);
        if (idTokenResult.claims.admin !== true) {
            console.warn("REJECT_NUTRITIONIST_CALL: User is not an admin. Access denied.");
            this.setError("Access Denied: You must be an administrator to reject accounts.");
            
            const errorMessage = "Access Denied: You must be an administrator to reject accounts.";
            if (window.showError) {
                window.showError(errorMessage);
            } else {
                alert(errorMessage);
            }
            return;
        }

        console.log(`Admin ${user.uid} attempting to reject nutritionist ${userId} with reason: ${this.rejectionReason}`);

        const result = await nutritionistApplicationRepository.rejectNutritionist(userId, this.rejectionReason);
        
        runInAction(() => {
       
            this.setPendingAccounts(this.pendingAccounts.filter(u => u.id !== userId));
         
            this.userAccountsVM.fetchAccounts();
     
            this.setShowRejectionReasonModal(false);
            this.setShowUserDetailModal(false);
            this.setRejectionReason('');
            this.setSelectedUser(null);
        });

       
        const successMessage = result.emailSent 
            ? "Nutritionist application has been rejected and notification email sent!"
            : "Nutritionist application has been rejected! (Note: Email notification may have failed)";
        
        if (window.showSuccess) {
            window.showSuccess(successMessage);
        } else {
            alert(successMessage); 
        }
        
        console.log("Nutritionist rejected successfully:", userId, result);
        
    } catch (error) {
        console.error("Error rejecting nutritionist:", error);
        this.setError(`Failed to reject: ${error.message}`);
        
        const errorMessage = `Failed to reject user: ${error.message}`;
        if (window.showError) {
            window.showError(errorMessage);
        } else {
            alert(errorMessage); 
        }
    } finally {
        runInAction(() => {
            this.setLoading(false);
        });
    }
}
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