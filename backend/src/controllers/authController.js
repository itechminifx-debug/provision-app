const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Login - DEBUG VERSION
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('=========================================');
        console.log('📧 LOGIN ATTEMPT');
        console.log('Email:', email);
        console.log('Password provided:', password ? 'YES' : 'NO');

        if (!email || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        console.log('🔍 Looking for user:', email);
        const user = await User.findByEmail(email);
        
        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        console.log('✅ User found:', user.email);
        console.log('🔐 Stored hash:', user.password_hash);

        // Verify password
        console.log('🔑 Verifying password...');
        const isValid = await User.verifyPassword(password, user.password_hash);
        console.log('✅ Password valid?', isValid);

        if (!isValid) {
            console.log('❌ Password verification FAILED');
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        console.log('✅ Password verified! Generating token...');
        const token = generateToken(user);
        const { password_hash, ...userData } = user;

        console.log('✅ Login successful!');
        console.log('=========================================');

        res.json({
            message: 'Login successful',
            token,
            user: userData
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
};

// Get current user
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Register new user (admin only)
const register = async (req, res) => {
    try {
        const { full_name, email, password, role, store_id } = req.body;

        if (!full_name || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!['admin', 'cashier'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be admin or cashier' });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const newUser = await User.create({ full_name, email, password, role, store_id });

        res.status(201).json({
            message: 'User created successfully',
            user: newUser
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'An error occurred during registration' });
    }
};

// Logout
const logout = (req, res) => {
    res.json({ message: 'Logout successful' });
};

module.exports = { login, getMe, register, logout };