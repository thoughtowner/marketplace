import ProductNamespace from './modules/product.js';
import UserNamespace from './modules/user.js';
import ConsumerNamespace from './modules/consumer.js';
import ProducerNamespace from './modules/producer.js';
import ShopNamespace from './modules/shop.js';


let user1 = new UserNamespace.User('name1', 'password', true);
let user2 = new UserNamespace.User('name2', 'password', undefined, true);
let user3 = new UserNamespace.User('name3', 'password', true);
let user4 = new UserNamespace.User('name4', 'password', undefined, true);

let consumer1 = new ConsumerNamespace.Consumer(user1);
let consumer2 = new ConsumerNamespace.Consumer(user3);

let producer1 = new ProducerNamespace.Producer(user2);
let shop1 = new ShopNamespace.Shop(producer1, 'shop1');

let producer2 = new ProducerNamespace.Producer(user4);
let shop2 = new ShopNamespace.Shop(producer2, 'shop2');

let product1 = new ProductNamespace.Product('product1', 100);
let product2 = new ProductNamespace.Product('product2', 200);
let product3 = new ProductNamespace.Product('product3', 300);
let product4 = new ProductNamespace.Product('product4', 400);
let product5 = new ProductNamespace.Product('product5', 500);

// // console.log(consumer1.money);
user1.addMoneyToConsumer(consumer1, 1000);
// // console.log(consumer1.money);
// user1.addMoneyToConsumer(consumer1, '1000');
// user1.addMoneyToConsumer(consumer1, -1000);
// user1.addMoneyToConsumer(consumer2, 1000);
// user1.addMoneyToConsumer(producer1, 1000);

// // console.log(shop1.catalog);
producer1.addProduct(shop1, product1, 1);
producer1.addProduct(shop1, product2, 2);
producer1.addProduct(shop1, product3, 3);
// // console.log(shop1.catalog);
// producer1.addProduct(shop1, product1, '1');
// producer1.addProduct(shop1, product1, 0);

// // console.log(shop1.catalog);
producer1.reduceProduct(shop1, product1, 1);
// // console.log(shop1.catalog);
// producer1.reduceProduct(shop1, product1, 1);
// producer1.reduceProduct(shop1, product2, 5);

// // console.log(shop1.catalog);
producer1.deleteProduct(shop1, product1);
// // console.log(shop1.catalog);
// producer1.deleteProduct(shop1, product2);

producer2.addProduct(shop2, product3, 3);
producer2.addProduct(shop2, product4, 3);
producer2.addProduct(shop2, product5, 3);

// // console.log(consumer1.generalCart);
consumer1.putProduct(shop1, product3, 2);
consumer1.putProduct(shop2, product3, 1);
consumer1.putProduct(shop2, product4, 2);
consumer1.putProduct(shop2, product5, 3);
// // for (let i = 0; i < consumer1.generalCart.length; i++) {
// //     console.log('====================');
// //     console.log(consumer1.generalCart[i]['shop'].title);
// //     console.log('--------------------');
// //     for (let j = 0; j < consumer1.generalCart[i]['cart'].length; j++) {
// //         console.log(consumer1.generalCart[i]['cart'][j]);
// //     }
// //     console.log('====================');
// // }
// // console.log(shop1.catalog);
// // console.log(shop2.catalog);
// consumer1.putProduct(shop1, product5, 1);
// consumer1.putProduct(shop1, product2, 3);
// consumer1.putProduct(shop2, product5, 1);

// // for (let i = 0; i < consumer1.generalCart.length; i++) {
// //     console.log('====================');
// //     console.log(consumer1.generalCart[i]['shop'].title);
// //     console.log('--------------------');
// //     for (let j = 0; j < consumer1.generalCart[i]['cart'].length; j++) {
// //         console.log(consumer1.generalCart[i]['cart'][j]);
// //     }
// //     console.log('====================');
// // }
consumer1.putOutProduct(shop2, product4, 1);
consumer1.putOutProduct(shop2, product5, 3);
consumer1.putOutProduct(shop1, product3, 1);
// // for (let i = 0; i < consumer1.generalCart.length; i++) {
// //     console.log('====================');
// //     console.log(consumer1.generalCart[i]['shop'].title);
// //     console.log('--------------------');
// //     for (let j = 0; j < consumer1.generalCart[i]['cart'].length; j++) {
// //         console.log(consumer1.generalCart[i]['cart'][j]);
// //     }
// //     console.log('====================');
// // }
// consumer1.putOutProduct(shop1, product3, 2);
// consumer1.putOutProduct(shop1, product1, 1);

// // console.log(consumer1.money);
// // console.log(user1.boughtProducts);
// // for (let i = 0; i < consumer1.generalCart.length; i++) {
// //     console.log('====================');
// //     console.log(consumer1.generalCart[i]['shop'].title);
// //     console.log('--------------------');
// //     for (let j = 0; j < consumer1.generalCart[i]['cart'].length; j++) {
// //         console.log(consumer1.generalCart[i]['cart'][j]);
// //     }
// //     console.log('====================');
// // }
consumer1.buyProducts();
// // console.log(consumer1.money);
// // console.log(user1.boughtProducts);
// // console.log(consumer1.generalCart);
// consumer1.buyProducts();
// consumer2.putProduct(shop1, product3, 1);
// consumer2.buyProducts();

// // console.log(producer1.money);
user2.reduceMoneyFromProducer(producer1, 100);
// // console.log(producer1.money);
// user2.reduceMoneyFromProducer(producer1, '100');
// user2.reduceMoneyFromProducer(producer1, -100);
// user2.reduceMoneyFromProducer(producer1, 1000);
// user2.reduceMoneyFromProducer(producer2, 100);
// user2.reduceMoneyFromProducer(consumer1, 100);