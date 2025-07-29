// src/Services/MealCategoryService.js
import { db } from '../firebase'; // Ensure this path is correct for your firebase.js
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

class MealCategoryService {
    constructor() {
        this.collectionRef = collection(db, 'meal_plan_categories');
    }

    async getAllCategories() {
        try {
            const querySnapshot = await getDocs(this.collectionRef);
            const categories = querySnapshot.docs.map(doc => ({
                id: doc.id, // The Firestore document ID
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
            // Step 1: Prepare data for initial add.
            // Explicitly build the object to ensure no undefined fields are included initially.
            const initialData = {
                categoryName: categoryData.categoryName,
                categoryDescription: categoryData.categoryDescription,
                createdAt: new Date(),
            };

            // Only include categoryId if it's explicitly provided and valid (not undefined/null)
            if (categoryData.categoryId) { // Check if it's truthy (not undefined, null, 0, false, '')
                initialData.categoryId = categoryData.categoryId;
            }

            const docRef = await addDoc(this.collectionRef, initialData);
            console.log("Category added with ID: ", docRef.id);

            // Step 2: If categoryId was NOT provided in the initial `categoryData`
            // (meaning it was undefined, null, or falsy), update the document with its Firestore ID.
            // This ensures categoryId always matches doc.id if not explicitly set.
            if (!categoryData.categoryId) {
                await updateDoc(docRef, { categoryId: docRef.id });
                // Return the full object including the newly set categoryId
                return { id: docRef.id, ...initialData, categoryId: docRef.id };
            }

            // If categoryId was already present and valid, just return the initial data with the doc ID
            return { id: docRef.id, ...initialData };

        } catch (error) {
            console.error('Error adding meal category:', error);
            throw error;
        }
    }

    async updateCategory(id, updatedData) {
        try {
            const docRef = doc(this.collectionRef, id);

            // Create a new object for updates to ensure no undefined values are passed.
            const dataForFirestore = {};

            // Iterate over the provided updatedData
            for (const key in updatedData) {
                // Only include properties that are not undefined
                if (updatedData[key] !== undefined) {
                    dataForFirestore[key] = updatedData[key];
                }
            }

            // Always add or update the 'updatedAt' timestamp
            dataForFirestore.updatedAt = new Date();

            await updateDoc(docRef, dataForFirestore); // Use the cleaned object
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