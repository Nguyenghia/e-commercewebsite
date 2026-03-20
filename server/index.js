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
    const db = require('./config/db');
    const results = [];
    const migrations = [
        { table: 'orders',   column: 'points_earned',    sql: 'ALTER TABLE orders ADD COLUMN points_earned INT NOT NULL DEFAULT 0' },
        { table: 'orders',   column: 'shipping_address', sql: 'ALTER TABLE orders ADD COLUMN shipping_address TEXT' },
        { table: 'products', column: 'discount',         sql: 'ALTER TABLE products ADD COLUMN discount INT NOT NULL DEFAULT 0' },
        { table: 'users',    column: 'points',           sql: 'ALTER TABLE users ADD COLUMN points INT NOT NULL DEFAULT 0' },
    ];
    for (const m of migrations) {
        try {
            const [rows] = await db.query(
                `SELECT COUNT(*) as cnt FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
                [m.table, m.column]
            );
            if (rows[0].cnt === 0) {
                await db.query(m.sql);
                results.push(`Added: ${m.table}.${m.column}`);
            } else {
                results.push(`Skipped (exists): ${m.table}.${m.column}`);
            }
        } catch (err) {
            results.push(`Error on ${m.table}.${m.column}: ${err.message}`);
        }
    }
    res.json({ status: 'ok', results });
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
