// src/Models/MealCategory.js
class MealCategory {
    constructor(id, data) {
        this.id = id; // Firestore document ID
        this.categoryName = data.categoryName;
        this.categoryDescription = data.categoryDescription;
        // Ensure categoryId is explicitly null if not provided, not undefined
        this.categoryId = data.categoryId !== undefined ? data.categoryId : null;
    }

    // Method to convert instance to plain object for Firestore
    toFirestore() {
        const firestoreData = {
            categoryName: this.categoryName,
            categoryDescription: this.categoryDescription,
        };
        // Only include categoryId if it has a value (not null or undefined)
        if (this.categoryId !== null && this.categoryId !== undefined) {
            firestoreData.categoryId = this.categoryId;
        }
        return firestoreData;
    }
}

export default MealCategory;