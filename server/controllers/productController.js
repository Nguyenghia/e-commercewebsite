const db = require('../config/db');

exports.getProducts = async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC
        `);
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProduct = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, discount, category_id, image_url } = req.body;
        if (!name || price === undefined) {
            return res.status(400).json({ message: 'Name and price are required' });
        }
        const [result] = await db.query(
            'INSERT INTO products (name, description, price, stock, discount, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description || null, price, stock || 0, discount || 0, category_id || null, image_url || null]
        );
        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock, discount, category_id, image_url } = req.body;
        const [existing] = await db.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Product not found' });

        await db.query(
            'UPDATE products SET name=?, description=?, price=?, stock=?, discount=?, category_id=?, image_url=? WHERE id=?',
            [name, description || null, price, stock, discount || 0, category_id || null, image_url || null, req.params.id]
        );
        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const [existing] = await db.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Product not found' });
        await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });
        const [result] = await db.query('INSERT INTO categories (name) VALUES (?)', [name]);
        res.status(201).json({ id: result.insertId, name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
