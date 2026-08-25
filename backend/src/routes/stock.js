const express = require('express');
const router = express.Router();
const {
    getStockByStore,
    getStockSummary,
    addStock,
    getLowStock,
    getStockHistory
} = require('../controllers/stockController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Protected routes (any authenticated user)
router.get('/store/:storeId', authMiddleware, getStockByStore);
router.get('/summary', authMiddleware, getStockSummary);
router.get('/low-stock', authMiddleware, getLowStock);
router.get('/history/:productId/:storeId', authMiddleware, getStockHistory);

// Admin only routes
router.post('/add', authMiddleware, roleCheck('admin'), addStock);

module.exports = router;