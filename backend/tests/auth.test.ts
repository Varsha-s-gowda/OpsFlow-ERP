import request from 'supertest';
import app from '../src/app';
import prisma from '../src/services/db';

describe('Auth & API Foundation Tests', () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/health', () => {
    it('should return 200 health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'OpsFlow ERP API is running',
      });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid admin credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@opsflow.local',
          password: 'OpsFlow@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('admin@opsflow.local');
      expect(res.body.data.user.role).toBe('ADMIN');
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@opsflow.local',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 validation error for missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should reject requests without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return user info with valid token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@opsflow.local',
          password: 'OpsFlow@123',
        });

      const token = loginRes.body.data.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('admin@opsflow.local');
      expect(res.body.data.user.role).toBe('ADMIN');
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });
  });

  describe('RBAC Endpoint Authorization', () => {
    let adminToken: string;
    let operationsToken: string;
    let salesToken: string;

    beforeAll(async () => {
      const adminRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@opsflow.local', password: 'OpsFlow@123' });
      adminToken = adminRes.body.data.token;

      const opsRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'operations@opsflow.local', password: 'OpsFlow@123' });
      operationsToken = opsRes.body.data.token;

      const salesRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'sales@opsflow.local', password: 'OpsFlow@123' });
      salesToken = salesRes.body.data.token;
    });

    it('should allow ADMIN to access admin-test', async () => {
      const res = await request(app)
        .get('/api/auth/admin-test')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny OPERATIONS access to admin-test', async () => {
      const res = await request(app)
        .get('/api/auth/admin-test')
        .set('Authorization', `Bearer ${operationsToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should deny SALES access to admin-test', async () => {
      const res = await request(app)
        .get('/api/auth/admin-test')
        .set('Authorization', `Bearer ${salesToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
