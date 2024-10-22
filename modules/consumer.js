const ConsumerNamespace = {
    Consumer: class {
        constructor(name) {
            this.name = name;
            this.money = 0;
            this.cart = [];
        }

        checkMoneyValue(money) {
            if (typeof money !== 'number') {
                throw new Error('Значение money должно быть числом.');
            } else {
                if (money < 0) {
                    throw new Error('Значение money должно быть больше или равно нулю.');
                }
            }
        }

        checkQuantityValue(quantity) {
            if (typeof quantity !== 'number') {
                throw new Error('Значение quantity должно быть числом.');
            } else {
                if (quantity <= 0) {
                    throw new Error('Значение money должно быть больше нуля.');
                }
            }
        }

        addMoney(money) {
            this.checkMoneyValue(money);
            this.money += money;
            console.log(`На счёт покупателя "${this.name}" положено ${money} рублей.`);
        }

        putProduct(shop, product, quantity) {
            this.checkQuantityValue(quantity);
            let isExists = false;
            for (let i = 0; i < shop.catalog.length; i++) {
                if (shop.catalog[i]['product'].title === product.title) {
                    if (quantity > shop.catalog[i]['totalQuantity'] - shop.catalog[i]['quantityInCart']) {
                        throw new Error(`Покупатель "${this.name}" не может положить в корзину товар "${product.title}" в количестве ${quantity} штук из магазина "${shop.name}", так как в магазине не достаточно этого товара (${shop.catalog[i]['totalQuantity'] - shop.catalog[i]['quantityInCart']} штук).`);
                    }
                    shop.catalog[i]['quantityInCart'] += quantity;
                    isExists = true;
                    
                    let isAlreadyPutted = false;
                    for (let j = 0; j < this.cart.length; j++) {
                        if (this.cart[j]['product'].title === product.title) {
                            this.cart[j]['quantity'] += quantity;
                            isAlreadyPutted = true;
                            console.log(`Покупатель "${this.name}" положил в корзину ещё ${quantity} штук товара "${product.title}" из магазина "${shop.name}".`);
                            break;
                        }
                    }
                    if (!isAlreadyPutted) {
                        this.cart.push({ 'product': product, 'quantity': quantity });
                        console.log(`Покупатель "${this.name}" положил новый товар "${product.title}" в количестве ${quantity} штук в корзину из магазина "${shop.name}".`);
                        break;
                    }
                }
            }
            if (!isExists) {
                throw new Error(`Товар "${product.title}" не найден в магазине "${shop.name}".`);
            }
        }

        putOutProduct(shop, product, quantity) {
            let isExists = false;
            for (let i = 0; i < this.cart.length; i++) {
                if (this.cart[i]['product'].title === product.title) {
                    if (quantity > this.cart[i]['quantity']) {
                        throw new Error(`Покупатель "${this.name}" не может выложить из корзины товар "${product.title}" в количестве ${quantity} штук в магазин "${shop.name}", так как в корзине покупателя меньшее количество товара (${this.cart[i]['quantity']} штук) чем он хотел бы выложить.`);
                    }
                    this.cart[i]['quantity'] -= quantity;
                    isExists = true;

                    for (let j = 0; j < shop.catalog.length; j++) {
                        if (shop.catalog[j]['product'].title === product.title) {
                            shop.catalog[j]['quantityInCart'] -= quantity;
                        }
                    }
                    console.log(`Покупатель "${this.name}" выложил из корзины товар "${product.title}" в количестве ${quantity} штук в магазин "${shop.name}".`);
                    break;
                }
            }
            if (!isExists) {
                throw new Error(`Товар "${product.title}" не найден в корзине покупателя "${this.name}".`);
            }
        }

        buyProducts(shop, user) {
            let totalCost = 0;
            for (let i = 0; i < this.cart.length; i++) {
                totalCost += this.cart[i]['product'].price * this.cart[i]['quantity'];
            }
            if (this.money >= totalCost) {
                this.money -= totalCost;

                user.buyProducts(this);

                for (let i = 0; i < this.cart.length; i++) {
                    for (let j = 0; j < shop.catalog.length; j++) {
                        shop.catalog[j]['totalQuantity'] -= this.cart[i]['quantity'];
                        shop.catalog[j]['quantityInCart'] -= this.cart[i]['quantity'];
                    }
                }
                this.cart.splice(0, this.cart.length);
                for (let i = shop.catalog.length - 1; i >= 0; i--) {
                    if (shop.catalog[i]['totalQuantity'] === 0) {
                        shop.catalog.pop();
                    }
                }
                console.log(`Все товары из корзины были успешно куплены. Покупатель "${this.name}" заплатил ${totalCost} заплатил магазину "${shop.name}".`);
            } else {
                throw new Error(`Товары из корзины не удалось купить. Покупатель "${this.name}" не может заплатить ${totalCost} рублей магазину "${shop.name}", так как сумма покупки больше, чем есть на счету у покупателя (${this.money} рублей).`);
            }
        }
    }
}

export default ConsumerNamespace;