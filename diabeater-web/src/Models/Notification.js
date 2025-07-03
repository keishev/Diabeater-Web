const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // The user who receives the notification (nutritionist or admin)
        required: true
    },
    type: { // e.g., 'MEAL_PLAN_APPROVED', 'MEAL_PLAN_REJECTED', 'NEW_MEAL_PLAN_PENDING'
        type: String,
        required: true
    },
    mealPlanId: { // Optional: Link to a specific meal plan if applicable
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MealPlan',
        required: false // Not all notifications will be meal-plan specific
    },
    message: { // The main text of the notification
        type: String,
        required: true
    },
    reason: { type: String }, // Optional: For rejection reasons
    link: { type: String }, // Optional: A URL path for the frontend to navigate to
    isRead: { // Whether the notification has been viewed
        type: Boolean,
        default: false
    }
}, { timestamps: true }); // Adds createdAt and updatedAt

module.exports = mongoose.model('Notification', notificationSchema);