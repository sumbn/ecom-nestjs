import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  const mockHealthService = {
    check: jest.fn(),
    ready: jest.fn(),
    live: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health check result', async () => {
      const mockResult = {
        statusCode: 200,
        message: 'Service is healthy',
        data: {
          status: 'ok',
          timestamp: '2025-01-01T00:00:00.000Z',
          uptime: 123.456,
          environment: 'test',
          version: '1.0.0',
          database: 'connected',
          memory: {
            used: 10,
            total: 100,
            percentage: 10.0,
          },
          responseTime: '5ms',
        },
        timestamp: '2025-01-01T00:00:00.000Z',
      };

      mockHealthService.check.mockResolvedValue(mockResult);

      const result = await controller.check();

      expect(service.check).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('ready', () => {
    it('should return readiness check result', async () => {
      const mockResult = {
        statusCode: 200,
        message: 'Service is ready',
        data: {
          status: 'ready',
          timestamp: '2025-01-01T00:00:00.000Z',
          database: 'connected',
        },
        timestamp: '2025-01-01T00:00:00.000Z',
      };

      mockHealthService.ready.mockResolvedValue(mockResult);

      const result = await controller.ready();

      expect(service.ready).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('live', () => {
    it('should return liveness check result', async () => {
      const mockResult = {
        statusCode: 200,
        message: 'Service is alive',
        data: {
          status: 'alive',
          timestamp: '2025-01-01T00:00:00.000Z',
          uptime: 123.456,
        },
        timestamp: '2025-01-01T00:00:00.000Z',
      };

      mockHealthService.live.mockResolvedValue(mockResult);

      const result = await controller.live();

      expect(service.live).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });
});
