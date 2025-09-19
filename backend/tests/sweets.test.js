const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user');
const Sweet = require('../src/models/sweet');

describe('Sweet Endpoints', () => {
  let userToken, adminToken;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sweetshop_test');
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Sweet.deleteMany({});

    // Create test users
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });

    await request(app)
      .post('/api/auth/register')
      .send({ username: 'admin', password: 'password123', isAdmin: true });

    // Get tokens
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password123' });
    userToken = userLogin.body.access_token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'password123' });
    adminToken = adminLogin.body.access_token;

    // Create test sweets
    await Sweet.create([
      { name: 'Chocolate Truffle', category: 'Chocolate', price: 3.99, quantity: 50 },
      { name: 'Gummy Bears', category: 'Gummy', price: 1.99, quantity: 100 },
      { name: 'Expensive Candy', category: 'Premium', price: 15.00, quantity: 5 }
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/sweets', () => {
    test('should return all sweets without authentication', async () => {
      const response = await request(app).get('/api/sweets');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0].name).toBeDefined();
    });
  });

  describe('GET /api/sweets/search', () => {
    test('should search sweets by name', async () => {
      const response = await request(app)
        .get('/api/sweets/search?name=chocolate');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Chocolate Truffle');
    });

    test('should search sweets by category', async () => {
      const response = await request(app)
        .get('/api/sweets/search?category=Gummy');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].category).toBe('Gummy');
    });

    test('should search sweets by price range', async () => {
      const response = await request(app)
        .get('/api/sweets/search?minPrice=2&maxPrice=5');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].price).toBe(3.99);
    });
  });

  describe('POST /api/sweets', () => {
    test('should create sweet as admin', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Sweet',
          category: 'Test',
          price: 2.99,
          quantity: 20
        });
      
      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Sweet');
    });

    test('should reject creation by regular user', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'New Sweet',
          category: 'Test',
          price: 2.99,
          quantity: 20
        });
      
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('POST /api/sweets/:id/purchase', () => {
    test('should purchase sweet successfully', async () => {
      const sweet = await Sweet.findOne({ name: 'Gummy Bears' });
      
      const response = await request(app)
        .post(`/api/sweets/${sweet._id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Purchase successful');
      expect(response.body.quantity).toBe(99);
    });

    test('should reject purchase when out of stock', async () => {
      const sweet = await Sweet.findOneAndUpdate(
        { name: 'Gummy Bears' },
        { quantity: 0 }
      );
      
      const response = await request(app)
        .post(`/api/sweets/${sweet._id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Sweet out of stock');
    });
  });
});
