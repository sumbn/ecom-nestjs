import {
  HealthCheckDto,
  ReadinessDto,
  LivenessDto,
} from '../../../../health/dto/health-check.dto';

describe('Health DTOs', () => {
  describe('HealthCheckDto', () => {
    it('should create a DTO with all properties assigned', () => {
      const dto: HealthCheckDto = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 123,
        environment: 'test',
        version: '1.0.0',
        database: 'connected',
        memory: {
          used: 512,
          total: 1024,
          percentage: 50,
        },
        responseTime: '45ms',
        error: undefined,
      };

      expect(dto.status).toBe('ok');
      expect(dto.environment).toBe('test');
      expect(dto.memory?.used).toBe(512);
    });
  });

  describe('ReadinessDto', () => {
    it('should assign readiness properties', () => {
      const dto: ReadinessDto = {
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };

      expect(dto.status).toBe('ready');
      expect(dto.database).toBe('connected');
    });
  });

  describe('LivenessDto', () => {
    it('should assign liveness properties', () => {
      const dto: LivenessDto = {
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: 456,
      };

      expect(dto.status).toBe('alive');
      expect(dto.uptime).toBe(456);
    });
  });
});
