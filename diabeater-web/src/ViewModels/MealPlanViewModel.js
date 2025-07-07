// src/ViewModel/MealPlanViewModel.js
import { makeAutoObservable } from 'mobx'; // Using MobX for observable state, can be substituted with just plain JS objects and callbacks if MobX is not desired.
import MealPlanRepository from '../Repositories/MealPlanRepository';

class MealPlanViewModel {
    mealPlans = [];
    loading = false;
    error = '';
    success = '';
    searchTerm = '';
    selectedCategory = '';
    allCategories = [];

    constructor() {
        makeAutoObservable(this); // Makes the state observable for React components to react to changes.
    }

    setLoading(isLoading) {
        this.loading = isLoading;
    }

    setError(errorMessage) {
        this.error = errorMessage;
    }

    setSuccess(successMessage) {
        this.success = successMessage;
    }

    setSearchTerm(term) {
        this.searchTerm = term;
    }

    setSelectedCategory(category) {
        this.selectedCategory = category;
    }

    setAllCategories(categories) {
        this.allCategories = categories;
    }

    async createMealPlan(mealPlanData, uploadPhoto) {
        this.setLoading(true);
        this.setError('');
        this.setSuccess('');
        try {
            const newPlan = await MealPlanRepository.addMealPlan(mealPlanData, uploadPhoto);
            this.setSuccess('Meal Plan created successfully and sent for approval!');
            console.log('New Meal Plan Data Saved:', newPlan);
            return true; // Indicate success
        } catch (err) {
            console.error('Error creating meal plan:', err);
            this.setError('Failed to create meal plan: ' + err.message);
            return false; // Indicate failure
        } finally {
            this.setLoading(false);
        }
    }

    async fetchPendingMealPlans() {
        this.setLoading(true);
        this.setError('');
        try {
            const fetchedPlans = await MealPlanRepository.getPendingMealPlans();
            this.mealPlans = fetchedPlans;
            // Extract and set all unique categories
            const categories = [...new Set(fetchedPlans.flatMap(plan => plan.categories || []))];
            this.setAllCategories(categories.sort());
        } catch (err) {
            console.error('Error fetching pending meal plans:', err);
            this.setError('Failed to fetch meal plans.');
            this.mealPlans = [];
            this.setAllCategories([]);
        } finally {
            this.setLoading(false);
        }
    }

    async approveMealPlan(mealPlanId) {
        this.setLoading(true);
        this.setError('');
        try {
            await MealPlanRepository.updateMealPlanStatus(mealPlanId, 'UPLOADED');
            const approvedPlanData = await MealPlanRepository.getMealPlanDetails(mealPlanId);
            if (approvedPlanData) {
                await MealPlanRepository.addNotification(
                    approvedPlanData.authorId,
                    'mealPlanApproval',
                    `Your meal plan "${approvedPlanData.name}" has been APPROVED.`,
                    mealPlanId
                );
            }
            this.setSuccess(`Meal plan ${mealPlanId} approved successfully.`);
            await this.fetchPendingMealPlans(); // Refresh the list
        } catch (err) {
            console.error('Error approving meal plan:', err);
            this.setError('Failed to approve meal plan: ' + err.message);
        } finally {
            this.setLoading(false);
        }
    }

    async rejectMealPlan(mealPlanId, reason) {
        this.setLoading(true);
        this.setError('');
        try {
            await MealPlanRepository.updateMealPlanStatus(mealPlanId, 'REJECTED', reason);
            const rejectedPlanData = await MealPlanRepository.getMealPlanDetails(mealPlanId);
            if (rejectedPlanData) {
                await MealPlanRepository.addNotification(
                    rejectedPlanData.authorId,
                    'mealPlanRejection',
                    `Your meal plan "${rejectedPlanData.name}" has been REJECTED. Reason: ${reason}`,
                    mealPlanId,
                    reason
                );
            }
            this.setSuccess(`Meal plan ${mealPlanId} rejected successfully.`);
            await this.fetchPendingMealPlans(); // Refresh the list
        } catch (err) {
            console.error('Error rejecting meal plan:', err);
            this.setError('Failed to reject meal plan: ' + err.message);
        } finally {
            this.setLoading(false);
        }
    }

    get filteredMealPlans() {
        return this.mealPlans.filter(plan => {
            const matchesSearchTerm = plan.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (plan.author && plan.author.toLowerCase().includes(this.searchTerm.toLowerCase()));
            const matchesCategory = this.selectedCategory === '' || (plan.categories && plan.categories.includes(this.selectedCategory));
            return matchesSearchTerm && matchesCategory;
        });
    }
}

export default new MealPlanViewModel();