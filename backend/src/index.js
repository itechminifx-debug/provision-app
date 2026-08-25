const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const pool = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const stockRoutes = require('./routes/stock');
const saleRoutes = require('./routes/sales');
const transferRoutes = require('./routes/transfers');
const debtorRoutes = require('./routes/debtors');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://provision-app.vercel.app',
        'https://provision-app.netlify.app',
        'https://provision-app.onrender.com',
        'https://provision-app-backend.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/debtors', debtorRoutes);
app.use('/api/reports', reportRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({
        message: 'Provision App API is running!',
        status: 'OK',
        version: '1.0.0'
    });
});

// Test database connection route
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        res.json({
            message: 'Database connection successful!',
            time: result.rows[0].current_time
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message 
    });
});

app.listen(PORT, () => {
    console.log('=========================================');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: Neon PostgreSQL`);
    console.log('=========================================');
    console.log('\n📋 Available routes:');
    console.log(`   GET  http://localhost:${PORT}/`);
    console.log(`   GET  http://localhost:${PORT}/api/test-db`);
    console.log(`   POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   GET  http://localhost:${PORT}/api/auth/me`);
    console.log(`   POST http://localhost:${PORT}/api/auth/register (Admin only)`);
    console.log(`   GET  http://localhost:${PORT}/api/users (Admin only)`);
    console.log(`   POST http://localhost:${PORT}/api/users/cashier (Admin only)`);
    console.log(`   GET  http://localhost:${PORT}/api/products`);
    console.log(`   POST http://localhost:${PORT}/api/products (Admin only)`);
    console.log(`   GET  http://localhost:${PORT}/api/stock/store/:storeId`);
    console.log(`   POST http://localhost:${PORT}/api/stock/add (Admin only)`);
    console.log(`   POST http://localhost:${PORT}/api/sales`);
    console.log(`   GET  http://localhost:${PORT}/api/sales`);
    console.log(`   POST http://localhost:${PORT}/api/transfers (Admin only)`);
    console.log(`   GET  http://localhost:${PORT}/api/transfers (Admin only)`);
    console.log(`   GET  http://localhost:${PORT}/api/reports (Admin only)`);
    console.log('\n✅ Server is ready!');
});