const express = require('express');
const router = express.Router();
const {
    createTransfer,
    getAllTransfers,
    getTransfersByProduct
} = require('../controllers/transferController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(authMiddleware);

// Admin only routes
router.post('/', roleCheck('admin'), createTransfer);
router.get('/', roleCheck('admin'), getAllTransfers);
router.get('/product/:productId', roleCheck('admin'), getTransfersByProduct);

module.exports = router;