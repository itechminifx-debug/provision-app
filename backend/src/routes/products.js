const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts
} = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public routes (any authenticated user can view products)
router.get('/', authMiddleware, getAllProducts);
router.get('/search', authMiddleware, searchProducts);
router.get('/:id', authMiddleware, getProductById);

// Admin only routes
router.post('/', authMiddleware, roleCheck('admin'), createProduct);
router.put('/:id', authMiddleware, roleCheck('admin'), updateProduct);
router.delete('/:id', authMiddleware, roleCheck('admin'), deleteProduct);

module.exports = router;
