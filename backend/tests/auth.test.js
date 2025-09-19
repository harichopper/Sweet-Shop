const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user');

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sweetshop_test');
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    test('should create new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.username).toBe('testuser');
      expect(response.body.isAdmin).toBe(false);
      expect(response.body.id).toBeDefined();
    });

    test('should create admin user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'adminuser',
          password: 'password123',
          isAdmin: true
        });
      
      expect(response.status).toBe(201);
      expect(response.body.isAdmin).toBe(true);
    });

    test('should reject duplicate username', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password456' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' });
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' });
      
      expect(response.status).toBe(200);
      expect(response.body.access_token).toBeDefined();
      expect(response.body.token_type).toBe('bearer');
    });

    test('should reject invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'wronguser', password: 'password123' });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Incorrect username or password');
    });

    test('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Incorrect username or password');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' });
      
      token = loginResponse.body.access_token;
    });

    test('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.username).toBe('testuser');
      expect(response.body.isAdmin).toBe(false);
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });
  });
});
