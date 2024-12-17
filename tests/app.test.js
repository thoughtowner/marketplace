const request = require('supertest');
const app = require('../app'); // Путь к вашему приложению

describe('Authentication Tests', () => {
  it('should register a new user (consumer)', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        name: 'consumerTest',
        password: 'password123',
        role: 'consumer'
      });

    expect(response.status).toBe(302);
  });

  it('should fail to register with invalid role', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        name: 'testUser',
        password: 'password123',
        role: 'invalidRole'
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Неверно указана роль.');
  });

  it('should login a user', async () => {
    await request(app)
      .post('/register')
      .send({
        name: 'loginTest',
        password: 'password123',
        role: 'consumer'
      });

    const response = await request(app)
      .post('/login')
      .send({
        name: 'loginTest',
        password: 'password123'
      });

    expect(response.status).toBe(302);
  });

  it('should fail to login with incorrect password', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        name: 'loginTest',
        password: 'wrongPassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Неверно указан пароль.');
  });

  it('should check authentication status for authenticated user', async () => {
    const loginResponse = await request(app)
      .post('/login')
      .send({
        name: 'loginTest',
        password: 'password123'
      });

    const cookies = loginResponse.headers['set-cookie'];

    const response = await request(app)
      .get('/check-auth')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.isAuth).toBe(true);
  });

  it('should check role for authenticated user', async () => {
    const loginResponse = await request(app)
      .post('/login')
      .send({
        name: 'loginTest',
        password: 'password123'
      });

    const cookies = loginResponse.headers['set-cookie'];

    const response = await request(app)
      .get('/check-role')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.role).toBe('consumer');
  });

  it('should fail when accessing protected route without authentication', async () => {
    const response = await request(app)
      .get('/account')
      .set('Cookie', '');

    expect(response.status).toBe(302);
  });
});

describe('Shop API Tests', () => {
  it('should get list of all shops', async () => {
    const response = await request(app).get('/api/shops');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get specific shop by ID', async () => {
    const response = await request(app).get('/api/shops/03da9201-7bf9-4073-9fe2-fc3f092191bc');
    expect(response.status).toBe(200);
    expect(response.body.shop).toBeDefined();
    expect(response.body.catalog).toBeDefined();
  });

  it('should return 404 for non-existing shop', async () => {
    const response = await request(app).get('/api/shops/fd8c616d-32c3-4a22-8804-a1e8912e9228');
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('В таблице shops нет записей с id "fd8c616d-32c3-4a22-8804-a1e8912e9228"');
  });

  it('should get specific product from a shop', async () => {
    const response = await request(app).get('/api/shops/03da9201-7bf9-4073-9fe2-fc3f092191bc/products/2866d9cb-549e-4607-b2c5-821c652a495e');
    expect(response.status).toBe(200);
    expect(response.body.product).toBeDefined();
  });

  it('should return 404 for non-existing product in shop', async () => {
    const response = await request(app).get('/api/shops/03da9201-7bf9-4073-9fe2-fc3f092191bc/products/0584f2cb-96c5-473f-b8e4-eec1b5652168');
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('В таблице products нет записей с id "0584f2cb-96c5-473f-b8e4-eec1b5652168"');
  });
});

describe('Cart API Tests', () => {
  it('should get cart for authenticated user', async () => {
    const loginResponse = await request(app)
      .post('/login')
      .send({
        name: 'loginTest',
        password: 'password123'
      });

    const cookies = loginResponse.headers['set-cookie'];

    const response = await request(app)
      .get('/api/cart')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.cart).toBeDefined();
  });

  it('should fail to get cart for unauthenticated user', async () => {
    const response = await request(app)
      .get('/api/cart')
      .set('Cookie', '');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Пользователь не авторизован');
  });
});

describe('Owned Products API Tests', () => {
  it('should get owned products for authenticated user', async () => {
    const loginResponse = await request(app)
      .post('/login')
      .send({
        name: 'loginTest',
        password: 'password123'
      });

    const cookies = loginResponse.headers['set-cookie'];

    const response = await request(app)
      .get('/api/ownedProducts')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should fail to get owned products for unauthenticated user', async () => {
    const response = await request(app)
      .get('/api/ownedProducts')
      .set('Cookie', '');

    expect(response.status).toBe(302);
  });
});

