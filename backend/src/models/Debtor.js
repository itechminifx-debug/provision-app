const pool = require('../config/database');

class Debtor {
    // Create a new debtor
    static async create({ customer_name, phone }) {
        const query = `
            INSERT INTO debtors (customer_name, phone, total_debt)
            VALUES ($1, $2, 0)
            RETURNING id, customer_name, phone, total_debt, created_at
        `;
        const result = await pool.query(query, [customer_name, phone || null]);
        return result.rows[0];
    }

    // Get all debtors with outstanding balance
    static async findAll() {
        const query = `
            SELECT 
                d.id,
                d.customer_name,
                d.phone,
                d.total_debt,
                COALESCE(SUM(p.amount_paid), 0) AS total_paid,
                d.total_debt - COALESCE(SUM(p.amount_paid), 0) AS outstanding_balance,
                COUNT(p.id) AS payment_count,
                MAX(p.created_at) AS last_payment_date,
                d.created_at
            FROM debtors d
            LEFT JOIN payments p ON d.id = p.debtor_id
            GROUP BY d.id
            
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    // Get debtor by ID with full details
    static async findById(id) {
        const query = `
            SELECT 
                d.id,
                d.customer_name,
                d.phone,
                d.total_debt,
                COALESCE(SUM(p.amount_paid), 0) AS total_paid,
                d.total_debt - COALESCE(SUM(p.amount_paid), 0) AS outstanding_balance,
                COUNT(p.id) AS payment_count,
                MAX(p.created_at) AS last_payment_date,
                d.created_at
            FROM debtors d
            LEFT JOIN payments p ON d.id = p.debtor_id
            WHERE d.id = $1
            GROUP BY d.id
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    // Get debtor by name (for finding existing)
    static async findByName(customer_name) {
        const query = 'SELECT * FROM debtors WHERE customer_name ILIKE $1';
        const result = await pool.query(query, [customer_name]);
        return result.rows[0] || null;
    }

    // Update debtor total debt (triggered by sales)
    static async updateTotalDebt(debtorId, amount) {
        const query = `
            UPDATE debtors 
            SET total_debt = total_debt + $1
            WHERE id = $2
            RETURNING id, total_debt
        `;
        const result = await pool.query(query, [amount, debtorId]);
        return result.rows[0];
    }

    // Record a payment
    static async recordPayment({ debtor_id, sale_id, amount_paid, payment_method }) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Insert payment
            const insertQuery = `
                INSERT INTO payments (debtor_id, sale_id, amount_paid, payment_method)
                VALUES ($1, $2, $3, $4)
                RETURNING id, created_at
            `;
            const result = await client.query(insertQuery, [
                debtor_id,
                sale_id || null,
                amount_paid,
                payment_method
            ]);

            // Update debtor total debt (reduce it)
            const updateQuery = `
                UPDATE debtors 
                SET total_debt = total_debt - $1
                WHERE id = $2
                RETURNING total_debt
            `;
            await client.query(updateQuery, [amount_paid, debtor_id]);

            await client.query('COMMIT');

            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Get payment history for a debtor
    static async getPaymentHistory(debtorId) {
        const query = `
            SELECT 
                p.id,
                p.amount_paid,
                p.payment_method,
                p.created_at,
                s.invoice_number,
                s.sale_type
            FROM payments p
            LEFT JOIN sales s ON p.sale_id = s.id
            WHERE p.debtor_id = $1
            ORDER BY p.created_at DESC
        `;
        const result = await pool.query(query, [debtorId]);
        return result.rows;
    }

    // Get all payments (admin overview)
    static async getAllPayments() {
        const query = `
            SELECT 
                p.id,
                p.amount_paid,
                p.payment_method,
                p.created_at,
                d.customer_name AS debtor_name,
                s.invoice_number
            FROM payments p
            JOIN debtors d ON p.debtor_id = d.id
            LEFT JOIN sales s ON p.sale_id = s.id
            ORDER BY p.created_at DESC
            LIMIT 100
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = Debtor;