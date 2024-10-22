const UserNamespace = {
    User: class {
        constructor(username, password) {
            this.username = username;
            this.password = password;
            this.boughtProducts = [];
        }

        buyProducts(consumer) {
            // this.boughtProducts = consumer.cart.slice();
            
            let isAlreadyBought = false;
            for (let i = 0; i < consumer.cart.length; i++) {
                for (let j = 0; j < this.boughtProducts.length; j++) {
                    if (consumer.cart[i]['product'].title === this.boughtProducts[j]['product'].title) {
                        this.boughtProducts[j]['quantity'] += consumer.cart[i]['quantity'];
                        isAlreadyBought = true;
                        break;
                    }
                }
                if (!isAlreadyBought) {
                    this.boughtProducts.push({ 'product': consumer.cart[i]['product'], 'quantity': consumer.cart[i]['quantity'] });
                }
            }
            console.log(`Все купленные покупателем "${this.name}" товары переданы пользователю "${user.username}".`);
        }
    }
}

export default UserNamespace;