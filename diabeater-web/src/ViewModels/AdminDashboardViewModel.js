// src/ViewModels/AdminDashboardViewModel.js
import { makeAutoObservable, runInAction } from 'mobx';
import nutritionistRepository from '../Repositories/NutritionistRepository';
import { getAuth } from 'firebase/auth';

class AdminDashboardViewModel {
    allAccounts = []; // This will be populated from Firestore or combined with other data
    pendingAccounts = [];
    activeTab = 'ALL_ACCOUNTS';
    searchTerm = '';
    selectedUser = null;
    showUserDetailModal = false;
    showRejectionReasonModal = false;
    rejectionReason = '';
    isLoading = false;
    error = '';
    currentView = 'dashboard';

    constructor() {
        makeAutoObservable(this);
        // We will fetch initial data when the AdminDashboard component mounts
        // rather than directly in the constructor, allowing for more control
        // and potential dependency injection of mock data if needed for testing.
    }

    setAllAccounts(accounts) {
        this.allAccounts = accounts;
    }

    setPendingAccounts(accounts) {
        this.pendingAccounts = accounts;
    }

    setActiveTab(tab) {
        this.activeTab = tab;
    }

    setSearchTerm(term) {
        this.searchTerm = term;
    }

    setSelectedUser(user) {
        this.selectedUser = user;
    }

    setShowUserDetailModal(value) {
        this.showUserDetailModal = value;
    }

