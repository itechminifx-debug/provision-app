const pool = require('../config/database');

class Stock {
    // Get stock summary - ONLY shows products that have stock entries
    static async getSummary() {
        try {
            const query = `
                SELECT 
                    p.id AS product_id,
                    p.name AS product_name,
                    p.category,
                    s.id AS store_id,
                    s.name AS store_name,
                    st.stock_type,
                    st.quantity,
                    st.date_added,
                    st.expiry_date
                FROM stock st
                JOIN products p ON st.product_id = p.id
                JOIN stores s ON st.store_id = s.id
                WHERE st.quantity > 0
                ORDER BY p.name ASC, s.name ASC
            `;
            const result = await pool.query(query);
            console.log('📊 Stock Summary Result:', JSON.stringify(result.rows, null, 2));
            return result.rows;
        } catch (error) {
            console.error('❌ getSummary Error:', error);
            throw error;
        }
    }

    // Get stock for a specific store
    static async getByStore(storeId) {
        const query = `
            SELECT 
                p.id AS product_id,
                p.name AS product_name,
                p.category,
                p.wholesale_price,
                p.retail_price,
                p.cost_price,
                s.id AS store_id,
                s.name AS store_name,
                st.stock_type,
                st.quantity,
                st.date_added,
                st.expiry_date
            FROM stock st
            JOIN products p ON st.product_id = p.id
            JOIN stores s ON st.store_id = s.id
            WHERE st.store_id = $1 AND st.quantity > 0
            ORDER BY p.name ASC
        `;
        const result = await pool.query(query, [storeId]);
        return result.rows;
    }

    // Get stock by product and store
    static async getByProductAndStore(productId, storeId) {
        const query = `
            SELECT * FROM stock 
            WHERE product_id = $1 AND store_id = $2
            ORDER BY stock_type
        `;
        const result = await pool.query(query, [productId, storeId]);
        return result.rows;
    }

    // Add stock (new or old)
    static async addStock({ product_id, store_id, stock_type, quantity, expiry_date }) {
        // Check if stock entry exists
        const checkQuery = `
            SELECT * FROM stock 
            WHERE product_id = $1 AND store_id = $2 AND stock_type = $3
        `;
        const checkResult = await pool.query(checkQuery, [product_id, store_id, stock_type]);

        if (checkResult.rows.length > 0) {
            // Update existing stock
            const updateQuery = `
                UPDATE stock 
                SET quantity = quantity + $1, date_added = CURRENT_DATE
                WHERE product_id = $2 AND store_id = $3 AND stock_type = $4
                RETURNING id, product_id, store_id, stock_type, quantity, date_added
            `;
            const result = await pool.query(updateQuery, [quantity, product_id, store_id, stock_type]);
            return result.rows[0];
        } else {
            // Insert new stock
            const insertQuery = `
                INSERT INTO stock (product_id, store_id, stock_type, quantity, date_added, expiry_date)
                VALUES ($1, $2, $3, $4, CURRENT_DATE, $5)
                RETURNING id, product_id, store_id, stock_type, quantity, date_added
            `;
            const result = await pool.query(insertQuery, [product_id, store_id, stock_type, quantity, expiry_date || null]);
            return result.rows[0];
        }
    }

    // Deduct stock (when sale is made) - FIFO: old stock first
    static async deductStock(productId, storeId, quantity) {
        // Get old stock first
        const oldStockQuery = `
            SELECT id, quantity FROM stock 
            WHERE product_id = $1 AND store_id = $2 AND stock_type = 'old_stock' AND quantity > 0
            ORDER BY date_added ASC
        `;
        const oldStock = await pool.query(oldStockQuery, [productId, storeId]);

        let remaining = quantity;
        let deducted = [];

        // Deduct from old stock first
        for (const stock of oldStock.rows) {
            if (remaining <= 0) break;

            const deductQty = Math.min(stock.quantity, remaining);
            const updateQuery = `
                UPDATE stock 
                SET quantity = quantity - $1 
                WHERE id = $2 
                RETURNING id, quantity
            `;
            const result = await pool.query(updateQuery, [deductQty, stock.id]);
            deducted.push({ stock_id: stock.id, deducted: deductQty });
            remaining -= deductQty;
        }

        // If still remaining, deduct from new stock
        if (remaining > 0) {
            const newStockQuery = `
                SELECT id, quantity FROM stock 
                WHERE product_id = $1 AND store_id = $2 AND stock_type = 'new_stock' AND quantity > 0
                ORDER BY date_added ASC
            `;
            const newStock = await pool.query(newStockQuery, [productId, storeId]);

            for (const stock of newStock.rows) {
                if (remaining <= 0) break;

                const deductQty = Math.min(stock.quantity, remaining);
                const updateQuery = `
                    UPDATE stock 
                    SET quantity = quantity - $1 
                    WHERE id = $2 
                    RETURNING id, quantity
                `;
                const result = await pool.query(updateQuery, [deductQty, stock.id]);
                deducted.push({ stock_id: stock.id, deducted: deductQty });
                remaining -= deductQty;
            }
        }

        if (remaining > 0) {
            throw new Error(`Insufficient stock. ${remaining} units not available.`);
        }

        return deducted;
    }

    // Get low stock alert (quantity < 10)
    static async getLowStock() {
        const query = `
            SELECT 
                p.id AS product_id,
                p.name AS product_name,
                s.id AS store_id,
                s.name AS store_name,
                st.stock_type,
                st.quantity
            FROM stock st
            JOIN products p ON st.product_id = p.id
            JOIN stores s ON st.store_id = s.id
            WHERE st.quantity < 10 AND st.quantity > 0
            ORDER BY st.quantity ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    // Get stock history (transfers + sales)
    static async getHistory(productId, storeId) {
        const query = `
            SELECT 
                'transfer' AS type,
                t.created_at AS date,
                t.quantity,
                t.stock_type,
                ts.name AS from_store,
                ts2.name AS to_store,
                u.full_name AS performed_by
            FROM transfers t
            JOIN stores ts ON t.from_store_id = ts.id
            JOIN stores ts2 ON t.to_store_id = ts2.id
            JOIN users u ON t.transferred_by = u.id
            WHERE t.product_id = $1 AND (t.from_store_id = $2 OR t.to_store_id = $2)
            UNION ALL
            SELECT 
                'sale' AS type,
                s.created_at AS date,
                si.quantity,
                NULL AS stock_type,
                NULL AS from_store,
                NULL AS to_store,
                u.full_name AS performed_by
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN users u ON s.cashier_id = u.id
            WHERE si.product_id = $1 AND s.store_id = $2
            ORDER BY date DESC
            LIMIT 50
        `;
        const result = await pool.query(query, [productId, storeId]);
        return result.rows;
    }
}

module.exports = Stock;