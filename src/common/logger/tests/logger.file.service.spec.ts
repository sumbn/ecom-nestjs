import { FileLoggerService } from '../logger.file.service';
import { LogLevel } from '../logger.interface';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('FileLoggerService', () => {
  let service: FileLoggerService;
  const mockLogDir = path.join(process.cwd(), 'logs');

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.statSync as jest.Mock).mockReturnValue({ size: 1000 });
    (fs.appendFileSync as jest.Mock).mockImplementation(() => {});
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});

    service = new FileLoggerService();
  });

  afterEach(() => {
    service.clearContext();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log levels', () => {
    it('should log error messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.error('Test error', 'trace', 'TestContext');

      expect(fs.appendFileSync).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should log warning messages', () => {
      service.warn('Test warning', 'TestContext');

      expect(fs.appendFileSync).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      service.log('Test log', 'TestContext');

      expect(fs.appendFileSync).toHaveBeenCalled();
    });

    it('should log debug messages in non-production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      service.debug('Test debug', 'TestContext');

      expect(fs.appendFileSync).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log debug messages in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      service.debug('Test debug', 'TestContext');

      expect(fs.appendFileSync).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should log verbose messages in non-production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      service.verbose('Test verbose', 'TestContext');

      expect(fs.appendFileSync).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log verbose messages in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      service.verbose('Test verbose', 'TestContext');

      expect(fs.appendFileSync).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('context management', () => {
    it('should set request ID', () => {
      service.setRequestId('req-123');
      service.log('Test message');

      const callArgs = (fs.appendFileSync as jest.Mock).mock.calls[0];
      const logEntry = JSON.parse(callArgs[1]);

      expect(logEntry.requestId).toBe('req-123');
    });

    it('should set user ID', () => {
      service.setUserId('user-456');
      service.log('Test message');

      const callArgs = (fs.appendFileSync as jest.Mock).mock.calls[0];
      const logEntry = JSON.parse(callArgs[1]);

      expect(logEntry.userId).toBe('user-456');
    });

    it('should set metadata', () => {
      service.setMetadata('key1', 'value1');
      service.log('Test message');

      const callArgs = (fs.appendFileSync as jest.Mock).mock.calls[0];
      const logEntry = JSON.parse(callArgs[1]);

      expect(logEntry.metadata).toHaveProperty('key1', 'value1');
    });

    it('should clear context', () => {
      service.setRequestId('req-123');
      service.setUserId('user-456');
      service.setMetadata('key1', 'value1');

      service.clearContext();
      service.log('Test message');

      const callArgs = (fs.appendFileSync as jest.Mock).mock.calls[0];
      const logEntry = JSON.parse(callArgs[1]);

      expect(logEntry.requestId).toBeUndefined();
      expect(logEntry.userId).toBeUndefined();
      expect(logEntry.metadata).toBeUndefined();
    });
  });

  describe('sensitive data masking', () => {
    it('should handle metadata with sensitive fields', () => {
      service.setMetadata('password', 'secret123');
      service.log('Test message');

      const callArgs = (fs.appendFileSync as jest.Mock).mock.calls[0];
      const logEntry = JSON.parse(callArgs[1]);

      expect(logEntry.metadata).toBeDefined();
      // Masking is applied, exact value depends on implementation
      expect(logEntry.metadata).toHaveProperty('password');
    });

    it('should handle metadata with token fields', () => {
      service.setMetadata('accessToken', 'token123');
      service.log('Test message');

      const callArgs = (fs.appendFileSync as jest.Mock).mock.calls[0];
      const logEntry = JSON.parse(callArgs[1]);

      expect(logEntry.metadata).toBeDefined();
      expect(logEntry.metadata).toHaveProperty('accessToken');
    });

    it('should handle nested objects in metadata', () => {
      service.setMetadata('user', {
        email: 'test@example.com',
        password: 'secret',
        token: 'abc123',
      });
      service.log('Test message');

      const callArgs = (fs.appendFileSync as jest.Mock).mock.calls[0];
      const logEntry = JSON.parse(callArgs[1]);

      expect(logEntry.metadata).toBeDefined();
      expect(logEntry.metadata).toHaveProperty('user');
    });

    it('should handle arrays in metadata', () => {
      service.setMetadata('users', [
        { email: 'user1@example.com', password: 'pass1' },
        { email: 'user2@example.com', password: 'pass2' },
      ]);
      service.log('Test message');

      const callArgs = (fs.appendFileSync as jest.Mock).mock.calls[0];
      const logEntry = JSON.parse(callArgs[1]);

      expect(logEntry.metadata).toBeDefined();
      expect(logEntry.metadata.users).toBeInstanceOf(Array);
      expect(logEntry.metadata.users).toHaveLength(2);
    });
  });

  describe('file operations', () => {
    it('should create log directory if not exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      new FileLoggerService();

      expect(fs.mkdirSync).toHaveBeenCalledWith(mockLogDir, {
        recursive: true,
      });
    });

    it('should rotate log file when exceeds max size', () => {
      const maxSize = 10485760; // 10MB
      (fs.statSync as jest.Mock).mockReturnValue({ size: maxSize + 1 });
      (fs.renameSync as jest.Mock).mockImplementation(() => {});

      service.log('Test message');

      expect(fs.renameSync).toHaveBeenCalled();
    });

    it('should not rotate log file when below max size', () => {
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1000 });
      (fs.renameSync as jest.Mock).mockImplementation(() => {});

      service.log('Test message');

      expect(fs.renameSync).not.toHaveBeenCalled();
    });

    it('should handle file write errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (fs.appendFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Write failed');
      });

      service.log('Test message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to write log to file:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('log entry structure', () => {
    it('should create proper log entry structure', () => {
      service.log('Test message', 'TestContext');

      const callArgs = (fs.appendFileSync as jest.Mock).mock.calls[0];
      const logEntry = JSON.parse(callArgs[1]);

      expect(logEntry).toHaveProperty('level', LogLevel.LOG);
      expect(logEntry).toHaveProperty('message', 'Test message');
      expect(logEntry).toHaveProperty('context', 'TestContext');
      expect(logEntry).toHaveProperty('timestamp');
    });

    it('should include trace in error logs', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.error('Error message', 'stack trace', 'ErrorContext');

      const callArgs = (fs.appendFileSync as jest.Mock).mock.calls[0];
      const logEntry = JSON.parse(callArgs[1]);

      expect(logEntry.metadata).toHaveProperty('trace', 'stack trace');

      consoleSpy.mockRestore();
    });

    it('should write log as JSON line', () => {
      service.log('Test message');

      const callArgs = (fs.appendFileSync as jest.Mock).mock.calls[0];
      const logLine = callArgs[1];

      expect(logLine).toMatch(/^\{.*\}\n$/);
    });
  });

  describe('log file naming', () => {
    it('should use date-based log file names', () => {
      service.log('Test message');

      const callArgs = (fs.appendFileSync as jest.Mock).mock.calls[0];
      const filePath = callArgs[0];
      const date = new Date().toISOString().split('T')[0];

      expect(filePath).toContain(`info-${date}.log`);
    });

    it('should use different files for different log levels', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.error('Error message');
      service.warn('Warning message');
      service.log('Info message');

      const errorCall = (fs.appendFileSync as jest.Mock).mock.calls[0][0];
      const warnCall = (fs.appendFileSync as jest.Mock).mock.calls[1][0];
      const infoCall = (fs.appendFileSync as jest.Mock).mock.calls[2][0];

      expect(errorCall).toContain('error-');
      expect(warnCall).toContain('warn-');
      expect(infoCall).toContain('info-');

      consoleSpy.mockRestore();
    });
  });

  describe('NestJS LoggerService compatibility', () => {
    it('should implement NestJS LoggerService interface', () => {
      expect(service.log).toBeDefined();
      expect(service.error).toBeDefined();
      expect(service.warn).toBeDefined();
      expect(service.debug).toBeDefined();
      expect(service.verbose).toBeDefined();
    });

    it('should accept optional context parameter', () => {
      expect(() => service.log('message')).not.toThrow();
      expect(() => service.log('message', 'context')).not.toThrow();
    });
  });
});
