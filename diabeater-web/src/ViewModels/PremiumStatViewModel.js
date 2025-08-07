// src/ViewModels/PremiumStatViewModel.js
import { makeAutoObservable, runInAction, computed } from 'mobx';
import PremiumRepository from '../Repositories/PremiumRepository';
import { format, addDays } from 'date-fns'; // Import addDays for renewal date calculation

class PremiumStatViewModel {
    premiumSubscriptionPrice = 0;
    premiumFeatures = [];
    allPremiumUserAccounts = []; // Stores all fetched user accounts
    filteredPremiumUserAccounts = []; // Stores user accounts after applying search filter

    searchQuery = ''; // State for the search bar

    loading = false;
    error = null;
    success = null;

    // Modals state
    isUserDetailModalOpen = false;
    isUserHistoryModalOpen = false;
    selectedUser = null; // Stores the user object for the currently open modal

    // History-specific states
    userSubscriptionHistory = [];
    loadingHistory = false;
    historyError = null;

    constructor() {
        makeAutoObservable(this);
    }

    // --- State Management Actions ---
    setLoading = (status) => {
        runInAction(() => {
            this.loading = status;
        });
    }

    setError = (message) => {
        runInAction(() => {
            this.error = message;
            if (message) {
                this.success = null;
                setTimeout(() => {
                    if (this.error === message) {
                        this.error = null;
                    }
                }, 5000);
            }
        });
    }

    setSuccess = (message) => {
        runInAction(() => {
            this.success = message;
            if (message) {
                this.error = null;
                setTimeout(() => {
                    if (this.success === message) {
                        this.success = null;
                    }
                }, 5000);
            }
        });
    }

    setSearchQuery = (query) => {
        runInAction(() => {
            this.searchQuery = query;
            this.applySearchFilter(); // Apply filter whenever search query changes
        });
    }

    openUserDetailModal = (user) => {
        runInAction(() => {
            this.selectedUser = user;
            this.isUserDetailModalOpen = true;
        });
    }

    closeUserDetailModal = () => {
        runInAction(() => {
            this.isUserDetailModalOpen = false;
            this.selectedUser = null;
        });
    }

    openUserHistoryModal = async (user) => {
        console.log("[PremiumStatViewModel] Opening user history modal for:", user);
        
        // FIXED: Open the modal immediately and set loading state
        runInAction(() => {
            this.selectedUser = user;
            this.isUserHistoryModalOpen = true; // Open modal immediately
            this.userSubscriptionHistory = []; // Clear previous history
            this.loadingHistory = true;
            this.historyError = null;
        });

        try {
            console.log(`[PremiumStatViewModel] Fetching history for user ID: ${user._id}`);
            const history = await PremiumRepository.getUserSubscriptionHistory(user._id);
            
            runInAction(() => {
                this.userSubscriptionHistory = history;
                console.log(`[PremiumStatViewModel] Successfully loaded ${history.length} history records`);
            });
        } catch (error) {
            console.error("[PremiumStatViewModel] Error loading user history:", error);
            runInAction(() => {
                this.historyError = `Failed to load history: ${error.message}`;
            });
        } finally {
            runInAction(() => {
                this.loadingHistory = false;
            });
        }
    }

    closeUserHistoryModal = () => {
        runInAction(() => {
            this.isUserHistoryModalOpen = false;
            this.selectedUser = null;
            this.userSubscriptionHistory = []; // Clear history when closing
            this.historyError = null;
            this.loadingHistory = false;
        });
    }

    // --- Data Loading ---
    loadPremiumData = async () => {
        console.log("[PremiumStatViewModel] Starting loadPremiumData...");
        this.setLoading(true);
        try {
            const [
                premiumPrice,
                premiumFeaturesData,
                premiumUsers
            ] = await Promise.all([
                PremiumRepository.getSubscriptionPrice(),
                PremiumRepository.getPremiumFeatures(),
                PremiumRepository.getPremiumUserAccounts()
            ]);

            runInAction(() => {
                this.premiumSubscriptionPrice = typeof premiumPrice === 'number' ? premiumPrice : 0;
                this.premiumFeatures = premiumFeaturesData || [];
                this.allPremiumUserAccounts = premiumUsers || [];
                this.applySearchFilter(); // Apply initial filter
                console.log("[PremiumStatViewModel] Premium data loaded successfully.");
                this.success = 'Premium data refreshed.';
                this.error = null;
                // Auto-clear success message after 5 seconds
                setTimeout(() => {
                    runInAction(() => {
                        if (this.success === 'Premium data refreshed.') {
                            this.success = null;
                        }
                    });
                }, 5000);
            });
        } catch (error) {
            console.error("[PremiumStatViewModel] Error in loadPremiumData:", error);
            runInAction(() => {
                this.error = `Failed to load premium data: ${error.message}`;
                this.success = null;
                this.premiumSubscriptionPrice = 0;
                this.premiumFeatures = [];
                this.allPremiumUserAccounts = [];
                this.filteredPremiumUserAccounts = [];
                // Auto-clear error message after 5 seconds
                setTimeout(() => {
                    runInAction(() => {
                        if (this.error === `Failed to load premium data: ${error.message}`) {
                            this.error = null;
                        }
                    });
                }, 5000);
            });
        } finally {
            this.setLoading(false);
        }
    }

