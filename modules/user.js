import ConsumerNamespace from "./consumer.js";
import PoolNamespace from "./pool.js";

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

        // private
        checkMoneyValue(money) {
            if (typeof money !== 'number') {
                throw new Error(`Тип значения <money> должно быть <number>.`);
            } else {
                if (money < 0) {
                    throw new Error(`Значение <money> должно быть больше или равно нулю.`);
                }
            }
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

        // public
        addMoneyToConsumer(money) {
            this.checkRoleAffiliation('consumer');
            this.checkMoneyValue(money);
            let consumer = ConsumerNamespace.findById(PoolNamespace.getTestPool(), this.consumerId);
            consumer.addMoney(money);
            console.log(`Пользователь "${userName}" положил на счёт для покупок ${money} рублей.`);
        }

        // public
        reduceMoneyFromProducer(money) {
            this.checkRoleAffiliation('producer');
            this.checkMoneyValue(money);
            if (this.producerId.money >= money) {
                this.producerId.reduceMoney(money);
                console.log(`Пользователь "${this.name}" снял со счёта для продаж ${money} рублей.`);
            } else {
                throw new Error(`Пользователь "${this.name}" не может снять со счёта для продаж ${money} рублей, так как на счёте для продаж недостаточно средств для этого.`);
            }
        }

        // public
        putProduct(shop, product, quantity) {
            this.checkRoleAffiliation('consumer');
            this.checkQuantityValue(quantity);
            this.consumerId.putProduct(this.name, shop, product, quantity);
        }

        // public
        putOutProduct(shop, product, quantity) {
            this.checkRoleAffiliation('consumer');
            this.checkQuantityValue(quantity);
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

    async findById(pool, userId) {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [userId]
        );
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        return null;
    }
}

export default UserNamespace;