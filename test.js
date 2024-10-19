import ProductNamespace from './modules/product.js';
import ConsumerNamespace from './modules/consumer.js';
import ShopNamespace from './modules/shop.js';


let product1 = new ProductNamespace.Product('product1', 100);
let product2 = new ProductNamespace.Product('product2', 200);
let product3 = new ProductNamespace.Product('product3', 300);
let product4 = new ProductNamespace.Product('product4', 500);
let consumer1 = new ConsumerNamespace.Consumer('consumer1', 1000);
let consumer2 = new ConsumerNamespace.Consumer('consumer2', 400);
let shop = new ShopNamespace.Shop();

shop.addProduct(product1, 1);
shop.addProduct(product1, 1);
shop.addProduct(product2, 2);
shop.addProduct(product3, 3);
shop.deleteProduct(product1, 1);
shop.deleteProduct(product2, 3);
shop.deleteProduct(product4, 1);

consumer1.addMoney(100);
consumer1.deductMoney(100);
consumer2.deductMoney(500);

console.log(consumer1.products);
console.log(shop.products);

consumer1.putProduct(shop, product1, 1);
consumer1.putProduct(shop, product2, 2);
consumer1.putProduct(shop, product3, 1);
consumer1.putProduct(shop, product3, 5);
consumer1.putProduct(shop, product4, 1);

console.log(consumer1.products);
console.log(shop.products);

consumer1.putOutProduct(shop, product1, 1);
consumer1.putOutProduct(shop, product2, 1);
consumer1.putOutProduct(shop, product1, 1);

console.log(consumer1.products);
console.log(shop.products);

consumer1.buyProducts(shop);

console.log(consumer1.products);
console.log(shop.products);

consumer1.putProduct(shop, product1, 1);
consumer1.putProduct(shop, product2, 1);
consumer1.putProduct(shop, product3, 2);

console.log(consumer1.products);
console.log(shop.products);

consumer1.addMoney(400);
consumer1.buyProducts(shop);

console.log(consumer1.products);
console.log(shop.products);