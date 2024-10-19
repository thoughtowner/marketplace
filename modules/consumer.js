const ConsumerNamespace = {
    Consumer: class {
        constructor(name, money, products) {
            this.name = name;
            this.money = money || 0;
            this.products = products || [];
        }
        
        addMoney(money) {
            this.money += money;
            console.log(`Покупатель ${this.name} получил ${money} денег. Итого: ${this.money} денег`);
        }

        putProduct(product, quantity) {
            let isAlreadyPurchased = false;
            for (let i = 0; i < this.products.length; i++) {
                if (this.products[i]['product'].title === product.title) {
                    isAlreadyPurchased = true;
                    this.products[i]['quantity'] += quantity;
                    break;
                }
            }
            if (!isAlreadyPurchased) {
                this.products.push({ 'product': product, 'quantity': quantity });
            }
        }
    }
}

export default ConsumerNamespace;