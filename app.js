import express from 'express';
import pg from 'pg';
import cors from 'cors';

import UserNamespace from './modules/user.js';
import ConsumerNamespace from './modules/consumer.js';
import ProducerNamespace from './modules/producer.js';
import ProductNamespace from './modules/product.js';
import ShopNamespace from './modules/shop.js';
import PoolNamespace from './modules/pool.js';
import DelayNamespace from './modules/delay.js';

import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';

const app = express();
const port = 8000;

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

app.put('/addMoneyToConsumer/users/:userID', async (req, res) => {
    const { userID } = req.params;
    const { money } = req.body;

    try {
        if (userID && money) {
            const userInstance = await UserNamespace.getInstanceById(userID);

            await userInstance.addMoneyToConsumer(money);
            await DelayNamespace.delay(100);

            const consumerInstance = await ConsumerNamespace.getInstanceById(userInstance.consumerId);
            res.status(200).json({ consumerMoney: consumerInstance.money });
        } else {
            res.status(400).json({ 'error': 'Неверно указаны ID пользователя и(или) количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.put('/reduceMoneyFromProducer/users/:userID', async (req, res) => {
    const { userID } = req.params;
    const { money } = req.body;

    try {
        if (userID && money) {
            const userInstance = await UserNamespace.getInstanceById(userID);

            await userInstance.reduceMoneyFromProducer(money);
            await DelayNamespace.delay(100);

            const producerInstance = await ProducerNamespace.getInstanceById(userInstance.producerId);
            res.status(200).json({ producerMoney: producerInstance.money });
        } else {
            res.status(400).json({ 'error': 'Неверно указаны ID пользователя и(или) количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.post('/putProductToCart/shops/:shopId/products/:productId/users/:userID', async (req, res) => {
    const { shopId, productId, userID } = req.params;
    const { quantity } = req.body;

    try {
        if (shopId && productId&& userID && quantity) {
            let shopInstance = await ShopNamespace.getInstanceById(shopId);
            const productInstance = await ProductNamespace.getInstanceById(productId);
            const userInstance = await UserNamespace.getInstanceById(userID);

            await userInstance.putProductToCart(shopInstance, productInstance, quantity);
            await DelayNamespace.delay(100);

            const consumerInstance = await ConsumerNamespace.getInstanceById(userInstance.consumerId);
            res.status(200).json({ consumerCart: consumerInstance.cart });
        } else {
            res.status(400).json({ 'error': 'Неверно указаны ID пользователя и(или) количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.put('/putOutProductFromCart/shops/:shopId/products/:productId/users/:userID', async (req, res) => {
    const { shopId, productId, userID } = req.params;
    const { quantity } = req.body;

    try {
        if (shopId && productId&& userID && quantity) {
            let shopInstance = await ShopNamespace.getInstanceById(shopId);
            const productInstance = await ProductNamespace.getInstanceById(productId);
            const userInstance = await UserNamespace.getInstanceById(userID);

            await userInstance.putOutProductFromCart(shopInstance, productInstance, quantity);
            await DelayNamespace.delay(100);

            const consumerInstance = await ConsumerNamespace.getInstanceById(userInstance.consumerId);
            res.status(200).json({ consumerCart: consumerInstance.cart });
        } else {
            res.status(400).json({ 'error': 'Неверно указаны ID пользователя и(или) количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.post('/addProductToShop/products/:productId/users/:userID', async (req, res) => {
    const { productId, userID } = req.params;
    const { quantity } = req.body;

    try {
        if (productId && userID && quantity) {
            const productInstance = await ProductNamespace.getInstanceById(productId);
            const userInstance = await UserNamespace.getInstanceById(userID);

            await userInstance.addProductToShop(productInstance, quantity);
            await DelayNamespace.delay(100);

            const shopInstance = await ShopNamespace.getInstanceById((await ProducerNamespace.getInstanceById(userInstance.producerId)).shopId);
            res.status(200).json({ shopCatalog: shopInstance.catalog });
        } else {
            res.status(400).json({ 'error': 'Неверно указаны ID пользователя и(или) количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.put('/reduceProductFromShop/products/:productId/users/:userID', async (req, res) => {
    const { productId, userID } = req.params;
    const { quantity } = req.body;

    try {
        if (productId && userID && quantity) {
            const productInstance = await ProductNamespace.getInstanceById(productId);
            const userInstance = await UserNamespace.getInstanceById(userID);

            await userInstance.reduceProductFromShop(productInstance, quantity);
            await DelayNamespace.delay(100);

            const shopInstance = await ShopNamespace.getInstanceById((await ProducerNamespace.getInstanceById(userInstance.producerId)).shopId);
            res.status(200).json({ shopCatalog: shopInstance.catalog });
        } else {
            res.status(400).json({ 'error': 'Неверно указаны ID пользователя и(или) количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.delete('/deleteProductFromShop/products/:productId/users/:userID', async (req, res) => {
    const { productId, userID } = req.params;

    try {
        if (productId && userID) {
            const productInstance = await ProductNamespace.getInstanceById(productId);
            const userInstance = await UserNamespace.getInstanceById(userID);

            await userInstance.deleteProductFromShop(productInstance);
            await DelayNamespace.delay(100);

            const shopInstance = await ShopNamespace.getInstanceById((await ProducerNamespace.getInstanceById(userInstance.producerId)).shopId);
            res.status(200).json({ shopCatalog: shopInstance.catalog });
        } else {
            res.status(400).json({ 'error': 'Неверно указаны ID пользователя и(или) количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.post('/buyProducts/users/:userID', async (req, res) => {
    const { userID } = req.params;

    try {
        if (userID) {
            let userInstance = await UserNamespace.getInstanceById(userID);

            await userInstance.buyProducts();
            await DelayNamespace.delay(100);

            userInstance = await UserNamespace.getInstanceById(userID);
            res.status(200).json({ userOwnedProducts: userInstance.ownedProducts });
        } else {
            res.status(400).json({ 'error': 'Неверно указаны ID пользователя и(или) количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.post('/addNewProductToOwned/users/:userID', async (req, res) => {
    const { userID } = req.params;
    const { title, price, quantity } = req.body;

    try {
        if (userID && quantity) {
            let userInstance = await UserNamespace.getInstanceById(userID);

            const insertResult = await PoolNamespace.pool.query(
                `
                    INSERT INTO products (title, price)
                    VALUES ($1, $2)
                    RETURNING *;
                `,
                [title, price]
            );
            await DelayNamespace.delay(100);

            await userInstance.addOwnedProductToOwned(insertResult.rows[0], quantity);
            await DelayNamespace.delay(100);

            userInstance = await UserNamespace.getInstanceById(userID);
            res.status(200).json({ userOwnedProducts: userInstance.ownedProducts });
        } else {
            res.status(400).json({ 'error': 'Неверно указаны ID пользователя и(или) количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.post('/addOwnedProductToOwned/products/:productId/users/:userID', async (req, res) => {
    const { productId, userID } = req.params;
    const { quantity } = req.body;

    try {
        if (productId && userID && quantity) {
            const productInstance = await ProductNamespace.getInstanceById(productId);
            let userInstance = await UserNamespace.getInstanceById(userID);

            await userInstance.addOwnedProductToOwned(productInstance, quantity);
            await DelayNamespace.delay(100);

            userInstance = await UserNamespace.getInstanceById(userID);
            res.status(200).json({ userOwnedProducts: userInstance.ownedProducts });
        } else {
            res.status(400).json({ 'error': 'Неверно указаны ID пользователя и(или) количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});



app.get('/users', async (req, res) => {
    const result = await PoolNamespace.pool.query('SELECT * FROM users;');
    res.status(200).json(result.rows);
});

app.get('/consumers', async (req, res) => {
    const result = await PoolNamespace.pool.query('SELECT * FROM consumers;');
    res.status(200).json(result.rows);
});

app.get('/producers', async (req, res) => {
    const result = await PoolNamespace.pool.query('SELECT * FROM producers;');
    res.status(200).json(result.rows);
});

app.get('/shops', async (req, res) => {
    const result = await PoolNamespace.pool.query('SELECT * FROM shops;');
    res.status(200).json(result.rows);
});

app.get('/products', async (req, res) => {
    const result = await PoolNamespace.pool.query('SELECT * FROM products;');
    res.status(200).json(result.rows);
});



app.get('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await UserNamespace.getInstanceById(userId);
        res.status(200).json({ user: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.get('/consumers/:consumerId', async (req, res) => {
    try {
        const { consumerId } = req.params;

        const consumer = await ConsumerNamespace.getInstanceById(consumerId);
        res.status(200).json({ consumer: consumer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.get('/producers/:producerId', async (req, res) => {
    try {
        const { producerId } = req.params;

        const producer = await ProducerNamespace.getInstanceById(producerId);
        res.status(200).json({ producer: producer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.get('/shops/:shopId', async (req, res) => {
    try {
        const { shopId } = req.params;

        const shop = await ShopNamespace.getInstanceById(shopId);
        res.status(200).json({ shop: shop });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.get('/products/:productId', async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await ProductNamespace.getInstanceById(productId);
        res.status(200).json({ product: product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});