const express = require('express');
const router = express.Router();
const MealPlan = require('../Models/MealPlan');
const NotificationService = require('../Services/NotificationService');
const authMiddleware = require('../middleware/authMiddleware'); // Your authentication middleware
const authorizeRoles = require('../middleware/authorizeRoles'); // Your authorization middleware

// Protect all nutritionist meal plan routes with auth and role check
router.use(authMiddleware, authorizeRoles(['nutritionist']));

// POST /api/meal-plans - Create a new meal plan (by nutritionist)
router.post('/', async (req, res) => {
    try {
        const nutritionistId = req.user.id; // Get ID from authenticated user
        const { name, description, image, recipe, preparation, allergens, portionSize, storage, nutrientInfo, categories } = req.body;

        const newMealPlan = new MealPlan({
            name,
            description,
            image,
            recipe,
            preparation,
            allergens,
            portionSize,
            storage,
            nutrientInfo,
            categories,
            authorId: nutritionistId,
            status: 'PENDING_APPROVAL', // Default status upon creation
            likes: '0' // Initial likes
        });

        await newMealPlan.save();

        // Notify admins about the new pending meal plan
        await NotificationService.createAdminNotification({
            type: 'NEW_MEAL_PLAN_PENDING',
            mealPlanId: newMealPlan._id,
            message: `New meal plan "${newMealPlan.name}" submitted by nutritionist ${req.user.name || req.user.id} for review.`,
            link: `/admin/meal-plans/${newMealPlan._id}` // Link to admin review page (adjust as per your admin frontend routes)
        });

        res.status(201).json({
            message: 'Meal plan created and submitted for approval successfully!',
            mealPlan: newMealPlan
        });

    } catch (error) {
        console.error('Error creating meal plan:', error);
        res.status(500).json({ message: 'Server error while creating meal plan.', error: error.message });
    }
});

// GET /api/meal-plans/nutritionist - Get all meal plans for the logged-in nutritionist
router.get('/nutritionist', async (req, res) => {
    try {
        const nutritionistId = req.user.id;
        // Populate author information if needed, to show "By John Doe"
        const mealPlans = await MealPlan.find({ authorId: nutritionistId }).sort({ createdAt: -1 });
        res.json(mealPlans);
    } catch (error) {
        console.error('Error fetching nutritionist meal plans:', error);
        res.status(500).json({ message: 'Server error while fetching meal plans.', error: error.message });
    }
});

// PUT /api/meal-plans/:id - Update a meal plan (by nutritionist)
router.put('/:id', async (req, res) => {
    try {
        const mealPlanId = req.params.id;
        const nutritionistId = req.user.id;

        // Ensure the meal plan belongs to the nutritionist and is not pending approval
        const mealPlan = await MealPlan.findOne({ _id: mealPlanId, authorId: nutritionistId });

        if (!mealPlan) {
            return res.status(404).json({ message: 'Meal plan not found or you are not authorized to update it.' });
        }
        if (mealPlan.status === 'PENDING_APPROVAL') {
            return res.status(400).json({ message: 'Cannot update a meal plan that is currently pending approval.' });
        }

        const updatedMealPlan = await MealPlan.findByIdAndUpdate(
            mealPlanId,
            { ...req.body, status: 'PENDING_APPROVAL' }, // Set to pending approval again on update
            { new: true, runValidators: true }
        );

        // Notify admins again if the plan goes back to pending after update
        await NotificationService.createAdminNotification({
            type: 'MEAL_PLAN_UPDATED_PENDING',
            mealPlanId: updatedMealPlan._id,
            message: `Meal plan "${updatedMealPlan.name}" has been updated by nutritionist ${req.user.name || req.user.id} and requires re-review.`,
            link: `/admin/meal-plans/${updatedMealPlan._id}`
        });

        res.json({ message: 'Meal plan updated and resubmitted for approval successfully!', mealPlan: updatedMealPlan });

    } catch (error) {
        console.error('Error updating meal plan:', error);
        res.status(500).json({ message: 'Server error updating meal plan.', error: error.message });
    }
});

module.exports = router;