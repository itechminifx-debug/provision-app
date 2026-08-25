const pool = require('../config/database');

class Transfer {
    // Create a stock transfer
    static async create({ product_id, from_store_id, to_store_id, stock_type, quantity, transferred_by }) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Check if from_store has enough stock
            const checkQuery = `
                SELECT quantity FROM stock 
                WHERE product_id = $1 AND store_id = $2 AND stock_type = $3
            `;
            const checkResult = await client.query(checkQuery, [product_id, from_store_id, stock_type]);
            
            if (checkResult.rows.length === 0 || checkResult.rows[0].quantity < quantity) {
                throw new Error(`Insufficient ${stock_type} stock in source store`);
            }

            // Deduct from source store
            const deductQuery = `
                UPDATE stock 
                SET quantity = quantity - $1 
                WHERE product_id = $2 AND store_id = $3 AND stock_type = $4
                RETURNING quantity
            `;
            await client.query(deductQuery, [quantity, product_id, from_store_id, stock_type]);

            // Add to destination store
            const addQuery = `
                INSERT INTO stock (product_id, store_id, stock_type, quantity, date_added)
                VALUES ($1, $2, $3, $4, CURRENT_DATE)
                ON CONFLICT (product_id, store_id, stock_type) 
                DO UPDATE SET quantity = stock.quantity + $4
                RETURNING id, quantity
            `;
            await client.query(addQuery, [product_id, to_store_id, stock_type, quantity]);

            // Log the transfer
            const logQuery = `
                INSERT INTO transfers (product_id, from_store_id, to_store_id, stock_type, quantity, transferred_by)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, created_at
            `;
            const logResult = await client.query(logQuery, [
                product_id, from_store_id, to_store_id, stock_type, quantity, transferred_by
            ]);

            await client.query('COMMIT');

            return {
                transfer: logResult.rows[0],
                product_id,
                from_store_id,
                to_store_id,
                stock_type,
                quantity
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Get all transfers
    static async findAll() {
        const query = `
            SELECT 
                t.id, t.quantity, t.stock_type, t.created_at,
                p.name AS product_name,
                fs.name AS from_store_name,
                ts.name AS to_store_name,
                u.full_name AS transferred_by_name
            FROM transfers t
            JOIN products p ON t.product_id = p.id
            JOIN stores fs ON t.from_store_id = fs.id
            JOIN stores ts ON t.to_store_id = ts.id
            JOIN users u ON t.transferred_by = u.id
            ORDER BY t.created_at DESC
            LIMIT 100
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    // Get transfers for a specific product
    static async findByProduct(productId) {
        const query = `
            SELECT 
                t.id, t.quantity, t.stock_type, t.created_at,
                fs.name AS from_store_name,
                ts.name AS to_store_name,
                u.full_name AS transferred_by_name
            FROM transfers t
            JOIN stores fs ON t.from_store_id = fs.id
            JOIN stores ts ON t.to_store_id = ts.id
            JOIN users u ON t.transferred_by = u.id
            WHERE t.product_id = $1
            ORDER BY t.created_at DESC
        `;
        const result = await pool.query(query, [productId]);
        return result.rows;
    }
}

module.exports = Transfer;