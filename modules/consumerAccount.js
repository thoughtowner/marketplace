const ConsumerAccountNamespace = {
    ConsumerAccount: class {
        constructor() {
            this.money = 0;
            this.generalCart = [];
        }

        // internal
        addMoney(money) {
            this.money += money;
        }

        // internal
        putProduct(userName, shop, product, quantity) {
            let isProductExists = false;
            for (let i = 0; i < shop.catalog.length; i++) {
                if (shop.catalog[i]['product'] === product) {
                    isProductExists = true;
                    if (quantity <= shop.catalog[i]['totalQuantity'] - shop.catalog[i]['quantityInCarts']) {

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

                        let isProductInShopIncludes = false;
                        for (let j = 0; j < this.generalCart.length; j++) {
                            if (this.generalCart[j]['shop'] === shop) {
                                for (let k = 0; k < this.generalCart[j]['cart'].length; k++) {
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

                        for (let j = 0; j < this.generalCart.length; j++) {
                            if (this.generalCart[j]['shop'] === shop) {
                                for (let k = 0; k < this.generalCart[j]['cart'].length; k++) {
                                    if (this.generalCart[j]['cart'][k]['product'] === product) {
                                        this.generalCart[j]['cart'][k]['quantity'] += quantity;
                                        shop.catalog[i]['quantityInCarts'] += quantity;
                                        console.log(`Пользователь "${userName}" положил в корзину ${quantity} штук товара "${product.title}" из магазина "${shop.title}".`);
                                        break;
                                    }
                                }
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
                if (this.generalCart[i]['shop'] === shop) {
                    for (let j = 0; j < this.generalCart[i]['cart'].length; j++) {
                        if (this.generalCart[i]['cart'][j]['product'] === product) {
                            isProductExists = true;
                            if (quantity <= this.generalCart[i]['cart'][j]['quantity']) {
                                for (let k = 0; k < shop.catalog.length; k++) {
                                    if (shop.catalog[k]['product'] === product) {
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
                        unitCost = this.generalCart[i]['cart'][j]['product'].price * this.generalCart[i]['cart'][j]['quantity'];
                        totalCost += unitCost;
                        this.generalCart[i]['shop'].producerAccount.money += unitCost;
                    }
                }
                if (this.money >= totalCost) {

                    for (let i = 0; i < this.generalCart.length; i++) {
                        for (let j = 0; j < this.generalCart[i]['cart'].length; j++) {
                            for (let k = 0; k < this.generalCart[i]['shop'].catalog.length; k++) {
                                if (this.generalCart[i]['cart'][j]['product'] === this.generalCart[i]['shop'].catalog[k]['product']) {
                                    this.generalCart[i]['shop'].catalog[k]['quantityInCarts'] -= this.generalCart[i]['cart'][j]['quantity'];
                                    this.generalCart[i]['shop'].catalog[k]['totalQuantity'] -= this.generalCart[i]['cart'][j]['quantity'];
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
    }
}

export default ConsumerAccountNamespace;