const express = require('express');
const pg = require('pg');
const cors = require('cors');

const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const session = require('express-session');

const UserNamespace = require('./modules/user.js');
const ConsumerNamespace = require('./modules/consumer.js');
const ProducerNamespace = require('./modules/producer.js');
const ProductNamespace = require('./modules/product.js');
const ShopNamespace = require('./modules/shop.js');
const PoolNamespace = require('./modules/pool.js');
const DelayNamespace = require('./modules/delay.js');


const app = express();
app.use(express.json());
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

app.get('/check-role', async (req, res) => {
    if (!req.session.user) {
        return res.json({ role: '' });
    }
    if (req.session.user.role === 'consumer') {
        res.json({ role: 'consumer' });
    } else if (req.session.user.role === 'producer') {
        const producerResult = await PoolNamespace.pool.query('SELECT * FROM producers WHERE user_id = $1', [req.session.user.id]);
        const shopResult = await PoolNamespace.pool.query('SELECT * FROM shops WHERE producer_id = $1', [producerResult.rows[0].id]);
        res.json({ role: 'producer', shopId: shopResult.rows[0].id });
    } else if (req.session.user.role === 'admin') {
        res.json({ role: 'admin' });
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
                await PoolNamespace.pool.query(
                    'INSERT INTO consumers (user_id, money) VALUES ($1, $2);',
                    [userData.id, 0]
                );
            } else if (role === 'producer') {
                const producerResult = await PoolNamespace.pool.query(
                    'INSERT INTO producers (user_id, money) VALUES ($1, $2) RETURNING *;',
                    [userData.id, 0]
                );

                await PoolNamespace.pool.query(
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

app.get('/logout', checkAuth, (req, res) => {
    req.session.destroy();
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/logout.html');
});


app.get('/', (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/index.html');
});

app.get('/account', checkAuth, (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/account.html');
});

app.get('/api/getMyShopId', async (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    try {
        const userInstance = await UserNamespace.getInstanceById(user.id);
        const producerInstance = await ProducerNamespace.getInstanceById(userInstance.producerId);
        const shop = await ShopNamespace.getShopByProducerId(producerInstance.id);
        res.json({ shopId: shop.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/account/cart', checkAuth, (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/cart.html');
});

app.get('/api/cart', async (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    try {
        const userInstance = await UserNamespace.getInstanceById(user.id);
        const consumerInstance = await ConsumerNamespace.getInstanceById(userInstance.consumerId);

        const cartDetails = await Promise.all(consumerInstance.cart.map(async (item) => {
            const product = await ProductNamespace.getInstanceById(item.productId);
            const shop = await ShopNamespace.getInstanceById(item.shopId);

            return {
                productId: item.productId,
                productName: product.title,
                productPhoto: product.photo,
                quantity: item.quantity,
                shopId: shop.id,
                shopTitle: shop.title,
                price: product.price,
                cost: product.price * item.quantity
            };
        }));

        res.json({ cart: cartDetails });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Не удалось получить корзину.' });
    }
});


app.get('/account/ownedProducts', checkAuth, (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/ownedProducts.html');
});

app.get('/api/ownedProducts', checkAuth, async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) {
            return res.status(302).json('Пользователь не авторизован');
        }

        const userInstance = await UserNamespace.getInstanceById(user.id);
        let userDataOfProducts = [];
        let productInstance;
        for (let i = 0; i < userInstance.ownedProducts.length; i++) {
            productInstance = await ProductNamespace.getInstanceById(userInstance.ownedProducts[i]['productId']);
            userDataOfProducts.push({
                'product': {
                    'id': productInstance.id,
                    'title': productInstance.title,
                    'price': productInstance.price,
                    'photo': productInstance.photo
                },
                'quantity': userInstance.ownedProducts[i]['quantity']
            });
        }

        res.json(userDataOfProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});


app.get('/shops', async (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/shops.html');
});

app.get('/api/shops', async (req, res) => {
    const result = await PoolNamespace.pool.query('SELECT * FROM shops;');
    res.status(200).json(result.rows);
});


app.get('/shops/:shopId', async (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/shop.html');
});

app.get('/api/shops/:shopId', async (req, res) => {
    const { shopId } = req.params;
    
    try {
        const shopData = await ShopNamespace.getInstanceById(shopId);

        if (!shopData || !shopData.catalog || shopData.catalog.length === 0) {
            return res.status(404).json({ error: 'Магазин не найден или пуст' });
        }

        const productPromises = shopData.catalog.map(async (productData) => {
            try {
                const product = await ProductNamespace.getInstanceById(productData.productId);
                
                return { 
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    photo: product.photo,
                    totalQuantity: productData.totalQuantity,
                    quantityInCarts: productData.quantityInCarts
                };
            } catch (error) {
                console.error(`Ошибка при получении товара с id ${productData.productId}:`, error);
                return { productId: productData.productId, title: `Товар не найден (${productData.productId})`, category: '' };
            }
        });

        const products = await Promise.all(productPromises);

        res.json({ shop: shopData, catalog: products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});


app.get('/shops/:shopId/products/:productId', async (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/product.html');
});

app.get('/api/shops/:shopId/products/:productId', async (req, res) => {
    const { shopId } = req.params;
    const { productId } = req.params;

    try {
        const shopToProductResult = await PoolNamespace.pool.query('SELECT * FROM shop_to_product WHERE shop_id = $1 AND product_id = $2;', [shopId, productId]);
        const productData = await ProductNamespace.getInstanceById(productId);
        if (!productData) {
            return res.status(404).json({ error: 'Продукт не найден' });
        }

        res.json({ product: productData, shopToProduct: shopToProductResult.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});



app.get('/account/addMoneyToConsumer', checkAuth, async (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/addMoneyToConsumer.html');
});

app.put('/addMoneyToConsumer', checkAuth, async (req, res) => {
    const { money } = req.body;

    try {
        if (money) {
            const user = req.session.user;
            
            const userInstance = await UserNamespace.getInstanceById(user.id);

            await userInstance.addMoneyToConsumer(money);
            await DelayNamespace.delay(100);

            const consumerInstance = await ConsumerNamespace.getInstanceById(userInstance.consumerId);
            res.status(200).json({ consumerMoney: consumerInstance.money });
        } else {
            res.status(400).json({ 'error': 'Не передано количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});


app.get('/account/reduceMoneyFromProducer', checkAuth, async (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/reduceMoneyFromProducer.html');
});

app.put('/reduceMoneyFromProducer', checkAuth, async (req, res) => {
    const { money } = req.body;

    try {
        if (money) {
            const user = req.session.user;

            const userInstance = await UserNamespace.getInstanceById(user.id);

            await userInstance.reduceMoneyFromProducer(money);
            await DelayNamespace.delay(100);

            const producerInstance = await ProducerNamespace.getInstanceById(userInstance.producerId);
            res.status(200).json({ producerMoney: producerInstance.money });
        } else {
            res.status(400).json({ 'error': 'Не передано количество денег.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});


app.post('/putProductToCart/shops/:shopId/products/:productId', checkAuth, async (req, res) => {
    const { shopId, productId } = req.params;
    const { quantity } = req.body;

    try {
        if (shopId && productId && quantity) {
            const user = req.session.user;

            let shopInstance = await ShopNamespace.getInstanceById(shopId);
            const productInstance = await ProductNamespace.getInstanceById(productId);
            const userInstance = await UserNamespace.getInstanceById(user.id);

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

app.put('/putOutProductFromCart/shops/:shopId/products/:productId', checkAuth, async (req, res) => {
    const { shopId, productId } = req.params;
    const { quantity } = req.body;

    try {
        if (shopId && productId && quantity) {
            const user = req.session.user;

            let shopInstance = await ShopNamespace.getInstanceById(shopId);
            const productInstance = await ProductNamespace.getInstanceById(productId);
            const userInstance = await UserNamespace.getInstanceById(user.id);

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

app.post('/buyProducts', checkAuth, async (req, res) => {
    try {
        const user = req.session.user;

        let userInstance = await UserNamespace.getInstanceById(user.id);

        await userInstance.buyProducts();
        await DelayNamespace.delay(100);

        userInstance = await UserNamespace.getInstanceById(user.id);
        res.status(200).json({ userOwnedProducts: userInstance.ownedProducts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});


app.get('/api/getProducerShop', checkAuth, async (req, res) => {
    try {
        const user = req.session.user;

        const producerResult = await PoolNamespace.pool.query(
            'SELECT * FROM producers WHERE user_id = $1',
            [user.id]
        );
        const shopInstance = await ShopNamespace.getShopByProducerId(producerResult.rows[0].id);
        const shopId = shopInstance.id;

        res.status(200).json({ shopId: shopId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});


app.post('/api/addNewProductToShop', checkAuth, async (req, res) => {
    const { title, quantity } = req.body;

    try {
        if (title && quantity) {
            const user = req.session.user;

            const selectResult = await PoolNamespace.pool.query(`
                SELECT * FROM products p JOIN user_to_product up ON p.id = up.product_id WHERE title = $1 AND up.user_id = $2`
                , [title, user.id]
            );
    
            if (selectResult.rows.length === 0) {
                throw new Error(`Невозможно добавить в машазин товар "${title}", так как он не найден среди имеющихся товаров`);
            }
    
            const productInstance = await ProductNamespace.getInstanceById(selectResult.rows[0].id);
            const userInstance = await UserNamespace.getInstanceById(user.id);
    
            await userInstance.addProductToShop(productInstance, quantity);
            await DelayNamespace.delay(100);
    
            const shopInstance = await ShopNamespace.getInstanceById((await ProducerNamespace.getInstanceById(userInstance.producerId)).shopId);
            res.status(200).json({ success: true, shopCatalog: shopInstance.catalog });
        } else {
            return res.status(400).json({ error: 'Не переданы ID продукта или количество продукта.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


app.post('/api/addProductToShop', checkAuth, async (req, res) => {
    const { productId, quantity } = req.body;

    try {
        if (productId && quantity) {
            const user = req.session.user;

            const productInstance = await ProductNamespace.getInstanceById(productId);
            const userInstance = await UserNamespace.getInstanceById(user.id);

            await userInstance.addProductToShop(productInstance, quantity);
            await DelayNamespace.delay(100);

            const shopInstance = await ShopNamespace.getInstanceById((await ProducerNamespace.getInstanceById(userInstance.producerId)).shopId);
            res.status(200).json({ success: true, shopCatalog: shopInstance.catalog });
        } else {
            return res.status(400).json({ error: 'Не переданы ID продукта или количество продукта.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


app.post('/api/reduceProductFromShop', checkAuth, async (req, res) => {
    const { productId, quantity } = req.body;

    try {
        if (productId && quantity) {
            const user = req.session.user;

            const productInstance = await ProductNamespace.getInstanceById(productId);
            const userInstance = await UserNamespace.getInstanceById(user.id);

            await userInstance.reduceProductFromShop(productInstance, quantity);
            await DelayNamespace.delay(100);

            const shopInstance = await ShopNamespace.getInstanceById((await ProducerNamespace.getInstanceById(userInstance.producerId)).shopId);
            res.status(200).json({ shopCatalog: shopInstance.catalog });
        } else {
            res.status(400).json({ 'error': 'Не переданы ID продукта, количество продукта.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.post('/api/deleteProductFromShop', checkAuth, async (req, res) => {
    const { productId } = req.body;

    try {
        if (productId) {
            const user = req.session.user;

            const productInstance = await ProductNamespace.getInstanceById(productId);
            const userInstance = await UserNamespace.getInstanceById(user.id);

            await userInstance.deleteProductFromShop(productInstance);
            await DelayNamespace.delay(100);

            const shopInstance = await ShopNamespace.getInstanceById((await ProducerNamespace.getInstanceById(userInstance.producerId)).shopId);
            res.status(200).json({ shopCatalog: shopInstance.catalog });
        } else {
            res.status(400).json({ 'error': 'Не передан ID продукта.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.post('/api/addNewProductToOwned', checkAuth, async (req, res) => {
    const { title, price, photo, quantity } = req.body;

    try {
        if (title && price && photo && quantity) {
            const user = req.session.user;

            let userInstance = await UserNamespace.getInstanceById(user.id);

            const selectResult = await PoolNamespace.pool.query(`
                SELECT * FROM products p JOIN user_to_product up ON p.id = up.product_id WHERE title = $1 AND up.user_id = $2`
                , [title, user.id]
            );
            if (selectResult.rows.length !== 0) {
                throw new Error('Товар уже содержится среди имеющихся товаров');
            }

            const insertResult = await PoolNamespace.pool.query(
                `
                    INSERT INTO products (title, price, photo)
                    VALUES ($1, $2, $3)
                    RETURNING *;
                `,
                [title, price, photo]
            );
            await DelayNamespace.delay(100);

            const productInstance = await ProductNamespace.getInstanceById(insertResult.rows[0].id);
            await userInstance.addOwnedProductToOwned(productInstance, quantity);
            await DelayNamespace.delay(100);

            userInstance = await UserNamespace.getInstanceById(user.id);
            res.status(200).json({ userOwnedProducts: userInstance.ownedProducts });
        } else {
            res.status(400).json({ 'error': 'Не переданы название продукта, цена продукта, количество продукта.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.post('/api/addOwnedProductToOwned', checkAuth, async (req, res) => {
    const { productId, quantity } = req.body;

    try {
        if (productId && quantity) {
            const user = req.session.user;

            const productInstance = await ProductNamespace.getInstanceById(productId);
            let userInstance = await UserNamespace.getInstanceById(user.id);

            await userInstance.addOwnedProductToOwned(productInstance, quantity);
            await DelayNamespace.delay(100);

            userInstance = await UserNamespace.getInstanceById(user.id);
            res.status(200).json({ success: true, userOwnedProducts: userInstance.ownedProducts });
        } else {
            throw new Error('Не переданы ID продукта, количество продукта.');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});

app.get('/getAllUsers', (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/getAllUsers.html');
});

app.get('/api/getAllUsers', async (req, res) => {
    try {
        const user = req.session.user;

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Вы не являетесь администратором.' });
        }

        const usersResult = await PoolNamespace.pool.query('SELECT * FROM users;');

        const usersData = usersResult.rows;

        res.status(200).json({ users: usersData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 'error': error.message });
    }
});


app.delete('/api/deleteUser/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = req.session.user;

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Вы не являетесь администратором.' });
        }

        const deleteResult = await PoolNamespace.pool.query('DELETE FROM users WHERE id = $1 RETURNING *;', [userId]);

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ error: 'Пользователь не найден.' });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


app.get('/addNewUser', (req, res) => {
    res.sendFile('/home/ilya/Documents/college-3-semester/marketplace/public/addNewUser.html');
});

app.post('/api/addNewUser', async (req, res) => {
    const { name, password, role, shopTitle } = req.body;
    
    try {
        const user = req.session.user;

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Вы не являетесь администратором.' });
        }

        if (name && password && role) {
            if (role !== 'consumer' && role !== 'producer' && role != 'admin') {
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
                await PoolNamespace.pool.query(
                    'INSERT INTO consumers (user_id, money) VALUES ($1, $2);',
                    [userData.id, 0]
                );
            } else if (role === 'producer') {
                const producerResult = await PoolNamespace.pool.query(
                    'INSERT INTO producers (user_id, money) VALUES ($1, $2) RETURNING *;',
                    [userData.id, 0]
                );

                await PoolNamespace.pool.query(
                    'INSERT INTO shops (producer_id, title) VALUES ($1, $2);',
                    [producerResult.rows[0].id, shopTitle]
                );
            } else if (role === 'admin') {
                await PoolNamespace.pool.query(
                    'INSERT INTO admins (user_id) VALUES ($1);',
                    [userData.id]
                );
            }
            await DelayNamespace.delay(100);

            res.redirect('/getAllUsers');
        } else {
            res.status(400).json({ 'error': 'Не переданы имя пользователя, пароль, роль.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
