const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const { requireAdmin, requireAdminOrSales } = require('../middleware/roleMiddleware');
const orderController = require('../controllers/orderController');

router.post('/', verifyToken, orderController.createOrder);
router.get('/my', verifyToken, orderController.getMyOrders);

// Sales can view all orders and update statuses
router.get('/', verifyToken, requireAdminOrSales, orderController.getAllOrders);
router.patch('/:id/status', verifyToken, requireAdminOrSales, orderController.updateOrderStatus);

module.exports = router;
