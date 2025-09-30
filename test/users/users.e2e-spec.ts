import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Users Fixed (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Create admin user for testing
    const hashedPassword = await bcrypt.hash('AdminPassword123', 12);
    const adminUser = await dataSource.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
       VALUES (gen_random_uuid(), 'admin-fixed@example.com', $1, 'Admin', 'Fixed', 'admin', true, NOW(), NOW())
       RETURNING id`,
      [hashedPassword],
    );
    adminUserId = adminUser[0].id;

    // Login as admin to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin-fixed@example.com',
        password: 'AdminPassword123',
      });

    adminToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    if (adminUserId && dataSource) {
      await dataSource.query('DELETE FROM users WHERE id = $1', [adminUserId]);
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /api/v1/users', () => {
    it('should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test-fixed@example.com',
          password: 'SecurePassword123',
          firstName: 'Test',
          lastName: 'Fixed',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe('test-fixed@example.com');
      expect(response.body.data).not.toHaveProperty('passwordHash');
      expect(response.body.data.fullName).toBe('Test Fixed');

      // Cleanup immediately
      await dataSource.query('DELETE FROM users WHERE id = $1', [
        response.body.data.id,
      ]);
    });

    it('should fail with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email',
          password: 'SecurePassword123',
          firstName: 'Test',
          lastName: 'Invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Email không hợp lệ');
    });

    it('should fail with short password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test-short@example.com',
          password: 'short',
          firstName: 'Test',
          lastName: 'Short',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'Mật khẩu phải có ít nhất 8 ký tự',
      );
    });
  });

  describe('GET /api/v1/users', () => {
    it('should return paginated users', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    let testUserId: string;
    let userToken: string;

    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash('UserPassword123', 12);
      const testUser = await dataSource.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), 'user-fixed@example.com', $1, 'User', 'Fixed', 'user', true, NOW(), NOW())
         RETURNING id`,
        [hashedPassword],
      );
      testUserId = testUser[0].id;

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user-fixed@example.com',
          password: 'UserPassword123',
        });
      userToken = loginResponse.body.data.accessToken;
    });

    afterAll(async () => {
      if (testUserId) {
        await dataSource.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    });

    it('admin should get any user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testUserId);
    });

    it('user should get self', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testUserId);
    });

    it('user should not get other user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${adminUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Không có quyền truy cập');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    let patchUserId: string;
    let patchUserToken: string;

    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash('PatchPassword123', 12);
      const patchUser = await dataSource.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), 'patch-fixed@example.com', $1, 'Patch', 'Fixed', 'user', true, NOW(), NOW())
         RETURNING id`,
        [hashedPassword],
      );
      patchUserId = patchUser[0].id;

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'patch-fixed@example.com',
          password: 'PatchPassword123',
        });
      patchUserToken = loginResponse.body.data.accessToken;
    });

    afterAll(async () => {
      if (patchUserId) {
        await dataSource.query('DELETE FROM users WHERE id = $1', [
          patchUserId,
        ]);
      }
    });

    it('admin should update any user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${patchUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'UpdatedByAdmin' });

      expect(response.status).toBe(200);
      expect(response.body.data.firstName).toBe('UpdatedByAdmin');
    });

    it('user should update self', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${patchUserId}`)
        .set('Authorization', `Bearer ${patchUserToken}`)
        .send({ lastName: 'SelfUpdated' });

      expect(response.status).toBe(200);
      expect(response.body.data.lastName).toBe('SelfUpdated');
    });

    it('user should not update other user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${adminUserId}`)
        .set('Authorization', `Bearer ${patchUserToken}`)
        .send({ lastName: 'HackAttempt' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Không có quyền truy cập');
    });

    it('should fail with invalid data', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${patchUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'not-an-email' });

      expect(response.status).toBe(400);
    });

    it('should return 404 when updating non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'NoUser' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('admin should delete a user', async () => {
      // Create a user specifically for this test with unique email
      const uniqueEmail = `delete-${Date.now()}@example.com`;
      const hashedPassword = await bcrypt.hash('DeletePassword123', 12);
      const deleteUser = await dataSource.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'Delete', 'Fixed', 'user', true, NOW(), NOW())
         RETURNING id`,
        [uniqueEmail, hashedPassword],
      );
      const deleteUserId = deleteUser[0].id;

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // Cleanup: hard delete the user
      await dataSource.query('DELETE FROM users WHERE id = $1', [deleteUserId]);
    });

    it('user should not delete (forbidden)', async () => {
      const uniqueEmail = `trydelete-${Date.now()}@example.com`;
      const hashedPassword = await bcrypt.hash('TryDelete123', 12);
      const user = await dataSource.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'Try', 'Delete', 'user', true, NOW(), NOW())
         RETURNING id`,
        [uniqueEmail, hashedPassword],
      );
      const userId = user[0].id;

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: uniqueEmail,
          password: 'TryDelete123',
        });
      const userToken = loginResponse.body.data.accessToken;

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Forbidden resource');

      await dataSource.query('DELETE FROM users WHERE id = $1', [userId]);
    });

    it('should return 404 when deleting non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/users/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Auth guard checks', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/users');

      expect(response.status).toBe(401);
    });

    it('should return 403 if not admin on admin-only route', async () => {
      const hashedPassword = await bcrypt.hash('RoleCheck123', 12);
      const roleUser = await dataSource.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), 'rolecheck@example.com', $1, 'Role', 'Check', 'user', true, NOW(), NOW())
         RETURNING id`,
        [hashedPassword],
      );
      const roleUserId = roleUser[0].id;

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'rolecheck@example.com',
          password: 'RoleCheck123',
        });
      const userToken = loginResponse.body.data.accessToken;

      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123',
          firstName: 'No',
          lastName: 'Role',
        });

      expect(response.status).toBe(403);

      await dataSource.query('DELETE FROM users WHERE id = $1', [roleUserId]);
    });
  });
});
