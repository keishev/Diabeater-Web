// src/Repositories/CategoryRepository.js
import { db } from '../firebase'; 
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const CATEGORIES_COLLECTION = 'meal_plan_categories'; 

class CategoryRepository {
    constructor() {
        this.collectionRef = collection(db, CATEGORIES_COLLECTION);
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
            console.error("Error fetching all categories:", error);
            throw error;
        }
    }

    async addCategory(categoryData) {
        try {
            const docRef = await addDoc(this.collectionRef, {
                createdAt: new Date(),
                ...categoryData
            });
            console.log("Document written with ID: ", docRef.id);
            return docRef.id;
        } catch (error) {
            console.error("Error adding category:", error);
            throw error;
        }
    }

    async updateCategory(id, updatedData) {
        try {
            const categoryDocRef = doc(db, CATEGORIES_COLLECTION, id);
            await updateDoc(categoryDocRef, {
                updatedAt: new Date(),
                ...updatedData
            });
            console.log("Category updated successfully:", id);
        } catch (error) {
            console.error("Error updating category:", error);
            throw error;
        }
    }

    async deleteCategory(id) {
        try {
            const categoryDocRef = doc(db, CATEGORIES_COLLECTION, id);
            await deleteDoc(categoryDocRef);
            console.log("Category deleted successfully:", id);
        } catch (error) {
            console.error("Error deleting category:", error);
            throw error;
        }
    }
}

export default new CategoryRepository();