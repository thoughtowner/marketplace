import ProductNamespace from './modules/product.js';
import UserNamespace from './modules/user.js';
import ConsumerAccountNamespace from './modules/consumerAccount.js';
import ProducerAccountNamespace from './modules/producerAccount.js';
import ShopNamespace from './modules/shop.js';


let user1 = new UserNamespace.User('name1', 'password', true);
let user2 = new UserNamespace.User('name2', 'password', undefined, true);
let user3 = new UserNamespace.User('name3', 'password', true);
let user4 = new UserNamespace.User('name4', 'password', undefined, true);

let consumerAccount1 = new ConsumerAccountNamespace.ConsumerAccount(user1);
let consumerAccount2 = new ConsumerAccountNamespace.ConsumerAccount(user3);

let producerAccount1 = new ProducerAccountNamespace.ProducerAccount(user2);
let shop1 = new ShopNamespace.Shop(producerAccount1, 'shop1');

let producerAccount2 = new ProducerAccountNamespace.ProducerAccount(user4);
let shop2 = new ShopNamespace.Shop(producerAccount2, 'shop2');

let product1 = new ProductNamespace.Product('product1', 100);
let product2 = new ProductNamespace.Product('product2', 200);
let product3 = new ProductNamespace.Product('product3', 300);
let product4 = new ProductNamespace.Product('product4', 400);
let product5 = new ProductNamespace.Product('product5', 500);

// // console.log(consumerAccount1.money);
user1.addMoneyToConsumerAccount(consumerAccount1, 1000);
// // console.log(consumerAccount1.money);
// user1.addMoneyToConsumerAccount(consumerAccount1, '1000');
// user1.addMoneyToConsumerAccount(consumerAccount1, -1000);
// user1.addMoneyToConsumerAccount(consumerAccount2, 1000);
// user1.addMoneyToConsumerAccount(producerAccount1, 1000);

// // console.log(shop1.catalog);
producerAccount1.addProduct(shop1, product1, 1);
producerAccount1.addProduct(shop1, product2, 2);
producerAccount1.addProduct(shop1, product3, 3);
// // console.log(shop1.catalog);
// producerAccount1.addProduct(shop1, product1, '1');
// producerAccount1.addProduct(shop1, product1, 0);

// // console.log(shop1.catalog);
producerAccount1.reduceProduct(shop1, product1, 1);
// // console.log(shop1.catalog);
// producerAccount1.reduceProduct(shop1, product1, 1);
// producerAccount1.reduceProduct(shop1, product2, 5);

// // console.log(shop1.catalog);
producerAccount1.deleteProduct(shop1, product1);
// // console.log(shop1.catalog);
// producerAccount1.deleteProduct(shop1, product2);

producerAccount2.addProduct(shop2, product3, 3);
producerAccount2.addProduct(shop2, product4, 3);
producerAccount2.addProduct(shop2, product5, 3);

// // console.log(consumerAccount1.generalCart);
consumerAccount1.putProduct(shop1, product3, 2);
consumerAccount1.putProduct(shop2, product3, 1);
consumerAccount1.putProduct(shop2, product4, 2);
consumerAccount1.putProduct(shop2, product5, 3);
// // for (let i = 0; i < consumerAccount1.generalCart.length; i++) {
// //     console.log('====================');
// //     console.log(consumerAccount1.generalCart[i]['shop'].title);
// //     console.log('--------------------');
// //     for (let j = 0; j < consumerAccount1.generalCart[i]['cart'].length; j++) {
// //         console.log(consumerAccount1.generalCart[i]['cart'][j]);
// //     }
// //     console.log('====================');
// // }
// // console.log(shop1.catalog);
// // console.log(shop2.catalog);
// consumerAccount1.putProduct(shop1, product5, 1);
// consumerAccount1.putProduct(shop1, product2, 3);
// consumerAccount1.putProduct(shop2, product5, 1);

// // for (let i = 0; i < consumerAccount1.generalCart.length; i++) {
// //     console.log('====================');
// //     console.log(consumerAccount1.generalCart[i]['shop'].title);
// //     console.log('--------------------');
// //     for (let j = 0; j < consumerAccount1.generalCart[i]['cart'].length; j++) {
// //         console.log(consumerAccount1.generalCart[i]['cart'][j]);
// //     }
// //     console.log('====================');
// // }
consumerAccount1.putOutProduct(shop2, product4, 1);
consumerAccount1.putOutProduct(shop2, product5, 3);
consumerAccount1.putOutProduct(shop1, product3, 1);
// // for (let i = 0; i < consumerAccount1.generalCart.length; i++) {
// //     console.log('====================');
// //     console.log(consumerAccount1.generalCart[i]['shop'].title);
// //     console.log('--------------------');
// //     for (let j = 0; j < consumerAccount1.generalCart[i]['cart'].length; j++) {
// //         console.log(consumerAccount1.generalCart[i]['cart'][j]);
// //     }
// //     console.log('====================');
// // }
// consumerAccount1.putOutProduct(shop1, product3, 2);
// consumerAccount1.putOutProduct(shop1, product1, 1);

// // console.log(consumerAccount1.money);
// // console.log(user1.boughtProducts);
// // for (let i = 0; i < consumerAccount1.generalCart.length; i++) {
// //     console.log('====================');
// //     console.log(consumerAccount1.generalCart[i]['shop'].title);
// //     console.log('--------------------');
// //     for (let j = 0; j < consumerAccount1.generalCart[i]['cart'].length; j++) {
// //         console.log(consumerAccount1.generalCart[i]['cart'][j]);
// //     }
// //     console.log('====================');
// // }
consumerAccount1.buyProducts();
// // console.log(consumerAccount1.money);
// // console.log(user1.boughtProducts);
// // console.log(consumerAccount1.generalCart);
// consumerAccount1.buyProducts();
// consumerAccount2.putProduct(shop1, product3, 1);
// consumerAccount2.buyProducts();

// // console.log(producerAccount1.money);
user2.reduceMoneyFromProducerAccount(producerAccount1, 100);
// // console.log(producerAccount1.money);
// user2.reduceMoneyFromProducerAccount(producerAccount1, '100');
// user2.reduceMoneyFromProducerAccount(producerAccount1, -100);
// user2.reduceMoneyFromProducerAccount(producerAccount1, 1000);
// user2.reduceMoneyFromProducerAccount(producerAccount2, 100);
// user2.reduceMoneyFromProducerAccount(consumerAccount1, 100);
