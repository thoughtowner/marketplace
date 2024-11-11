import PoolNamespace from "./pool.js";

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

                        // let isShopIncludes = false;
                        // for (let j = 0; j < this.generalCart.length; j++) {
                        //     if (this.generalCart[j]['shopId'] === shop.id) {
                        //         isShopIncludes = true;
                        //         break;
                        //     }
                        // }
                        // if (!isShopIncludes) {
                        //     this.generalCart.push({ 'shopId': shop.id, 'cart': [] });
                        // }

                        // let isProductInShopIncludes = false;
                        // for (let j = 0; j < this.generalCart.length; j++) {
                        //     if (this.generalCart[j]['shopId'] === shop.id) {
                        //         for (let k = 0; k < this.generalCart[j]['cart'].length; k++) {
                        //             if (this.generalCart[j]['cart'][k]['productId'] === product.id) {
                        //                 isProductInShopIncludes = true;
                        //                 break;
                        //             }
                        //         }
                        //         if (!isProductInShopIncludes) {
                        //             this.generalCart[j]['cart'].push({ 'productId': product.id, 'quantity': 0 });
                        //         }
                        //     }
                        // }

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

                        // for (let j = 0; j < this.generalCart.length; j++) {
                        //     if (this.generalCart[j]['shopId'] === shop.id) {
                        //         for (let k = 0; k < this.generalCart[j]['cart'].length; k++) {
                        //             if (this.generalCart[j]['cart'][k]['productId'] === product.id) {
                        //                 this.generalCart[j]['cart'][k]['quantity'] += quantity;
                        //                 shop.catalog[i]['quantityInCarts'] += quantity;
                        //                 console.log(`Пользователь "${userName}" положил в корзину ${quantity} штук товара "${product.title}" из магазина "${shop.title}".`);
                        //                 break;
                        //             }
                        //         }
                        //         break;
                        //     }
                        // }

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
            for (let i = 0; i < this.generalCart.length; i++) {
                if (this.generalCart[i]['shopId'] === shop.id) {
                    for (let j = 0; j < this.generalCart[i]['cart'].length; j++) {
                        if (this.generalCart[i]['cart'][j]['productId'] === product.id) {
                            isProductExists = true;
                            if (quantity <= this.generalCart[i]['cart'][j]['quantity']) {
                                for (let k = 0; k < shop.catalog.length; k++) {
                                    if (shop.catalog[k]['productId'] === product.id) {
                                        this.generalCart[i]['cart'][j]['quantity'] -= quantity;
                                        shop.catalog[k]['quantityInCarts'] -= quantity;

                                        if (this.generalCart[i]['cart'][j]['quantity'] === 0) {
                                            this.generalCart[i]['cart'].splice(j, 1);
                                            if (this.generalCart[i]['cart'].length === 0) {
                                                this.generalCart.splice(i, 1);
                                            }
                                        }

                                        console.log(`Пользователь "${userName}" выложил из корзины товар "${product.title}" в количестве ${quantity} штук в магазин "${shop.title}".`);
                                        break;
                                    }
                                }
                            } else {
                                throw new Error(`Пользователь "${userName}" не может выложить из корзины товар "${product.title}" в количестве ${quantity} штук в магазин "${shop.title}", так как в корзине пользователя меньшее количество товара, чем он хотел бы выложить.`);
                            }
                            break;
                        }
                    }
                    break;
                }
            }
            if (!isProductExists) {
                throw new Error(`Товар "${product.title}" не найден в корзине пользователя "${userName}".`);
            }
        }

        // internal
        buyProducts(userName) {
            if (this.generalCart.length !== 0) {
                let unitCost = 0;
                let totalCost = 0;
                for (let i = 0; i < this.generalCart.length; i++) {
                    for (let j = 0; j < this.generalCart[i]['cart'].length; j++) {
                        unitCost = this.generalCart[i]['cart'][j]['productId'].price * this.generalCart[i]['cart'][j]['quantity'];
                        totalCost += unitCost;
                        this.generalCart[i]['shopId'].producer.money += unitCost;
                    }
                }
                if (this.money >= totalCost) {

                    for (let i = 0; i < this.generalCart.length; i++) {
                        for (let j = 0; j < this.generalCart[i]['cart'].length; j++) {
                            for (let k = 0; k < this.generalCart[i]['shopId'].catalog.length; k++) {
                                if (this.generalCart[i]['cart'][j]['productId'] === this.generalCart[i]['shopId'].catalog[k]['productId']) {
                                    this.generalCart[i]['shopId'].catalog[k]['quantityInCarts'] -= this.generalCart[i]['cart'][j]['quantity'];
                                    this.generalCart[i]['shopId'].catalog[k]['totalQuantity'] -= this.generalCart[i]['cart'][j]['quantity'];
                                }
                            }
                        }
                    }

                    this.user.transferProductsFromCartToOwned();
                    this.money -= totalCost;
                    console.log(`Пользователь "${userName}" успешно оплатил все продукты из корзины за ${totalCost} рублей.`);
                } else {
                    throw new Error(`Пользователь "${userName}" не может оплатить все продукты из корзины за ${totalCost} рублей, так как сумма покупки больше, чем есть на счету для покупок у пользователя.`);
                }
            } else {
                throw new Error(`Невозможно совершить покупку, так как корзина пользователя "${userName}" пуста.`);
            }
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

        async updateGeneralCartInDB() {
            let selectResult;
            let selectData;
            let result;

            for (let i = 0; i < this.cart.length; i++) {
                selectResult = await PoolNamespace.pool.query(
                    `
                        SELECT * FROM consumer_to_product
                        WHERE
                            consumer_id = $1 AND
                            product_id = $2 AND
                            shop_id = $3
                    `,
                    [this.id, this.cart[i]['productId'], this.cart[i]['shopId']]
                );

                if (selectResult.rows.length > 0) {
                    selectData = selectResult.rows[0];
                    result = await PoolNamespace.pool.query(
                        `
                            UPDATE consumer_to_product
                            SET
                                quantity = $1
                            WHERE
                                consumer_id = $2 AND
                                product_id = $3 AND
                                shop_id = $4
                        `,
                        [this.cart[i]['quantity'], this.id, this.cart[i]['productId'], this.cart[i]['shopId']]
                    );
                } else {
                    result = await PoolNamespace.pool.query(
                        `
                            INSERT INTO consumer_to_product (consumer_id, product_id, shop_id, quantity) 
                            VALUES ($1, $2, $3, $4);
                        `,
                        [this.id, this.cart[i]['productId'], this.cart[i]['shopId'], this.cart[i]['quantity']]
                    );
                }
            }
        }
    },

    // async getUserIdById(pool, consumerId) {
    //     const result = await pool.query(
    //         'SELECT user_id FROM consumers WHERE id = $1',
    //         [consumerId]
    //     );
    //     return result.rows[0].user_id;
    // },

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
            cart.push({
                shopId: row.shop_id,
                productId: row.product_id,
                quantity: row.quantity
            });
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