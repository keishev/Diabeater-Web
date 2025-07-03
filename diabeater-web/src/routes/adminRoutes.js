const express = require('express');
const router = express.Router();
const MealPlan = require('../Models/MealPlan');
const Notification = require('../Models/Notification');
const NotificationService = require('../Services/NotificationService');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');

// Apply auth and admin role check to all routes in this file
router.use(authMiddleware, authorizeRoles(['admin']));

// GET /api/admin/meal-plans/pending - Get all meal plans pending approval
router.get('/meal-plans/pending', async (req, res) => {
    try {
        // Populate author details (e.g., name) if you want to display them in admin view
        const pendingMealPlans = await MealPlan.find({ status: 'PENDING_APPROVAL' }).populate('authorId', 'name email');
        res.json(pendingMealPlans);
    } catch (error) {
        console.error('Error fetching pending meal plans for admin:', error);
        res.status(500).json({ message: 'Server error fetching pending meal plans.' });
    }
});

// PUT /api/admin/meal-plans/:id/approve - Approve a meal plan
router.put('/meal-plans/:id/approve', async (req, res) => {
    try {
        const mealPlan = await MealPlan.findByIdAndUpdate(
            req.params.id,
            { status: 'UPLOADED', reason: null }, // 'UPLOADED' is the final approved state
            { new: true }
        );

        if (!mealPlan) {
            return res.status(404).json({ message: 'Meal plan not found.' });
        }

        // Notify the nutritionist that their meal plan has been approved
        await NotificationService.createNotification({
            recipientId: mealPlan.authorId,
            type: 'MEAL_PLAN_APPROVED',
            mealPlanId: mealPlan._id,
            message: `Good news! Your meal plan "${mealPlan.name}" has been approved and is now live!`
        });

        res.json({ message: 'Meal plan approved successfully!', mealPlan });
    } catch (error) {
        console.error('Error approving meal plan:', error);
        res.status(500).json({ message: 'Server error approving meal plan.' });
    }
});

// PUT /api/admin/meal-plans/:id/reject - Reject a meal plan
router.put('/meal-plans/:id/reject', async (req, res) => {
    try {
        const { reason } = req.body; // Admin provides a reason

        const mealPlan = await MealPlan.findByIdAndUpdate(
            req.params.id,
            { status: 'REJECTED', reason: reason || 'No specific reason provided.' },
            { new: true }
        );

        if (!mealPlan) {
            return res.status(404).json({ message: 'Meal plan not found.' });
        }

        // Notify the nutritionist that their meal plan has been rejected
        await NotificationService.createNotification({
            recipientId: mealPlan.authorId,
            type: 'MEAL_PLAN_REJECTED',
            mealPlanId: mealPlan._id,
            message: `Your meal plan "${mealPlan.name}" has been rejected.`,
            reason: reason // Pass the reason to the nutritionist
        });

        res.json({ message: 'Meal plan rejected successfully!', mealPlan });
    } catch (error) {
        console.error('Error rejecting meal plan:', error);
        res.status(500).json({ message: 'Server error rejecting meal plan.' });
    }
});

// GET /api/admin/notifications - Get all notifications for the logged-in admin
router.get('/notifications', async (req, res) => {
    try {
        const adminId = req.user.id;
        const notifications = await Notification.find({ recipientId: adminId }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching admin notifications:', error);
        res.status(500).json({ message: 'Server error fetching admin notifications.' });
    }
});

// PUT /api/admin/notifications/:id/read - Mark an admin notification as read
router.put('/notifications/:id/read', async (req, res) => {
    try {
        const notificationId = req.params.id;
        const adminId = req.user.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipientId: adminId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found or not authorized.' });
        }

        res.json({ message: 'Notification marked as read.', notification });
    } catch (error) {
        console.error('Error marking admin notification as read:', error);
        res.status(500).json({ message: 'Server error marking notification as read.' });
    }
});

module.exports = router;