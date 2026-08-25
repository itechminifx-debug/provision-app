const Stock = require('../models/Stock');

// Get stock by store
const getStockByStore = async (req, res) => {
    try {
        const { storeId } = req.params;
        const stock = await Stock.getByStore(storeId);
        res.json(stock);
    } catch (error) {
        console.error('Get stock error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Get stock summary (all stores)
const getStockSummary = async (req, res) => {
    try {
        const summary = await Stock.getSummary();
        res.json(summary);
    } catch (error) {
        console.error('Get stock summary error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Add stock (admin only)
const addStock = async (req, res) => {
    try {
        const { product_id, store_id, stock_type, quantity, expiry_date } = req.body;

        if (!product_id || !store_id || !stock_type || !quantity) {
            return res.status(400).json({ error: 'Product ID, Store ID, Stock Type, and Quantity are required' });
        }

        if (!['new_stock', 'old_stock'].includes(stock_type)) {
            return res.status(400).json({ error: 'Stock type must be new_stock or old_stock' });
        }

        if (quantity <= 0) {
            return res.status(400).json({ error: 'Quantity must be greater than 0' });
        }

        const stock = await Stock.addStock({
            product_id,
            store_id,
            stock_type,
            quantity,
            expiry_date
        });

        res.status(201).json({
            message: 'Stock added successfully',
            stock
        });
    } catch (error) {
        console.error('Add stock error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Get low stock alert
const getLowStock = async (req, res) => {
    try {
        const lowStock = await Stock.getLowStock();
        res.json(lowStock);
    } catch (error) {
        console.error('Get low stock error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Get stock history for a product
const getStockHistory = async (req, res) => {
    try {
        const { productId, storeId } = req.params;
        const history = await Stock.getHistory(productId, storeId);
        res.json(history);
    } catch (error) {
        console.error('Get stock history error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

module.exports = {
    getStockByStore,
    getStockSummary,
    addStock,
    getLowStock,
    getStockHistory
};