    setShowRejectionReasonModal(value) {
        this.showRejectionReasonModal = value;
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

    setCurrentView(view) {
        this.currentView = view;
    }

    // --- Data Fetching ---
    async fetchAccounts() {
        this.setLoading(true);
        this.setError('');
        try {
            // Fetch all nutritionists (including pending, approved, rejected)
            const allNutritionistsFromFirestore = await nutritionistRepository.firestoreService.getAllNutritionists();

            runInAction(() => {
                // Set pending accounts directly from Firestore results
                this.setPendingAccounts(allNutritionistsFromFirestore.filter(n => n.status === 'pending'));

                // Transform approved nutritionists for the 'ALL_ACCOUNTS' tab display
                const approvedNutritionistsDisplay = allNutritionistsFromFirestore
                    .filter(n => n.status === 'approved')
                    .map(n => ({
                        id: n.id,
                        name: `${n.firstName} ${n.lastName}`, // Combine first and last name
                        email: n.email,
                        accountType: 'Nutritionist', // Explicitly set type for display
                        status: 'Active', // Approved nutritionists are 'Active' from admin's perspective
                        userSince: n.createdAt ? n.createdAt.toLocaleDateString('en-SG') : 'N/A', // Format date, consider locale
                        uid: n.id,
                    }));

                // For 'ALL_ACCOUNTS', you currently have a static `initialUserAccounts` in AdminDashboard.js.
                // You need to decide how to merge this.
                // Option 1 (Better long-term): Fetch ALL non-nutritionist users from THEIR Firestore collection too.
                // Option 2 (Temp fix): Keep `initialUserAccounts` in AdminDashboard.js and pass it,
                // or define a minimal set of mock non-nutritionists here.
                // Let's assume you'll eventually fetch *all* user types from Firestore.
                // For now, we'll simulate by filtering out nutritionist types from the *original mock data* if it was passed in.
                // **However, the ViewModel should ideally be self-contained for its data.**
                // Let's simplify for the ViewModel: `allAccounts` will be composed *only* of approved nutritionists
                // for now, unless you pass in other mock data or fetch it.

                // To resolve the `initialUserAccounts` error directly in this ViewModel:
                // If you intend for `allAccounts` to *only* show approved nutritionists, then:
                this.setAllAccounts(approvedNutritionistsDisplay);
                // If you need to combine it with other mock data, you'd need to either:
                // A) Import `initialUserAccounts` from a shared mock data file.
                // B) Define a separate mock data source (e.g., `mockNonNutritionistUsers`) here.
                // For this scenario, let's assume `allAccounts` will primarily be *dynamically fetched*.
                // If the `initialUserAccounts` (non-nutritionists) are still needed for display,
                // you will need to manage that data source appropriately, perhaps passing it into the ViewModel
                // during its creation in `AdminDashboard.js` or having the ViewModel fetch it from a "users" collection.

                // Given the error, the simplest *immediate* fix without breaking too much logic is to
                // ensure `initialUserAccounts` is accessible or `allAccounts` is correctly built.
                // I will add a placeholder mock data within the ViewModel for `nonNutritionistUsers` to ensure `allAccounts` can be built.
                // In a real app, these would come from Firestore.
                const mockNonNutritionistUsers = [
                    { id: '1', name: 'John Doe', email: 'johndoe@gmail.com', accountType: 'System Admin', status: 'Active', userSince: '01/01/2025', uid: 'ADMN001' },
                    { id: '2', name: 'Matilda Swayne', email: 'matildaswayne@gmail.com', accountType: 'Premium User', status: 'Active', userSince: '01/01/2025', uid: 'PREM002' },
                    // ... include other non-nutritionist mock data you want to display initially if not coming from Firestore
                ];

                // Combine mock non-nutritionists with dynamically fetched approved nutritionists
                this.setAllAccounts([...mockNonNutritionistUsers, ...approvedNutritionistsDisplay]);

            });

        } catch (e) {
            runInAction(() => {
                this.setError(`Failed to fetch accounts: ${e.message}`);
                console.error("Error fetching accounts:", e);
            });
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }

    // --- Admin Actions ---
    async approveNutritionist(userId) {
        this.setLoading(true);
        this.setError('');
        try {
            await nutritionistRepository.approveNutritionist(userId);
            runInAction(() => {
                // Remove from pending, add to all accounts (or re-fetch)
                this.pendingAccounts = this.pendingAccounts.filter(n => n.id !== userId);
                this.fetchAccounts(); // Re-fetch all accounts to reflect changes
                alert('Nutritionist approved and email sent!');
            });
        } catch (e) {
            runInAction(() => {
                this.setError(`Failed to approve nutritionist: ${e.message}`);
            });
            alert(`Failed to approve: ${e.message}`);
        } finally {
            runInAction(() => {
                this.setLoading(false);
                this.setShowUserDetailModal(false); // Close modal
            });
        }
    }

    async rejectNutritionist(userId) {
        if (!this.rejectionReason) {
            this.setError('Please provide a reason for rejection.');
            return;
        }
        this.setLoading(true);
        this.setError('');
        try {
            await nutritionistRepository.rejectNutritionist(userId, this.rejectionReason);
            runInAction(() => {
                // Remove from pending (or re-fetch)
                this.pendingAccounts = this.pendingAccounts.filter(n => n.id !== userId);
                this.fetchAccounts(); // Re-fetch all accounts
                alert('Nutritionist rejected and email sent!');
            });
        } catch (e) {
            runInAction(() => {
                this.setError(`Failed to reject nutritionist: ${e.message}`);
            });
            alert(`Failed to reject: ${e.message}`);
        } finally {
            runInAction(() => {
                this.setLoading(false);
                this.setShowUserDetailModal(false); // Close modal
                this.setShowRejectionReasonModal(false); // Close rejection modal
                this.setRejectionReason('');
            });
        }
    }

    async viewCertificate(userId) {
        this.setLoading(true);
        this.setError('');
        try {
            const url = await nutritionistRepository.getNutritionistCertificateUrl(userId);
            if (url) {
                window.open(url, '_blank'); // Open PDF in a new tab
            } else {
                alert('Certificate not found.');
            }
        } catch (e) {
            runInAction(() => {
                this.setError(`Failed to retrieve certificate: ${e.message}`);
            });
            alert(`Failed to retrieve certificate: ${e.message}`);
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }

    // --- Authentication related logic for Admin Login ---
    async checkAdminStatus() {
        const auth = getAuth();
        return new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged(async (user) => {
                if (user) {
                    try {
                        const idTokenResult = await user.getIdTokenResult(true);
                        runInAction(() => {
                            if (idTokenResult.claims.admin) {
                                console.log('Admin user logged in:', user.email);
                                resolve(true); // Is an admin
                            } else {
                                console.log('User is not an admin:', user.email);
                                resolve(false); // Not an admin
                            }
                        });
                    } catch (error) {
                        console.error("Error getting ID token result:", error);
                        runInAction(() => {
                            this.setError("Authentication error: Could not verify admin status.");
                            resolve(false);
                        });
                    }
                } else {
                    console.log('No user logged in.');
                    runInAction(() => {
                        this.setError("No user logged in. Please log in as an admin.");
                        resolve(false); // No user
                    });
                }
                unsubscribe(); // Stop listening after initial check
            });
        });
    }

    // Filtered lists for the UI
    get filteredAllAccounts() {
        return this.allAccounts.filter(user =>
            user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
    }

    get filteredPendingAccounts() {
        return this.pendingAccounts.filter(user =>
            user.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            user.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
    }
}

// Instantiate the ViewModel
export default new AdminDashboardViewModel();