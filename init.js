const { Pool } = require('pg');
require('dotenv').config()

const config = {
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'admin123',
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432
};

async function createDb(targetDb) {
    const pool = new Pool({ ...config, database: 'postgres' });
    const client = await pool.connect();

    try {
        const res = await client.query(`
        SELECT 1 FROM pg_database WHERE datname = $1
        `, [targetDb]);

        if (res.rowCount === 0) {
            await client.query(`CREATE DATABASE ${targetDb}`);
            console.log(`\x1b[32mDatabase ${targetDb} created successfully.\x1b[0m`);
        } else {
            console.log(`\x1b[33mDatabase ${targetDb} already exists.\x1b[0m`);
        }
    } catch (err) {
        console.error(`\x1b[31mError checking or creating database: ${err}\x1b[0m`);
    } finally {
        client.release();
        pool.end();
    }
}

async function createTables(targetDb) {
    const pool = new Pool({ ...config, database: targetDb });
    const client = await pool.connect();

    try {
        const commands = [
            `CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(100) NOT NULL,
                order_date timestamp DEFAULT current_timestamp NOT NULL,
                status integer DEFAULT 0 NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                price INTEGER NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS status_dict (
                id INTEGER PRIMARY KEY,
                progress INTEGER DEFAULT 1,
                description VARCHAR(100) NOT NULL
            )`,
        ]
        await Promise.all(commands.map(async (command) => {
            await client.query(command)
            console.log(`\x1b[32mQuery Success: ${command}\x1b[0m`)
        }))
    } catch (err) {
        console.error(`\x1b[31mError creating table: ${err}\x1b[30m`);
    } finally {
        client.release();
        pool.end();
    }
}

async function insertExampleData(targetDb) {
    const pool = new Pool({ ...config, database: targetDb });
    const client = await pool.connect();
    const products = [
        {
            name: 'americano',
            price: 50000,
        },
        {
            name: 'macchiato',
            price: 30000,
        },
        {
            name: 'latte',
            price: 40000,
        },
        {
            name: 'espresso',
            price: 25000,
        },
        {
            name: 'mocha',
            price: 10000,
        }, {
            name: 'black',
            price: 5000,
        }
    ]
    const statuses = [
        {
            progress: 25,
            description: 'Order received'
        },
        {
            progress: 50,
            description: 'Preparing order'
        },
        {
            progress: 75,
            description: 'Ready for collection'
        },
        {
            progress: 100,
            description: 'Order finished'
        },
        {
            progress: 0,
            description: 'Order Canceled'
        },
    ]
    for (const product of products) {
        await client.query('INSERT INTO products(name,price) VALUES($1,$2)', [product.name, product.price])
    }
    for (const [index, status] of statuses.entries()) {
        await client.query('INSERT INTO status_dict(id,progress,description) VALUES($1,$2,$3)', [index + 1, status.progress, status.description])
    }
    console.log(`\x1b[32mInserting \x1b[33m${products.length} \x1b[32mRecord\x1b[0m`)
}

async function init() {
    const targetDb = process.env.PGDATABASE || 'liputan8';
    await createDb(targetDb);
    await createTables(targetDb);
    await insertExampleData(targetDb);
}

init().catch(err => {
    console.error(err);
});
