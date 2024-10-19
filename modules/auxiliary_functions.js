const AuxiliaryFunctionsNamespace = {
    addSomeProductQuantity(entityProducts, storageName, product, quantity) {
        let isAlreadyAdded = false;
        for (let i = 0; i < entityProducts.length; i++) {
            if (entityProducts[i]['title'] === product.title) {
                if (storageName === 'корзина') {
                    if (quantity > entityProducts[i]['totalQuantity'] - entityProducts[i]['quantityInBasket']) {
                        console.log(`Продукт ${product.title} в количестве ${quantity} штук невозможно положить в корзину, т.к. в магазине недостаточно товара для этого`);
                        return false;
                    } else {
                        entityProducts[i]['quantityInBasket'] += quantity;
                    }
                }
                entityProducts[i]['totalQuantity'] += quantity;
                isAlreadyAdded = true;
                console.log(`К имеющемуся продукту ${product.title} добавлено ${quantity} штук в ${storageName}(_/у). Итого: ${entityProducts[i]['totalQuantity']} штук`);
                break;
            }
        }
        if (!isAlreadyAdded) {
            entityProducts.push({ 'title': product.title, 'totalQuantity': quantity, 'quantityInBasket': 0 });
            console.log(`Новый продукт ${product.title} в количестве ${quantity} штук добавлен в ${storageName}(_/у)`);
        }
        return true;
    },

    deleteSomeProductQuantity(entityProducts, storageName, product, quantity) {
        let isExists = false;
        for (let i = 0; i < entityProducts.length; i++) {
            if (entityProducts[i]['title'] === product.title) {
                isExists = true;
                if (storageName === 'магазин') {
                    entityProducts[i]['quantityInBasket'] -= quantity;
                }
                if (quantity === entityProducts[i]['totalQuantity']) {
                    entityProducts.splice(i, 1);
                    console.log(`Всё количество продукта ${product.title} удалено из ${storageName}(ы/а)`);
                    return true;
                } else if (quantity > entityProducts[i]['totalQuantity']) {
                    console.log(`Невозможно удалить ${quantity} штук продукта ${product.title}, т.к. удаляемое количество продукта больше имеющегося (${entityProducts[i]['quantity']}) в ${storageName}е`);
                    return false;
                } else {
                    entityProducts[i]['totalQuantity'] -= quantity;
                    console.log(`Продукт ${product.title} в количестве ${quantity} удален из ${storageName}(ы/а). Итого: ${entityProducts[i]['totalQuantity']} штук`);
                    return true;
                }
            }
        }
        if (!isExists) {
            console.log(`Продукт ${product.title} не найден в ${storageName}е`);
            return false;
        }
    }
}

export default AuxiliaryFunctionsNamespace;