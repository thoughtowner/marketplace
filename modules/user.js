import ConsumerAccountNamespace from './consumerAccount.js';
import ProducerAccountNamespace from './producerAccount.js';

const UserNamespace = {
    User: class {
        constructor(name, password, role, title=null) {
            this.name = name;
            this.password = password;
            this.ownedProducts = [];
            if (role === 'consumerAccount') {
                this.consumerAccount = new ConsumerAccountNamespace.ConsumerAccount();
                this.producerAccount = null;
            } else if (role === 'producerAccount') {
                this.producerAccount = new ProducerAccountNamespace.ProducerAccount(title);
                this.consumerAccount = null;
            }
        }

        // private
        checkRoleAffiliation(role) {
            if (role === 'consumerAccount') {
                if (!this.consumerAccount) {
                    throw new Error(`Невозможно выполнить метод, так как пользователь не имеет счёта для покупок.`);
                }
            } else if (role === 'producerAccount') {
                if (!this.producerAccount) {
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
        addMoneyToConsumerAccount(money) {
            this.checkRoleAffiliation('consumerAccount');
            this.checkMoneyValue(money);
            this.consumerAccount.addMoney(this.name, money);
            console.log(`Пользователь "${userName}" положил на счёт для покупок ${money} рублей.`);
        }

        // public
        reduceMoneyFromProducerAccount(money) {
            this.checkRoleAffiliation('producerAccount');
            this.checkMoneyValue(money);
            if (this.producerAccount.money >= money) {
                this.producerAccount.reduceMoney(this.name, money);
                console.log(`Пользователь "${this.name}" снял со счёта для продаж ${money} рублей.`);
            } else {
                throw new Error(`Пользователь "${this.name}" не может снять со счёта для продаж ${money} рублей, так как на счёте для продаж недостаточно средств для этого.`);
            }
        }

        // public
        putProduct(shop, product, quantity) {
            this.checkRoleAffiliation('consumerAccount');
            this.checkQuantityValue(quantity);
            this.consumerAccount.putProduct(this.name, shop, product, quantity);
        }

        // public
        putOutProduct(shop, product, quantity) {
            this.checkRoleAffiliation('consumerAccount');
            this.checkQuantityValue(quantity);
            this.consumerAccount.putOutProduct(this.name, shop, product, quantity);
        }

        // internal
        transferProductsFromCartToOwned() {
            let product, quantity;
            for (let i = 0; i < this.consumerAccount.generalCart.length; i++) {
                for (let j = 0; j < this.consumerAccount.generalCart[i]['cart'].length; j++) {
                    product = this.consumerAccount.generalCart[i]['cart'][j]['product'];
                    quantity = this.consumerAccount.generalCart[i]['cart'][j]['quantity'];

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
            this.consumerAccount.generalCart.splice(0, this.generalCart.length);
        }

        // public
        buyProducts() {
            this.checkRoleAffiliation('consumerAccount');
            this.consumerAccount.buyProducts(this.name);
        }
    }
}

export default UserNamespace;