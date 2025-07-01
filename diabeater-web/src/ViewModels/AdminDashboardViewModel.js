// src/ViewModels/AdminDashboardViewModel.js

import { makeAutoObservable, runInAction } from 'mobx';
import nutritionistRepository from '../Repositories/NutritionistApplicationRepository';
import { getAuth } from 'firebase/auth'; // Ensure getAuth is imported

class AdminDashboardViewModel {
    allAccounts = [];
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

    mockNonNutritionistUsers = [
        { id: 'user_john_doe', name: 'John Doe', email: 'johndoe@gmail.com', accountType: 'System Admin', status: 'Active', userSince: 'Jan 1, 2024' },
        { id: 'user_matilda_s', name: 'Matilda Swayne', email: 'matildaswayne@gmail.com', accountType: 'Premium User', status: 'Active', userSince: 'Jan 15, 2024' },
        { id: 'user_sarah_c', name: 'Sarah Connor', email: 'sarah.c@example.com', accountType: 'Basic User', status: 'Active', userSince: 'Feb 1, 2024' },
        { id: 'user_mike_r', name: 'Mike Ross', email: 'mike.r@example.com', accountType: 'Basic User', status: 'Active', userSince: 'Mar 10, 2024' },
        { id: 'user_lisa_d', name: 'Lisa Davis', email: 'lisa.d@example.com', accountType: 'Premium User', status: 'Inactive', userSince: 'Apr 5, 2024' },
    ];

    constructor() {
        makeAutoObservable(this);
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
        this.error = '';
        this.rejectionReason = '';
    }

    setShowUserDetailModal(value) {
        this.showUserDetailModal = value;
        if (!value) {
            this.selectedUser = null;
            this.setError('');
        }
    }

    setShowRejectionReasonModal(value) {
        this.showRejectionReasonModal = value;
        if (!value) {
            this.rejectionReason = '';
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

    setCurrentView(view) {
        this.currentView = view;
    }

    get filteredAllAccounts() {
        const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
        return this.allAccounts.filter(user =>
            (user.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
            user.firstName?.toLowerCase().includes(lowerCaseSearchTerm) ||
            user.lastName?.toLowerCase().includes(lowerCaseSearchTerm) ||
            user.email.toLowerCase().includes(lowerCaseSearchTerm))
        );
    }

    get filteredPendingAccounts() {
        const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
        return this.pendingAccounts.filter(user =>
            (user.firstName?.toLowerCase().includes(lowerCaseSearchTerm) ||
            user.lastName?.toLowerCase().includes(lowerCaseSearchTerm) ||
            user.email.toLowerCase().includes(lowerCaseSearchTerm))
        );
    }

    async fetchAccounts() {
        this.setLoading(true);
        this.setError('');
        try {
            const allNutritionistsFromFirestore = await nutritionistRepository.getAllNutritionists() || [];

            runInAction(() => {
                const pending = allNutritionistsFromFirestore.filter(n => n.status === 'pending').map(n => ({
                    ...n,
                    id: n.id,
                    name: `${n.firstName} ${n.lastName}`,
                    appliedDate: n.createdAt ? n.createdAt.toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A',
                }));
                this.setPendingAccounts(pending);

                const approvedAndOtherStatusNutritionists = allNutritionistsFromFirestore
                    .filter(n => n.status !== 'pending')
                    .map(n => ({
                        id: n.id,
                        name: `${n.firstName} ${n.lastName}`,
                        email: n.email,
                        accountType: 'Nutritionist',
                        status: n.status === 'approved' ? 'Active' : n.status,
                        userSince: n.createdAt ? n.createdAt.toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A',
                        ...n
                    }));

                const combinedAllAccounts = [
                    ...this.mockNonNutritionistUsers,
                    ...approvedAndOtherStatusNutritionists,
                ];
                this.setAllAccounts(combinedAllAccounts);
            });

        } catch (error) {
            console.error("Error fetching accounts:", error);
            this.setError(`Failed to fetch accounts: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    async unsuspendUser(userId) {
        this.setLoading(true);
        this.setError('');
        try {
            console.log(`Simulating unsuspend for user: ${userId}`);
            runInAction(() => {
                const userToUpdate = this.allAccounts.find(user => user.id === userId);
                if (userToUpdate) {
                    userToUpdate.status = 'Active';
                    alert(`User ${userToUpdate.name} has been unsuspended.`);
                }
            });
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error("Error unsuspending user:", error);
            this.setError(`Failed to unsuspend user: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    async checkAdminStatus() {
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                console.log("AdminDashboardViewModel: No user logged in. Admin access denied.");
                return false;
            }

            const idTokenResult = await user.getIdTokenResult(true);

            if (idTokenResult.claims.admin === true) {
                console.log("AdminDashboardViewModel: User is authenticated as an admin.");
                return true;
            } else {
                console.log("AdminDashboardViewModel: User is logged in but does not have admin claims.", idTokenResult.claims);
                return false;
            }
        } catch (error) {
            console.error("AdminDashboardViewModel: Error checking admin status:", error);
            return false;
        }
    }

    
}

export default new AdminDashboardViewModel();