import PoolNamespace from "./pool.js";
import ProductNamespace from "./product.js";
import ProducerNamespace from "./producer.js";
import ShopNamespace from "./shop.js";
import UserNamespace from "./user.js";

const ConsumerNamespace = {
    Consumer: class {
        constructor(id, money=null, cart=null) {
            this.id = id;
            this.money = money || 0;
            this.cart = cart || [];
        }

        // internal
        addMoney(money) {
            this.money += money;
        }

        // internal
        putProduct(userName, shop, product, quantity) {
            let isProductExists = false;
            for (let i = 0; i < shop.catalog.length; i++) {
                if (shop.catalog[i]['productId'] === product.id) {
                    isProductExists = true;
                    if (quantity <= shop.catalog[i]['totalQuantity'] - shop.catalog[i]['quantityInCarts']) {

                        let isProductIncludes = false;
                        for (let j = 0; j < this.cart.length; j++) {
                            if (this.cart[j]['productId'] === product.id) {
                                isProductIncludes = true;
                                break;
                            }
                        }
                        if (!isProductIncludes) {
                            this.cart.push({ 'shopId': shop.id, 'productId': product.id, 'quantity': 0 });
                        }

                        for (let j = 0; j < this.cart.length; j++) {
                            if (this.cart[j]['productId'] === product.id) {
                                this.cart[j]['quantity'] += quantity;
                                shop.catalog[i]['quantityInCarts'] += quantity;
                                console.log(`Пользователь "${userName}" положил в корзину ${quantity} штук товара "${product.title}" из магазина "${shop.title}".`);
                                break;
                            }
                        }

                    } else {
                        throw new Error(`Пользователь "${userName}" не может положить в корзину товар "${product.title}" в количестве ${quantity} штук из магазина "${shop.title}", так как в магазине недостаточно этого товара.`);
                    }
                    break;
                }
            }
            if (!isProductExists) {
                throw new Error(`Товар "${product.title}" не найден в магазине "${shop.title}".`);
            }
        }

        // internal
        putOutProduct(userName, shop, product, quantity) {
            let isProductExists = false;
            for (let i = 0; i < this.cart.length; i++) {
                if (this.cart[i]['productId'] === product.id) {
                    isProductExists = true;
                    if (quantity <= this.cart[i]['quantity']) {

                        for (let j = 0; j < shop.catalog.length; j++) {
                            if (shop.catalog[j]['productId'] === product.id) {
                                this.cart[i]['quantity'] -= quantity;
                                shop.catalog[j]['quantityInCarts'] -= quantity;
                            }
                        }

                        console.log(`Пользователь "${userName}" выложил из корзины товар "${product.title}" в количестве ${quantity} штук в магазин "${shop.title}".`);
                        break;
                    } else {
                        throw new Error(`Пользователь "${userName}" не может выложить из корзины товар "${product.title}" в количестве ${quantity} штук в магазин "${shop.title}", так как в корзине пользователя меньшее количество товара, чем он хотел бы выложить.`);
                    }
                }
            }
            if (!isProductExists) {
                throw new Error(`Товар "${product.title}" не найден в корзине пользователя "${userName}".`);
            }
        }

        // internal
        async buyProducts(userName) {
            if (this.cart.length !== 0) {
                let unitCost = 0;
                let totalCost = 0;
                for (let i = 0; i < this.cart.length; i++) {
                    const product = await ProductNamespace.getInstanceById(this.cart[i]['productId']);
                    unitCost = product.price * this.cart[i]['quantity'];
                    totalCost += unitCost;
                }
                if (this.money >= totalCost) {
                    for (let i = 0; i < this.cart.length; i++) {
                        const product = await ProductNamespace.getInstanceById(this.cart[i]['productId']);
                        const shop = await ShopNamespace.getInstanceById(this.cart[i]['shopId']);
                        let producer = await ProducerNamespace.getInstanceByShopId(shop.id);
                        producer.money += product.price * this.cart[i]['quantity'];;
                        await producer.updateMoneyInDB();
                        for (let k = 0; k < shop.catalog.length; k++) {
                            if (this.cart[i]['productId'] === shop.catalog[k]['productId']) {
                                shop.catalog[k]['quantityInCarts'] -= this.cart[i]['quantity'];
                                shop.catalog[k]['totalQuantity'] -= this.cart[i]['quantity'];
                                break;
                            }
                        }
                        await shop.updateCatalogInDB();
                    }
                    let user = await UserNamespace.getInstanceByConsumerId(this.id);
                    await this.transferProductsFromCartToOwned(user);
                    this.money -= totalCost;
                    await this.updateMoneyInDB();
                    console.log(`Пользователь "${userName}" успешно оплатил все продукты из корзины за ${totalCost} рублей.`);
                } else {
                    throw new Error(`Пользователь "${userName}" не может оплатить все продукты из корзины за ${totalCost} рублей, так как сумма покупки больше, чем есть на счету для покупок у пользователя.`);
                }
            } else {
                throw new Error(`Невозможно совершить покупку, так как корзина пользователя "${userName}" пуста.`);
            }
        }

        async transferProductsFromCartToOwned(user) {
            let productId, quantity;
            for (let i = 0; i < this.cart.length; i++) {
                productId = this.cart[i]['productId'];
                quantity = this.cart[i]['quantity'];

                let isProductIncludes = false;
                for (let j = 0; j < user.ownedProducts.length; j++) {
                    if (user.ownedProducts[j]['productId'] === productId) {
                        isProductIncludes = true;
                        break;
                    }
                }
                if (!isProductIncludes) {
                    user.ownedProducts.push({ 'productId': productId, 'quantity': 0 });
                }

                for (let j = 0; j < user.ownedProducts.length; j++) {
                    if (user.ownedProducts[j]['productId'] === productId) {
                        user.ownedProducts[j]['quantity'] += quantity;
                        break;
                    }
                }
                this.cart[i]['quantity'] = 0;
            }
            // this.cart.splice(0, this.cart.length);
            await user.updateOwnedProductsInDB();
            await this.updateCartInDB();
        }

        async updateMoneyInDB() {
            const result = await PoolNamespace.pool.query(`
                UPDATE consumers
                SET
                    money = $1
                WHERE id = $2
                RETURNING *
            `, [this.money, this.id]);
            return result.rows[0];
        }

        async updateCartInDB() {
            let deleteResult;
            let insertResult;

            for (let i = 0; i < this.cart.length; i++) {
                deleteResult = await PoolNamespace.pool.query(
                    `
                        DELETE FROM consumer_to_product
                        WHERE
                            consumer_id = $1 AND
                            product_id = $2 AND
                            shop_id = $3
                    `,
                    [this.id, this.cart[i]['productId'], this.cart[i]['shopId']]
                );
            }

            for (let i = 0; i < this.cart.length; i++) {
                insertResult = await PoolNamespace.pool.query(
                    `
                        INSERT INTO consumer_to_product (consumer_id, product_id, shop_id, quantity)
                        VALUES ($1, $2, $3, $4);
                    `,
                    [this.id, this.cart[i]['productId'], this.cart[i]['shopId'], this.cart[i]['quantity']]
                );
            }

            for (let i = 0; i < this.cart.length; i++) {
                if (this.cart[i]['quantity'] === 0) {
                    deleteResult = await PoolNamespace.pool.query(
                        `
                            DELETE FROM consumer_to_product
                            WHERE
                                consumer_id = $1 AND
                                product_id = $2 AND
                                shop_id = $3
                        `,
                        [this.id, this.cart[i]['productId'], this.cart[i]['shopId']]
                    );
                    this.cart.splice(i, 1);
                    i--;
                }
            }
        }

        // async updateCartInDB() {
        //     let selectResult;
        //     let selectData;
        //     let result;

        //     for (let i = 0; i < this.cart.length; i++) {
        //         selectResult = await PoolNamespace.pool.query(
        //             `
        //                 SELECT * FROM consumer_to_product
        //                 WHERE
        //                     consumer_id = $1 AND
        //                     product_id = $2 AND
        //                     shop_id = $3
        //             `,
        //             [this.id, this.cart[i]['productId'], this.cart[i]['shopId']]
        //         );

        //         if (selectResult.rows.length > 0) {
        //             selectData = selectResult.rows[0];
        //             result = await PoolNamespace.pool.query(
        //                 `
        //                     UPDATE consumer_to_product
        //                     SET
        //                         quantity = $1
        //                     WHERE
        //                         consumer_id = $2 AND
        //                         product_id = $3 AND
        //                         shop_id = $4
        //                 `,
        //                 [this.cart[i]['quantity'], this.id, this.cart[i]['productId'], this.cart[i]['shopId']]
        //             );
        //         } else {
        //             result = await PoolNamespace.pool.query(
        //                 `
        //                     INSERT INTO consumer_to_product (consumer_id, product_id, shop_id, quantity) 
        //                     VALUES ($1, $2, $3, $4);
        //                 `,
        //                 [this.id, this.cart[i]['productId'], this.cart[i]['shopId'], this.cart[i]['quantity']]
        //             );
        //         }

        //         // if (this.cart[i]['quantity'] === 0) {
        //         //     this.cart.splice(i, 1);
        //         //     console.log(this.cart);

        //         //     // тут нужно ещё написать запрос на удаление записи из consumer_to_product, если quantity = 0
        //         // }

        //         // if (this.cart[i]['quantity'] === 0) {
        //         //     result = await PoolNamespace.pool.query(
        //         //         `
        //         //             DELETE FROM consumer_to_product
        //         //             WHERE
        //         //                 consumer_id = $1 AND
        //         //                 product_id = $2 AND
        //         //                 shop_id = $3
        //         //         `,
        //         //         [this.id, this.cart[i]['productId'], this.cart[i]['shopId']]
        //         //     );
        //         //     this.cart.splice(i, 1);
        //         // }
        //     }
        // }
    },

    async getInstanceById(consumerId) {
        const baseResult = await PoolNamespace.pool.query(
            'SELECT * FROM consumers WHERE id = $1',
            [consumerId]
        );

        const cartResults = await PoolNamespace.pool.query(
            `
                SELECT 
                    c.id AS consumer_id,
                    s.id AS shop_id,
                    cp.product_id,
                    cp.quantity
                FROM 
                    consumers c
                LEFT JOIN 
                    consumer_to_product cp ON c.id = cp.consumer_id
                LEFT JOIN 
                    shops s ON cp.shop_id = s.id
                WHERE 
                    c.id = $1
            `,
            [consumerId]
        );

        let cart = [];
        cartResults.rows.forEach(row => {
            if (row.shop_id && row.product_id && row.quantity) {
                cart.push({
                    shopId: row.shop_id,
                    productId: row.product_id,
                    quantity: row.quantity
                });
            }
        });

        const result = {
            ...baseResult.rows[0],
            cart: Object.values(cart)
        };
    
        let consumerInstance = new this.Consumer(result.id, result.money, result.cart);
        return consumerInstance;
    }
}

export default ConsumerNamespace;