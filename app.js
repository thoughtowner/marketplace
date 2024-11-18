import express from 'express';
import pg from 'pg';
import cors from 'cors';

import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';
import session from 'express-session';

import UserNamespace from './modules/user.js';
import ConsumerNamespace from './modules/consumer.js';
import ProducerNamespace from './modules/producer.js';
import ProductNamespace from './modules/product.js';
import ShopNamespace from './modules/shop.js';
import PoolNamespace from './modules/pool.js';
import DelayNamespace from './modules/delay.js';


const app = express();
const port = 8000;

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 600000 } // Сессия на 10 минут
}));

app.get('/check-auth', (req, res) => {
    if (req.session.user) {
        res.json({ isAuth: true });
    } else {
        res.json({ isAuth: false });
    }
});

app.get('/check-role', (req, res) => {
    if (req.session.user.role === 'consumer') {
        res.json({ role: 'consumer' });
    } else if (req.session.user.role === 'producer') {
        res.json({ role: 'producer' });
    }
});

function checkAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}




app.get('/register', (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/register.html');
});

app.post('/register', async (req, res) => {
    const { name, password, role, shopTitle } = req.body;
    
    try {
        if (name && password && role) {
            if (role !== 'consumer' && role !== 'producer') {
                return res.status(401).json({ error: 'Неверно указана роль.' });
            }

            if (role === 'producer' && !shopTitle) {
                return res.status(401).json({ error: 'Не передано название магазина для аккаунта "Продавец".' });
            }

            const userCheck = await PoolNamespace.pool.query('SELECT * FROM users WHERE name = $1', [name]);

            if (userCheck.rows.length > 0) {
                return res.status(200).json({ error: 'Пользователь уже существует.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const userResult = await PoolNamespace.pool.query(
                'INSERT INTO users (name, password, role) VALUES ($1, $2, $3) RETURNING *;',
                [name, hashedPassword, role]
            );
            await DelayNamespace.delay(100);

            const userData = userResult.rows[0];

            if (role === 'consumer') {
                const consumerResult = await PoolNamespace.pool.query(
                    'INSERT INTO consumers (user_id, money) VALUES ($1, $2);',
                    [userData.id, 0]
                );
            } else if (role === 'producer') {
                const producerResult = await PoolNamespace.pool.query(
                    'INSERT INTO producers (user_id, money) VALUES ($1, $2) RETURNING *;',
                    [userData.id, 0]
                );

                const shopResult = await PoolNamespace.pool.query(
                    'INSERT INTO shops (producer_id, title) VALUES ($1, $2);',
                    [producerResult.rows[0].id, shopTitle]
                );
            }
            await DelayNamespace.delay(100);

            res.redirect('/login');
        } else {
            res.status(400).json({ 'error': 'Не переданы имя пользователя, пароль, роль.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/login', (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/login.html');
});

app.post('/login', async (req, res) => {
    const { name, password } = req.body;

    try {
        if (name && password) {
            const result = await PoolNamespace.pool.query('SELECT * FROM users WHERE name = $1;', [name]);
 
            if (result.rowCount === 0) {
                return res.status(401).json({ error: 'Неверно указано имя пользователя.' });
            }
    
            const user = result.rows[0];
            const match = await bcrypt.compare(password, user.password);
    
            if (match) {
                req.session.user = {
                    id: user.id,
                    name: name,
                    role: user.role
                };
                res.redirect('/');
            } else {
                res.status(401).json({ error: 'Неверно указан пароль.' });
            }
        } else {
            res.status(400).json({ 'error': 'Не переданы имя пользователя, пароль.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/logout.html');
});



app.get('/', (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/index.html');
});

app.get('/account', (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/account.html');
});

app.get('/ownedProducts', async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) {
            throw new Error('Пользователь не авторизован');
        }

        const userInstance = await UserNamespace.getInstanceById(user.id);
        
        console.log('Получен пользователь:', user);
        console.log('Данные пользователя:', userInstance);

        // Создаем HTML-страницу с данными
        const html = `
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <title>Владельские продуктов: ${Object.keys(userInstance.ownedProducts).length}</title>
            </head>
            <body>
                <h1>Владельские продуктов: ${Object.keys(userInstance.ownedProducts).length}</h1>

                <div id="logDiv"></div>

                <table id="productsTable">
                    <thead>
                        <tr>
                            <th>ID продукта</th>
                            <th>Название продукта</th>
                            <th>Количество</th>
                        </tr>
                    </thead>
                    <tbody id="productsTableBody"></tbody>
                </table>

                <script>
                    console.log('JavaScript загружен');

                    var productsData = ${JSON.stringify({ ownedProducts: userInstance.ownedProducts })};
                    console.log('Полученные данные:', productsData);

                    console.log('Тип productsData:', typeof productsData);
                    console.log('Структура productsData:', JSON.stringify(productsData, null, 2));

                    let tableBody = document.getElementById('productsTableBody');
                    if (typeof productsData === 'object' && productsData !== null) {
                        console.log('Объект productsData существует и не пустой');
                        Object.keys(productsData.ownedProducts).forEach(function(key) {
                            console.log('Добавлен продукт:', key, productsData.ownedProducts[key]);
                            tableBody.innerHTML += '<tr><td>' + productsData.ownedProducts[key]['productId'] + '</td><td>' + productsData.ownedProducts[key]['quantity'] + '</td><td>';
                        });
                    } else {
                        console.log('productsData не является объектом или пустой');
                        tableBody.innerHTML = '<tr><td>Нет данных</td><td>Нет данных</td><td>Нет данных</td></tr>';
                    }
                </script>
            </body>
        `;

        res.send(html);
    } catch (error) {
        console.error('Ошибка на эндпоинте ownedProducts:', error);
        res.status(500).json({ error: 'Произошла ошибка при получении данных' });
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
    const { userId } = req.params;

    try {
        if (userId) {
            const user = await UserNamespace.getInstanceById(userId);
            res.status(200).json({ user: user });
        } else {
            res.status(400).json({ 'error': 'Неверно указан ID пользователя.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.get('/consumers/:consumerId', async (req, res) => {
    const { consumerId } = req.params;

    try {
        if (consumerId) {
            const consumer = await ConsumerNamespace.getInstanceById(consumerId);
            res.status(200).json({ consumer: consumer });
        } else {
            res.status(400).json({ 'error': 'Неверно указан ID акаунта покупателя.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.get('/producers/:producerId', async (req, res) => {
    const { producerId } = req.params;

    try {
        if (producerId) {
            const producer = await ProducerNamespace.getInstanceById(producerId);
            res.status(200).json({ producer: producer });
        } else {
            res.status(400).json({ 'error': 'Неверно указан ID акаунта продавца.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.get('/shops/:shopId', async (req, res) => {
    const { shopId } = req.params;

    try {
        if (shopId) {
            const shop = await ShopNamespace.getInstanceById(shopId);
            res.status(200).json({ shop: shop });
        } else {
            res.status(400).json({ 'error': 'Неверно указан ID магазина.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.get('/products/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        if (productId) {
            const product = await ProductNamespace.getInstanceById(productId);
            res.status(200).json({ product: product });
        } else {
            res.status(400).json({ 'error': 'Неверно указан ID продукта.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});



app.put('/addMoneyToConsumer/users/:userId', checkAuth, async (req, res) => {
    const { userId } = req.params;
    const { money } = req.body;

    try {
        if (userId && money) {
            const userInstance = await UserNamespace.getInstanceById(userId);

            await userInstance.addMoneyToConsumer(money);
            await DelayNamespace.delay(100);

            const consumerInstance = await ConsumerNamespace.getInstanceById(userInstance.consumerId);
            res.status(200).json({ consumerMoney: consumerInstance.money });
        } else {
            res.status(400).json({ 'error': 'Не переданы ID пользователя, количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.put('/reduceMoneyFromProducer/users/:userId', checkAuth, async (req, res) => {
    const { userId } = req.params;
    const { money } = req.body;

    try {
        if (userId && money) {
            const userInstance = await UserNamespace.getInstanceById(userId);

            await userInstance.reduceMoneyFromProducer(money);
            await DelayNamespace.delay(100);

            const producerInstance = await ProducerNamespace.getInstanceById(userInstance.producerId);
            res.status(200).json({ producerMoney: producerInstance.money });
        } else {
            res.status(400).json({ 'error': 'Не переданы ID пользователя, количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.post('/putProductToCart/shops/:shopId/products/:productId/users/:userId', checkAuth, async (req, res) => {
    const { shopId, productId, userId } = req.params;
    const { quantity } = req.body;

    try {
        if (shopId && productId && userId && quantity) {
            let shopInstance = await ShopNamespace.getInstanceById(shopId);
            const productInstance = await ProductNamespace.getInstanceById(productId);
            const userInstance = await UserNamespace.getInstanceById(userId);

            await userInstance.putProductToCart(shopInstance, productInstance, quantity);
            await DelayNamespace.delay(100);

            const consumerInstance = await ConsumerNamespace.getInstanceById(userInstance.consumerId);
            res.status(200).json({ consumerCart: consumerInstance.cart });
        } else {
            res.status(400).json({ 'error': 'Не переданы ID магазина, ID продукта, ID пользователя, количество продукта.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.put('/putOutProductFromCart/shops/:shopId/products/:productId/users/:userId', checkAuth, async (req, res) => {
    const { shopId, productId, userId } = req.params;
    const { quantity } = req.body;

    try {
        if (shopId && productId&& userId && quantity) {
            let shopInstance = await ShopNamespace.getInstanceById(shopId);
            const productInstance = await ProductNamespace.getInstanceById(productId);
            const userInstance = await UserNamespace.getInstanceById(userId);

            await userInstance.putOutProductFromCart(shopInstance, productInstance, quantity);
            await DelayNamespace.delay(100);

            const consumerInstance = await ConsumerNamespace.getInstanceById(userInstance.consumerId);
            res.status(200).json({ consumerCart: consumerInstance.cart });
        } else {
            res.status(400).json({ 'error': 'Не переданы ID магазина, ID продукта, ID пользователя, количество продукта.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.post('/buyProducts/users/:userId', checkAuth, async (req, res) => {
    const { userId } = req.params;

    try {
        if (userId) {
            let userInstance = await UserNamespace.getInstanceById(userId);

            await userInstance.buyProducts();
            await DelayNamespace.delay(100);

            userInstance = await UserNamespace.getInstanceById(userId);
            res.status(200).json({ userOwnedProducts: userInstance.ownedProducts });
        } else {
            res.status(400).json({ 'error': 'Неверно указан ID пользователя.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.post('/addProductToShop/products/:productId/users/:userId', checkAuth, async (req, res) => {
    const { productId, userId } = req.params;
    const { quantity } = req.body;

    try {
        if (productId && userId && quantity) {
            const productInstance = await ProductNamespace.getInstanceById(productId);
            const userInstance = await UserNamespace.getInstanceById(userId);

            await userInstance.addProductToShop(productInstance, quantity);
            await DelayNamespace.delay(100);

            const shopInstance = await ShopNamespace.getInstanceById((await ProducerNamespace.getInstanceById(userInstance.producerId)).shopId);
            res.status(200).json({ shopCatalog: shopInstance.catalog });
        } else {
            res.status(400).json({ 'error': 'Не переданы ID продукта, ID пользователя, количество продукта.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.put('/reduceProductFromShop/products/:productId/users/:userId', checkAuth, async (req, res) => {
    const { productId, userId } = req.params;
    const { quantity } = req.body;

    try {
        if (productId && userId && quantity) {
            const productInstance = await ProductNamespace.getInstanceById(productId);
            const userInstance = await UserNamespace.getInstanceById(userId);

            await userInstance.reduceProductFromShop(productInstance, quantity);
            await DelayNamespace.delay(100);

            const shopInstance = await ShopNamespace.getInstanceById((await ProducerNamespace.getInstanceById(userInstance.producerId)).shopId);
            res.status(200).json({ shopCatalog: shopInstance.catalog });
        } else {
            res.status(400).json({ 'error': 'Не переданы ID продукта, ID пользователя, количество продукта.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.delete('/deleteProductFromShop/products/:productId/users/:userId', checkAuth, async (req, res) => {
    const { productId, userId } = req.params;

    try {
        if (productId && userId) {
            const productInstance = await ProductNamespace.getInstanceById(productId);
            const userInstance = await UserNamespace.getInstanceById(userId);

            await userInstance.deleteProductFromShop(productInstance);
            await DelayNamespace.delay(100);

            const shopInstance = await ShopNamespace.getInstanceById((await ProducerNamespace.getInstanceById(userInstance.producerId)).shopId);
            res.status(200).json({ shopCatalog: shopInstance.catalog });
        } else {
            res.status(400).json({ 'error': 'Не переданы ID продукта, ID пользователя.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.post('/addNewProductToOwned/users/:userId', checkAuth, async (req, res) => {
    const { userId } = req.params;
    const { title, price, quantity } = req.body;

    try {
        if (userId && quantity) {
            let userInstance = await UserNamespace.getInstanceById(userId);

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

            userInstance = await UserNamespace.getInstanceById(userId);
            res.status(200).json({ userOwnedProducts: userInstance.ownedProducts });
        } else {
            res.status(400).json({ 'error': 'Не переданы ID пользователя, название продукта, цена продукта, количество продукта.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.post('/addOwnedProductToOwned/products/:productId/users/:userId', checkAuth, async (req, res) => {
    const { productId, userId } = req.params;
    const { quantity } = req.body;

    try {
        if (productId && userId && quantity) {
            const productInstance = await ProductNamespace.getInstanceById(productId);
            let userInstance = await UserNamespace.getInstanceById(userId);

            await userInstance.addOwnedProductToOwned(productInstance, quantity);
            await DelayNamespace.delay(100);

            userInstance = await UserNamespace.getInstanceById(userId);
            res.status(200).json({ userOwnedProducts: userInstance.ownedProducts });
        } else {
            res.status(400).json({ 'error': 'Не переданы ID продукта, ID пользователя, количество продукта.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
