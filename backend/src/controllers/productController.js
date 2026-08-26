const Product = require('../models/Product');

// Get all products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll();
        res.json(products);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Get product by ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Create product (admin only)
const createProduct = async (req, res) => {
    try {
        const { name, category, wholesale_price, retail_price, cost_price } = req.body;

        if (!name || !wholesale_price || !retail_price || !cost_price) {
            return res.status(400).json({ error: 'Name and prices are required' });
        }

        const product = await Product.create({
            name,
            category: category || null,
            wholesale_price,
            retail_price,
            cost_price
        });

        res.status(201).json({
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Update product (admin only)
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, wholesale_price, retail_price, cost_price } = req.body;

        const existing = await Product.findById(id);
        if (!existing) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = await Product.update(id, {
            name: name || existing.name,
            category: category || existing.category,
            wholesale_price: wholesale_price || existing.wholesale_price,
            retail_price: retail_price || existing.retail_price,
            cost_price: cost_price || existing.cost_price
        });

        res.json({
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Delete product (admin only)
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await Product.findById(id);
        if (!existing) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // First, delete all stock entries for this product
        const pool = require('../config/database');
        await pool.query('DELETE FROM stock WHERE product_id = $1', [id]);

        // Then delete the product
        await Product.delete(id);

        res.json({ message: 'Product and associated stock deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Search products
const searchProducts = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Search term is required' });
        }

        const products = await Product.search(q);
        res.json(products);
    } catch (error) {
        console.error('Search products error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts
};
