import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset mockDataSource state
    mockDataSource.isInitialized = true;
    mockDataSource.query.mockResolvedValue([{ '?column?': 1 }]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should return healthy status when database is connected', async () => {
      const result = await service.check();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(result.environment).toBe('test');
      expect(result.version).toBe('1.0.0');

      const memoryData = result as {
        memory: { used: number; total: number; percentage: number };
      };
      expect(memoryData.memory).toBeDefined();
      expect(memoryData.memory.used).toBeGreaterThan(0);
      expect(memoryData.memory.total).toBeGreaterThan(0);
      expect(memoryData.memory.percentage).toBeGreaterThan(0);

      expect(result.uptime).toBeGreaterThan(0);
      expect((result as { responseTime: string }).responseTime).toMatch(
        /\d+ms/,
      );
    });

    it('should return unhealthy status when database is disconnected', async () => {
      mockDataSource.isInitialized = false;

      const result = await service.check();

      expect(result.status).toBe('error');
      expect(result.database).toBe('not initialized');
    });

    it('should return unhealthy status when database query fails', async () => {
      mockDataSource.isInitialized = true;
      mockDataSource.query.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await service.check();

      expect(result.status).toBe('error');
      expect(result.database).toBe('disconnected');
    });
  });

  describe('ready', () => {
    it('should return ready status when database is connected', async () => {
      mockDataSource.isInitialized = true;
      mockDataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.ready();

      expect(result.status).toBe('ready');
      expect(result.database).toBe('connected');
    });

    it('should return not ready status when database is disconnected', async () => {
      mockDataSource.isInitialized = false;

      const result = await service.ready();

      expect(result.status).toBe('not ready');
      expect(result.database).toBe('not initialized');
    });

    it('should return not ready status when database query fails', async () => {
      mockDataSource.isInitialized = true;
      mockDataSource.query.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await service.ready();

      expect(result.status).toBe('not ready');
      expect(result.database).toBe('disconnected');
    });
  });

  describe('live', () => {
    it('should return alive status', async () => {
      const result = await service.live();

      expect(result.status).toBe('alive');
      expect(result.uptime).toBeGreaterThan(0);
    });
  });
});
