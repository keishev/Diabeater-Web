import { makeAutoObservable, runInAction, computed } from 'mobx';
import MealPlanRepository from '../Repositories/MealPlanRepository';
import AuthService from '../Services/AuthService';

class MealPlanViewModel {
    mealPlans = [];
    loading = false;
    error = '';
    success = '';
    searchTerm = '';
    selectedCategory = '';
    allCategories = [];

    currentUserId = null;
    currentUserRole = null;
    currentUserName = null;
    selectedMealPlanForDetail = null;
    selectedMealPlanForUpdate = null; // This state must hold the full meal plan object for the UpdateMealPlan component
    notifications = [];
    unreadNotificationCount = 0;

    adminActiveTab = 'PENDING_APPROVAL';
    _notificationsUnsubscribe = null;

    constructor() {
        makeAutoObservable(this, {
            filteredMealPlans: computed,
        });

        this.initializeUser();
        // Setup listener after potential user initialization delay, for nutritionists
        // This will be called again by initializeUser once currentUserId is set
        // if (this.currentUserRole === 'nutritionist' && this.currentUserId) {
        //     this.setupNotificationListener();
        // }
    }

    initializeUser = () => {
        const user = AuthService.getCurrentUser();
        if (user) {
            runInAction(() => {
                this.currentUserId = user.uid;
                this.currentUserRole = user.role;
                this.currentUserName = user.name || user.username || user.email;
            });
            // Ensure meal plans are fetched here based on role
            if (user.role === 'admin') {
                this.fetchAdminMealPlans(this.adminActiveTab);
            } else { // Nutritionist
                this.fetchNutritionistMealPlans(user.uid);
                this.setupNotificationListener(); // Setup listener only for nutritionists
            }
            this.fetchNotifications(user.uid);
        } else {
            console.warn("No authenticated user found in initializeUser.");
            // If no user, ensure lists are cleared
            runInAction(() => {
                this.mealPlans = [];
                this.allCategories = [];
                this.currentUserId = null;
                this.currentUserRole = null;
                this.currentUserName = null;
            });
            this.dispose(); // Unsubscribe from notifications if user logs out
        }
    };

    setAdminActiveTab = async (tab) => {
        if (this.adminActiveTab !== tab) {
            runInAction(() => {
                this.adminActiveTab = tab;
            });
            if (this.currentUserRole === 'admin') {
                await this.fetchAdminMealPlans(tab);
            }
        }
    };

    setupNotificationListener = () => {
        // Only set up listener if currentUserId and role are confirmed as nutritionist
        if (!this.currentUserId || this.currentUserRole !== 'nutritionist') {
            console.warn("Cannot setup notification listener: User ID not available or not a nutritionist.");
            return;
        }

        // Unsubscribe from any previous listener to prevent duplicates
        if (this._notificationsUnsubscribe) {
            this._notificationsUnsubscribe();
            this._notificationsUnsubscribe = null;
            console.log("Existing notification listener unsubscribed.");
        }

        console.log(`Setting up notification listener for user: ${this.currentUserId}`);
        this._notificationsUnsubscribe = MealPlanRepository.onNotificationsSnapshot(this.currentUserId, (notifications) => {
            runInAction(() => {
                this.notifications = notifications;
                // 'isRead' is the Firestore field, 'read' is what you mapped it to in the repository.
                // Use 'read' here for consistency with the mapped data.
                this.unreadNotificationCount = notifications.filter(n => !n.read).length;
            });
        });
    };

    fetchNotifications = async (userId) => {
        if (!userId) {
            console.warn("User ID not available for fetching notifications.");
            return;
        }
        this.setLoading(true);
        try {
            const fetchedNotifications = await MealPlanRepository.getNotifications(userId);
            runInAction(() => {
                this.notifications = fetchedNotifications;
                // Use 'read' property as mapped in repository
                this.unreadNotificationCount = fetchedNotifications.filter(n => !n.read).length;
            });
        } catch (err) {
            console.error('Error fetching notifications:', err);
            this.setError('Failed to fetch notifications.');
        } finally {
            this.setLoading(false);
        }
    }

