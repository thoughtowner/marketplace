import ConsumerNamespace from "./consumer.js";
import ProducerNamespace from "./producer.js";
import PoolNamespace from "./pool.js";
import ProductNamespace from "./product.js";


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
        constructor(id, name, password, role, roleId) {
            this.id = id;
            this.name = name;
            this.password = password;
            this.ownedProducts = [];
            if (role === 'consumer') {
                this.consumerId = roleId;
                this.producerId = null;
            } else if (role === 'producer') {
                this.producerId = roleId;
                this.consumerId = null;
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
            } else {
                throw new Error(`Невозможно выполнить метод, так как введена неверная роль.`);
            }
        }

        // public
        async addMoneyToConsumer(money) {
            this.checkRoleAffiliation('consumer');
            checkMoneyValue(money);
            let consumer = await ConsumerNamespace.getInstanceById(PoolNamespace.pool, this.consumerId);
            consumer.addMoney(money);
            consumer.updateMoneyInDB();
            console.log(`Пользователь "${this.name}" положил на счёт для покупок ${money} рублей.`);
        }

        // public
        async reduceMoneyFromProducer(money) {
            this.checkRoleAffiliation('producer');
            checkMoneyValue(money);
            let producer = await ProducerNamespace.getInstanceById(PoolNamespace.pool, this.producerId);
            if (producer.money >= money) {
                producer.reduceMoney(money);
                producer.updateMoneyInDB();
                console.log(`Пользователь "${this.name}" снял со счёта для продаж ${money} рублей.`);
            } else {
                throw new Error(`Пользователь "${this.name}" не может снять со счёта для продаж ${money} рублей, так как на счёте для продаж недостаточно средств для этого.`);
            }
        }

        // public
        putProduct(shop, product, quantity) {
            this.checkRoleAffiliation('consumer');
            checkQuantityValue(quantity);
            this.consumerId.putProduct(this.name, shop, product, quantity);
        }

        // public
        putOutProduct(shop, product, quantity) {
            this.checkRoleAffiliation('consumer');
            checkQuantityValue(quantity);
            this.consumerId.putOutProduct(this.name, shop, product, quantity);
        }

        // internal
        transferProductsFromCartToOwned() {
            let product, quantity;
            for (let i = 0; i < this.consumerId.generalCart.length; i++) {
                for (let j = 0; j < this.consumerId.generalCart[i]['cart'].length; j++) {
                    product = this.consumerId.generalCart[i]['cart'][j]['product'];
                    quantity = this.consumerId.generalCart[i]['cart'][j]['quantity'];

                    let isProductIncludes = false;
                    for (let k = 0; k < this.ownedProducts.length; k++) {
                        if (this.ownedProducts[k]['product'] === product) {
                            isProductIncludes = true;
                            break;
                        }
                    }
                    if (!isProductIncludes) {
                        this.ownedProducts.push({ 'product': product, 'quantity': 0 });
                    }

                    for (let k = 0; k < this.ownedProducts.length; k++) {
                        if (this.ownedProducts[k]['product'] === product) {
                            this.ownedProducts[k]['quantity'] += quantity;
                            break;
                        }
                    }
                }
            }
            this.consumerId.generalCart.splice(0, this.generalCart.length);
        }

        // public
        buyProducts() {
            this.checkRoleAffiliation('consumer');
            this.consumerId.buyProducts(this.name);
        }
    },

    // async getInstanceById(pool, userId) {
    //     const result = await pool.query(
    //         'SELECT * FROM users WHERE id = $1',
    //         [userId]
    //     );
    //     const userData = result.rows[0];
    //     const userInstance = new this.User(userData.id, userData.name, userData.password, userData.role, userData.roleId);
    //     return userInstance;
    // }

    async getInstanceById(pool, userId) {
        try {
            // Сначала проверяем, существует ли пользователь с таким ID
            const userResult = await pool.query(
                'SELECT * FROM users WHERE id = $1',
                [userId]
            );
    
            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }
    
            const userData = userResult.rows[0];

            // Затем определяем роль пользователя (продавец или покупатель)
            let role;
            let roleId;

            const consumerResult = await pool.query(
                'SELECT * FROM consumers WHERE user_id = $1',
                [userId]
            );

            const producerResult = await pool.query(
                'SELECT * FROM producers WHERE user_id = $1',
                [userId]
            );

            if (consumerResult.rows.length > 0) {
                role = 'consumer';
                roleId = consumerResult.rows[0].id;
            } else if (producerResult.rows.length > 0) {
                role = 'producer';
                roleId = producerResult.rows[0].id;
            }
    
            // if (await this.isUserProducer(pool, userId)) {
            //     role = 'producer';
            //     roleId = await this.getRoleIdByUserId(pool, userId);
            // } else if (await this.isUserConsumer(pool, userId)) {
            //     role = 'consumer';
            //     roleId = await this.getRoleIdByUserId(pool, userId);
            // } else {
            //     throw new Error('User is neither producer nor consumer');
            // }
    
            // Создаем экземпляр пользователя с учетом роли
            const userInstance = new this.User(
                userData.id,
                userData.name,
                userData.password,
                role,
                roleId
            );
    
            return userInstance;
        } catch (error) {
            console.error('Error in getInstanceById:', error);
            throw error;
        }
    },
    
    // Дополнительные вспомогательные методы
    
    async isUserProducer(pool, userId) {
        const result = await pool.query(
            'SELECT 1 FROM producers WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        return result.rowCount > 0;
    },
    
    async isUserConsumer(pool, userId) {
        const result = await pool.query(
            'SELECT 1 FROM consumers WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        return result.rowCount > 0;
    },
    
    async getRoleIdByUserId(pool, userId) {
        const result = await pool.query(
            'SELECT CASE WHEN EXISTS (SELECT 1 FROM producers WHERE user_id = $1) THEN 1 ELSE 2 END AS role_id FROM users WHERE id = $1',
            [userId]
        );
        console.log(result.rows[0].role_id);
        return result.rows[0].role_id;
    },
}

export default UserNamespace;