import { ConsoleLoggerService } from '../logger.console.service';

describe('ConsoleLoggerService', () => {
  let logger: ConsoleLoggerService;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new ConsoleLoggerService();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    logger.clearContext();
  });

  describe('Basic Logging', () => {
    it('should log info message', () => {
      logger.log('Test message', 'TestContext');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleLogSpy.mock.calls[0][0];
      expect(logOutput).toContain('[LOG]');
      expect(logOutput).toContain('[TestContext]');
      expect(logOutput).toContain('Test message');
    });

    it('should log error message with trace', () => {
      logger.error('Error message', 'Stack trace here', 'TestContext');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      expect(logOutput).toContain('[ERROR]');
      expect(logOutput).toContain('[TestContext]');
      expect(logOutput).toContain('Error message');
      expect(consoleErrorSpy.mock.calls[0][1]).toBe('Stack trace here');
    });

    it('should log warning message', () => {
      logger.warn('Warning message', 'TestContext');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleWarnSpy.mock.calls[0][0];
      expect(logOutput).toContain('[WARN]');
      expect(logOutput).toContain('Warning message');
    });

    it('should log debug message in non-production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logger.debug('Debug message', 'TestContext');

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleDebugSpy.mock.calls[0][0];
      expect(logOutput).toContain('[DEBUG]');

      process.env.NODE_ENV = originalEnv;
    });

    it('should NOT log debug message in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      logger.debug('Debug message', 'TestContext');

      expect(consoleDebugSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should log verbose message in non-production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logger.verbose('Verbose message', 'TestContext');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleLogSpy.mock.calls[0][0];
      expect(logOutput).toContain('[VERBOSE]');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Context Management', () => {
    it('should set and include request ID', () => {
      logger.setRequestId('req-123');
      logger.log('Test message');

      const logOutput = consoleLogSpy.mock.calls[0][0];
      expect(logOutput).toContain('[ReqID: req-123]');
    });

    it('should set and include user ID', () => {
      logger.setUserId('user-456');
      logger.log('Test message');

      const logOutput = consoleLogSpy.mock.calls[0][0];
      expect(logOutput).toContain('[UserID: user-456]');
    });

    it('should set and include metadata', () => {
      logger.setMetadata('action', 'user.login');
      logger.log('Test message');

      const logOutput = consoleLogSpy.mock.calls[0][0];
      expect(logOutput).toContain('"action": "user.login"');
    });

    it('should include all context information', () => {
      logger.setRequestId('req-123');
      logger.setUserId('user-456');
      logger.setMetadata('action', 'user.login');
      logger.log('Test message', 'AuthService');

      const logOutput = consoleLogSpy.mock.calls[0][0];
      expect(logOutput).toContain('[ReqID: req-123]');
      expect(logOutput).toContain('[UserID: user-456]');
      expect(logOutput).toContain('[AuthService]');
      expect(logOutput).toContain('"action": "user.login"');
    });

    it('should clear context', () => {
      logger.setRequestId('req-123');
      logger.setUserId('user-456');
      logger.clearContext();
      logger.log('Test message');

      const logOutput = consoleLogSpy.mock.calls[0][0];
      expect(logOutput).not.toContain('[ReqID:');
      expect(logOutput).not.toContain('[UserID:');
    });
  });

  describe('Sensitive Data Masking', () => {
    it('should mask password field', () => {
      logger.setMetadata('user', {
        email: 'test@example.com',
        password: 'secret123',
      });
      logger.log('Test message');

      const logOutput = consoleLogSpy.mock.calls[0][0];
      expect(logOutput).toContain('"email": "test@example.com"');
      expect(logOutput).toContain('"password": "***MASKED***"');
      expect(logOutput).not.toContain('secret123');
    });

    it('should mask multiple sensitive fields', () => {
      logger.setMetadata('credentials', {
        username: 'john',
        password: 'pass123',
        token: 'secret-token',
      });
      logger.log('Test message');

      const logOutput = consoleLogSpy.mock.calls[0][0];
      expect(logOutput).toContain('"username": "john"');
      expect(logOutput).toContain('"password": "***MASKED***"');
      expect(logOutput).toContain('"token": "***MASKED***"');
      expect(logOutput).not.toContain('pass123');
      expect(logOutput).not.toContain('secret-token');
    });
  });
});
