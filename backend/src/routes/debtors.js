const express = require('express');
const router = express.Router();
const {
    createDebtor,
    getAllDebtors,
    getDebtorById,
    getPaymentHistory,
    recordPayment,
    getAllPayments
} = require('../controllers/debtorController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(roleCheck('admin'));

// Debtor routes
router.post('/', createDebtor);
router.get('/', getAllDebtors);
router.get('/:id', getDebtorById);
router.get('/:id/payments', getPaymentHistory);
router.post('/payments', recordPayment);
router.get('/payments/all', getAllPayments);

module.exports = router;