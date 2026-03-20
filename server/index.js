const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.get('/api/migrate', async (req, res) => {
    try {
        const db = require('./config/db');
        await db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_earned INT NOT NULL DEFAULT 0`);
        await db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT`);
        await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS discount INT NOT NULL DEFAULT 0`);
        await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS points INT NOT NULL DEFAULT 0`);
        res.json({ status: 'ok', message: 'Migrations applied successfully' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.get('/api/health', async (req, res) => {
    try {
        const db = require('./config/db');
        await db.query('SELECT 1');
        res.json({ status: 'ok', db: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', db: err.message });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
