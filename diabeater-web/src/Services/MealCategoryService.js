
import { db } from '../firebase'; 
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

class MealCategoryService {
    constructor() {
        this.collectionRef = collection(db, 'meal_plan_categories');
    }

    async getAllCategories() {
        try {
            const querySnapshot = await getDocs(this.collectionRef);
            const categories = querySnapshot.docs.map(doc => ({
                id: doc.id, 
                ...doc.data()
            }));
            return categories;
        } catch (error) {
            console.error('Error fetching meal categories:', error);
            throw error;
        }
    }

    async addCategory(categoryData) {
        try {
            
            
            const initialData = {
                categoryName: categoryData.categoryName,
                categoryDescription: categoryData.categoryDescription,
                createdAt: new Date(),
            };

            
            if (categoryData.categoryId) { 
                initialData.categoryId = categoryData.categoryId;
            }

            const docRef = await addDoc(this.collectionRef, initialData);
            console.log("Category added with ID: ", docRef.id);

            
            
            
            if (!categoryData.categoryId) {
                await updateDoc(docRef, { categoryId: docRef.id });
                
                return { id: docRef.id, ...initialData, categoryId: docRef.id };
            }

            
            return { id: docRef.id, ...initialData };

        } catch (error) {
            console.error('Error adding meal category:', error);
            throw error;
        }
    }

    async updateCategory(id, updatedData) {
        try {
            const docRef = doc(this.collectionRef, id);

            
            const dataForFirestore = {};

            
            for (const key in updatedData) {
                
                if (updatedData[key] !== undefined) {
                    dataForFirestore[key] = updatedData[key];
                }
            }

            
            dataForFirestore.updatedAt = new Date();

            await updateDoc(docRef, dataForFirestore); 
            console.log(`Category ${id} updated.`);
        } catch (error) {
            console.error(`Error updating meal category ${id}:`, error);
            throw error;
        }
    }

    async deleteCategory(id) {
        try {
            const docRef = doc(this.collectionRef, id);
            await deleteDoc(docRef);
            console.log(`Category ${id} deleted.`);
        } catch (error) {
            console.error(`Error deleting meal category ${id}:`, error);
            throw error;
        }
    }
}

export default new MealCategoryService();