import express from 'express';
import pg from 'pg';
import cors from 'cors';

import UserNamespace from './modules/user.js';
import ConsumerNamespace from './modules/consumer.js';
import ProducerNamespace from './modules/producer.js';
import ProductNamespace from './modules/product.js';
import PoolNamespace from './modules/pool.js';
import DelayNamespace from './modules/delay.js';

import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';


// const { Pool } = pg;
// const pool = new Pool(
//     {
//         'user': 'postgres',
//         'host': 'localhost',
//         'database': '',
//         'password': 'postgres',
//         'port': 7960,
//     }
// );

const app = express();
const port = 8000;

app.use(cors());
// app.use(express.json());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/test/:userID', async (req, res) => {
    const { userID } = req.params;
    const { money } = req.body;
    const userInstance = await UserNamespace.getInstanceById(PoolNamespace.pool, userID);
    await userInstance.addMoneyToConsumer(money);
    await DelayNamespace.delay(100);
    let consumerInstance = await ConsumerNamespace.getInstanceById(PoolNamespace.pool, userInstance.consumerId);
    res.status(200).json({ consumerMoney: consumerInstance.money });
});

app.get('/register', (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/js-lessons/24-09-2024/alpha/register.html');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
 
    if (!username || !password) {
       return res.status(400).json({ error: 'Имя пользователя или пароль не переданы.' });
    }
 
    const hashedPassword = await bcrypt.hash(password, 10);
 
    try {
        const userDataFromDB = await pool.query(
            'INSERT INTO users (username, password, isLoggedIn) VALUES ($1, $2, $3) RETURNING *;',
            [username, hashedPassword, true]
        );
        const userData = userDataFromDB.rows[0];

        const consumerDataFromDB = await pool.query(
            'INSERT INTO consumers (user_id, money) VALUES ($1, $2) RETURNING *;',
            [userData.id, 0]
        );
        const consumerData = consumerDataFromDB.rows[0];

        res.status(201).json({
            user: userData,
            consumer: consumerData
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Пользователь с таким именем уже существует.' });
        }
        res.status(500).json({ error: error.message });
    }
});

app.get('/login', (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/js-lessons/24-09-2024/alpha/login.html');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
 
    if (!username || !password) {
        return res.status(400).json({ error: 'Имя пользователя и(или) пароль не переданы.' });
    }
 
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1;', [username]);
 
        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'Неверно указано имя пользователя.' });
        }
 
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);
 
        if (match) {
            res.status(200).json(user);
        } else {
            res.status(401).json({ error: 'Неверно указан пароль.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/js-lessons/24-09-2024/alpha/index.html');
});

