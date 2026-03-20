const db = require('../config/db');
const { calcPoints } = require('../utils/tier');

exports.createOrder = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { items, shipping_address } = req.body;
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const productIds = items.map(i => i.productId);
        const [products] = await conn.query(
            `SELECT * FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`,
            productIds
        );

        const productMap = {};
        for (const p of products) productMap[p.id] = p;

        let total = 0;
        for (const item of items) {
            const product = productMap[item.productId];
            if (!product) return res.status(400).json({ message: `Product ${item.productId} not found` });
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for "${product.name}"` });
            }
            total += parseFloat(product.price) * item.quantity;
        }

        const pointsEarned = calcPoints(total);

        await conn.beginTransaction();

        const [orderResult] = await conn.query(
            'INSERT INTO orders (user_id, total, points_earned, shipping_address) VALUES (?, ?, ?, ?)',
            [req.user.id, total.toFixed(2), pointsEarned, shipping_address || null]
        );
        const orderId = orderResult.insertId;

        for (const item of items) {
            const product = productMap[item.productId];
            await conn.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.productId, item.quantity, product.price]
            );
            await conn.query(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.productId]
            );
        }

        await conn.commit();
        res.status(201).json({ message: 'Order placed successfully', orderId, pointsEarned });
    } catch (error) {
        await conn.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        conn.release();
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const [orders] = await db.query(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        for (const order of orders) {
            const [items] = await db.query(`
                SELECT oi.*, p.name, p.image_url
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [order.id]);
            order.items = items;
        }
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.*, u.username, u.email
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);
        for (const order of orders) {
            const [items] = await db.query(`
                SELECT oi.*, p.name
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [order.id]);
            order.items = items;
        }
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const [existing] = await db.query(
            'SELECT id, status, user_id, points_earned FROM orders WHERE id = ?',
            [req.params.id]
        );
        if (existing.length === 0) return res.status(404).json({ message: 'Order not found' });

        const order = existing[0];
        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);

        // Award points only on first transition to 'delivered'
        if (status === 'delivered' && order.status !== 'delivered') {
            await db.query(
                'UPDATE users SET points = points + ? WHERE id = ?',
                [order.points_earned, order.user_id]
            );
        }

        res.json({ message: 'Order status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
