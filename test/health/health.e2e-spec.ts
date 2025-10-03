import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return health check status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('statusCode', 200);
          expect(response.body).toHaveProperty('message', 'Success');
          expect(response.body).toHaveProperty('data');
          expect(response.body).toHaveProperty('timestamp');
          expect(response.body.data).toHaveProperty('status');
          expect(response.body.data).toHaveProperty('uptime');
          expect(response.body.data).toHaveProperty('database');
          expect(response.body.data).toHaveProperty('timestamp');
          expect(typeof response.body.data.uptime).toBe('number');
          expect(response.body.data.database).toBe('connected');
        });
    });

    it('should be accessible without authentication', () => {
      return request(app.getHttpServer()).get('/health').expect(200);
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness probe status', () => {
      return request(app.getHttpServer())
        .get('/health/ready')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('statusCode', 200);
          expect(response.body).toHaveProperty('message', 'Success');
          expect(response.body).toHaveProperty('data');
          expect(response.body).toHaveProperty('timestamp');
          expect(response.body.data).toHaveProperty('database');
          expect(response.body.data).toHaveProperty('status');
        });
    });

    it('should verify database connection', () => {
      return request(app.getHttpServer())
        .get('/health/ready')
        .expect(200)
        .then((response) => {
          expect(response.body.data.database).toBe('connected');
          expect(response.body.data.status).toBe('ready');
        });
    });

    it('should be accessible without authentication', () => {
      return request(app.getHttpServer()).get('/health/ready').expect(200);
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness probe status', () => {
      return request(app.getHttpServer())
        .get('/health/live')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('statusCode', 200);
          expect(response.body).toHaveProperty('message', 'Success');
          expect(response.body).toHaveProperty('data');
          expect(response.body).toHaveProperty('timestamp');
          expect(response.body.data).toHaveProperty('status', 'alive');
          expect(response.body.data).toHaveProperty('uptime');
          expect(typeof response.body.data.uptime).toBe('number');
        });
    });

    it('should be accessible without authentication', () => {
      return request(app.getHttpServer()).get('/health/live').expect(200);
    });
  });

  describe('Health endpoints response format', () => {
    it('all health endpoints should follow standard response format', async () => {
      const endpoints = ['/health', '/health/ready', '/health/live'];

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint)
          .expect(200);

        expect(response.body).toHaveProperty('statusCode');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('timestamp');
        expect(typeof response.body.timestamp).toBe('string');
      }
    });
  });
});