app.post('/users/addMoneyToConsumer/:userID', async (req, res) => {
    const { userID } = req.params;
    const { money } = req.body;

    try {
        if (userID && money) {
            const userInstance = await UserNamespace.getInstanceById(PoolNamespace.pool, userID);
            await userInstance.addMoneyToConsumer(money);
            await DelayNamespace.delay(100);
            let consumerInstance = await ConsumerNamespace.getInstanceById(PoolNamespace.pool, userInstance.consumerId);
            res.status(200).json({ consumerMoney: consumerInstance.money });
        } else {
            res.status(400).json({ 'error': 'Неверно указаны ID пользователя и(или) количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.post('/users/reduceMoneyFromProducer/:userID', async (req, res) => {
    const { userID } = req.params;
    const { money } = req.body;

    try {
        if (userID && money) {
            const userInstance = await UserNamespace.getInstanceById(PoolNamespace.pool, userID);
            await userInstance.reduceMoneyFromProducer(money);
            await DelayNamespace.delay(100);
            const producerInstance = await ProducerNamespace.getInstanceById(PoolNamespace.pool, userInstance.producerId);
            res.status(200).json({ producerMoney: producerInstance.money });
        } else {
            res.status(400).json({ 'error': 'Неверно указаны ID пользователя и(или) количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.get('/products', async (req, res) => {
    const result = await pool.query('SELECT * FROM products;');
    res.status(200).json(result.rows);
});

app.get('/consumers', async (req, res) => {
    let result = [];
    let productToConsumerDataFromDB, productDataFromDB;
    const consumersDataFromDB = await pool.query('SELECT * FROM consumers;');
    for (let i = 0; i < consumersDataFromDB.rows.length; i++) {
        result.push({ 'consumer': consumersDataFromDB.rows[i], 'cart': [] });
        productToConsumerDataFromDB = await pool.query(
            'SELECT * FROM product_to_consumer WHERE consumer_id = $1;',
            [consumersDataFromDB.rows[i].id]
        );
        for (let j = 0; j < productToConsumerDataFromDB.rows.length; j++) {
            productDataFromDB = await pool.query(
                'SELECT * FROM products WHERE id = $1;',
                [productToConsumerDataFromDB.rows[j].product_id]
            );
            result[i].products.push({ 'product': productDataFromDB.rows[0], 'quantity': productToConsumerDataFromDB.rows[j].quantity });
        }
    }
    res.status(200).json(result);
});

app.post('/products', async (req, res) => {
    const { title, price } = req.body;

    try {
        if (title && price) {
            const productInstance = new ProductNamespace.Product(title, price);
            const result = await pool.query(
                'INSERT INTO products (title, price) VALUES ($1, $2) RETURNING *;',
                [productInstance.title, productInstance.price]
            );
            res.status(201).json({'product': result.rows[0]});
        } else {
            res.status(400).json({ 'error': 'Неверно указаны название товара и(или) цена.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

// app.post('/consumers/:userID', async (req, res) => {
//     const { userID } = req.params;
//     const { money } = req.body;
    
//     try {
//         if (money) {
//             const result = await pool.query(
//                 'INSERT INTO consumers (user_id, money) VALUES ($1, $2) RETURNING *;',
//                 [userID, money]
//             );
//             res.status(201).json({'consumer': result.rows[0]});
//         } else {
//             res.status(400).json({ 'error': 'The request body was passed incorrectly: money' });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ 'error': error.message });
//     }
// });

app.put('/consumers/addMoney/:consumerID', async (req, res) => {
    const { consumerID } = req.params;
    const { money } = req.body;

    try {
        if (consumerID, money) {
            const consumerDataFromDB = await pool.query(
                'SELECT * FROM consumers WHERE id = $1;',
                [consumerID]
            );
            if (consumerDataFromDB.rowCount > 0) {
                const consumerData = consumerDataFromDB.rows[0];
                const consumerInstance = new ConsumerNamespace.Consumer(consumerData.money);
                consumerInstance.addMoney(money);
                const result = await pool.query(
                    'UPDATE consumers SET money = $1 WHERE id = $2 RETURNING *;',
                    [consumerInstance.money, consumerData.id]
                );
                res.json({ 'consumer': result.rows[0] });
            } else {
                res.status(404).json({ 'error': `Покупатель с ID "${consumerID}" не найден.` });
            }
        } else {
            res.status(400).json({ 'error': 'Неверно указано количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.put('/consumers/putProduct/:consumerID', async (req, res) => {
    const { consumerID } = req.params;
    const { productID, quantity } = req.body;

    try {
        const consumerDataFromDB = await pool.query(
            'SELECT * FROM consumers WHERE id = $1;',
            [consumerID]
        );
        if (consumerDataFromDB.rowCount > 0) {
            const productDataFromDB = await pool.query(
                'SELECT * FROM products WHERE id = $1;',
                [productID]
            );
            if (productDataFromDB.rowCount > 0) {
                let consumerData = consumerDataFromDB.rows[0];
                const productData = productDataFromDB.rows[0];
                let productToConsumerDataFromDB = await pool.query(
                    'SELECT * FROM product_to_consumer WHERE consumer_id = $1 AND product_id = $2;',
                    [consumerData.id, productData.id]
                );

                const productInstance = new ProductNamespace.Product(productData.title, productData.price);

                let consumerProductsFromDB = [];
                let consumerProductDataFromDB;
                for (let i = 0; i < productToConsumerDataFromDB.rows.length; i++) {
                    consumerProductDataFromDB = await pool.query(
                        'SELECT * FROM products WHERE id = $1;',
                        [productToConsumerDataFromDB.rows[i].product_id]
                    );
                    consumerProductsFromDB.push(consumerProductDataFromDB.rows[0]);
                }

                let consumerProducts = [];
                let consumerProductInstance;
                for (let i = 0; i < consumerProductsFromDB.length; i++) {
                    consumerProductInstance = new ProductNamespace.Product(consumerProductsFromDB[i].title, consumerProductsFromDB[i].price);
                    consumerProducts.push({ 'product': consumerProductInstance, 'quantity': productToConsumerDataFromDB.rows[i].quantity });
                }

                let consumerInstance = new ConsumerNamespace.Consumer(consumerData.money, consumerProducts);

                consumerInstance.putProduct(productInstance, quantity);
                consumerData.quantity = consumerInstance.cart.find(function (element) { return element.product.title === productInstance.title; }).quantity;

                let putProduct;
                if (productToConsumerDataFromDB.rowCount > 0) {
                    putProduct = await pool.query(
                        'UPDATE product_to_consumer SET quantity = $1 WHERE consumer_id = $2 AND product_id = $3 RETURNING *;',
                        [consumerData.quantity, consumerData.id, productData.id]
                    );
                } else {
                    putProduct = await pool.query(
                        'INSERT INTO product_to_consumer (consumer_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *;',
                        [consumerData.id, productData.id, consumerData.quantity]
                    );
                }

                // res.json({ 'productToConsumer': putProduct.rows[0] });
                res.json({ 'productToConsumer': consumerInstance });

                // Получить consumer из бд

                // productToConsumerDataFromDB = await pool.query(
                //     'SELECT * FROM product_to_consumer WHERE consumer_id = $1 AND product_id = $2;',
                //     [consumerData.id, productData.id]
                // );
                // consumerProductsFromDB.splice(0, consumerProductsFromDB.length);
                // consumerProducts.splice(0, consumerProducts.length);
                // for (let i = 0; i < productToConsumerDataFromDB.rows.length; i++) {
                //     consumerProductDataFromDB = await pool.query(
                //         'SELECT * FROM products WHERE id = $1;',
                //         [productToConsumerDataFromDB.rows[i].product_id]
                //     );
                //     consumerProductsFromDB.push(consumerProductDataFromDB.rows[0]);
                // }
                // for (let i = 0; i < consumerProductsFromDB.length; i++) {
                //     consumerProductInstance = new ProductNamespace.Product(consumerProductsFromDB[i].title, consumerProductsFromDB[i].price);
                //     consumerProducts.push({ 'product': consumerProductInstance, 'quantity': productToConsumerDataFromDB.rows[i].quantity });
                // }
                // consumerInstance = new ConsumerNamespace.Consumer(consumerData.money, consumerProducts);


                // res.json({ 'consumer': consumerInstance });
            } else {
                res.status(404).json({ 'error': `Товар с ID ${productID} не найден.` });
            }
        } else {
            res.status(404).json({ 'error': `Покупатель с ID ${consumerID} не найден.` });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});