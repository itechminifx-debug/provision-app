const User = require('../models/User');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Get user by ID (admin only)
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Create cashier (admin only)
const createCashier = async (req, res) => {
    try {
        const { full_name, email, password, store_id } = req.body;

        if (!full_name || !email || !password || !store_id) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create cashier
        const newUser = await User.create({
            full_name,
            email,
            password,
            role: 'cashier',
            store_id
        });

        res.status(201).json({
            message: 'Cashier created successfully',
            user: newUser
        });
    } catch (error) {
        console.error('Create cashier error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prevent admin from deleting themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        
        const deleted = await User.delete(id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

module.exports = { getAllUsers, getUserById, createCashier, deleteUser };