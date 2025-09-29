import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let userId: string;

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
  });

  afterAll(async () => {
    // Cleanup: xóa test user
    if (userId) {
      await dataSource.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return access token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'auth-test@example.com',
          password: 'SecurePassword123',
          firstName: 'Auth',
          lastName: 'Test',
        })
        .expect(201)
        .then((response) => {
          expect(response.body.data).toHaveProperty('accessToken');
          expect(response.body.data).toHaveProperty('tokenType', 'Bearer');
          expect(response.body.data).toHaveProperty('user');
          expect(response.body.data.user.email).toBe('auth-test@example.com');
          expect(response.body.data.user).not.toHaveProperty('passwordHash');

          // Save token và userId cho tests tiếp theo
          accessToken = response.body.data.accessToken;
          userId = response.body.data.user.id;
        });
    });

    it('should fail with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'auth-test@example.com',
          password: 'SecurePassword123',
          firstName: 'Duplicate',
          lastName: 'User',
        })
        .expect(409)
        .then((response) => {
          expect(response.body.message).toContain('Email đã được sử dụng');
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePassword123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });

    it('should fail with short password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
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
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'auth-test@example.com',
          password: 'SecurePassword123',
        })
        .expect(200)
        .then((response) => {
          expect(response.body.data).toHaveProperty('accessToken');
          expect(response.body.data).toHaveProperty('tokenType', 'Bearer');
          expect(response.body.data.user.email).toBe('auth-test@example.com');
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePassword123',
        })
        .expect(401)
        .then((response) => {
          expect(response.body.message).toContain(
            'Email hoặc mật khẩu không đúng',
          );
        });
    });

    it('should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'auth-test@example.com',
          password: 'WrongPassword123',
        })
        .expect(401);
    });

    it('should fail with missing credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'auth-test@example.com',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user info with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.data.id).toBe(userId);
          expect(response.body.data.email).toBe('auth-test@example.com');
          expect(response.body.data).not.toHaveProperty('passwordHash');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should fail with malformed Authorization header', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });
  });

  describe('Protected routes', () => {
    it('should access protected route with valid token', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.data.id).toBe(userId);
        });
    });

    it('should deny access without token', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .expect(401);
    });
  });

  describe('Role-based access', () => {
    it('regular user should not access admin endpoints', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it('regular user can only access own profile', async () => {
      // Tạo user thứ 2
      const otherUser = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'other-user@example.com',
          password: 'SecurePassword123',
          firstName: 'Other',
          lastName: 'User',
        });

      const otherUserId = otherUser.body.data.user.id;

      // User 1 không thể access profile user 2
      await request(app.getHttpServer())
        .get(`/api/v1/users/${otherUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      // Cleanup
      await dataSource.query('DELETE FROM users WHERE id = $1', [otherUserId]);
    });
  });
});
