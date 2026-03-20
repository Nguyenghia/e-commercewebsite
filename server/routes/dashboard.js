const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const { requireAdminOrSales } = require('../middleware/roleMiddleware');
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', verifyToken, requireAdminOrSales, dashboardController.getStats);

module.exports = router;
