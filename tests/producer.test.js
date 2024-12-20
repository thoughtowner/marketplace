const { Producer, ProducerNamespace } = require('../modules/producer.js');
const PoolNamespace = require('../modules/pool.js');


const mockPoolQuery = jest.fn();

jest.mock('../modules/pool.js', () => {
    return {
      pool: {
        query: jest.fn()
      }
    };
  });

describe('Producer class', () => {
  let producer;
  let user;
  let shop;
  let product;

  beforeEach(() => {
    producer = new Producer(1, 100, 1);
    
    user = {
      name: "User1",
      ownedProducts: [
        { productId: 1, quantity: 10 },
        { productId: 2, quantity: 5 }
      ]
    };

    shop = {
      title: "Shop1",
      catalog: [
        { productId: 1, totalQuantity: 10, quantityInCarts: 0 },
        { productId: 2, totalQuantity: 5, quantityInCarts: 0 }
      ]
    };

    product = {
      id: 1,
      title: "Product1"
    };
  });

  test('checkQuantityValue throws error if quantity is not a number', () => {
    expect(() => producer.checkQuantityValue('string')).toThrow('Тип значения <quantity> должно быть <number>.');
  });

  test('checkQuantityValue throws error if quantity is less than or equal to zero', () => {
    expect(() => producer.checkQuantityValue(0)).toThrow('Значение <quantity> должно быть больше нуля.');
  });

  test('addProductToShop adds product to shop if quantity is sufficient', async () => {
    await producer.addProductToShop(user, shop, product, 5);
    expect(shop.catalog[0].totalQuantity).toBe(15);
    expect(user.ownedProducts[0].quantity).toBe(5);
  });

  test('addProductToShop throws error if product is not owned by user', async () => {
    const newProduct = { id: 3, title: "Product3" };
    await expect(producer.addProductToShop(user, shop, newProduct, 5))
      .rejects
      .toThrow('Товар "Product3" не найден в имеющихся товарах пользователя "User1".');
  });

  test('addProductToShop throws error if user does not have enough product quantity', async () => {
    await expect(producer.addProductToShop(user, shop, product, 15))
      .rejects
      .toThrow('Пользователь "User1" не модет добавить в магазин "Shop1" 15 штук товара "Product1", так как количество этого продукта среди имеющихся у него продуктов недостаточно для этого.');
  });

  test('reduceProductFromShop reduces product from shop and updates user quantity', async () => {
    await producer.reduceProductFromShop(user, shop, product, 5);
    expect(shop.catalog[0].totalQuantity).toBe(5);
    expect(user.ownedProducts[0].quantity).toBe(15);
  });

  test('reduceProductFromShop throws error if quantity to reduce is greater than available stock in shop', async () => {
    await expect(producer.reduceProductFromShop(user, shop, product, 15))
      .rejects
      .toThrow('Пользователь "User1" не может уменьшить в магазине "Shop1" количество товара "Product1" на 15 штук, так как количетсво товара в магазине меньше, чем уменьшаемого количества.');
  });

  test('reduceProductFromShop throws error if product is not found in shop', async () => {
    const newProduct = { id: 3, title: "Product3" };
    await expect(producer.reduceProductFromShop(user, shop, newProduct, 5))
      .rejects
      .toThrow('Товар "Product3" не найден в магазине "Shop1".');
  });

  test('deleteProductFromShop deletes product from shop if total quantity is 0', async () => {
    shop.catalog[0].totalQuantity = 0;
    await producer.deleteProductFromShop(user, shop, product);
    expect(shop.catalog.length).toBe(1); // Product is removed
  });

  test('deleteProductFromShop throws error if product still has stock in shop', async () => {
    await expect(producer.deleteProductFromShop(user, shop, product))
      .rejects
      .toThrow('Пользователь "User1" не может удалить из магазина "Shop1" товар "Product1", так как он ещё не закончился.');
  });

  test('deleteProductFromShop throws error if product is not found in shop', async () => {
    const newProduct = { id: 3, title: "Product3" };
    await expect(producer.deleteProductFromShop(user, shop, newProduct))
      .rejects
      .toThrow('Товар "Product3" не найден в магазине "Shop1".');
  });

  test('updateMoneyInDB updates producer money in DB', async () => {
    const updatedProducer = { id: 1, money: 150 };
    mockPoolQuery.mockResolvedValueOnce({
      rows: [updatedProducer]
    });

    const result = await producer.updateMoneyInDB();
    expect(result.money).toBe(150);
  });
});

describe('ProducerNamespace.getInstanceById', () => {
  test('should return a producer instance by producerId', async () => {
    const producerData = { id: 1, money: 100 };
    const shopData = { id: 1, producer_id: 1 };

    mockPoolQuery.mockResolvedValueOnce({ rows: [producerData] });
    mockPoolQuery.mockResolvedValueOnce({ rows: [shopData] });

    const instance = await ProducerNamespace.getInstanceById(1);
    expect(instance).toBeInstanceOf(Producer);
    expect(instance.id).toBe(1);
  });

  test('should throw an error if no producer found by id', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] });
    await expect(ProducerNamespace.getInstanceById(1)).rejects.toThrow('В таблице users нет записей с id "1"');
  });
});

describe('ProducerNamespace.getInstanceByShopId', () => {
  test('should return a producer instance by shopId', async () => {
    const producerData = { id: 1, money: 100 };
    const shopData = { id: 1, producer_id: 1 };

    mockPoolQuery.mockResolvedValueOnce({ rows: [shopData] });
    mockPoolQuery.mockResolvedValueOnce({ rows: [producerData] });

    const instance = await ProducerNamespace.getInstanceByShopId(1);
    expect(instance).toBeInstanceOf(Producer);
    expect(instance.id).toBe(1);
  });

  test('should throw an error if no shop found by id', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] });
    await expect(ProducerNamespace.getInstanceByShopId(1)).rejects.toThrow('В таблице shops нет записей с id "1"');
  });
});
