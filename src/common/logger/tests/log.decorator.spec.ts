import { Log } from '../decorators/log.decorator';
import { ILoggerService } from '../logger.interface';

describe('Log decorator', () => {
  const createMockLogger = (): jest.Mocked<ILoggerService> => ({
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    setRequestId: jest.fn(),
    setUserId: jest.fn(),
    setMetadata: jest.fn(),
    clearContext: jest.fn(),
  });

  it('ghi log khi method thành công', async () => {
    const logger = createMockLogger();

    class TestService {
      constructor(public logger: ILoggerService) {}

      @Log()
      async run(value: string): Promise<string> {
        return `${value}!`;
      }
    }

    const service = new TestService(logger);

    const result = await service.run('ping');

    expect(result).toBe('ping!');
    expect(logger.debug).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('→ run'),
      'TestService',
    );
    expect(logger.debug).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('← run'),
      'TestService',
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('ghi log lỗi khi method throw', async () => {
    const logger = createMockLogger();

    class FailingService {
      constructor(public logger: ILoggerService) {}

      @Log()
      async fail(): Promise<void> {
        throw new Error('boom');
      }
    }

    const service = new FailingService(logger);

    await expect(service.fail()).rejects.toThrow('boom');

    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('→ fail'),
      'FailingService',
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('✗ fail'),
      expect.any(String),
      'FailingService',
    );
  });
});
