const { Consumer } = require('../modules/consumer');
const ProductNamespace = require('../modules/product');
const ShopNamespace = require('../modules/shop');
const PoolNamespace = require('../modules/pool');
const UserNamespace = require('../modules/user');
const ProducerNamespace = require('../modules/producer');

jest.mock('../modules/product');
jest.mock('../modules/shop');
jest.mock('../modules/pool');
jest.mock('../modules/user');
jest.mock('../modules/producer');

describe('Consumer class', () => {
  let consumer;
  let shop;
  let product;
  let user;

  beforeEach(() => {
    consumer = new Consumer(1, 100, []);
    shop = {
      id: 1,
      title: 'Shop1',
      catalog: [
        { productId: 1, totalQuantity: 10, quantityInCarts: 0 },
        { productId: 2, totalQuantity: 5, quantityInCarts: 0 },
      ]
    };
    product = { id: 1, title: 'Product1', price: 10 };
    user = {
      id: 1,
      ownedProducts: [
        { productId: 1, quantity: 5 },
        { productId: 2, quantity: 3 },
      ]
    };

    ProductNamespace.getInstanceById.mockResolvedValue(product);
    ShopNamespace.getInstanceById.mockResolvedValue(shop);
    UserNamespace.getInstanceByConsumerId.mockResolvedValue(user);
  });

  test('addMoney increases the consumer money', () => {
    consumer.addMoney(50);
    expect(consumer.money).toBe(150);
  });

  test('putProduct adds product to cart if sufficient quantity is available in the shop', () => {
    consumer.putProduct('User1', shop, product, 5);
    expect(consumer.cart.length).toBe(1);
    expect(consumer.cart[0].productId).toBe(product.id);
    expect(consumer.cart[0].quantity).toBe(5);
  });

  test('putProduct throws error if product not found in the shop', () => {
    const newProduct = { id: 3, title: 'Product3' };
    expect(() => consumer.putProduct('User1', shop, newProduct, 5))
      .toThrowError('Товар "Product3" не найден в магазине "Shop1".');
  });

  test('putProduct throws error if not enough quantity in the shop', () => {
    const newProduct = { id: 1, title: 'Product1' };
    expect(() => consumer.putProduct('User1', shop, newProduct, 15))
      .toThrowError('Пользователь "User1" не может положить в корзину товар "Product1" в количестве 15 штук из магазина "Shop1", так как в магазине недостаточно этого товара.');
  });

  test('putOutProduct removes product from cart if quantity is correct', () => {
    consumer.putProduct('User1', shop, product, 5);
    consumer.putOutProduct('User1', shop, product, 2);
    expect(consumer.cart[0].quantity).toBe(3);
    expect(shop.catalog[0].quantityInCarts).toBe(3);
  });

  test('putOutProduct throws error if product not in cart', () => {
    const newProduct = { id: 3, title: 'Product3' };
    expect(() => consumer.putOutProduct('User1', shop, newProduct, 2))
      .toThrowError('Товар "Product3" не найден в корзине пользователя "User1".');
  });

  test('buyProducts successfully completes a purchase if there is enough money', async () => {
    consumer.cart.push({ shopId: shop.id, productId: product.id, quantity: 3 });
    ProductNamespace.getInstanceById.mockResolvedValueOnce({ price: 10 });
    ShopNamespace.getInstanceById.mockResolvedValueOnce(shop);
    const updateMoneyInDBMock = jest.fn();
    consumer.updateMoneyInDB = updateMoneyInDBMock;

    await consumer.buyProducts('User1');

    expect(consumer.money).toBe(70); // 100 - (3 * 10)
    expect(updateMoneyInDBMock).toHaveBeenCalled();
    expect(shop.catalog[0].quantityInCarts).toBe(3);
    expect(shop.catalog[0].totalQuantity).toBe(7);
  });

  test('buyProducts throws error if not enough money', async () => {
    consumer.cart.push({ shopId: shop.id, productId: product.id, quantity: 15 });
    ProductNamespace.getInstanceById.mockResolvedValueOnce({ price: 10 });

    await expect(consumer.buyProducts('User1'))
      .rejects
      .toThrowError('Пользователь "User1" не может оплатить все продукты из корзины за 150 рублей, так как сумма покупки больше, чем есть на счету для покупок у пользователя.');
  });

  test('transferProductsFromCartToOwned successfully transfers products', async () => {
    consumer.cart.push({ shopId: shop.id, productId: product.id, quantity: 3 });
    await consumer.transferProductsFromCartToOwned(user);

    expect(user.ownedProducts[0].quantity).toBe(8); // 5 + 3
    expect(consumer.cart.length).toBe(0);
  });

  test('updateMoneyInDB updates consumer money in DB', async () => {
    const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [{ money: 100 }] });
    PoolNamespace.pool.query = mockQuery;

    const result = await consumer.updateMoneyInDB();
    expect(result.money).toBe(100);
    expect(mockQuery).toHaveBeenCalled();
  });

  test('updateCartInDB updates the cart in DB', async () => {
    const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [] });
    PoolNamespace.pool.query = mockQuery;

    await consumer.updateCartInDB();
    expect(mockQuery).toHaveBeenCalled();
  });
});
