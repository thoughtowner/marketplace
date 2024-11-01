const ConsumerNamespace = {
    Consumer: class {
        constructor(user) {
            this.user = user;
            this.money = 0;
            this.generalCart = [];
        }

        // private
        checkQuantityValue(quantity) {
            if (typeof quantity !== 'number') {
                throw new Error(`Тип значения <quantity> должно быть <number>, а не <${typeof quantity}>.`);
            } else {
                if (quantity <= 0) {
                    throw new Error(`Значение <quantity> должно быть больше нуля, а не ${quantity}.`);
                }
            }
        }

        // private
        addMoney(money) {
            this.money += money;
        }

        // public
        putProduct(shop, product, quantity) {
            this.checkQuantityValue(quantity);
            let isProductExists = false;
            for (let i = 0; i < shop.catalog.length; i++) {
                if (shop.catalog[i]['product'] === product) {
                    isProductExists = true;
                    if (quantity <= shop.catalog[i]['totalQuantity'] - shop.catalog[i]['quantityInCart']) {

                        // Добавляем данные инициализации для магазина, если их нет.
                        let isShopIncludes = false;
                        for (let j = 0; j < this.generalCart.length; j++) {
                            if (this.generalCart[j]['shop'] === shop) {
                                isShopIncludes = true;
                                break;
                            }
                        }
                        if (!isShopIncludes) {
                            this.generalCart.push({ 'shop': shop, 'cart': [] });
                        }

                        // Добавляем данные инициализации для товара, если их нет.
                        let isProductInShopIncludes = false;
                        for (let j = 0; j < this.generalCart.length; j++) {
                            if (this.generalCart[j]['shop'] === shop) {
                                for (let k = 0; k < this.generalCart[j]['cart']; k++) {
                                    if (this.generalCart[j]['cart'][k]['product'] === product) {
                                        isProductInShopIncludes = true;
                                        break;
                                    }
                                }
                                if (!isProductInShopIncludes) {
                                    this.generalCart[j]['cart'].push({ 'product': product, 'quantity': 0 });
                                }
                            }
                        }

                        // Добавляем товар в корзину.
                        for (let j = 0; j < this.generalCart.length; j++) {
                            if (this.generalCart[j]['shop'] === shop) {
                                for (let k = 0; k < this.generalCart[j]['cart']; k++) {
                                    if (this.generalCart[j]['cart'][k]['product'] === product) {
                                        this.generalCart[j]['cart'][k]['quantity'] += quantity;
                                        shop.catalog[i]['quantityInCart'] += quantity;
                                        console.log(`Пользователь "${this.user.name}" положил в корзину ${quantity} штук товара "${product.title}" из магазина "${shop.title}".`);
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                    } else {
                        throw new Error(`Пользователь "${this.user.name}" не может положить в корзину товар "${product.title}" в количестве ${quantity} штук из магазина "${shop.title}", так как в магазине недостаточно этого товара.`);
                    }
                    break;
                }
            }
            if (!isProductExists) {
                throw new Error(`Товар "${product.title}" не найден в магазине "${shop.title}".`);
            }
        }

        // public
        putOutProduct(shop, product, quantity) {
            this.checkQuantityValue(quantity);
            let isProductExists = false;
            for (let i = 0; i < this.generalCart.length; i++) {
                if (this.generalCart[i]['shop'] === shop) {
                    for (let j = 0; j < this.generalCart[i]['cart'].length; j++) {
                        if (this.generalCart[i]['cart'][j]['product'] === product) {
                            isProductExists = true;
                            if (quantity <= this.generalCart[i]['cart'][j]['quantity']) {
                                for (let k = 0; k < shop.catalog.length; k++) {
                                    if (shop.catalog[k]['product'] === product) {
                                        this.generalCart[i]['cart'][j]['quantity'] -= quantity;
                                        shop.catalog[k]['quantityInCart'] -= quantity;

                                        // Удаляем продукт из корзины, если его quantity равно 0 и удаляем корзину, если в ней нет продуктов.
                                        if (this.generalCart[i]['cart'][j]['quantity'] === 0) {
                                            this.generalCart[i]['cart'].splice(j, 1);
                                            if (this.generalCart[i]['cart'].length === 0) {
                                                this.generalCart.splice(i, 1);
                                            }
                                        }

                                        console.log(`Пользователь "${this.user.name}" выложил из корзины товар "${product.title}" в количестве ${quantity} штук в магазин "${shop.title}".`);
                                        break;
                                    }
                                }
                            } else {
                                throw new Error(`Пользователь "${this.user.name}" не может выложить из корзины товар "${product.title}" в количестве ${quantity} штук в магазин "${shop.title}", так как в корзине пользователя меньшее количество товара, чем он хотел бы выложить.`);
                            }
                            break;
                        }
                    }
                    break;
                }
            }
            if (!isProductExists) {
                throw new Error(`Товар "${product.title}" не найден в корзине пользователя "${this.user.name}".`);
            }
        }

        // public
        buyProducts() {
            let totalCost = 0;
            for (let i = 0; i < this.generalCart.length; i++) {
                for (let j = 0; j < this.generalCart[i]['cart'].length; j++) {
                    totalCost += this.generalCart[i]['cart'][i]['product'].price * this.generalCart[i]['cart'][i]['quantity'];
                }
            }
            if (this.money >= totalCost) {
                for (let i = 0; i < this.generalCart.length; i++) {
                    for (let j = 0; j < this.generalCart[i]['cart'].length; j++) {
                        for (let k = 0; k < this.generalCart[i]['shop'].catalog.length; k++) {
                            if (this.generalCart[i]['cart'][i]['product'] === this.generalCart[i]['shop'].catalog[k]['product']) {
                                this.generalCart[i]['shop'].catalog[k]['quantityInCart'] -= this.generalCart[i]['cart'][i]['quantity'];
                                this.generalCart[i]['shop'].catalog[k]['totalQuantity'] -= this.generalCart[i]['cart'][i]['quantity'];
                            }
                        }
                    }
                }

                // Мы здесь не удаляем продукты из магазина, если их quantity равно 0,
                // т.к. эта логика должна выполняться только в producer (плохо, когда товары продавца удаляются без его ведома).

                this.user.buyProduct(this.generalCart);
                this.generalCart.splice(0, this.generalCart.length);
                console.log(`Все товары из корзины успешно куплены. Пользователь "${this.user.name}" заплатил ${totalCost} рублей.`);
            } else {
                throw new Error(`Товары из корзины не удалось купить. Пользователь "${this.user.name}" не смог заплатить ${totalCost} рублей магазину, так как сумма покупки больше, чем есть на счету для покупок у пользователя.`);
            }
        }
    }
}

export default ConsumerNamespace;