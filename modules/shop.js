const ShopNamespace = {
    name: null,
    catalog: null,

    addProduct(product, quantity) {
        let isAlreadyAdded = false;
        for (let i = 0; i < this.catalog.length; i++) {
            if (this.catalog[i]['product'].title === product.title) {
                this.catalog[i]['totalQuantity'] += quantity;
                isAlreadyAdded = true;
                console.log(`В магазин "${this.name}" добавлено ещё ${quantity} штук товара "${product.title}".`);
                break;
            }
        }
        if (!isAlreadyAdded) {
            this.catalog.push({ 'product': product, 'totalQuantity': quantity, 'quantityInCart': 0 });
            console.log(`В магазин "${this.name}" добавлено ${quantity} штук нового товара "${product.title}".`);
        }
    },

    removeProduct(product, quantity) {
        let isExists = false;
        for (let i = 0; i < this.catalog.length; i++) {
            if (this.catalog[i]['product'].title === product.title) {
                if (quantity > this.catalog[i]['totalQuantity'] - this.catalog[i]['quantityInCart']) {
                    throw new Error(`Из магазина "${this.name}" невозможно удалить ${quantity} штук товара "${product.title}", так как количетсво товара в магазине меньше чем удаляемого количества.`);
                }
                this.catalog[i]['totalQuantity'] -= quantity;
                isExists = true;
                console.log(`Из магазина "${this.name}" удалено ${quantity} штук товара "${product.title}".`);
                break;
            }
        }
        if (!isExists) {
            throw new Error(`В магазине "${this.name}" не найден товар "${product.title}".`);
        }
    }
};

export default ShopNamespace;