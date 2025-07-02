// src/ViewModels/UserAccountsViewModel.js
import { makeAutoObservable, runInAction } from 'mobx';
import UserRepository from '../Repositories/UserRepository'; // <--- Import the new UserRepository

class UserAccountsViewModel {
    allAccounts = [];
    searchTerm = '';
    isLoading = false;
    error = '';

    constructor() {
        makeAutoObservable(this);
    }

    // --- State Setters ---
    setAllAccounts(accounts) {
        this.allAccounts = accounts;
    }

    setSearchTerm(term) {
        this.searchTerm = term;
    }

    setLoading(value) {
        this.isLoading = value;
    }

    setError(message) {
        this.error = message;
    }

    // --- Computed Properties ---
    get filteredAllAccounts() {
        const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
        return this.allAccounts.filter(user =>
            (user.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
             user.email.toLowerCase().includes(lowerCaseSearchTerm) ||
             user.accountType?.toLowerCase().includes(lowerCaseSearchTerm) ||
             user.status?.toLowerCase().includes(lowerCaseSearchTerm))
        );
    }

    // --- Asynchronous Actions ---

    /**
     * Fetches all user accounts from the repository.
     */
    async fetchAccounts() {
        this.setLoading(true);
        this.setError('');
        try {
            const users = await UserRepository.getAllUsers(); // <--- Call UserRepository
            runInAction(() => {
                this.setAllAccounts(users);
            });
        } catch (error) {
            console.error("Error fetching all user accounts:", error);
            this.setError(`Failed to fetch user accounts: ${error.message}`);
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }

    /**
     * Suspends a user account using the UserRepository.
     * @param {string} userId - The UID of the user to suspend.
     */
    async suspendUser(userId) {
        this.setLoading(true);
        this.setError('');
        try {
            const result = await UserRepository.suspendUser(userId); // <--- Call UserRepository
            
            runInAction(() => {
                // Optimistically update the local state after successful backend call
                const userIndex = this.allAccounts.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    this.allAccounts[userIndex].status = 'Inactive'; // Match your backend's update
                    this.allAccounts[userIndex].disabled = true; // Match your backend's update
                }
                alert(result.message || `User ${userId} suspended successfully.`);
            });
        } catch (error) {
            console.error("Error suspending user:", error);
            this.setError(`Failed to suspend user: ${error.message}`);
            alert(`Failed to suspend user: ${error.message}`); // Show alert
            throw error; // Re-throw for any component that might catch it
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }

    /**
     * Unsuspends a user account using the UserRepository.
     * @param {string} userId - The UID of the user to unsuspend.
     */
    async unsuspendUser(userId) {
        this.setLoading(true);
        this.setError('');
        try {
            const result = await UserRepository.unsuspendUser(userId); // <--- Call UserRepository

            runInAction(() => {
                // Optimistically update the local state after successful backend call
                const userIndex = this.allAccounts.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    this.allAccounts[userIndex].status = 'Active'; // Match your backend's update
                    this.allAccounts[userIndex].disabled = false; // Match your backend's update
                }
                alert(result.message || `User ${userId} unsuspended successfully.`);
            });
        } catch (error) {
            console.error("Error unsuspending user:", error);
            this.setError(`Failed to unsuspend user: ${error.message}`);
            alert(`Failed to unsuspend user: ${error.message}`); // Show alert
            throw error; // Re-throw for any component that might catch it
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }
}

// Export a singleton instance
export default new UserAccountsViewModel();