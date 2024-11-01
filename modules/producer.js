const ProducerNamespace = {
    Producer: class {
        constructor(user) {
            this.user = user;
            this.money = 0;
        }

        // private
        checkShopAffiliation(shop) {
            if (this !== shop.producer) {
                throw new Error(`Магазин не соответствует пользователю "${this.user.name}", так как он привязан к другому пользователю.`);
            }
        }

        // private
        reduceMoney(money) {
            this.money -= money;
        }

        // public
        addProduct(shop, product, quantity) {
            let isProductIncludes = false;
            for (let i = 0; i < shop.catalog.length; i++) {
                if (shop.catalog[i]['product'] === product) {
                    isProductIncludes = true;
                    break;
                }
            }
            if (!isProductIncludes) {
                shop.catalog.push({ 'product': product, 'totalQuantity': 0, 'quantityInCart': 0 });
            }

            for (let i = 0; i < shop.catalog.length; i++) {
                if (shop.catalog[i]['product'] === product) {
                    shop.catalog[i]['totalQuantity'] += quantity;
                    console.log(`Пользователь "${this.user.name}" добавил в магазин "${shop.title}" ${quantity} штук товара "${product.title}".`);
                    break;
                }
            }
        }

        // public
        reduceProduct(shop, product, quantity) {
            let isProductExists = false;
            for (let i = 0; i < shop.catalog.length; i++) {
                if (shop.catalog[i]['product'] === product) {
                    isProductExists = true;
                    if (quantity <= this.catalog[i]['totalQuantity'] - this.catalog[i]['quantityInCart']) {
                        shop.catalog[i]['totalQuantity'] -= quantity;
                        console.log(`Пользователь "${this.user.name}" уменьшил в магазине "${shop.title}" количество товара "${product.title}" на ${quantity} штук.`);
                        break;
                    } else {
                        throw new Error(`Пользователь "${this.user.name}" не может уменьшить в магазине "${shop.title}" количество товара "${product.title}" на ${quantity} штукб так как количетсво товара в магазине меньше, чем уменьшаемого количества.`);
                    }
                }
            }
            if (!isProductExists) {
                throw new Error(`Товар "${product.title}" не найден в магазине "${shop.title}".`);
            }
        }

        // public
        deleteProduct(shop, product) {
            let isProductExists = false;
            for (let i = 0; i < shop.catalog.length; i++) {
                if (shop.catalog[i]['product'] === product) {
                    isProductExists = true;
                    if (shop.catalog[i]['quantity'] === 0) {
                        shop.catalog.splice(i, 1);
                        console.log(`Пользователь "${this.user.name}" удалил из магазина "${shop.title}" товар "${product.title}".`);
                        break;
                    } else {
                        throw new Error(`Пользователь "${this.user.name}" не может удалить из магазина "${shop.title}" товар "${product.title}", так как он ещё не закончился.`);
                    }
                }
            }
            if (!isProductExists) {
                throw new Error(`Товар "${product.title}" не найден в магазине "${shop.title}".`);
            }
        }
    }
}

export default ProducerNamespace;