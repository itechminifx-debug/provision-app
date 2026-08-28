const pool = require('../config/database');
const Stock = require('./Stock');

class Sale {
    // Generate invoice number
    static generateInvoiceNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `INV-${year}${month}${day}-${random}`;
    }

    // Create a new sale
    static async create({
        cashier_id,
        store_id,
        sale_type,
        items,
        amount_paid,
        payment_method,
        customer_name
    }) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            let total_amount = 0;
            const saleItems = [];

            // Calculate total and process each item
            for (const item of items) {
                // Get product price based on sale type
                const priceQuery = `
                    SELECT ${sale_type === 'retail' ? 'retail_price' : 'wholesale_price'} as price
                    FROM products
                    WHERE id = $1
                `;
                const priceResult = await client.query(priceQuery, [item.product_id]);
                const unit_price = parseFloat(priceResult.rows[0].price);
                const item_total = unit_price * item.quantity;
                total_amount += item_total;

                saleItems.push({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: unit_price,
                    total_price: item_total
                });

                // Deduct stock (FIFO) - ONLY ONCE!
                console.log('🔍 SALE - Deducting stock:', {
                    product_id: item.product_id,
                    store_id: store_id,
                    quantity: item.quantity,
                    sale_type: sale_type
                });
                await Stock.deductStock(item.product_id, store_id, item.quantity);
            }

            // Generate invoice number
            const invoice_number = this.generateInvoiceNumber();

            // Calculate balance due
            const balance_due = total_amount - amount_paid;

            // Insert sale
            const saleQuery = `
                INSERT INTO sales (
                    invoice_number, cashier_id, store_id, sale_type,
                    total_amount, amount_paid, balance_due, payment_method, customer_name
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id, invoice_number, created_at
            `;
            const saleValues = [
                invoice_number,
                cashier_id,
                store_id,
                sale_type,
                total_amount,
                amount_paid,
                balance_due,
                payment_method,
                customer_name || null
            ];
            const saleResult = await client.query(saleQuery, saleValues);
            const saleId = saleResult.rows[0].id;

            // Insert sale items
            for (const item of saleItems) {
                const itemQuery = `
                    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                await client.query(itemQuery, [
                    saleId,
                    item.product_id,
                    item.quantity,
                    item.unit_price,
                    item.total_price
                ]);
            }

            await client.query('COMMIT');

            return {
                sale: saleResult.rows[0],
                total_amount,
                balance_due,
                items: saleItems
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Get all sales (admin sees all, cashier sees own)
    static async findAll(cashierId = null) {
        let query = `
            SELECT 
                s.id, s.invoice_number, s.sale_type, s.total_amount, s.amount_paid,
                s.balance_due, s.payment_method, s.customer_name, s.created_at,
                u.full_name AS cashier_name,
                st.name AS store_name,
                COUNT(si.id) AS items_count
            FROM sales s
            LEFT JOIN users u ON s.cashier_id = u.id
            LEFT JOIN stores st ON s.store_id = st.id
            LEFT JOIN sale_items si ON s.id = si.sale_id
        `;

        const params = [];
        if (cashierId) {
            query += ` WHERE s.cashier_id = $1`;
            params.push(cashierId);
        }

        query += ` GROUP BY s.id, u.full_name, st.name ORDER BY s.created_at DESC`;

        const result = await pool.query(query, params);
        return result.rows;
    }

    // Get sale by ID with items
    static async findById(saleId) {
        // Get sale details
        const saleQuery = `
            SELECT 
                s.*, u.full_name AS cashier_name, st.name AS store_name
            FROM sales s
            LEFT JOIN users u ON s.cashier_id = u.id
            LEFT JOIN stores st ON s.store_id = st.id
            WHERE s.id = $1
        `;
        const saleResult = await pool.query(saleQuery, [saleId]);
        if (saleResult.rows.length === 0) return null;

        // Get sale items
        const itemsQuery = `
            SELECT 
                si.*, p.name AS product_name
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = $1
        `;
        const itemsResult = await pool.query(itemsQuery, [saleId]);

        return {
            ...saleResult.rows[0],
            items: itemsResult.rows
        };
    }

    // Get sales by date range
    static async getByDateRange(startDate, endDate, storeId = null) {
        let query = `
            SELECT 
                s.id, s.invoice_number, s.sale_type, s.total_amount, s.amount_paid,
                s.balance_due, s.payment_method, s.customer_name, s.created_at,
                u.full_name AS cashier_name,
                st.name AS store_name
            FROM sales s
            LEFT JOIN users u ON s.cashier_id = u.id
            LEFT JOIN stores st ON s.store_id = st.id
            WHERE s.created_at::date BETWEEN $1 AND $2
        `;
        const params = [startDate, endDate];

        if (storeId) {
            query += ` AND s.store_id = $3`;
            params.push(storeId);
        }

        query += ` ORDER BY s.created_at DESC`;

        const result = await pool.query(query, params);
        return result.rows;
    }

    // Get daily sales summary
    static async getDailySummary(date) {
        const query = `
            SELECT 
                COUNT(*) AS total_sales,
                SUM(total_amount) AS total_revenue,
                SUM(amount_paid) AS total_received,
                SUM(balance_due) AS total_outstanding,
                COUNT(CASE WHEN sale_type = 'retail' THEN 1 END) AS retail_count,
                COUNT(CASE WHEN sale_type = 'wholesale' THEN 1 END) AS wholesale_count,
                SUM(CASE WHEN sale_type = 'retail' THEN total_amount ELSE 0 END) AS retail_revenue,
                SUM(CASE WHEN sale_type = 'wholesale' THEN total_amount ELSE 0 END) AS wholesale_revenue
            FROM sales
            WHERE created_at::date = $1
        `;
        const result = await pool.query(query, [date]);
        return result.rows[0];
    }
}

module.exports = Sale;