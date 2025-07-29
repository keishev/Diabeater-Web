// src/Repositories/MealCategoryRepository.js
import MealCategoryService from '../Services/MealCategoryService';
import MealCategory from '../Models/MealCategory';

class MealCategoryRepository {
    constructor() {
        this.mealCategoryService = MealCategoryService;
    }

    async getMealCategories() {
        const data = await this.mealCategoryService.getAllCategories();
        // Ensure that each item passed to MealCategory constructor is a plain object
        // and that 'id' is distinct from 'data' for the constructor.
        return data.map(item => new MealCategory(item.id, item));
    }

    async addMealCategory(categoryData) {
        // Pass the raw categoryData; the service layer will handle cleaning.
        const newCategory = await this.mealCategoryService.addCategory(categoryData);
        // Ensure newCategory has both 'id' (Firestore doc ID) and potentially 'categoryId' (internal field)
        return new MealCategory(newCategory.id, newCategory);
    }

    async updateMealCategory(id, updatedData) {
        // Pass the raw updatedData; the service layer will handle cleaning.
        await this.mealCategoryService.updateCategory(id, updatedData);
    }

    async deleteMealCategory(id) {
        await this.mealCategoryService.deleteCategory(id);
    }
}

export default new MealCategoryRepository();