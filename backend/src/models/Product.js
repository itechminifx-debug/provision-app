const pool = require('../config/database');

class Product {
    // Create product
    static async create({ name, category, wholesale_price, retail_price, cost_price }) {
        const query = `
            INSERT INTO products (name, category, wholesale_price, retail_price, cost_price)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, category, wholesale_price, retail_price, cost_price, created_at
        `;
        const values = [name, category, wholesale_price, retail_price, cost_price];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // Get all products
    static async findAll() {
        const query = 'SELECT * FROM products ORDER BY name ASC';
        const result = await pool.query(query);
        return result.rows;
    }

    // Get product by ID
    static async findById(id) {
        const query = 'SELECT * FROM products WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    // Update product
    static async update(id, { name, category, wholesale_price, retail_price, cost_price }) {
        const query = `
            UPDATE products 
            SET name = $1, category = $2, wholesale_price = $3, retail_price = $4, cost_price = $5
            WHERE id = $6
            RETURNING id, name, category, wholesale_price, retail_price, cost_price
        `;
        const values = [name, category, wholesale_price, retail_price, cost_price, id];
        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    // Delete product
    static async delete(id) {
        const query = 'DELETE FROM products WHERE id = $1 RETURNING id';
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    // Search products
    static async search(searchTerm) {
        const query = `
            SELECT * FROM products 
            WHERE name ILIKE $1 OR category ILIKE $1
            ORDER BY name ASC
        `;
        const result = await pool.query(query, [`%${searchTerm}%`]);
        return result.rows;
    }
}

module.exports = Product;