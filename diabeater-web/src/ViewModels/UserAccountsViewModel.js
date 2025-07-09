import { makeAutoObservable, runInAction, observable } from 'mobx';
import UserAccountRepository from '../Repositories/UserAccountRepository'; 

class UserAccountsViewModel {
    allAccounts = [];
    searchTerm = '';
    isLoading = false;
    error = '';

    profile = observable({});
    profileImage = null;
    currentUserId = null;

    constructor() {
        makeAutoObservable(this, {
            profile: observable,
        });
    }

    setAllAccounts(accounts) {
        this.allAccounts = accounts;
    }

    // This method is called from your UI component
    setSearchTerm(term) {
        this.searchTerm = term;
    }

    setLoading(value) {
        this.isLoading = value;
    }

    setError(message) {
        this.error = message;
    }

    get filteredAllAccounts() {
        const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
        return this.allAccounts.filter(user =>
            (user.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
             user.email.toLowerCase().includes(lowerCaseSearchTerm) ||
             user.accountType?.toLowerCase().includes(lowerCaseSearchTerm) ||
             user.status?.toLowerCase().includes(lowerCaseSearchTerm))
        );
    }

    async fetchAccounts() {
        this.setLoading(true);
        this.setError('');
        try {
            const users = await UserAccountRepository.getAllUsers(); 
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

    async suspendUser(userId) {
        this.setLoading(true);
        this.setError('');
        try {
            const result = await UserAccountRepository.suspendUser(userId); 
            runInAction(() => {
                const userIndex = this.allAccounts.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    this.allAccounts[userIndex].status = 'Inactive'; 
                    this.allAccounts[userIndex].disabled = true;
                }
                alert(result.message || `User ${userId} suspended successfully.`);
            });
        } catch (error) {
            console.error("Error suspending user:", error);
            this.setError(`Failed to suspend user: ${error.message}`);
            alert(`Failed to suspend user: ${error.message}`); 
            throw error; 
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }

    async unsuspendUser(userId) {
        this.setLoading(true);
        this.setError('');
        try {
            const result = await UserAccountRepository.unsuspendUser(userId); 
            runInAction(() => {
                const userIndex = this.allAccounts.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    this.allAccounts[userIndex].status = 'Active'; 
                    this.allAccounts[userIndex].disabled = false; 
                }
                alert(result.message || `User ${userId} unsuspended successfully.`);
            });
        } catch (error) {
            console.error("Error unsuspending user:", error);
            this.setError(`Failed to unsuspend user: ${error.message}`);
            alert(`Failed to unsuspend user: ${error.message}`); 
            throw error; 
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }

    async fetchAdminProfile(userId) {
        this.setLoading(true);
        this.setError('');
        try {
            const profileData = await UserAccountRepository.getAdminProfile(userId);
            runInAction(() => {
                this.profile = observable(profileData);
                this.profileImage = profileData?.profileImageURL || null;
                this.currentUserId = userId;
            });
        } catch (error) {
            console.error("Error fetching admin profile:", error);
            this.setError(`Failed to fetch admin profile: ${error.message}`);
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }

    async updateAdminProfile(userId, profileData, profileImage) {
        this.setLoading(true);
        this.setError('');
        try {
            let profileImageURL = profileData.profileImageURL;
            if (profileImage instanceof File) {
                profileImageURL = await UserAccountRepository.uploadProfileImage(userId, profileImage);
            }

            const finalData = Object.fromEntries(
            Object.entries({ ...profileData, profileImageURL })
                .filter(([_, value]) => value !== undefined)
            );

            await UserAccountRepository.updateAdminProfile(userId, finalData);

            runInAction(() => {
                this.profile = observable(finalData);
                this.profileImage = profileImageURL;
                alert("Admin profile updated successfully.");
            });
        } catch (error) {
            console.error("Error updating admin profile:", error);
            this.setError(`Failed to update admin profile: ${error.message}`);
            alert(`Failed to update admin profile: ${error.message}`);
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }

    async fetchNutritionistProfile(userId) {
        this.setLoading(true);
        this.setError('');
        try {
            const profileData = await UserAccountRepository.getNutritionistProfile(userId);
            runInAction(() => {
                this.profile = observable(profileData);
                this.profileImage = profileData?.profileImageURL || null;
                this.currentUserId = userId;
            });
        } catch (error) {
            console.error("Error fetching nutritionist profile:", error);
            this.setError(`Failed to fetch nutritionist profile: ${error.message}`);
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }

    async updateNutritionistProfile(userId, profileData, profileImage) {
        this.setLoading(true);
        this.setError('');
        try {
            let profileImageURL = profileData.profileImageURL;
            if (profileImage instanceof File) {
                profileImageURL = await UserAccountRepository.uploadProfileImage(userId, profileImage);
            }

            const finalData = Object.fromEntries(
                Object.entries({ ...profileData, profileImageURL })
                    .filter(([_, v]) => v !== undefined)
            );
            await UserAccountRepository.updateNutritionistProfile(userId, finalData);

            runInAction(() => {
                this.profile = observable(finalData);
                this.profileImage = profileImageURL;
                alert("Nutritionist profile updated successfully.");
            });
        } catch (error) {
            console.error("Error updating nutritionist profile:", error);
            this.setError(`Failed to update nutritionist profile: ${error.message}`);
            alert(`Failed to update nutritionist profile: ${error.message}`);
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }

    setProfileField(key, value) {
        if (this.profile) {
            this.profile[key] = value;
        }
    }

    setProfileImage(file) {
        this.profileImage = file;
    }

    setCurrentUserId(uid) {
        this.currentUserId = uid;
    }
}

// Export the class itself
export default UserAccountsViewModel;