    markNotificationAsRead = async (notificationId) => {
        this.setLoading(true);
        try {
            await MealPlanRepository.markNotificationAsRead(notificationId);
            runInAction(() => {
                // Find the notification and update its 'read' status locally
                const notification = this.notifications.find(n => n._id === notificationId); // Use _id here
                if (notification) {
                    notification.read = true; // Update the local observable
                    this.unreadNotificationCount = this.notifications.filter(n => !n.read).length;
                }
            });
            this.setSuccess('Notification marked as read.');
        } catch (err) {
            console.error('Error marking notification as read:', err);
            this.setError('Failed to mark notification as read.');
         } finally {
            this.setLoading(false);
        }
    }

    loadMealPlanDetails = async (mealPlanId) => {
        this.setLoading(true);
        this.setError('');
        try {
            const details = await MealPlanRepository.getMealPlanDetails(mealPlanId);
            runInAction(() => {
                this.selectedMealPlanForDetail = details;
            });
        } catch (err) {
            console.error('Error loading meal plan details:', err);
            this.setError('Failed to load meal plan details: ' + err.message);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * ⭐ CRITICAL FUNCTION: Sets the meal plan object to be used for the update form.
     * This relies on `this.mealPlans` being correctly populated.
     */
    selectMealPlanForUpdate = (mealPlanId) => {
        // Log to see what mealPlans contains
        console.log("ViewModel: All meal plans:", this.mealPlans.map(p => ({ id: p._id, name: p.name })));
        console.log("ViewModel: Looking for mealPlanId for update:", mealPlanId);

        const mealPlan = this.mealPlans.find(plan => plan._id === mealPlanId);
        if (mealPlan) {
            runInAction(() => {
                this.selectedMealPlanForUpdate = mealPlan;
                console.log("ViewModel: selectedMealPlanForUpdate set to:", this.selectedMealPlanForUpdate);
            });
            this.setSuccess(`Ready to update meal plan: ${mealPlan.name}`);
        } else {
            console.error("ViewModel: Meal plan NOT found in 'mealPlans' array for ID:", mealPlanId);
            runInAction(() => {
                this.selectedMealPlanForUpdate = null; // Explicitly set to null if not found
                this.setError("Could not find meal plan to update. Please refresh and try again.");
            });
        }
    };

    clearSelectedMealPlans = () => {
        runInAction(() => {
            this.selectedMealPlanForDetail = null;
            this.selectedMealPlanForUpdate = null;
        });
    }

    deleteMealPlan = async (mealPlanId, imageFileName) => {
        this.setLoading(true);
        this.setError('');
        this.setSuccess('');
        try {
            await MealPlanRepository.deleteMealPlan(mealPlanId, imageFileName);
            runInAction(() => {
                this.mealPlans = this.mealPlans.filter(plan => plan._id !== mealPlanId);
            });
            this.setSuccess('Meal plan deleted successfully!');
            return true;
        } catch (err) {
            console.error('Error deleting meal plan:', err);
            this.setError('Failed to delete meal plan: ' + err.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    approveOrRejectMealPlan = async (mealPlanId, newStatus, authorId, adminName, adminId, rejectionReason = null) => {
        this.setLoading(true);
        this.setError('');
        this.setSuccess('');
        try {
            const mealPlanToUpdate = this.mealPlans.find(p => p._id === mealPlanId);
            if (!mealPlanToUpdate) {
                throw new Error("Meal plan not found for approval/rejection.");
            }

            await MealPlanRepository.updateMealPlanStatus(mealPlanId, newStatus, rejectionReason);

            let notificationMessage;
            if (newStatus === 'APPROVED') {
                notificationMessage = `Your meal plan "${mealPlanToUpdate.name}" has been APPROVED by ${adminName}.`;
            } else {
                notificationMessage = `Your meal plan "${mealPlanToUpdate.name}" has been REJECTED by ${adminName}. Reason: ${rejectionReason || 'No reason provided.'}`;
            }

            // Note: The createNotification in service only takes recipientId, type, message, mealPlanId, rejectionReason.
            // If you need adminId/adminName in the notification data itself, you'd need to modify createNotification.
            await MealPlanRepository.addNotification(
                authorId,
                'MEAL_PLAN_STATUS_UPDATE',
                notificationMessage,
                mealPlanId,
                rejectionReason // Pass rejectionReason if applicable
            );

            // Re-fetch meal plans to reflect status change immediately
            if (this.currentUserRole === 'admin') {
                await this.fetchAdminMealPlans(this.adminActiveTab);
            } else if (this.currentUserId === authorId) {
                // If it's a nutritionist looking at their own plans, refresh their list
                await this.fetchNutritionistMealPlans(this.currentUserId);
            }

            this.setSuccess(`Meal plan ${newStatus.toLowerCase()} successfully!`);
            return true;
        } catch (err) {
            console.error(`Error ${newStatus.toLowerCase()}ing meal plan:`, err);
            this.setError(`Failed to ${newStatus.toLowerCase()} meal plan: ` + err.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    createMealPlan = async (mealPlanData, imageFile) => {
        this.setLoading(true);
        this.setError('');
        this.setSuccess('');
        try {
            const currentUser = AuthService.getCurrentUser();
            if (!currentUser) {
                throw new Error("No authenticated user found. Please log in.");
            }

            const authorId = currentUser.uid;
            const authorName = currentUser.name || currentUser.username || "Unknown Author";

            const newMealPlan = {
                ...mealPlanData,
                authorId: authorId,
                author: authorName,
                status: 'PENDING_APPROVAL',
                createdAt: new Date().toISOString(), // This will be overwritten by serverTimestamp in service but good for client-side representation initially
            };

            await MealPlanRepository.addMealPlan(newMealPlan, imageFile);
            this.setSuccess('Meal plan created successfully and sent for approval!');
            // After creation, trigger a refresh of the appropriate meal plan list
            if (this.currentUserRole === 'admin') {
                await this.fetchAdminMealPlans(this.adminActiveTab);
            } else {
                await this.fetchNutritionistMealPlans(authorId);
            }
            return true;
        } catch (err) {
            console.error('Error creating meal plan:', err);
            this.setError('Failed to create meal plan: ' + err.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    // ⭐ UPDATED: updateMealPlan method to set status to PENDING_APPROVAL ⭐
    updateMealPlan = async (updatedMealPlanData) => {
        this.setLoading(true);
        this.setError('');
        this.setSuccess('');
        try {
            // Extract _id, imageFile, and originalImageFileName as these are for ViewModel/Repository logic,
            // not directly for Firestore `updateDoc` payload.
            const { _id, imageFile, originalImageFileName, ...dataToUpdate } = updatedMealPlanData;

            // ⭐ CRITICAL CHANGE: Set status to PENDING_APPROVAL on update ⭐
            // This ensures updated meal plans go through the re-approval process.
            dataToUpdate.status = 'PENDING_APPROVAL';

            // Call the repository with the meal plan ID, the payload, new image file, and original image filename
            // The repository will handle the image upload/deletion and Firestore update.
            const returnedMealPlan = await MealPlanRepository.updateMealPlan(_id, dataToUpdate, imageFile, originalImageFileName);

            runInAction(() => {
                // Update the local mealPlans array with the data returned from the repository
                const index = this.mealPlans.findIndex(plan => plan._id === _id);
                if (index !== -1) {
                    // Spread existing data, then override with returnedMealPlan (which includes updated imageUrl/imageFileName)
                    this.mealPlans[index] = { ...this.mealPlans[index], ...returnedMealPlan };
                }
                // Clear the selected meal plan for update after a successful update
                this.selectedMealPlanForUpdate = null;
            });

            // ⭐ AFTER UPDATE: Re-fetch the nutritionist's own meal plans ⭐
            // This is important so the nutritionist immediately sees the updated status (PENDING_APPROVAL).
            if (this.currentUserId) {
                await this.fetchNutritionistMealPlans(this.currentUserId);
            }

            this.setSuccess('Meal plan updated successfully and sent for re-approval!');
            return true;
        } catch (err) {
            console.error('Error updating meal plan:', err);
            this.setError('Failed to update meal plan: ' + err.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    fetchAdminMealPlans = async (statusFilter) => {
        this.setLoading(true);
        this.setError('');
        try {
            let fetchedPlans = [];
            // Use the specific methods if getAllMealPlansByStatus is not a generic query function
            if (statusFilter === 'PENDING_APPROVAL') {
                fetchedPlans = await MealPlanRepository.getPendingMealPlans();
            } else if (statusFilter === 'APPROVED') {
                fetchedPlans = await MealPlanRepository.getApprovedMealPlans();
            } else if (statusFilter === 'REJECTED') {
                fetchedPlans = await MealPlanRepository.getRejectedMealPlans();
            } else {
                // Fallback for 'ALL' or undefined filter (though adminActiveTab should be one of the above)
                const pending = await MealPlanRepository.getPendingMealPlans();
                const approved = await MealPlanRepository.getApprovedMealPlans();
                const rejected = await MealPlanRepository.getRejectedMealPlans();
                fetchedPlans = [...pending, ...approved, ...rejected];
            }


            runInAction(() => {
                this.mealPlans = fetchedPlans;
                // Ensure `plan.categories` is an array for flatMap to work, or use `plan.category` if it's a single string
                const categories = [...new Set(this.mealPlans.flatMap(plan => plan.categories || (plan.category ? [plan.category] : [])))];
                this.setAllCategories(categories.sort());
            });
        } catch (err) {
            console.error('Error fetching admin meal plans:', err);
            this.setError('Failed to fetch meal plans for admin.');
            runInAction(() => {
                this.mealPlans = [];
                this.setAllCategories([]);
            });
        } finally {
            this.setLoading(false);
        }
    }

    fetchNutritionistMealPlans = async (authorId) => {
        if (!authorId) {
            console.warn("Author ID not available for fetching nutritionist meal plans.");
            return;
        }
        this.setLoading(true);
        this.setError('');
        try {
            const nutritionistPlans = await MealPlanRepository.getMealPlansByAuthor(authorId);
            runInAction(() => {
                this.mealPlans = nutritionistPlans;
                // Ensure `plan.categories` is an array for flatMap to work, or use `plan.category` if it's a single string
                const categories = [...new Set(nutritionistPlans.flatMap(plan => plan.categories || (plan.category ? [plan.category] : [])))];
                this.setAllCategories(categories.sort());
            });
        } catch (err) {
            console.error('Error fetching nutritionist meal plans:', err);
            this.setError('Failed to fetch nutritionist meal plans.');
            runInAction(() => {
                this.mealPlans = [];
                this.setAllCategories([]);
            });
        } finally {
            this.setLoading(false);
        }
    }

    setLoading = (isLoading) => {
        runInAction(() => {
            this.loading = isLoading;
        });
    }

    setError = (message) => {
        runInAction(() => {
            this.error = message;
            if (message) {
                setTimeout(() => runInAction(() => this.error = ''), 5000);
            }
        });
    }

    setSuccess = (message) => {
        runInAction(() => {
            this.success = message;
            if (message) {
                setTimeout(() => runInAction(() => this.success = ''), 5000);
            }
        });
    }

    setSearchTerm = (term) => {
        runInAction(() => {
            this.searchTerm = term;
        });
    }

    setSelectedCategory = (category) => {
        runInAction(() => {
            this.selectedCategory = category;
        });
    }

    setAllCategories = (categories) => {
        runInAction(() => {
            this.allCategories = categories;
        });
    }

    dispose = () => {
        if (this._notificationsUnsubscribe) {
            this._notificationsUnsubscribe();
            console.log("Unsubscribed from notifications listener.");
        }
    };

    get filteredMealPlans() {
        let plansToFilter = this.mealPlans;

        if (this.currentUserRole === 'admin') {
            // Admin filters by `adminActiveTab` which is a status
            plansToFilter = plansToFilter.filter(plan => plan.status === this.adminActiveTab);
        }

        return plansToFilter.filter(plan => {
            const matchesSearchTerm = plan.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (plan.author && plan.author.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
                (plan.description && plan.description.toLowerCase().includes(this.searchTerm.toLowerCase())); // Also search description

            // Check if plan.categories is an array, or if plan.category exists
            const matchesCategory = this.selectedCategory === '' ||
                                    (Array.isArray(plan.categories) && plan.categories.includes(this.selectedCategory)) ||
                                    (plan.category && plan.category === this.selectedCategory);

            return matchesSearchTerm && matchesCategory;
        });
    }
}

const mealPlanViewModel = new MealPlanViewModel();
export default mealPlanViewModel;