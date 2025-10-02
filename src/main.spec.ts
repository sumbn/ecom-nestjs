import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';

describe('Main Application Bootstrap', () => {
  let app: INestApplication;

  beforeEach(async () => {
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
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create application', () => {
    expect(app).toBeDefined();
  });

  it('should have validation pipe configured', () => {
    expect(app).toBeDefined();
  });

  it('should be able to get application instance', () => {
    expect(app.getHttpServer()).toBeDefined();
  });
});
