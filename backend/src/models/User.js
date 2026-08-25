const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // Create new user
    static async create({ full_name, email, password, role, store_id }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO users (full_name, email, password_hash, role, store_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, full_name, email, role, store_id, created_at
        `;
        const values = [full_name, email, hashedPassword, role, store_id || null];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // Find user by email
    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0] || null;
    }

    // Find user by ID
    static async findById(id) {
        const query = 'SELECT id, full_name, email, role, store_id, created_at FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    // Get all users
    static async findAll() {
        const query = 'SELECT id, full_name, email, role, store_id, created_at FROM users ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows;
    }

    // Get cashiers by store
    static async findByStore(storeId) {
        const query = 'SELECT id, full_name, email, role, created_at FROM users WHERE store_id = $1 AND role = $2';
        const result = await pool.query(query, [storeId, 'cashier']);
        return result.rows;
    }

    // Delete user
    static async delete(id) {
        const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

   // Verify password - DEBUG VERSION
static async verifyPassword(plainPassword, hashedPassword) {
    console.log('🔍 verifyPassword called');
    console.log('Plain password:', plainPassword);
    console.log('Hashed password:', hashedPassword);
    
    try {
        const result = await bcrypt.compare(plainPassword, hashedPassword);
        console.log('✅ bcrypt.compare result:', result);
        return result;
    } catch (error) {
        console.error('❌ bcrypt.compare error:', error);
        return false;
    }
}
}


module.exports = User;