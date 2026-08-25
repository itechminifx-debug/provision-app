const express = require('express');
const router = express.Router();
const {
    createSale,
    getSales,
    getSaleById,
    getSalesByDate,
    getDailySummary
} = require('../controllers/saleController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Sales routes
router.post('/', createSale);
router.get('/', getSales);
router.get('/by-date', getSalesByDate);
router.get('/daily-summary', getDailySummary);
router.get('/:id', getSaleById);

module.exports = router;