const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool to Neon PostgreSQL
const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Neon
    }
});

// Test the connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error connecting to Neon database:', err.stack);
    } else {
        console.log('✅ Connected to Neon PostgreSQL database successfully!');
        release();
    }
});

module.exports = pool;