const ShopNamespace = {
    Shop: class {
        constructor() {
            this.products = [];
        }
        
        addProduct(product, quantity) {
            let isAlreadyAdded = false;
            for (let i = 0; i < this.products.length; i++) {
                if (this.products[i]['title'] === product.title) {
                    isAlreadyAdded = true;
                    this.products[i]['totalQuantity'] += quantity;
                    console.log(`К имеющемуся продукту ${product.title} добавлено ${quantity} штук в магазине. Итого: ${this.products[i]['totalQuantity']} штук`);
                    break;
                }
            }
            if (!isAlreadyAdded) {
                this.products.push({ 'title': product.title, 'totalQuantity': quantity, 'quantityInBasket': 0 });
                console.log(`Новый продукт ${product.title} в количестве ${quantity} штук добавлен в магазин`);
            }
            return true;
        }
    
        deleteProduct(product, quantity) {
            let isExists = false;
            for (let i = 0; i < this.products.length; i++) {
                if (this.products[i]['title'] === product.title) {
                    if (quantity > this.products[i]['totalQuantity'] - this.products[i]['quantityInBasket']) {
                        console.log(`Продукт ${product.title} в количестве ${quantity} штук невозможно удалить из магазина, т.к. в магазине меньше товара, чем удаляемого`);
                        return false;
                    }
                    isExists = true;
                    this.products[i]['totalQuantity'] -= quantity;
                    console.log(`Продукт ${product.title} в количестве ${quantity} штук удалили из магазина`);
                    break;
                }
            }
            if (!isExists) {
                console.log(`Продукт ${product.title} не найден в магазине`);
                return false;
            }
            return true;
        }
    }
}

export default ShopNamespace;