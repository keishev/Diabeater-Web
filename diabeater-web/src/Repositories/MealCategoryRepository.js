
import MealCategoryService from '../Services/MealCategoryService';
import MealCategory from '../Models/MealCategory';

class MealCategoryRepository {
    constructor() {
        this.mealCategoryService = MealCategoryService;
    }

    async getMealCategories() {
        const data = await this.mealCategoryService.getAllCategories();
        
        
        return data.map(item => new MealCategory(item.id, item));
    }

    async addMealCategory(categoryData) {
        
        const newCategory = await this.mealCategoryService.addCategory(categoryData);
        
        return new MealCategory(newCategory.id, newCategory);
    }

    async updateMealCategory(id, updatedData) {
        
        await this.mealCategoryService.updateCategory(id, updatedData);
    }

    async deleteMealCategory(id) {
        await this.mealCategoryService.deleteCategory(id);
    }
}

export default new MealCategoryRepository();