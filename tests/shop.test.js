const ShopNamespace = require('../modules/shop');
const PoolNamespace = require('../modules/pool');

jest.mock('../modules/pool');

describe('Shop class', () => {
  let shop;

  beforeEach(() => {
    shop = new ShopNamespace.Shop(1, 'Shop1', [
      { productId: 1, totalQuantity: 10, quantityInCarts: 0 },
      { productId: 2, totalQuantity: 5, quantityInCarts: 0 },
    ]);
  });

  test('updateCatalogInDB updates the catalog in the database', async () => {
    const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [] });
    PoolNamespace.pool.query = mockQuery;

    await shop.updateCatalogInDB();

    expect(mockQuery).toHaveBeenCalledTimes(4); // 2 delete and 2 insert operations
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM shop_to_product'),
      expect.arrayContaining([1, expect.any(Number)]),
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO shop_to_product'),
      expect.arrayContaining([1, expect.any(Number), expect.any(Number), expect.any(Number)]),
    );
  });

  test('deleteProductFromCatalogInDB deletes product from the catalog', async () => {
    const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [] });
    PoolNamespace.pool.query = mockQuery;

    await shop.deleteProductFromCatalogInDB();

    expect(mockQuery).toHaveBeenCalledTimes(4); // 1 delete and 3 insert operations
  });

  test('getInstanceById returns a shop instance from DB', async () => {
    const mockQuery = jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Shop1' }] }) // Base shop query
      .mockResolvedValueOnce({ rows: [
        { product_id: 1, total_quantity: 10, quantity_in_carts: 0 },
        { product_id: 2, total_quantity: 5, quantity_in_carts: 0 },
      ] }); // Catalog query

    PoolNamespace.pool.query = mockQuery;

    const result = await ShopNamespace.getInstanceById(1);

    expect(result).toBeInstanceOf(ShopNamespace.Shop);
    expect(result.id).toBe(1);
    expect(result.title).toBe('Shop1');
    expect(result.catalog).toHaveLength(2);
    expect(result.catalog[0].productId).toBe(1);
    expect(result.catalog[1].productId).toBe(2);
  });

  test('getInstanceById throws error if no shop is found', async () => {
    const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [] });
    PoolNamespace.pool.query = mockQuery;

    await expect(ShopNamespace.getInstanceById(999))
      .rejects
      .toThrowError('В таблице shops нет записей с id "999"');
  });

  test('getShopByProducerId returns a shop by producer id', async () => {
    const mockQuery = jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Shop1' }] }) // Base shop query
      .mockResolvedValueOnce({ rows: [
        { product_id: 1, total_quantity: 10, quantity_in_carts: 0 },
        { product_id: 2, total_quantity: 5, quantity_in_carts: 0 },
      ] }); // Catalog query

    PoolNamespace.pool.query = mockQuery;

    const result = await ShopNamespace.getShopByProducerId(1);

    expect(result).toBeInstanceOf(ShopNamespace.Shop);
    expect(result.id).toBe(1);
    expect(result.title).toBe('Shop1');
    expect(result.catalog).toHaveLength(2);
  });

  test('getShopByProducerId throws error if no shop is found', async () => {
    const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [] });
    PoolNamespace.pool.query = mockQuery;

    await expect(ShopNamespace.getShopByProducerId(999))
      .rejects
      .toThrowError('В таблице shops нет записей с id "999"');
  });
});
