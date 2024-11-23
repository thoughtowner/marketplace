import ShopNamespace from './shop.js';
import PoolNamespace from "./pool.js";
import UserNamespace from './user.js';

const ProducerNamespace = {
    Producer: class {
        constructor(id, money=null, shopId=null) {
            this.id = id;
            this.money = money || 0;
            this.shopId = shopId || null;
        }

        // private
        checkQuantityValue(quantity) {
            if (typeof quantity !== 'number') {
                throw new Error(`Тип значения <quantity> должно быть <number>.`);
            } else {
                if (quantity <= 0) {
                    throw new Error(`Значение <quantity> должно быть больше нуля.`);
                }
            }
        }

        // private
        reduceMoney(money) {
            this.money -= money;
        }

        // public
        async addProductToShop(userName, shop, product, quantity) {
            let user = await UserNamespace.getInstanceByProducerId(this.id);
            let isProductIncludesInOwned = false;
            for (let i = 0; i < user.ownedProducts.length; i++) {
                if (user.ownedProducts[i]['productId'] === product.id) {
                    isProductIncludesInOwned = true;
                    break;
                }
            }
            if (!isProductIncludesInOwned) {
                throw new Error(`Товар "${product.title}" не найден в имеющихся товарах пользователя "${user.name}".`);
            }

            for (let i = 0; i < user.ownedProducts.length; i++) {
                if (user.ownedProducts[i]['productId'] === product.id) {
                    if (user.ownedProducts[i]['quantity'] >= quantity) {
                        let isProductIncludesInShop = false;
                        for (let j = 0; j < shop.catalog.length; j++) {
                            if (shop.catalog[j]['productId'] === product.id) {
                                isProductIncludesInShop = true;
                                break;
                            }
                        }
                        if (!isProductIncludesInShop) {
                            shop.catalog.push({ 'productId': product.id, 'totalQuantity': 0, 'quantityInCarts': 0 });
                        }
        
                        for (let j = 0; j < shop.catalog.length; j++) {
                            if (shop.catalog[j]['productId'] === product.id) {
                                shop.catalog[j]['totalQuantity'] += quantity;
                                console.log(`Пользователь "${userName}" добавил в магазин "${shop.title}" ${quantity} штук товара "${product.title}".`);
                                break;
                            }
                        }
        
                        user.ownedProducts[i]['quantity'] -= quantity;
                        user.updateOwnedProductsInDB();
                    } else {
                        throw new Error(`Пользователь "${userName}" не модет добавить в магазин "${shop.title}" ${quantity} штук товара "${product.title}", так как количество этого продукта среди имеющихся у него продуктов недостаточно для этого.`);
                    }
                    break;
                }
            }
        }

        // public
        async reduceProductFromShop(userName, shop, product, quantity) {
            let user = await UserNamespace.getInstanceByProducerId(this.id);
            let isProductIncludesInOwned = false;
            for (let i = 0; i < user.ownedProducts.length; i++) {
                if (user.ownedProducts[i]['productId'] === product.id) {
                    isProductIncludesInOwned = true;
                    break;
                }
            }
            if (!isProductIncludesInOwned) {
                user.ownedProducts.push({ 'productId': product.id, 'quantity': 0 });
            }

            for (let i = 0; i < user.ownedProducts.length; i++) {
                if (user.ownedProducts[i]['productId'] === product.id) {
                    let isProductExists = false;
                    for (let i = 0; i < shop.catalog.length; i++) {
                        if (shop.catalog[i]['productId'] === product.id) {
                            isProductExists = true;
                            if (quantity <= shop.catalog[i]['totalQuantity'] - shop.catalog[i]['quantityInCarts']) {
                                shop.catalog[i]['totalQuantity'] -= quantity;
                                user.ownedProducts[i]['quantity'] += quantity;
                                console.log(`Пользователь "${userName}" уменьшил в магазине "${shop.title}" количество товара "${product.title}" на ${quantity} штук.`);
                                break;
                            } else {
                                throw new Error(`Пользователь "${userName}" не может уменьшить в магазине "${shop.title}" количество товара "${product.title}" на ${quantity} штук, так как количетсво товара в магазине меньше, чем уменьшаемого количества.`);
                            }
                        }
                    }
                    if (!isProductExists) {
                        throw new Error(`Товар "${product.title}" не найден в магазине "${shop.title}".`);
                    }
                }
            }
        }

        // public
        async deleteProductFromShop(userName, shop, product) {
            let isProductExists = false;
            for (let i = 0; i < shop.catalog.length; i++) {
                // console.log(shop.catalog[i]);
                if (shop.catalog[i]['productId'] === product.id) {
                    isProductExists = true;
                    if (shop.catalog[i]['totalQuantity'] === 0) {
                        await shop.deleteProductFromCatalogInDB(i);
                        console.log(`Пользователь "${userName}" удалил из магазина "${shop.title}" товар "${product.title}".`);
                        break;
                    } else {
                        throw new Error(`Пользователь "${userName}" не может удалить из магазина "${shop.title}" товар "${product.title}", так как он ещё не закончился.`);
                    }
                }
            }
            if (!isProductExists) {
                throw new Error(`Товар "${product.title}" не найден в магазине "${shop.title}".`);
            }
        }

        async updateMoneyInDB() {
            const result = await PoolNamespace.pool.query(`
                UPDATE producers
                SET
                    money = $1
                WHERE id = $2
                RETURNING *
            `, [this.money, this.id]);
            return result.rows[0];
        }
    },

    async getInstanceById(producerId) {
        const producerResult = await PoolNamespace.pool.query(
            'SELECT * FROM producers WHERE id = $1',
            [producerId]
        );

        if (producerResult.rows.length === 0) {
            throw new Error(`В таблице users нет записей с id "${producerId}"`);
        }

        const shopResult = await PoolNamespace.pool.query(
            'SELECT * FROM shops WHERE producer_id = $1',
            [producerId]
        );

        const producerData = producerResult.rows[0];
        const shopData = shopResult.rows[0];
    
        let producerInstance = new this.Producer(producerData.id, producerData.money, shopData.id);
        return producerInstance;
    },

    async getInstanceByShopId(shopId) {
        const shopResult = await PoolNamespace.pool.query(
            'SELECT * FROM shops WHERE id = $1',
            [shopId]
        );

        if (shopResult.rows.length === 0) {
            throw new Error(`В таблице shops нет записей с id "${shopId}"`);
        }

        const shopData = shopResult.rows[0];

        const producerResult = await PoolNamespace.pool.query(
            'SELECT * FROM producers WHERE id = $1',
            [shopData.producer_id]
        );

        const producerData = producerResult.rows[0];

        let producerInstance = new this.Producer(producerData.id, producerData.money, shopData.id);
        return producerInstance;
    }
}

export default ProducerNamespace;