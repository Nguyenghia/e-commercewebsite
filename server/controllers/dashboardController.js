const db = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        const [[{ userCount }]] = await db.query('SELECT COUNT(*) as userCount FROM users');
        const [[{ productCount }]] = await db.query('SELECT COUNT(*) as productCount FROM products');

        const [[orderStats]] = await db.query(`
            SELECT
                COUNT(*) as totalOrders,
                COALESCE(SUM(total), 0) as totalRevenue,
                SUM(CASE WHEN status = 'pending'    THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
                SUM(CASE WHEN status = 'shipped'    THEN 1 ELSE 0 END) as shipped,
                SUM(CASE WHEN status = 'delivered'  THEN 1 ELSE 0 END) as delivered,
                SUM(CASE WHEN status = 'cancelled'  THEN 1 ELSE 0 END) as cancelled
            FROM orders
        `);

        const [recentOrders] = await db.query(`
            SELECT o.id, u.username, u.email, o.status, o.total, o.created_at
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 10
        `);

        const [lowStock] = await db.query(`
            SELECT id, name, stock FROM products WHERE stock < 10 ORDER BY stock ASC LIMIT 5
        `);

        res.json({
            userCount,
            productCount,
            totalOrders: orderStats.totalOrders,
            totalRevenue: parseFloat(orderStats.totalRevenue),
            ordersByStatus: {
                pending:    orderStats.pending    || 0,
                processing: orderStats.processing || 0,
                shipped:    orderStats.shipped    || 0,
                delivered:  orderStats.delivered  || 0,
                cancelled:  orderStats.cancelled  || 0,
            },
            recentOrders,
            lowStock,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
