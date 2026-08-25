const express = require('express');
const router = express.Router();
const {
    getDailyReport,
    getMonthlyReport,
    getStockReport,
    getLowStockReport,
    getDebtorReport,
    getPaymentMethodReport,
    getProfitReport,
    getFullReport
} = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(roleCheck('admin'));

// Report routes
router.get('/daily', getDailyReport);
router.get('/monthly', getMonthlyReport);
router.get('/stock', getStockReport);
router.get('/low-stock', getLowStockReport);
router.get('/debtors', getDebtorReport);
router.get('/payment-methods', getPaymentMethodReport);
router.get('/profit', getProfitReport);
router.get('/full', getFullReport);

module.exports = router;