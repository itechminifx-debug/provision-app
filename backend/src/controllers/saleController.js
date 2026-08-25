const Sale = require('../models/Sale');

// Create a new sale
const createSale = async (req, res) => {
    try {
        const {
            store_id,
            sale_type,
            items,
            amount_paid,
            payment_method,
            customer_name
        } = req.body;

        // Validation
        if (!store_id || !sale_type || !items || items.length === 0) {
            return res.status(400).json({ error: 'Store ID, sale type, and items are required' });
        }

        if (!['retail', 'wholesale'].includes(sale_type)) {
            return res.status(400).json({ error: 'Sale type must be retail or wholesale' });
        }

        if (!['cash', 'mobile_money', 'bank_transfer', 'credit'].includes(payment_method)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        // If credit, customer name is required
        if (payment_method === 'credit' && !customer_name) {
            return res.status(400).json({ error: 'Customer name is required for credit sales' });
        }

        const sale = await Sale.create({
            cashier_id: req.user.id,
            store_id,
            sale_type,
            items,
            amount_paid: amount_paid || 0,
            payment_method,
            customer_name
        });

        // If credit sale, add to debtors
        if (payment_method === 'credit' && sale.balance_due > 0) {
            try {
                const { handleCreditSale } = require('./debtorController');
                await handleCreditSale(sale.sale.id, customer_name, sale.balance_due);
            } catch (debtorError) {
                console.error('Debtor handling error:', debtorError);
                // Don't fail the sale if debtor handling fails
            }
        }

        res.status(201).json({
            message: 'Sale completed successfully',
            sale
        });
    } catch (error) {
        console.error('Create sale error:', error);
        if (error.message.includes('Insufficient stock')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'An error occurred during sale' });
    }
};

// Get all sales (admin sees all, cashier sees own)
const getSales = async (req, res) => {
    try {
        let cashierId = null;
        if (req.user.role === 'cashier') {
            cashierId = req.user.id;
        }
        const sales = await Sale.findAll(cashierId);
        res.json(sales);
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Get sale by ID
const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;
        const sale = await Sale.findById(id);
        
        if (!sale) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        // Cashiers can only view their own sales
        if (req.user.role === 'cashier' && sale.cashier_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(sale);
    } catch (error) {
        console.error('Get sale error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Get sales by date range
const getSalesByDate = async (req, res) => {
    try {
        const { startDate, endDate, storeId } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const sales = await Sale.getByDateRange(startDate, endDate, storeId);
        res.json(sales);
    } catch (error) {
        console.error('Get sales by date error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Get daily summary
const getDailySummary = async (req, res) => {
    try {
        const { date } = req.query;
        const summaryDate = date || new Date().toISOString().split('T')[0];
        const summary = await Sale.getDailySummary(summaryDate);
        res.json(summary);
    } catch (error) {
        console.error('Get daily summary error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

module.exports = {
    createSale,
    getSales,
    getSaleById,
    getSalesByDate,
    getDailySummary
};