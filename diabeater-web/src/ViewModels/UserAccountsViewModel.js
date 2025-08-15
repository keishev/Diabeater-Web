import { makeAutoObservable, runInAction, observable, action } from 'mobx';
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
        makeAutoObservable(this);
    }

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
     getUserDisplayName(user) {
    if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
    }
    if (user.name) {
        return user.name;
    }
    if (user.email) {
        return user.email;
    }
    return 'Unknown User';
}

findUserById(userId) {
    return this.allAccounts.find(u => u.id === userId);
}


    get filteredAllAccounts() {
        const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
        
        return this.allAccounts.filter(user => {
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
                (user.name?.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (user.email?.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (user.role?.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (user.status?.toLowerCase().includes(lowerCaseSearchTerm))
            );
        });
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
    
    // Get user details BEFORE the API call
    const user = this.findUserById(userId);
    const userName = this.getUserDisplayName(user);
    
    try {
        const result = await UserAccountRepository.suspendUser(userId);
        runInAction(() => {
            const userIndex = this.allAccounts.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                this.allAccounts[userIndex].status = 'Inactive';
                this.allAccounts[userIndex].disabled = true;
            }
            
            // Custom success message with user name
            const message = result.message || `${userName} has been successfully suspended.`;
            
            // Use custom alert instead of browser alert
            if (window.showSuccess) {
                window.showSuccess(message);
            } else {
                alert(message); // Fallback
            }
        });
    } catch (error) {
        console.error("Error suspending user:", error);
        this.setError(`Failed to suspend user: ${error.message}`);
        
        const errorMessage = `Failed to suspend ${userName}: ${error.message}`;
        
        if (window.showError) {
            window.showError(errorMessage);
        } else {
            alert(errorMessage); // Fallback
        }
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
    
    // Get user details BEFORE the API call
    const user = this.findUserById(userId);
    const userName = this.getUserDisplayName(user);
    
    try {
        const result = await UserAccountRepository.unsuspendUser(userId);
        runInAction(() => {
            const userIndex = this.allAccounts.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                this.allAccounts[userIndex].status = 'Active';
                this.allAccounts[userIndex].disabled = false;
            }
            
            // Custom success message with user name
            const message = result.message || `${userName} has been successfully reactivated.`;
            
            // Use custom alert instead of browser alert
            if (window.showSuccess) {
                window.showSuccess(message);
            } else {
                alert(message); // Fallback
            }
        });
    } catch (error) {
        console.error("Error unsuspending user:", error);
        this.setError(`Failed to unsuspend user: ${error.message}`);
        
        const errorMessage = `Failed to reactivate ${userName}: ${error.message}`;
        
        if (window.showError) {
            window.showError(errorMessage);
        } else {
            alert(errorMessage); // Fallback
        }
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
            console.log('profile data', profileData);
            console.log('profile data fn', profileData.firstName);
            runInAction(() => {
                this.profile = profileData;
                this.profileImage = profileData?.profileImageURL || null;
                this.currentUserId = userId;
                console.log('profile' + this.profile.firstName);
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
                
                const message = "Admin profile updated successfully.";
                
                // Use toast if available, otherwise fallback to alert
                if (window.showSuccess) {
                    window.showSuccess(message);
                } else if (window.showToast) {
                    window.showToast(message, 'success');
                } else {
                    alert(message);
                }
            });
        } catch (error) {
            console.error("Error updating admin profile:", error);
            this.setError(`Failed to update admin profile: ${error.message}`);
            
            const errorMessage = `Failed to update admin profile: ${error.message}`;
            
            // Use toast if available, otherwise fallback to alert
            if (window.showError) {
                window.showError(errorMessage);
            } else if (window.showToast) {
                window.showToast(errorMessage, 'error');
            } else {
                alert(errorMessage);
            }
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
                
                const message = "Nutritionist profile updated successfully.";
                
                // Use toast if available, otherwise fallback to alert
                if (window.showSuccess) {
                    window.showSuccess(message);
                } else if (window.showToast) {
                    window.showToast(message, 'success');
                } else {
                    alert(message);
                }
            });
        } catch (error) {
            console.error("Error updating nutritionist profile:", error);
            this.setError(`Failed to update nutritionist profile: ${error.message}`);
            
            const errorMessage = `Failed to update nutritionist profile: ${error.message}`;
            
            // Use toast if available, otherwise fallback to alert
            if (window.showError) {
                window.showError(errorMessage);
            } else if (window.showToast) {
                window.showToast(errorMessage, 'error');
            } else {
                alert(errorMessage);
            }
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

export default new UserAccountsViewModel();