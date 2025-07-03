const Notification = require('../Models/Notification');
const User = require('../Models/User'); // Assuming you have a User model to find admins

class NotificationService {
    /**
     * Creates a notification for a specific user (e.g., a nutritionist).
     * @param {string} recipientId - The ID of the user to receive the notification.
     * @param {string} type - The type of notification (e.g., 'MEAL_PLAN_APPROVED').
     * @param {string} message - The main message content.
     * @param {string} [mealPlanId] - Optional: ID of the related meal plan.
     * @param {string} [reason] - Optional: Reason for rejection etc.
     */
    static async createNotification({ recipientId, type, message, mealPlanId = null, reason = null }) {
        try {
            const newNotification = new Notification({
                recipientId,
                type,
                message,
                mealPlanId,
                reason,
                isRead: false,
                createdAt: new Date()
            });
            await newNotification.save();
            console.log(`Notification created for user ${recipientId}: ${message}`);
            return newNotification;
        } catch (error) {
            console.error('Error creating user notification:', error);
            // Decide how to handle this error (e.g., log, but don't fail the primary operation)
        }
    }

    /**
     * Creates a notification for all users with the 'admin' role.
     * @param {string} type - The type of notification (e.g., 'NEW_MEAL_PLAN_PENDING').
     * @param {string} message - The main message content.
     * @param {string} [mealPlanId] - Optional: ID of the related meal plan.
     * @param {string} [link] - Optional: A specific link for the admin to follow (e.g., review page).
     */
    static async createAdminNotification({ type, message, mealPlanId = null, link = null }) {
        try {
            const admins = await User.find({ role: 'admin' }); // Find all admin users

            if (admins.length === 0) {
                console.warn('No admin users found to send notification to.');
                return;
            }

            const notificationsToCreate = admins.map(admin => ({
                recipientId: admin._id,
                type: type,
                message: message,
                mealPlanId: mealPlanId,
                link: link,
                isRead: false,
                createdAt: new Date()
            }));

            await Notification.insertMany(notificationsToCreate); // Insert many notifications at once
            console.log(`Admin notification created for ${admins.length} admins: ${message}`);
        } catch (error) {
            console.error('Error creating admin notification:', error);
        }
    }
}

module.exports = NotificationService;