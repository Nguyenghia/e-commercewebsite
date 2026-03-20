const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { getTier } = require('../utils/tier');
require('dotenv').config();

exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, email, role, points, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(users.map(u => ({ ...u, tier: getTier(u.points).name })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['admin', 'sales', 'customer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
        if (existing.length === 0) return res.status(404).json({ message: 'User not found' });
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        res.json({ message: 'User role updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, username, email, role, points, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        const user = rows[0];

        // Fetch order history with points_earned
        const [orders] = await db.query(
            'SELECT id, status, total, points_earned, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        const tier = getTier(user.points);
        res.json({ ...user, tier: tier.name, tierColor: tier.color, orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        if (!username || !email) {
            return res.status(400).json({ message: 'Username and email are required' });
        }
        // Check email not taken by another user
        const [taken] = await db.query(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, req.user.id]
        );
        if (taken.length > 0) return res.status(400).json({ message: 'Email already in use' });

        await db.query(
            'UPDATE users SET username = ?, email = ? WHERE id = ?',
            [username, email, req.user.id]
        );

        const [rows] = await db.query(
            'SELECT id, username, email, role, points FROM users WHERE id = ?',
            [req.user.id]
        );
        const user = rows[0];
        const tier = getTier(user.points);

        // Issue fresh token with updated username
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: { ...user, tier: tier.name, tierColor: tier.color },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
