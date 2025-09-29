import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';

describe('Auth Refresh Token (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
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

    // Cleanup test data from previous runs
    await dataSource.query(
      'DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email = $1)',
      ['refresh-test@example.com'],
    );
    await dataSource.query('DELETE FROM users WHERE email = $1', [
      'refresh-test@example.com',
    ]);
  });

  afterAll(async () => {
    // Cleanup
    if (userId) {
      await dataSource.query('DELETE FROM refresh_tokens WHERE user_id = $1', [
        userId,
      ]);
      await dataSource.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await app.close();
  });

  describe('Login Flow', () => {
    it('should register and receive both tokens', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'refresh-test@example.com',
          password: 'SecurePassword123',
          firstName: 'Refresh',
          lastName: 'Test',
        })
        .expect(201)
        .then((response) => {
          expect(response.body.data).toHaveProperty('accessToken');
          expect(response.body.data).toHaveProperty('refreshToken');
          expect(response.body.data).toHaveProperty(
            'accessTokenExpiresIn',
            '15m',
          );
          expect(response.body.data).toHaveProperty(
            'refreshTokenExpiresIn',
            '7d',
          );

          accessToken = response.body.data.accessToken;
          refreshToken = response.body.data.refreshToken;
          userId = response.body.data.user.id;
        });
    });

    it('login should create new refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'refresh-test@example.com',
          password: 'SecurePassword123',
        })
        .expect(200);

      expect(response.body.data.refreshToken).not.toBe(refreshToken);

      // Verify có 2 refresh tokens trong DB
      const tokens = await dataSource.query(
        'SELECT COUNT(*) as count FROM refresh_tokens WHERE user_id = $1 AND is_revoked = false',
        [userId],
      );
      expect(parseInt(tokens[0].count)).toBe(2);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: refreshToken,
        })
        .expect(200)
        .then((response) => {
          expect(response.body.data).toHaveProperty('accessToken');
          expect(response.body.data.accessToken).not.toBe(accessToken);
          expect(response.body.data).toHaveProperty('tokenType', 'Bearer');

          // Update accessToken for next tests
          accessToken = response.body.data.accessToken;
        });
    });

    it('should fail with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(401)
        .then((response) => {
          expect(response.body.message).toContain('Refresh token không hợp lệ');
        });
    });

    it('should fail with missing refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/v1/auth/sessions', () => {
    it('should list active sessions', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body.data)).toBe(true);
          expect(response.body.data.length).toBeGreaterThanOrEqual(2);
          expect(response.body.data[0]).toHaveProperty('id');
          expect(response.body.data[0]).toHaveProperty('deviceInfo');
          expect(response.body.data[0]).toHaveProperty('ipAddress');
          expect(response.body.data[0]).toHaveProperty('createdAt');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout current session', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken: refreshToken,
        })
        .expect(200)
        .then((response) => {
          expect(response.body.data.message).toBe('Đăng xuất thành công');
        });
    });

    it('should fail to refresh with revoked token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: refreshToken,
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout-all', () => {
    let newAccessToken: string;
    let newRefreshToken: string;

    beforeAll(async () => {
      // Login lại để có tokens mới
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'refresh-test@example.com',
          password: 'SecurePassword123',
        });

      newAccessToken = response.body.data.accessToken;
      newRefreshToken = response.body.data.refreshToken;
    });

    it('should logout from all devices', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.data.message).toContain(
            'Đăng xuất khỏi tất cả thiết bị',
          );
          expect(response.body.data.count).toBeGreaterThanOrEqual(1);
        });
    });

    it('should fail to use any refresh token after logout-all', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: newRefreshToken,
        })
        .expect(401);
    });

    it('should verify all tokens revoked in database', async () => {
      const tokens = await dataSource.query(
        'SELECT COUNT(*) as count FROM refresh_tokens WHERE user_id = $1 AND is_revoked = false',
        [userId],
      );
      expect(parseInt(tokens[0].count)).toBe(0);
    });
  });

  describe('DELETE /api/v1/auth/sessions/:id', () => {
    let session1Token: string;
    let session2Token: string;
    let session1Id: string;
    let currentAccessToken: string;

    beforeAll(async () => {
      // Tạo 2 sessions
      const session1 = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'refresh-test@example.com',
          password: 'SecurePassword123',
        });

      const session2 = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'refresh-test@example.com',
          password: 'SecurePassword123',
        });

      session1Token = session1.body.data.refreshToken;
      session2Token = session2.body.data.refreshToken;
      currentAccessToken = session2.body.data.accessToken;

      // Get session IDs
      const sessions = await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${currentAccessToken}`);

      session1Id = sessions.body.data[1].id;
    });

    it('should revoke specific session', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/auth/sessions/${session1Id}`)
        .set('Authorization', `Bearer ${currentAccessToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.data.message).toBe('Revoke session thành công');
        });
    });

    it('should fail to use revoked session token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: session1Token,
        })
        .expect(401);
    });

    it('should still work with other session token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: session2Token,
        })
        .expect(200);
    });

    it('should fail to revoke non-existent session', () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';
      return request(app.getHttpServer())
        .delete(`/api/v1/auth/sessions/${fakeId}`)
        .set('Authorization', `Bearer ${currentAccessToken}`)
        .expect(400);
    });
  });

  describe('Session Metadata', () => {
    it('should capture device info and IP', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
        .send({
          email: 'refresh-test@example.com',
          password: 'SecurePassword123',
        });

      const accessToken = response.body.data.accessToken;

      const sessions = await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`);

      const latestSession = sessions.body.data[0];
      expect(latestSession.deviceInfo).toBeDefined();
      expect(latestSession.ipAddress).toBeDefined();
      expect(latestSession.userAgent).toContain('Mozilla');
    });
  });
});
