const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, createCashier, deleteUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(roleCheck('admin'));

// Routes
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/cashier', createCashier);
router.delete('/:id', deleteUser);

module.exports = router;