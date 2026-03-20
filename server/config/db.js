const mysql = require('mysql2/promise');
require('dotenv').config();

const initDB = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        });

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id         INT AUTO_INCREMENT PRIMARY KEY,
                username   VARCHAR(255) NOT NULL,
                email      VARCHAR(255) NOT NULL UNIQUE,
                password   VARCHAR(255) NOT NULL,
                role       ENUM('admin', 'sales', 'customer') NOT NULL DEFAULT 'customer',
                points     INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Migrations for existing installs
        await connection.query(`
            ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'sales', 'customer') NOT NULL DEFAULT 'customer';
        `);
        await connection.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS points INT NOT NULL DEFAULT 0;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id         INT AUTO_INCREMENT PRIMARY KEY,
                name       VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                name        VARCHAR(255)  NOT NULL,
                description TEXT,
                price       DECIMAL(10,2) NOT NULL,
                stock       INT           NOT NULL DEFAULT 0,
                discount    INT           NOT NULL DEFAULT 0,
                category_id INT,
                image_url   VARCHAR(500),
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
            );
        `);
        await connection.query(`
            ALTER TABLE products ADD COLUMN IF NOT EXISTS discount INT NOT NULL DEFAULT 0;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id               INT AUTO_INCREMENT PRIMARY KEY,
                user_id          INT NOT NULL,
                status           ENUM('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
                total            DECIMAL(10,2) NOT NULL,
                points_earned    INT NOT NULL DEFAULT 0,
                shipping_address TEXT,
                created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `);
        await connection.query(`
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_earned INT NOT NULL DEFAULT 0;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id         INT AUTO_INCREMENT PRIMARY KEY,
                order_id   INT           NOT NULL,
                product_id INT           NOT NULL,
                quantity   INT           NOT NULL,
                price      DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (order_id)   REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            );
        `);

        console.log('Database initialized successfully');
        await connection.end();
    } catch (error) {
        console.error('Error initializing database:', error.message);
    }
};

initDB();

const sslConfig = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: sslConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
