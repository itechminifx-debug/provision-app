const Transfer = require('../models/Transfer');

// Create a stock transfer (admin only)
const createTransfer = async (req, res) => {
    try {
        const { product_id, from_store_id, to_store_id, stock_type, quantity } = req.body;

        if (!product_id || !from_store_id || !to_store_id || !stock_type || !quantity) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (from_store_id === to_store_id) {
            return res.status(400).json({ error: 'Source and destination stores must be different' });
        }

        if (!['new_stock', 'old_stock'].includes(stock_type)) {
            return res.status(400).json({ error: 'Stock type must be new_stock or old_stock' });
        }

        if (quantity <= 0) {
            return res.status(400).json({ error: 'Quantity must be greater than 0' });
        }

        const transfer = await Transfer.create({
            product_id,
            from_store_id,
            to_store_id,
            stock_type,
            quantity,
            transferred_by: req.user.id
        });

        res.status(201).json({
            message: 'Stock transferred successfully',
            transfer
        });
    } catch (error) {
        console.error('Transfer error:', error);
        if (error.message.includes('Insufficient')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'An error occurred during transfer' });
    }
};

// Get all transfers (admin only)
const getAllTransfers = async (req, res) => {
    try {
        const transfers = await Transfer.findAll();
        res.json(transfers);
    } catch (error) {
        console.error('Get transfers error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Get transfers by product
const getTransfersByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const transfers = await Transfer.findByProduct(productId);
        res.json(transfers);
    } catch (error) {
        console.error('Get transfers by product error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

module.exports = {
    createTransfer,
    getAllTransfers,
    getTransfersByProduct
};