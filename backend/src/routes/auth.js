const express = require('express');
const router = express.Router();
const { login, register, getMe, logout } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public routes
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/me', authMiddleware, getMe);

// Admin only - register new users
router.post('/register', authMiddleware, roleCheck('admin'), register);

module.exports = router;