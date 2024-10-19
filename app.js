import express from 'express';
import pg from 'pg';
import cors from 'cors';
import ConsumerNamespace from './modules/consumer.js';
import ProductNamespace from './modules/product.js';


const { Pool } = pg;
const pool = new Pool(
    {
        'user': 'postgres',
        'host': 'localhost',
        'database': 'jsConsumersAndProducts',
        'password': 'postgres',
        'port': 7960,
    }
);

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/js-lessons/24-09-2024/alpha/index.html');
});

app.get('/products', async (req, res) => {
    const result = await pool.query('SELECT * FROM products');
    res.status(200).json(result.rows);
});

app.get('/consumers', async (req, res) => {
    let result = [];
    const consumers = await pool.query('SELECT * FROM consumers');
    for (let i = 0; i < consumers.rows.length; i++) {
        result.push({ 'consumer': consumers.rows[i], 'products': [] });
        const productToConsumer = await pool.query(
            'SELECT * FROM product_to_consumer WHERE consumer_id = $1',
            [consumers.rows[i].id]
        );
        for (let j = 0; j < productToConsumer.rows.length; j++) {
            const product = await pool.query(
                'SELECT * FROM products WHERE id = $1',
                [productToConsumer.rows[j].product_id]
            );
            result[i].products.push({ 'product': product.rows[0], 'quantity': productToConsumer.rows[j].quantity });
        }
    }
    res.status(200).json(result);
});

app.post('/products', async (req, res) => {
    const { title, price } = req.body;
    if (title && price) {
        const newProduct = new ProductNamespace.Product(title, price);
        const result = await pool.query(
            'INSERT INTO products (title, price) VALUES ($1, $2) RETURNING *',
            [newProduct.title, newProduct.price]
        );
        res.status(201).json({
            'message': 'Product created successfully',
            'product': result.rows[0]
        });
    } else {
        res.status(400).json({ 'error': 'Product is required' });
    }
});

app.post('/consumers', async (req, res) => {
    const { name, money } = req.body;
    if (name && money) {
        const newConsumer = new ConsumerNamespace.Consumer(name, money);
        const result = await pool.query(
            'INSERT INTO consumers (name, money) VALUES ($1, $2) RETURNING *',
            [newConsumer.name, newConsumer.money]
        );
        res.status(201).json({
            'message': 'Consumer created successfully',
            'consumer': result.rows[0]
        });
    } else {
        res.status(400).json({ 'error': 'Consumer is required' });
    }
});

app.put('/consumers/addMoney/:consumerID', async (req, res) => {
    const { consumerID } = req.params;
    const { money } = req.body;
    try {
        const consumerAllData = await pool.query(
            'SELECT * FROM consumers WHERE id = $1',
            [consumerID]
        );
        if (consumerAllData.rowCount > 0) {
            const consumerData = consumerAllData.rows[0];
            const consumerInstance = new ConsumerNamespace.Consumer(consumerData.name, consumerData.money);
            consumerInstance.addMoney(money);
            consumerData.money = consumerInstance.money;
            const result = await pool.query(
                'UPDATE consumers SET money = $1 WHERE id = $2 RETURNING *',
                [consumerData.money, consumerData.id]
            );
            res.json({ 'message': `Consumer ${consumerData.name} got ${money} money. Total: ${consumerData.money}`, 'consumer': consumerData });
        } else {
            res.status(404).json({ 'error': `Consumer with id ${consumerID} not found` });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': 'Error occurred while updating the consumer' });
    }
});

app.put('/consumers/putProduct/:consumerID', async (req, res) => {
    const { consumerID } = req.params;
    const { productID, quantity } = req.body;
    try {
        const consumerAllData = await pool.query(
            'SELECT * FROM consumers WHERE id = $1',
            [consumerID]
        );
        const productAllData = await pool.query(
            'SELECT * FROM products WHERE id = $1',
            [productID]
        );
        console.log(productAllData.rows[0]);
        if (consumerAllData.rowCount > 0) {
            const consumerData = consumerAllData.rows[0];
            const productData = productAllData.rows[0];
            const result = await pool.query(
                'SELECT * FROM product_to_consumer WHERE consumer_id = $1 AND product_id = $2',
                [consumerData.id, productData.id]
            );
            console.log(result.rows);
            const productInstance = new ProductNamespace.Product(productData.title, productData.price);
            const consumerProductsDB = [];
            for (let i = 0; i < result.rows.length; i++) {
                const product = await pool.query(
                    'SELECT * FROM products WHERE id = $1',
                    [result.rows[i].product_id]
                );
                consumerProductsDB.push(product.rows[0]);
            }
            const consumerProducts = [];
            for (let i = 0; i < consumerProductsDB.length; i++) {
                consumerProducts.push({ 'product': new ProductNamespace.Product(consumerProductsDB[i].title, consumerProductsDB[i].price), 'quantity': result.rows[i].quantity });
            }
            const consumerInstance = new ConsumerNamespace.Consumer(consumerData.name, consumerData.money, consumerProducts);
            consumerInstance.putProduct(productInstance, quantity);
            consumerData.quantity = consumerInstance.products.find(function (element) { return element.product.title === productInstance.title; }).quantity;
            if (result.rowCount > 0) {
                console.log('1');
                const result = await pool.query(
                    'UPDATE product_to_consumer SET quantity = $1 WHERE consumer_id = $2 AND product_id = $3 RETURNING *',
                    [consumerData.quantity, consumerData.id, productData.id]
                );
                res.json(result.rows[0]);
            } else {
                console.log('2');
                const result = await pool.query(
                    'INSERT INTO product_to_consumer (consumer_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
                    [consumerData.id, productData.id, consumerData.quantity]
                );
                res.json(result.rows[0]);
            }
        } else {
            res.status(404).json({ 'error': `Consumer with id ${consumerID} not found` });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': 'Error occurred while updating the consumer' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});