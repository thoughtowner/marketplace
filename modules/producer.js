import ShopNamespace from './shop.js';
import PoolNamespace from "./pool.js";

const ProducerNamespace = {
    Producer: class {
        constructor(id, money, shopId) {
            this.id = id;
            this.money = money || 0;
            this.shopId = shopId;
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
        addProduct(product, quantity) {
            this.checkQuantityValue(quantity);
            let isProductIncludes = false;
            for (let i = 0; i < this.shop.catalog.length; i++) {
                if (this.shop.catalog[i]['product'] === product) {
                    isProductIncludes = true;
                    break;
                }
            }
            if (!isProductIncludes) {
                this.shop.catalog.push({ 'product': product, 'totalQuantity': 0, 'quantityInCarts': 0 });
            }

            for (let i = 0; i < this.shop.catalog.length; i++) {
                if (this.shop.catalog[i]['product'] === product) {
                    this.shop.catalog[i]['totalQuantity'] += quantity;
                    console.log(`Пользователь "${this.user.name}" добавил в магазин "${this.shop.title}" ${quantity} штук товара "${product.title}".`);
                    break;
                }
            }
        }

        // public
        reduceProduct(product, quantity) {
            this.checkQuantityValue(quantity);
            let isProductExists = false;
            for (let i = 0; i < this.shop.catalog.length; i++) {
                if (this.shop.catalog[i]['product'] === product) {
                    isProductExists = true;
                    if (quantity <= this.shop.catalog[i]['totalQuantity'] - this.shop.catalog[i]['quantityInCarts']) {
                        this.shop.catalog[i]['totalQuantity'] -= quantity;
                        console.log(`Пользователь "${this.user.name}" уменьшил в магазине "${this.shop.title}" количество товара "${product.title}" на ${quantity} штук.`);
                        break;
                    } else {
                        throw new Error(`Пользователь "${this.user.name}" не может уменьшить в магазине "${this.shop.title}" количество товара "${product.title}" на ${quantity} штук, так как количетсво товара в магазине меньше, чем уменьшаемого количества.`);
                    }
                }
            }
            if (!isProductExists) {
                throw new Error(`Товар "${product.title}" не найден в магазине "${this.shop.title}".`);
            }
        }

        // public
        deleteProduct(product) {
            let isProductExists = false;
            for (let i = 0; i < this.shop.catalog.length; i++) {
                if (this.shop.catalog[i]['product'] === product) {
                    isProductExists = true;
                    if (this.shop.catalog[i]['totalQuantity'] === 0) {
                        this.shop.catalog.splice(i, 1);
                        console.log(`Пользователь "${this.user.name}" удалил из магазина "${this.shop.title}" товар "${product.title}".`);
                        break;
                    } else {
                        throw new Error(`Пользователь "${this.user.name}" не может удалить из магазина "${this.shop.title}" товар "${product.title}", так как он ещё не закончился.`);
                    }
                }
            }
            if (!isProductExists) {
                throw new Error(`Товар "${product.title}" не найден в магазине "${this.shop.title}".`);
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

    async getInstanceById(pool, producerId) {
        const producerResult = await pool.query(
            'SELECT * FROM producers WHERE id = $1 LIMIT 1',
            [producerId]
        );

        const shopResult = await pool.query(
            'SELECT * FROM shops WHERE producer_id = $1',
            [producerId]
        );

        const producerData = producerResult.rows[0];
        const shopData = shopResult.rows[0];
    
        return new this.Producer(producerData.id, producerData.money, shopData.id);;
    }
}

export default ProducerNamespace;