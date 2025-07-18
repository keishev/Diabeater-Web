const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String }, // URL or path to image
    saveCount: { type: String, default: '0' }, // Stored as string to allow '1.3k' etc.
    authorId: { // Link to the user (nutritionist) who created it
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming your User model is named 'User'
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING_APPROVAL', 'UPLOADED', 'REJECTED'], // 'UPLOADED' corresponds to 'APPROVED' in frontend
        default: 'PENDING_APPROVAL' // Default status for new meal plans
    },
    reason: { type: String }, // For rejection reasons
    recipe: { type: [String], default: [] },
    preparation: { type: String },
    allergens: { type: String },
    portionSize: { type: String },
    storage: { type: String },
    nutrientInfo: {
        calories: { type: Number },
        carbs: { type: Number },
        protein: { type: Number },
        fat: { type: Number }
    },
    categories: { type: [String], default: [] }
}, { timestamps: true }); // Adds createdAt and updatedAt

module.exports = mongoose.model('MealPlan', mealPlanSchema);