    // --- Search Filtering ---
    applySearchFilter = () => {
        const query = this.searchQuery.toLowerCase().trim();
        if (!query) {
            this.filteredPremiumUserAccounts = this.allPremiumUserAccounts.map(user => this.processUserData(user));
            return;
        }

        this.filteredPremiumUserAccounts = this.allPremiumUserAccounts
            .filter(user => {
                const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
                const email = user.email ? user.email.toLowerCase() : '';
                const status = user.currentSubscription?.status ? user.currentSubscription.status.toLowerCase() : '';

                return name.includes(query) ||
                    email.includes(query) ||
                    status.includes(query);
            })
            .map(user => this.processUserData(user));
    }

    // --- Data Processing for Display ---
    processUserData = (user) => {
        const renewalDate = user.currentSubscription?.endDate
            ? this.calculateRenewalDate(user.currentSubscription.endDate.toDate())
            : 'N/A';
        const status = user.currentSubscription?.status || 'N/A';
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();

        return {
            ...user, // Keep original user data for modals
            displayName: name || user.email,
            displayStatus: status,
            displayRenewalDate: renewalDate,
        };
    }

    calculateRenewalDate = (endDate) => {
        if (!endDate) return 'N/A';
        // Add one day to the end date
        const renewal = addDays(new Date(endDate), 1);
        return format(renewal, 'dd/MM/yyyy'); // Format as DD/MM/YYYY
    }

    // --- Premium Price Management ---
    updatePremiumSubscriptionPrice = async (newPrice) => {
        console.log(`[PremiumStatViewModel] Attempting to update premium subscription price to: ${newPrice}`);
        this.setLoading(true);
        try {
            const result = await PremiumRepository.updateSubscriptionPrice(newPrice);
            if (result.success) {
                runInAction(() => {
                    this.premiumSubscriptionPrice = typeof newPrice === 'number' ? newPrice : parseFloat(newPrice) || 0;
                    this.setSuccess(`Premium subscription price updated to $${this.premiumSubscriptionPrice.toFixed(2)}.`);
                });
                console.log(`[PremiumStatViewModel] Premium subscription price successfully updated to: ${newPrice}`);
                return { success: true };
            } else {
                throw new Error(result.message || 'Failed to update subscription price.');
            }
        } catch (error) {
            console.error("[PremiumStatViewModel] Error updating premium subscription price:", error);
            this.setError(`Failed to update premium subscription price: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    // --- Premium Feature Management (CRUD) ---
    createPremiumFeature = async (featureName) => {
        this.setLoading(true);
        try {
            const result = await PremiumRepository.addPremiumFeature(featureName);
            if (result.success) {
                runInAction(() => {
                    this.setSuccess(`Feature "${featureName}" added successfully.`);
                });
                await this.loadPremiumData();
                return { success: true };
            } else {
                throw new Error(result.message || "Failed to add feature.");
            }
        } catch (error) {
            console.error("[PremiumStatViewModel] Error creating premium feature:", error);
            this.setError(`Failed to add feature: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    editPremiumFeature = async (oldFeatureName, newFeatureName) => {
        this.setLoading(true);
        try {
            const result = await PremiumRepository.updatePremiumFeature(oldFeatureName, newFeatureName);
            if (result.success) {
                runInAction(() => {
                    this.setSuccess(`Feature updated to "${newFeatureName}" successfully.`);
                });
                await this.loadPremiumData();
                return { success: true };
            } else {
                throw new Error(result.message || 'Failed to update feature.');
            }
        } catch (error) {
            console.error("[PremiumStatViewModel] Error updating premium feature:", error);
            this.setError(`Failed to update feature: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    removePremiumFeature = async (featureName) => {
        this.setLoading(true);
        try {
            const result = await PremiumRepository.deletePremiumFeature(featureName);
            if (result.success) {
                runInAction(() => {
                    this.setSuccess('Feature deleted successfully.');
                });
                await this.loadPremiumData();
                return { success: true };
            } else {
                throw new Error(result.message || 'Failed to delete feature.');
            }
        } catch (error) {
            console.error("[PremiumStatViewModel] Error deleting premium feature:", error);
            this.setError(`Failed to delete feature: ${error.message}`);
            return { success: false, message: error.message };
        } finally {
            this.setLoading(false);
        }
    }
}

const premiumStatViewModel = new PremiumStatViewModel();
export default premiumStatViewModel;