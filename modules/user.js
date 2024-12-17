const ConsumerNamespace = require('./consumer.js');
const ProducerNamespace = require('./producer.js');
const PoolNamespace = require('./pool.js');
const ShopNamespace = require('./shop.js');


// private
function checkMoneyValue(money) {
    if (typeof money !== 'number') {
        throw new Error(`Тип значения <money> должно быть <number>.`);
    } else {
        if (money < 0) {
            throw new Error(`Значение <money> должно быть больше или равно нулю.`);
        }
    }
}

// private
function checkQuantityValue(quantity) {
    if (typeof quantity !== 'number') {
        throw new Error(`Тип значения <quantity> должно быть <number>.`);
    } else {
        if (quantity <= 0) {
            throw new Error(`Значение <quantity> должно быть больше нуля.`);
        }
    }
}

const UserNamespace = {
    User: class {
        constructor(id, name, password, role=null, roleId=null, ownedProducts=null) {
            this.id = id;
            this.name = name;
            this.password = password;
            this.ownedProducts = ownedProducts || [];
            this.role = role;
            if (role === 'consumer') {
                this.consumerId = roleId;
                this.producerId = null;
                this.adminId = null;
            } else if (role === 'producer') {
                this.producerId = roleId;
                this.consumerId = null;
                this.adminId = null;
            } else if (role === 'admin') {
                this.producerId = null;
                this.consumerId = null;
                this.adminId = roleId;
            } else {
                this.consumerId = null;
                this.producerId = null;
                this.adminId = null;
            }
        }

        // private
        checkRoleAffiliation(role) {
            if (role === 'consumer') {
                if (!this.consumerId) {
                    throw new Error(`Невозможно выполнить метод, так как пользователь не имеет счёта для покупок.`);
                }
            } else if (role === 'producer') {
                if (!this.producerId) {
                    throw new Error(`Невозможно выполнить метод, так как пользователь не имеет счёта для продаж.`);
                }
            } else if (role === 'admin') {
                if (!this.adminId) {
                    throw new Error(`Невозможно выполнить метод, так как пользователь не является админом.`);
                }
            } else {
                throw new Error(`Невозможно выполнить метод, так как введена неверная роль.`);
            }
        }

        // public
        async addMoneyToConsumer(money) {
            this.checkRoleAffiliation('consumer');
            checkMoneyValue(money);
            let consumer = await ConsumerNamespace.getInstanceById(this.consumerId);
            consumer.addMoney(money);
            await consumer.updateMoneyInDB();
            console.log(`Пользователь "${this.name}" положил на счёт для покупок ${money} рублей.`);
        }

        // public
        async reduceMoneyFromProducer(money) {
            this.checkRoleAffiliation('producer');
            checkMoneyValue(money);
            let producer = await ProducerNamespace.getInstanceById(this.producerId);
            if (producer.money >= money) {
                producer.reduceMoney(money);
                await producer.updateMoneyInDB();
                console.log(`Пользователь "${this.name}" снял со счёта для продаж ${money} рублей.`);
            } else {
                throw new Error(`Пользователь "${this.name}" не может снять со счёта для продаж ${money} рублей, так как на счёте для продаж недостаточно средств для этого.`);
            }
        }

        // public
        async putProductToCart(shop, product, quantity) {
            this.checkRoleAffiliation('consumer');
            checkQuantityValue(quantity);
            let consumer = await ConsumerNamespace.getInstanceById(this.consumerId);
            consumer.putProduct(this.name, shop, product, quantity);
            await consumer.updateCartInDB();
            shop.updateCatalogInDB();
        }

        // public
        async putOutProductFromCart(shop, product, quantity) {
            this.checkRoleAffiliation('consumer');
            checkQuantityValue(quantity);
            let consumer = await ConsumerNamespace.getInstanceById(this.consumerId);
            consumer.putOutProduct(this.name, shop, product, quantity);
            await consumer.updateCartInDB();
            shop.updateCatalogInDB();
        }

        // public
        async buyProducts() {
            this.checkRoleAffiliation('consumer');
            let consumer = await ConsumerNamespace.getInstanceById(this.consumerId);
            await consumer.buyProducts(this.name);
        }

        async addProductToShop(product, quantity) {
            this.checkRoleAffiliation('producer');
            checkQuantityValue(quantity);
            let producer = await ProducerNamespace.getInstanceById(this.producerId);
            let shop = await ShopNamespace.getInstanceById(producer.shopId);
            await producer.addProductToShop(this, shop, product, quantity);
            shop.updateCatalogInDB();
            this.updateOwnedProductsInDB();
        }

        async reduceProductFromShop(product, quantity) {
            this.checkRoleAffiliation('producer');
            checkQuantityValue(quantity);
            let producer = await ProducerNamespace.getInstanceById(this.producerId);
            let shop = await ShopNamespace.getInstanceById(producer.shopId);
            await producer.reduceProductFromShop(this, shop, product, quantity);
            shop.updateCatalogInDB();
            this.updateOwnedProductsInDB();
        }

        async deleteProductFromShop(product) {
            this.checkRoleAffiliation('producer');
            let producer = await ProducerNamespace.getInstanceById(this.producerId);
            let shop = await ShopNamespace.getInstanceById(producer.shopId);
            await producer.deleteProductFromShop(this, shop, product);
            shop.deleteProductFromCatalogInDB(product);
        }

        async addOwnedProductToOwned(product, quantity) {
            this.checkRoleAffiliation('producer');

            let isProductIncludes = false;
            for (let i = 0; i < this.ownedProducts.length; i++) {
                if (this.ownedProducts[i]['productId'] === product.id) {
                    isProductIncludes = true;
                    break;
                }
            }
            if (!isProductIncludes) {
                this.ownedProducts.push({ 'productId': product.id, 'quantity': 0 });
            }
            
            for (let i = 0; i < this.ownedProducts.length; i++) {
                if (this.ownedProducts[i]['productId'] === product.id) {
                    this.ownedProducts[i]['quantity'] += quantity;
                    break;
                }
            }
            await this.updateOwnedProductsInDB();
        }

        async updateOwnedProductsInDB() {
            let deleteResult;
            let insertResult;

            for (let i = 0; i < this.ownedProducts.length; i++) {
                deleteResult = await PoolNamespace.pool.query(
                    `
                        DELETE FROM user_to_product
                        WHERE
                            user_id = $1 AND
                            product_id = $2
                    `,
                    [this.id, this.ownedProducts[i]['productId']]
                );
            }

            for (let i = 0; i < this.ownedProducts.length; i++) {
                insertResult = await PoolNamespace.pool.query(
                    `
                        INSERT INTO user_to_product (user_id, product_id, quantity)
                        VALUES ($1, $2, $3);
                    `,
                    [this.id, this.ownedProducts[i]['productId'], this.ownedProducts[i]['quantity']]
                );
            }

            for (let i = 0; i < this.ownedProducts.length; i++) {
                if (this.ownedProducts[i]['quantity'] === 0) {
                    deleteResult = await PoolNamespace.pool.query(
                        `
                            DELETE FROM user_to_product
                            WHERE
                                user_id = $1 AND
                                product_id = $2
                        `,
                        [this.id, this.ownedProducts[i]['productId']]
                    );
                    this.ownedProducts.splice(i, 1);
                }
            }
        }
    },

    // Можно переписать, т.к. в таблице users добавил поле role.
    async getInstanceById(userId) {
        const userResult = await PoolNamespace.pool.query(
            'SELECT * FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            throw new Error(`В таблице users нет записей с id "${userId}"`);
        }

        let role = null;
        let roleId = null;

        const consumerResult = await PoolNamespace.pool.query(
            'SELECT * FROM consumers WHERE user_id = $1',
            [userId]
        );

        const producerResult = await PoolNamespace.pool.query(
            'SELECT * FROM producers WHERE user_id = $1',
            [userId]
        );

        const adminResult = await PoolNamespace.pool.query(
            'SELECT * FROM admins WHERE user_id = $1',
            [userId]
        );

        if (consumerResult.rows.length > 0) {
            role = 'consumer';
            roleId = consumerResult.rows[0].id;
        } else if (producerResult.rows.length > 0) {
            role = 'producer';
            roleId = producerResult.rows[0].id;
        } else if (adminResult.rows.length > 0) {
            role = 'admin';
            roleId = adminResult.rows[0].id;
        }

        const ownedProductsResults = await PoolNamespace.pool.query(
            `
                SELECT 
                    u.id AS user_id,
                    up.product_id,
                    up.quantity
                FROM 
                    users u
                LEFT JOIN 
                    user_to_product up ON u.id = up.user_id
                WHERE 
                    u.id = $1
            `,
            [userId]
        );

        let ownedProducts = [];
        ownedProductsResults.rows.forEach(row => {
            if (row.product_id !== null && row.quantity !== null) {
                ownedProducts.push({
                    productId: row.product_id,
                    quantity: row.quantity
                });
            }
        });

        const result = {
            ...userResult.rows[0],
            role: role,
            roleId: roleId,
            ownedProducts: Object.values(ownedProducts)
        };

        const userInstance = new this.User(result.id, result.name, result.password, result.role, result.roleId, result.ownedProducts);
        return userInstance;
    },

    async getInstanceByConsumerId(consumerId) {
        const consumerResult = await PoolNamespace.pool.query(
            'SELECT * FROM consumers WHERE id = $1',
            [consumerId]
        );

        if (consumerResult.rows.length === 0) {
            throw new Error(`В таблице consumers нет записей с id "${consumerId}"`);
        }

        const consumerData = consumerResult.rows[0];

        const userResult = await PoolNamespace.pool.query(
            'SELECT * FROM users WHERE id = $1',
            [consumerData.user_id]
        );

        if (userResult.rows.length === 0) {
            throw new Error(`Никакой пользователь не связан с аккаунтом покупателя с id ${consumerId}`);
        }

        const ownedProductsResults = await PoolNamespace.pool.query(
            `
                SELECT 
                    u.id AS user_id,
                    up.product_id,
                    up.quantity
                FROM 
                    users u
                LEFT JOIN 
                    user_to_product up ON u.id = up.user_id
                WHERE 
                    u.id = $1
            `,
            [userResult.rows[0].id]
        );

        let ownedProducts = [];
        ownedProductsResults.rows.forEach(row => {
            if (row.product_id !== null && row.quantity !== null) {
                ownedProducts.push({
                    productId: row.product_id,
                    quantity: row.quantity
                });
            }
        });

        const result = {
            ...userResult.rows[0],
            role: 'consumer',
            roleId: consumerId,
            ownedProducts: Object.values(ownedProducts)
        };

        const userInstance = new this.User(result.id, result.name, result.password, result.role, result.roleId, result.ownedProducts);
        return userInstance;
    },

    async getInstanceByProducerId(producerId) {
        const consumerResult = await PoolNamespace.pool.query(
            'SELECT * FROM producers WHERE id = $1',
            [producerId]
        );

        if (consumerResult.rows.length === 0) {
            throw new Error(`В таблице producers нет записей с id "${producerId}"`);
        }

        const consumerData = consumerResult.rows[0];

        const userResult = await PoolNamespace.pool.query(
            'SELECT * FROM users WHERE id = $1',
            [consumerData.user_id]
        );

        if (userResult.rows.length === 0) {
            throw new Error(`Никакой пользователь не связан с аккаунтом продавца с id ${producerId}`);
        }

        const ownedProductsResults = await PoolNamespace.pool.query(
            `
                SELECT 
                    u.id AS user_id,
                    up.product_id,
                    up.quantity
                FROM 
                    users u
                LEFT JOIN 
                    user_to_product up ON u.id = up.user_id
                WHERE 
                    u.id = $1
            `,
            [userResult.rows[0].id]
        );

        let ownedProducts = [];
        ownedProductsResults.rows.forEach(row => {
            if (row.product_id !== null && row.quantity !== null) {
                ownedProducts.push({
                    productId: row.product_id,
                    quantity: row.quantity
                });
            }
        });

        const result = {
            ...userResult.rows[0],
            role: 'producer',
            roleId: producerId,
            ownedProducts: Object.values(ownedProducts)
        };

        const userInstance = new this.User(result.id, result.name, result.password, result.role, result.roleId, result.ownedProducts);
        return userInstance;
    },

    async getInstanceByAdminId(adminId) {
        const adminResult = await PoolNamespace.pool.query(
            'SELECT * FROM admins WHERE id = $1',
            [adminId]
        );

        if (adminResult.rows.length === 0) {
            throw new Error(`В таблице admins нет записей с id "${adminId}"`);
        }

        const adminData = adminResult.rows[0];

        const userResult = await PoolNamespace.pool.query(
            'SELECT * FROM users WHERE id = $1',
            [adminData.user_id]
        );

        if (userResult.rows.length === 0) {
            throw new Error(`Никакой пользователь не связан с аккаунтом продавца с id ${adminId}`);
        }

        const ownedProductsResults = await PoolNamespace.pool.query(
            `
                SELECT 
                    u.id AS user_id,
                    up.product_id,
                    up.quantity
                FROM 
                    users u
                LEFT JOIN 
                    user_to_product up ON u.id = up.user_id
                WHERE 
                    u.id = $1
            `,
            [userResult.rows[0].id]
        );

        let ownedProducts = [];
        ownedProductsResults.rows.forEach(row => {
            if (row.product_id !== null && row.quantity !== null) {
                ownedProducts.push({
                    productId: row.product_id,
                    quantity: row.quantity
                });
            }
        });

        const result = {
            ...userResult.rows[0],
            role: 'admin',
            roleId: producerId,
            ownedProducts: Object.values(ownedProducts)
        };

        const userInstance = new this.User(result.id, result.name, result.password, result.role, result.roleId, result.ownedProducts);
        return userInstance;
    },
}

module.exports = UserNamespace;
