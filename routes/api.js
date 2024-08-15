const { Router } = require('express')
const { Client } = require('pg')
require('dotenv').config()

const router = Router()
const client = new Client({
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'admin123',
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE || 'bean'
})

client.connect().then(() => console.log(`\x1b[33mConnected to database: \x1b[34m${client.database}\x1b[0m`))

router.get('/product', async (req, res) => {
    const result = await client.query('SELECT * FROM products')
    res.send(result.rows);
})

router.post('/product', async (req, res) => {
    const { name, price } = req.body

    try {
        const result = await client.query('INSERT INTO products (name, price) VALUES ($1,$2) RETURNING id', [name, price])
        const productid = result.rows[0].id
        console.log(`Post Product Success, Product ID: ${productid}`)
        res.send({ productid: productid });
    } catch (err) {
        console.error(`Post Product Error, error: ${err.message}`)
        res.status(400).send({ error: err.message })
    } finally {

    }
})

router.patch('/product/:productid', async (req, res) => {
    const { productid } = req.params
    const { name, price } = req.body

    try {
        if (name) {
            await client.query('UPDATE products SET name = $1 WHERE id = $2', [name, productid])
        }
        if (price) {
            await client.query('UPDATE products SET price = $1 WHERE id = $2', [price, productid])
        }
        console.log(`Patch Product Success, Product ID: ${productid}`)
        res.send({ message: "success" });
    } catch (err) {
        console.error(`Patch Product Error, Product ID: ${productid}, error: ${err.message}`)
        res.status(400).send({ error: err.message })
    } finally {

    }
})

router.delete('/product/:productid', async (req, res) => {
    const { productid } = req.params

    try {
        await client.query('DELETE FROM products WHERE id = $1', [productid])
        console.log(`Delete Product Success`)
        res.send({ message: "success" });
    } catch (err) {
        console.error(`Delelte Product Error, Product ID: ${productid}, error: ${err.message}`)
        res.status(400).send({ error: err.message })
    } finally {

    }
})

router.get('/status', async (req, res) => {

    let result = await client.query('SELECT * FROM status_dict')
    result = result.rows
    res.send(result);

})

router.get('/order', async (req, res) => {

    let data = await client.query('SELECT orders.id,orders.name,orders.phone,orders.order_date,status_dict.progress,status_dict.description FROM orders JOIN status_dict ON orders.status = status_dict.id')
    if (data.rows.length > 0) {
        data = data.rows;
        data = await Promise.all(data.map(async (row) => {
            let orders = await client.query('SELECT products.*,order_items.quantity FROM orders JOIN order_items ON order_items.order_id = orders.id JOIN products ON order_items.product_id = products.id WHERE orders.id = $1', [row.id])
            orders = orders.rows

            row.total = orders.reduce((result, order) => result += (order.price * order.quantity), 0)
            row.orders = orders
            return row
        }))
        console.log(`Get Orders Success`)
        res.send(data)
    } else {
        console.error(`Get Order Empty`)
        res.status(404).send({ error: "Empty" })
    }

})

router.get('/order/:orderid', async (req, res) => {
    const { orderid } = req.params

    let data = await client.query('SELECT orders.id,orders.name,orders.phone,orders.order_date,status_dict.progress,status_dict.description FROM orders JOIN status_dict ON orders.status = status_dict.id WHERE orders.id = $1', [orderid])
    if (data.rows.length > 0) {
        data = data.rows[0];

        let orders = await client.query('SELECT products.*,order_items.quantity FROM orders JOIN order_items ON order_items.order_id = orders.id JOIN products ON order_items.product_id = products.id WHERE orders.id = $1', [orderid])
        orders = orders.rows

        data.total = orders.reduce((result, order) => result += (order.price * order.quantity), 0)
        data.orders = orders

        console.log(`Get Order Success, Order ID: ${orderid}`)
        res.send(data)
    } else {
        console.error(`Get Order Order ID: ${orderid} Not Found`)
        res.status(404).send({ error: "Not Found" })
    }

})

router.post('/order/', async (req, res) => {
    const { name, phone, orders } = req.body

    try {
        let result = await client.query('INSERT INTO orders(name, phone, status) VALUES($1, $2, $3) RETURNING id', [name, phone, 1]);
        const orderid = result.rows[0].id
        for (const order of orders) {
            await client.query('INSERT INTO order_items(order_id,product_id,quantity) VALUES($1,$2,$3)', [orderid, order.id, order.quantity])
        }
        console.log(`New Order Created, Name: ${name}, Phone ${phone}, Order ID ${orderid}`)
        res.send({ orderid: orderid })
    } catch (err) {
        console.error(`Post Order Error, Order ID: ${orderid}, error: ${err.message}`)
        res.status(400).send({ error: err.message })
    }
})

router.patch('/order/:orderid', async (req, res) => {
    const { orderid } = req.params
    const { status, orders } = req.body

    try {
        if (status) {
            await client.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderid])
        }
        if (Array.isArray(orders)) {
            for (const order of orders) {
                if (order.quantity > 0) {
                    const result = await client.query('SELECT quantity FROM order_items WHERE order_id = $1 AND product_id = $2', [orderid, order.id])
                    if (result.rows.length === 0) {
                        await client.query('INSERT INTO order_items(order_id,product_id,quantity) VALUES($1,$2,$3)', [orderid, order.id, order.quantity])
                    } else {
                        await client.query('UPDATE order_items SET quantity = $1 WHERE order_id = $2 AND product_id = $3', [order.quantity, orderid, order.id])
                    }
                } else {
                    await client.query('DELETE FROM order_items WHERE order_id = $1 AND product_id = $2', [orderid, order.id])
                }
            }
        }
        console.log(`Patch Order Success, Order ID: ${orderid}`)
        res.send({ result: 'Success' })
    } catch (err) {
        console.error(`Patch Order Error, Order ID: ${orderid}, error: ${err.message}`)
        res.status(400).send({ error: err.message })
    }
})

router.delete('/order/:orderid', async (req, res) => {
    const { orderid } = req.params;

    const commands = [
        'DELETE FROM order_items WHERE order_id = $1',
        'DELETE FROM orders WHERE id = $1'
    ]
    try {
        for (const command of commands) {
            await client.query(command, [orderid])
        }
        console.log(`Success Delete Order, Order ID: ${orderid}`)
        res.send({ result: 'Success' })
    } catch (err) {
        console.error(`Error Delete Order, Order ID: ${orderid}, error: ${err.message}`)
        res.status(400).send({ error: err.message })
    }

})

module.exports = router