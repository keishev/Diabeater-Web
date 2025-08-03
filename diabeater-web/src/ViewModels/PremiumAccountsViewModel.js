// src/ViewModels/PremiumAccountsViewModel.js
import { makeAutoObservable, runInAction } from 'mobx';

class PremiumAccountsViewModel {
    premiumUsers = [];
    isLoading = false;
    error = null;
    searchTerm = '';

    constructor() {
        makeAutoObservable(this);
    }

    setPremiumUsers = (users) => {
        this.premiumUsers = users;
    }

    setLoading = (value) => {
        this.isLoading = value;
    }

    setError = (message) => {
        this.error = message;
    }

    setSearchTerm = (term) => {
        this.searchTerm = term;
    }

    get filteredPremiumUsers() {
        const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
        return this.premiumUsers.filter(user =>
            (user.firstName?.toLowerCase().includes(lowerCaseSearchTerm) ||
             user.lastName?.toLowerCase().includes(lowerCaseSearchTerm) ||
             user.email.toLowerCase().includes(lowerCaseSearchTerm))
        );
    }

    fetchPremiumUsers = async () => {
        this.setLoading(true);
        this.setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockPremiumUsers = [
                { id: 'prem1', firstName: 'Alice', lastName: 'Smith', email: 'alice.smith@example.com', premiumStartDate: '2024-01-15', premiumEndDate: '2025-01-15', status: 'Active' },
                { id: 'prem2', firstName: 'Bob', lastName: 'Johnson', email: 'bob.j@example.com', premiumStartDate: '2024-03-01', premiumEndDate: '2025-03-01', status: 'Active' },
                { id: 'prem3', firstName: 'Charlie', lastName: 'Brown', email: 'charlie.b@example.com', premiumStartDate: '2023-11-20', premiumEndDate: '2024-11-20', status: 'Inactive' },
            ];

            runInAction(() => {
                const filtered = mockPremiumUsers.filter(user =>
                    user.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                    user.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(this.searchTerm.toLowerCase())
                );
                this.setPremiumUsers(filtered);
            });
        } catch (error) {
            console.error("Error fetching premium users:", error);
            runInAction(() => {
                this.setError(`Failed to fetch premium accounts: ${error.message}`);
            });
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }
}

export default new PremiumAccountsViewModel(); // <--- Important: export the instance