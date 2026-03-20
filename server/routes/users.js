const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const { requireAdmin, requireAdminOrSales } = require('../middleware/roleMiddleware');
const userController = require('../controllers/userController');

// Personal profile — any logged-in user
router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, userController.updateProfile);

// Staff routes
router.get('/', verifyToken, requireAdminOrSales, userController.getAllUsers);

// Admin only — role changes
router.patch('/:id/role', verifyToken, requireAdmin, userController.updateUserRole);

module.exports = router;
