const UserNamespace = {
    User: class {
        constructor(name, password, isConsumer=null, isProducer=null) {
            this.isConsumer = isConsumer || false;
            this.isProducer = isProducer || false;
            this.name = name;
            this.password = password;
            this.boughtProducts = [];
        }

        // private
        checkRoleAffiliation(consumer=null, producer=null) {
            if (this.isConsumer) {
                if(consumer) {
                    if (this !== consumer.user) {
                        throw new Error(`Покупатель не соответствует пользователю "${this.name}", так как он привязан к другому пользователю.`);
                    }
                } else {
                    throw new Error(`Невозможно выполнить метод, так как пользователь не является продавцом.`);
                }
            }
            else if (this.isProducer) {
                if(producer) {
                    if (this !== producer.user) {
                        throw new Error(`Продавец не соответствует пользователю "${this.name}", так как он привязан к другому пользователю.`);
                    }
                } else {
                    throw new Error(`Невозможно выполнить метод, так как пользователь не является покупателем.`);
                }
            }
        }

        // private
        checkMoneyValue(money) {
            if (typeof money !== 'number') {
                throw new Error(`Тип значения <money> должно быть <number>, а не <${typeof money}>.`);
            } else {
                if (money < 0) {
                    throw new Error(`Значение <money> должно быть больше или равно нулю, а не ${money}.`);
                }
            }
        }

        // public
        addMoneyToConsumer(consumer, money) {
            this.checkRoleAffiliation(consumer);
            this.checkMoneyValue(money);
            consumer.addMoney(money);
            console.log(`Пользователь "${this.name}" положил на счёт для покупок ${money} рублей.`);
        }

        // public
        reduceMoneyFromProducer(producer, money) {
            this.checkRoleAffiliation(producer);
            this.checkMoneyValue(money);
            if (producer.money >= money) {
                producer.reduceMoney(money);
                console.log(`Пользователь "${this.name}" снял со счёта для продаж ${money} рублей.`);
            } else {
                throw new Error(`Пользователь "${this.name}" не может снять со счёта для продаж ${money} рублей, так как на счёте для продаж недостаточно средств для этого.`);
            }
        }

        // private
        buyProduct(generalCart) {
            for (let i = 0; i < generalCart.length; i++) {
                for (let j = 0; j < generalCart[i]['cart'].length; j++) {

                    // Добавляем данные инициализации для товара, если их нет.
                    let isProductIncludes = false;
                    for (let k = 0; k < this.boughtProducts.length; k++) {
                        if (this.boughtProducts[k]['product'] === product) {
                            isProductIncludes = true;
                            break;
                        }
                    }
                    if (!isProductIncludes) {
                        this.globalCart.push({ 'product': product, 'quantity': 0 });
                    }

                    // Добавляем товар к купленным товарам.
                    for (let k = 0; k < this.boughtProducts.length; k++) {
                        if (this.boughtProducts[k]['product'] === product) {
                            this.boughtProducts[k]['quantity'] += quantity;
                            break;
                        }
                    }
                }
            }
        }
    }
}

export default UserNamespace;