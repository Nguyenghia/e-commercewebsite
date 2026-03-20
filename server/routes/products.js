const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const { requireAdmin } = require('../middleware/roleMiddleware');
const productController = require('../controllers/productController');

// Public (but requires login)
router.get('/', verifyToken, productController.getProducts);
router.get('/categories', verifyToken, productController.getCategories);
router.get('/:id', verifyToken, productController.getProduct);

// Admin only
router.post('/', verifyToken, requireAdmin, productController.createProduct);
router.put('/:id', verifyToken, requireAdmin, productController.updateProduct);
router.delete('/:id', verifyToken, requireAdmin, productController.deleteProduct);
router.post('/categories/new', verifyToken, requireAdmin, productController.createCategory);

module.exports = router;
