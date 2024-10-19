const ConsumerNamespace = {
    Consumer: class {
        constructor(name, money) {
            this.name = name || 'default_name';
            this.money = money || 0;
            this.products = [];
        }

        addMoney(money) {
            this.money += money;
            console.log(`Покупатель ${this.name} получил ${money} денег. Итого: ${this.money}`);
        }
    
        deductMoney(money) {
            if (money === this.money) {
                this.money = 0;
                console.log(`Покупатель ${this.name} отдал все деньги`);
                return true;
            } else if (money > this.money) {
                console.log(`Покупатель ${this.name} не может отдать ${money} денег, т.к. отдаваемое количество денег больше имеющегося (${this.money}) у покупателя`);
                return false;
            } else {
                this.money -= money;
                console.log(`Покупатель ${this.name} отдал ${money} денег. Итого: ${this.money}`);
                return true;
            }
        }
    
        // addProduct(shop, product, quantity) {
        //     if (AuxiliaryFunctionsNamespace.addSomeProductQuantity(this.products, 'корзина', product, quantity)) {
        //         shop.deleteSomeProductQuantity(product, quantity);
        //     }
        // }
    
        // deleteProduct(shop, product, quantity) {
        //     if (AuxiliaryFunctionsNamespace.deleteSomeProductQuantity(this.products, 'корзина', product, quantity)) {
        //         shop.addSomeProductQuantity(product, quantity);
        //     }
        // }
        
        putProduct(shop, product, quantity) {
            let isExists = false;
            for (let i = 0; i < shop.products.length; i++) {
                if (shop.products[i]['title'] === product.title) {
                    if (quantity > shop.products[i]['totalQuantity'] - shop.products[i]['quantityInBasket']) {
                        console.log(`Продукт ${product.title} в количестве ${quantity} штук невозможно положить в корзину, т.к. в магазине недостаточно товара для этого`);
                        return false;
                    }
                    isExists = true;
                    shop.products[i]['quantityInBasket'] += quantity;
                    
                    let isAlreadyPut = false;
                    for (let j = 0; j < this.products.length; j++) {
                        if (this.products[j]['title'] === product.title) {
                            isAlreadyPut = true;
                            this.products[j]['quantity'] += quantity;
                            console.log(`К имеющемуся продукту ${product.title} добавлено ${quantity} штук в корзину. Итого: ${this.products[i]['quantity']} штук`);
                            break;
                        }
                    }
                    if (!isAlreadyPut) {
                        this.products.push({ 'title': product.title, 'price': product.price, 'quantity': quantity });
                        console.log(`Новый продукт ${product.title} в количестве ${quantity} штук добавлен в корзину`);
                        break;
                    }
                }
            }
            if (!isExists) {
                console.log(`Продукт ${product.title} не найден в магазине`);
            }
            return true;
        }

        putOutProduct(shop, product, quantity) {
            let isExists = false;
            for (let i = 0; i < this.products.length; i++) {
                if (this.products[i]['title'] === product.title) {
                    if (quantity > this.products[i]['quantity']) {
                        console.log(`Продукт ${product.title} в количестве ${quantity} штук невозможно выложить из корзины, т.к. в корзине меньше товара, чем выкладываемого`);
                        return false;
                    }
                    isExists = true;
                    this.products[i]['quantity'] -= quantity;
                    for (let j = 0; j < shop.products.length; j++) {
                        if (shop.products[j]['title'] === product.title) {
                            shop.products[j]['quantityInBasket'] -= quantity;
                        }
                    }
                    console.log(`Продукт ${product.title} в количестве ${quantity} штук выложили из корзины`);
                    break;
                }
            }
            if (!isExists) {
                console.log(`Продукт ${product.title} не найден в корзине`);
                return false;
            }
            return true;
        }
    
        buyProducts(shop) {
            let totalCost = 0;
            for (let i = 0; i < this.products.length; i++) {
                totalCost += this.products[i]['price'] * this.products[i]['quantity'];
            }
            if (this.deductMoney(totalCost)) {
                for (let i = 0; i < this.products.length; i++) {
                    for (let j = 0; j < shop.products.length; j++) {
                        if (this.products[i]['title'] === shop.products[j]['title']) {
                            shop.products[j]['totalQuantity'] -= this.products[i]['quantity'];
                            shop.products[j]['quantityInBasket'] -= this.products[i]['quantity'];
                        }
                    }
                }
                this.products.splice(0, this.products.length);
                for (let i = 0; i < shop.products.length; i++) {
                    if (shop.products[i]['totalQuantity'] === 0) {
                        shop.products.splice(i, 1);
                        i--;
                    }
                }
                console.log('Покупка прошла успешно');
            } else {
                console.log('Покупка не выполнена');
            }
        }
    }
}

export default ConsumerNamespace;