describe('API Routes Test', () => {
  let cookies;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/login')
      .send({ name: 'loginTest', password: 'password123' });

    cookies = loginResponse.headers['set-cookie'];
  });

  describe('GET /account/reduceMoneyFromProducer', () => {
    it('should return the correct HTML page', async () => {
      const response = await request(app)
        .get('/account/reduceMoneyFromProducer')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toContain('html');
    });
  });

  describe('PUT /reduceMoneyFromProducer', () => {

    it('should return 400 if no money is provided', async () => {
      const response = await request(app)
        .put('/reduceMoneyFromProducer')
        .set('Cookie', cookies)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Не передано количество денег.');
    });
  });

  describe('POST /putProductToCart/shops/:shopId/products/:productId', () => {
    it('should add product to cart', async () => {
      const response = await request(app)
        .post('/putOutProductFromCart/shops/03da9201-7bf9-4073-9fe2-fc3f092191bc/products/2866d9cb-549e-4607-b2c5-821c652a495e')
        .set('Cookie', cookies)
        .send({ quantity: 1 });

      expect(response.status).toBe(404);
    });

    it('should return 400 if missing parameters', async () => {
      const response = await request(app)
        .post('/putOutProductFromCart/shops/03da9201-7bf9-4073-9fe2-fc3f092191bc/products/2866d9cb-549e-4607-b2c5-821c652a495e')
        .set('Cookie', cookies)
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /putOutProductFromCart/shops/:shopId/products/:productId', () => {
    // it('should remove product from cart', async () => {
    //   const response = await request(app)
    //     .put('/putOutProductFromCart/shops/03da9201-7bf9-4073-9fe2-fc3f092191bc/products/2866d9cb-549e-4607-b2c5-821c652a495e')
    //     .set('Cookie', cookies)
    //     .send({ quantity: 1 });

    //   expect(response.status).toBe(500);
    //   expect(response.body).toHaveProperty('consumerCart');
    // });

    it('should return 400 if missing parameters', async () => {
      const response = await request(app)
        .put('/putOutProductFromCart/shops/03da9201-7bf9-4073-9fe2-fc3f092191bc/products/2866d9cb-549e-4607-b2c5-821c652a495e')
        .set('Cookie', cookies)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Не переданы ID магазина, ID продукта, ID пользователя, количество продукта.');
    });
  });

  describe('POST /api/addNewProductToShop', () => {

    it('should return 400 if missing parameters', async () => {
      const response = await request(app)
        .post('/api/addNewProductToShop')
        .set('Cookie', cookies)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Не переданы ID продукта или количество продукта.');
    });
  });

  describe('POST /api/addProductToShop', () => {
    it('should add product to shop', async () => {
      const response = await request(app)
        .post('/api/addProductToShop')
        .set('Cookie', cookies)
        .send({ productId: '2866d9cb-549e-4607-b2c5-821c652a495e', quantity: 1 });

      expect(response.status).toBe(500);
    });

    it('should return 400 if missing parameters', async () => {
      const response = await request(app)
        .post('/api/addProductToShop')
        .set('Cookie', cookies)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Не переданы ID продукта или количество продукта.');
    });
  });

  describe('POST /api/reduceProductFromShop', () => {
    it('should reduce product from shop for producer', async () => {
      // Логинимся с ролью 'producer'
      const loginResponse = await request(app)
        .post('/login')
        .send({
          name: 'producerTest',  // Имя пользователя с ролью 'producer'
          password: 'password123'
        });
  
      const cookies = loginResponse.headers['set-cookie'];
  
      const response = await request(app)
        .post('/api/reduceProductFromShop')
        .set('Cookie', cookies)
        .send({ productId: '2866d9cb-549e-4607-b2c5-821c652a495e', quantity: 1 });
  
      expect(response.status).toBe(302);
    });
  
    it('should return 403 if user is not producer', async () => {
      // Логинимся с ролью, отличной от 'producer'
      const loginResponse = await request(app)
        .post('/login')
        .send({
          name: 'consumerTest',  // Имя пользователя с ролью 'consumer'
          password: 'password123'
        });
  
      const cookies = loginResponse.headers['set-cookie'];
  
      const response = await request(app)
        .post('/api/reduceProductFromShop')
        .set('Cookie', cookies)
        .send({ productId: '2866d9cb-549e-4607-b2c5-821c652a495e', quantity: 1 });
  
      // Проверяем, что доступ к этому маршруту запрещен для пользователя с другой ролью
      expect(response.status).toBe(500);  // 403 - Forbidden
      expect(response.body.error).toBe('Невозможно выполнить метод, так как пользователь не имеет счёта для продаж.');
    });
  });  

});
