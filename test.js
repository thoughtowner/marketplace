import ProductNamespace from './modules/product.js';
import UserNamespace from './modules/user.js';
import ConsumerNamespace from './modules/consumer.js';
import ShopNamespace from './modules/shop.js';


let product1 = new ProductNamespace.Product('product1', 100);
let product2 = new ProductNamespace.Product('product2', 200);
let product3 = new ProductNamespace.Product('product3', 300);
let product4 = new ProductNamespace.Product('product4', 500);

let consumer1 = new ConsumerNamespace.Consumer('consumer1');
let consumer2 = new ConsumerNamespace.Consumer('consumer2');

let shop = new ShopNamespace.Shop('shop');

let user = new UserNamespace.User('username', 'password');

consumer1.addMoney(1000);
consumer2.addMoney(400);

console.log(consumer1.products);
console.log(shop.products);

shop.addProduct(product1, 1);
shop.addProduct(product1, 1);
shop.addProduct(product2, 2);
shop.addProduct(product3, 3);
shop.removeProduct(product1, 1);
// shop.removeProduct(product2, 3);
// shop.removeProduct(product4, 1);

console.log(consumer1.products);
console.log(shop.products);

consumer1.putProduct(shop, product1, 1);
consumer1.putProduct(shop, product2, 2);
consumer1.putProduct(shop, product3, 1);
// consumer1.putProduct(shop, product3, 5);
// consumer1.putProduct(shop, product4, 1);

console.log(consumer1.products);
console.log(shop.products);

consumer1.putOutProduct(shop, product1, 1);
consumer1.putOutProduct(shop, product2, 1);
// consumer1.putOutProduct(shop, product1, 1);

console.log(consumer1.products);
console.log(shop.products);

consumer1.buyProducts(shop, user);

console.log(consumer1.products);
console.log(shop.products);