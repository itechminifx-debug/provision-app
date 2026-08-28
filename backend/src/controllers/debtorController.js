const Debtor = require('../models/Debtor');
const Sale = require('../models/Sale');

// Create a new debtor
const createDebtor = async (req, res) => {
    try {
        const { customer_name, phone } = req.body;

        if (!customer_name) {
            return res.status(400).json({ error: 'Customer name is required' });
        }

        // Check if debtor already exists
        const existing = await Debtor.findByName(customer_name);
        if (existing) {
            return res.status(400).json({ 
                error: 'Debtor already exists',
                debtor: existing
            });
        }

        const debtor = await Debtor.create({ customer_name, phone });

        res.status(201).json({
            message: 'Debtor created successfully',
            debtor
        });
    } catch (error) {
        console.error('Create debtor error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Get all debtors
const getAllDebtors = async (req, res) => {
    try {
        const debtors = await Debtor.findAll();
        console.log('📊 Debtors found:', debtors.length);
        res.json(debtors);
    } catch (error) {
        console.error('Get debtors error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Get debtor by ID
const getDebtorById = async (req, res) => {
    try {
        const { id } = req.params;
        const debtor = await Debtor.findById(id);
        
        if (!debtor) {
            return res.status(404).json({ error: 'Debtor not found' });
        }
        
        res.json(debtor);
    } catch (error) {
        console.error('Get debtor error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Get payment history for a debtor
const getPaymentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const payments = await Debtor.getPaymentHistory(id);
        res.json(payments);
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Record a payment
const recordPayment = async (req, res) => {
    try {
        const { debtor_id, sale_id, amount_paid, payment_method } = req.body;

        if (!debtor_id || !amount_paid || !payment_method) {
            return res.status(400).json({ error: 'Debtor ID, amount, and payment method are required' });
        }

        if (amount_paid <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        if (!['cash', 'mobile_money', 'bank_transfer'].includes(payment_method)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        // Check if debtor exists
        const debtor = await Debtor.findById(debtor_id);
        if (!debtor) {
            return res.status(404).json({ error: 'Debtor not found' });
        }

        // Check if amount exceeds outstanding balance
        if (amount_paid > debtor.outstanding_balance) {
            return res.status(400).json({ 
                error: `Amount exceeds outstanding balance of GHS ${debtor.outstanding_balance}` 
            });
        }

        const result = await Debtor.recordPayment({
            debtor_id,
            sale_id: sale_id || null,
            amount_paid,
            payment_method
        });

        // Get updated debtor info
        const updatedDebtor = await Debtor.findById(debtor_id);

        res.status(201).json({
            message: 'Payment recorded successfully',
            payment: result.payment,
            new_total_debt: result.new_total_debt,
            debtor: updatedDebtor
        });
    } catch (error) {
        console.error('Record payment error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Get all payments
const getAllPayments = async (req, res) => {
    try {
        const payments = await Debtor.getAllPayments();
        res.json(payments);
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Handle credit sale (called from sales controller)
const handleCreditSale = async (saleId, customer_name, balance_due) => {
    try {
        // Find or create debtor
        let debtor = await Debtor.findByName(customer_name);
        if (!debtor) {
            debtor = await Debtor.create({ customer_name, phone: null });
            console.log('✅ New debtor created:', debtor);
        } else {
            console.log('✅ Existing debtor found:', debtor);
        }

        // Update debtor's total debt
        const updated = await Debtor.updateTotalDebt(debtor.id, balance_due);
        console.log('✅ Debtor total debt updated:', updated);

        return debtor;
    } catch (error) {
        console.error('❌ Handle credit sale error:', error);
        throw error;
    }
};

module.exports = {
    createDebtor,
    getAllDebtors,
    getDebtorById,
    getPaymentHistory,
    recordPayment,
    getAllPayments,
    handleCreditSale
};