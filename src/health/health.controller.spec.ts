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
        status: 'ready',
        timestamp: '2025-01-01T00:00:00.000Z',
        database: 'connected',
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
        status: 'alive',
        timestamp: '2025-01-01T00:00:00.000Z',
        uptime: 123.456,
      };

      mockHealthService.live.mockResolvedValue(mockResult);

      const result = await controller.live();

      expect(service.live).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });
});
