const express = require('express');
const router = express.Router();
const Notification = require('../Models/Notification');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');

// Apply auth and nutritionist role check to all routes in this file
router.use(authMiddleware, authorizeRoles(['nutritionist']));

// GET /api/notifications - Get all notifications for the logged-in nutritionist
router.get('/', async (req, res) => {
    try {
        const nutritionistId = req.user.id;
        const notifications = await Notification.find({ recipientId: nutritionistId }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching nutritionist notifications:', error);
        res.status(500).json({ message: 'Server error fetching notifications.' });
    }
});

// PUT /api/notifications/:id/read - Mark a specific notification as read
router.put('/:id/read', async (req, res) => {
    try {
        const notificationId = req.params.id;
        const nutritionistId = req.user.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipientId: nutritionistId }, // Ensure user owns the notification
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found or not authorized.' });
        }

        res.json({ message: 'Notification marked as read.', notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error marking notification as read.' });
    }
});

module.exports = router;