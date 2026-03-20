const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected route example
router.get('/me', authController.verifyToken, (req, res) => {
    res.json(req.user);
});

module.exports = router;
