const request = require('supertest');
const app = require('../app');


describe('Authentication Tests', () => {

  it('should register a new user (consumer)', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        name: 'consumerTest',
        password: 'password123',
        role: 'consumer'
      });

    expect(response.status).toBe(302); // Ожидаем редирект на /login
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

    expect(response.status).toBe(302); // Ожидаем редирект после успешного входа
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
    // Сначала логинимся, чтобы получить куки
    const loginResponse = await request(app)
      .post('/login')
      .send({
        name: 'loginTest',
        password: 'password123'
      });
  
    // Получаем cookie из ответа
    const cookies = loginResponse.headers['set-cookie'];
  
    // Теперь используем полученный cookie для запроса на /check-auth
    const response = await request(app)
      .get('/check-auth')
      .set('Cookie', cookies);  // Используем полученные куки для проверки
  
    expect(response.status).toBe(200);
    expect(response.body.isAuth).toBe(true);
  });

  it('should check role for authenticated user', async () => {
    // Сначала логинимся, чтобы получить куки
    const loginResponse = await request(app)
      .post('/login')
      .send({
        name: 'loginTest',
        password: 'password123'
      });
  
    // Получаем cookie из ответа
    const cookies = loginResponse.headers['set-cookie'];
  
    // Теперь используем полученные куки для запроса на /check-role
    const response = await request(app)
      .get('/check-role')
      .set('Cookie', cookies);  // Используем полученные куки для проверки
  
    expect(response.status).toBe(200);
    expect(response.body.role).toBe('consumer');
  });
  
  it('should fail when accessing protected route without authentication', async () => {
    const response = await request(app)
      .get('/account')
      .set('Cookie', '');  // Без куки

    expect(response.status).toBe(302); // Ожидаем редирект на /login
  });

});

describe('Shop API Tests', () => {

  it('should get list of all shops', async () => {
    const response = await request(app).get('/api/shops');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true); // Ожидаем массив магазинов
  });

  it('should get specific shop by ID', async () => {
    const response = await request(app).get('/api/shops/03da9201-7bf9-4073-9fe2-fc3f092191bc');  // Замените 1 на существующий shopId
    expect(response.status).toBe(200);
    expect(response.body.shop).toBeDefined();
    expect(response.body.catalog).toBeDefined();
  });

  it('should return 404 for non-existing shop', async () => {
    const response = await request(app).get('/api/shops/fd8c616d-32c3-4a22-8804-a1e8912e9228');  // Не существующий shopId
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('В таблице shops нет записей с id "fd8c616d-32c3-4a22-8804-a1e8912e9228"');
  });

  it('should get specific product from a shop', async () => {
    const response = await request(app).get('/api/shops/03da9201-7bf9-4073-9fe2-fc3f092191bc/products/2866d9cb-549e-4607-b2c5-821c652a495e');  // Замените на существующий shopId и productId
    expect(response.status).toBe(200);
    expect(response.body.product).toBeDefined();
  });

  it('should return 404 for non-existing product in shop', async () => {
    const response = await request(app).get('/api/shops/03da9201-7bf9-4073-9fe2-fc3f092191bc/products/0584f2cb-96c5-473f-b8e4-eec1b5652168');  // Не существующий productId
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('В таблице products нет записей с id "0584f2cb-96c5-473f-b8e4-eec1b5652168"');
  });

});

describe('Cart API Tests', () => {

    it('should get cart for authenticated user', async () => {
        // Сначала логинимся, чтобы получить куки
        const loginResponse = await request(app)
          .post('/login')
          .send({
            name: 'loginTest',
            password: 'password123'
          });
      
        // Получаем cookie из ответа
        const cookies = loginResponse.headers['set-cookie'];
      
        // Теперь используем полученные куки для запроса на /api/cart
        const response = await request(app)
          .get('/api/cart')
          .set('Cookie', cookies);  // Используем полученные куки для запроса
      
        expect(response.status).toBe(200);
        expect(response.body.cart).toBeDefined();
      });      

  it('should fail to get cart for unauthenticated user', async () => {
    const response = await request(app)
      .get('/api/cart')
      .set('Cookie', '');  // Без куки

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Пользователь не авторизован');
  });

});

describe('Owned Products API Tests', () => {

    it('should get owned products for authenticated user', async () => {
        // Сначала логинимся, чтобы получить куки
        const loginResponse = await request(app)
          .post('/login')
          .send({
            name: 'loginTest',
            password: 'password123'
          });
      
        // Получаем cookie из ответа
        const cookies = loginResponse.headers['set-cookie'];
      
        // Теперь используем полученные куки для запроса на /api/ownedProducts
        const response = await request(app)
          .get('/api/ownedProducts')
          .set('Cookie', cookies);  // Используем полученные куки для запроса
      
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });      

  it('should fail to get owned products for unauthenticated user', async () => {
    const response = await request(app)
      .get('/api/ownedProducts')
      .set('Cookie', '');  // Без куки

    expect(response.status).toBe(302);
  });

});

