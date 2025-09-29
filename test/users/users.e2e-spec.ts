import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let adminUserId: string;
  let createdUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same pipes as main.ts
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
       VALUES (gen_random_uuid(), 'admin-test@example.com', $1, 'Admin', 'Test', 'admin', true, NOW(), NOW())
       RETURNING id`,
      [hashedPassword],
    );
    adminUserId = adminUser[0].id;

    // Login as admin to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin-test@example.com',
        password: 'AdminPassword123',
      });

    adminToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup: xóa test data
    if (createdUserId) {
      await dataSource.query('DELETE FROM users WHERE id = $1', [
        createdUserId,
      ]);
    }
    if (adminUserId) {
      await dataSource.query('DELETE FROM users WHERE id = $1', [adminUserId]);
    }
    await app.close();
  });

  describe('POST /api/v1/users', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test-e2e@example.com',
          password: 'SecurePassword123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201)
        .then((response) => {
          expect(response.body.data).toHaveProperty('id');
          expect(response.body.data.email).toBe('test-e2e@example.com');
          expect(response.body.data).not.toHaveProperty('passwordHash');
          expect(response.body.data.fullName).toBe('Test User');

          // Save ID để cleanup
          createdUserId = response.body.data.id;
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email',
          password: 'SecurePassword123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400)
        .then((response) => {
          expect(response.body.message).toContain('Email không hợp lệ');
        });
    });

    it('should fail with short password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test2@example.com',
          password: 'short',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400)
        .then((response) => {
          expect(response.body.message).toContain(
            'Mật khẩu phải có ít nhất 8 ký tự',
          );
        });
    });

    it('should fail with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test-e2e@example.com', // Email đã tạo ở test đầu
          password: 'SecurePassword123',
          firstName: 'Test',
          lastName: 'Duplicate',
        })
        .expect(409)
        .then((response) => {
          expect(response.body.message).toContain('Email đã được sử dụng');
        });
    });
  });

  describe('GET /api/v1/users', () => {
    it('should return paginated users', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200)
        .then((response) => {
          expect(response.body.data).toHaveProperty('data');
          expect(response.body.data).toHaveProperty('total');
          expect(response.body.data).toHaveProperty('page');
          expect(response.body.data).toHaveProperty('limit');
          expect(Array.isArray(response.body.data.data)).toBe(true);
        });
    });

    it('should limit max records to 100', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 200 })
        .expect(200)
        .then((response) => {
          expect(response.body.data.limit).toBeLessThanOrEqual(100);
        });
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return user by id', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.data.id).toBe(createdUserId);
          expect(response.body.data).not.toHaveProperty('passwordHash');
        });
    });

    it('should return 404 for non-existent user', () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';
      return request(app.getHttpServer())
        .get(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 400 for invalid UUID', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('should update user', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(200)
        .then((response) => {
          expect(response.body.data.firstName).toBe('Updated');
          expect(response.body.data.lastName).toBe('Name');
          expect(response.body.data.fullName).toBe('Updated Name');
        });
    });

    it('should fail when updating to existing email', async () => {
      // Tạo user thứ 2
      const secondUserResponse = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'second-user@example.com',
          password: 'SecurePassword123',
          firstName: 'Second',
          lastName: 'User',
        });

      const secondUserId = secondUserResponse.body.data.id;

      // Thử update email của user 2 thành email của user 1
      await request(app.getHttpServer())
        .patch(`/api/v1/users/${secondUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test-e2e@example.com',
        })
        .expect(409);

      // Cleanup
      await dataSource.query('DELETE FROM users WHERE id = $1', [secondUserId]);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should soft delete user', async () => {
      // Tạo user để xóa
      const userToDelete = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'to-delete@example.com',
          password: 'SecurePassword123',
          firstName: 'To',
          lastName: 'Delete',
        });

      const deleteUserId = userToDelete.body.data.id;

      // Xóa user
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify user không còn active
      await request(app.getHttpServer())
        .get(`/api/v1/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      // Cleanup
      await dataSource.query('DELETE FROM users WHERE id = $1', [deleteUserId]);
    });

    it('should return 404 when deleting non-existent user', () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';
      return request(app.getHttpServer())
        .delete(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
