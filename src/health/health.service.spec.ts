import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let configService: ConfigService;
  let dataSource: DataSource;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        NODE_ENV: 'test',
        npm_package_version: '1.0.0',
      };
      return config[key] || defaultValue;
    }),
  };

  const mockDataSource = {
    isInitialized: true,
    query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    configService = module.get<ConfigService>(ConfigService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should return healthy status when database is connected', async () => {
      const result = await service.check();

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Service is healthy');
      expect(result.data.status).toBe('ok');
      expect(result.data.database).toBe('connected');
      expect(result.data.environment).toBe('test');
      expect(result.data.version).toBe('1.0.0');
      expect((result.data as any).memory).toBeDefined();
      expect((result.data as any).memory.used).toBeGreaterThan(0);
      expect((result.data as any).memory.total).toBeGreaterThan(0);
      expect((result.data as any).memory.percentage).toBeGreaterThan(0);
      expect(result.data.uptime).toBeGreaterThan(0);
      expect((result.data as any).responseTime).toMatch(/\d+ms/);
    });

    it('should return unhealthy status when database is disconnected', async () => {
      mockDataSource.isInitialized = false;

      const result = await service.check();

      expect(result.statusCode).toBe(503);
      expect(result.message).toBe('Service is unhealthy');
      expect(result.data.status).toBe('error');
      expect(result.data.database).toBe('not initialized');
    });

    it('should return unhealthy status when database query fails', async () => {
      mockDataSource.isInitialized = true;
      mockDataSource.query.mockRejectedValue(new Error('Database connection failed'));

      const result = await service.check();

      expect(result.statusCode).toBe(503);
      expect(result.message).toBe('Service is unhealthy');
      expect(result.data.status).toBe('error');
      expect(result.data.database).toBe('disconnected');
    });
  });

  describe('ready', () => {
    it('should return ready status when database is connected', async () => {
      mockDataSource.isInitialized = true;
      mockDataSource.query.mockResolvedValue([{ '?column?': 1 }]);
      
      const result = await service.ready();

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Service is ready');
      expect(result.data.status).toBe('ready');
      expect(result.data.database).toBe('connected');
    });

    it('should return not ready status when database is disconnected', async () => {
      mockDataSource.isInitialized = false;

      const result = await service.ready();

      expect(result.statusCode).toBe(503);
      expect(result.message).toBe('Service is not ready');
      expect(result.data.status).toBe('not ready');
      expect(result.data.database).toBe('not initialized');
    });

    it('should return not ready status when database query fails', async () => {
      mockDataSource.isInitialized = true;
      mockDataSource.query.mockRejectedValue(new Error('Database connection failed'));

      const result = await service.ready();

      expect(result.statusCode).toBe(503);
      expect(result.message).toBe('Service is not ready');
      expect(result.data.status).toBe('not ready');
      expect(result.data.database).toBe('disconnected');
    });
  });

  describe('live', () => {
    it('should return alive status', async () => {
      const result = await service.live();

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Service is alive');
      expect(result.data.status).toBe('alive');
      expect(result.data.uptime).toBeGreaterThan(0);
    });
  });
});
