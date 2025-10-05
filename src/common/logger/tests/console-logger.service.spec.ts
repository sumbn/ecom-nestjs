import { ConsoleLoggerService } from '../logger.console.service';

describe('ConsoleLoggerService', () => {
  let service: ConsoleLoggerService;
  let originalNodeEnv: string | undefined;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;

  const mockConsoleMethod = (
    method: 'log' | 'warn' | 'error' | 'debug',
  ): jest.SpyInstance =>
    jest.spyOn(console, method).mockImplementation(() => {});

  beforeEach(() => {
    service = new ConsoleLoggerService();
    originalNodeEnv = process.env.NODE_ENV;

    logSpy = mockConsoleMethod('log');
    warnSpy = mockConsoleMethod('warn');
    errorSpy = mockConsoleMethod('error');
    debugSpy = mockConsoleMethod('debug');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  const extractMetadataFromOutput = (
    output: string,
  ): Record<string, unknown> | undefined => {
    const jsonStart = output.indexOf('{');
    if (jsonStart === -1) {
      return undefined;
    }

    return JSON.parse(output.slice(jsonStart));
  };

  it('ghi log đầy đủ thông tin và mask metadata nhạy cảm', () => {
    process.env.NODE_ENV = 'development';

    service.setRequestId('req-123');
    service.setUserId('user-456');
    service.setMetadata('password', 'secret');
    service.setMetadata('details', {
      token: 'abc',
      nested: [{ creditCard: '4111-1111-1111-1111', code: 'OK' }],
    });
    service.setMetadata('list', ['visible', { refreshToken: 'refresh' }]);

    service.log('Payment processed', 'PaymentsService');

    expect(logSpy).toHaveBeenCalledTimes(1);
    const output = logSpy.mock.calls[0][0] as string;

    expect(output).toContain('[LOG]');
    expect(output).toContain('[PaymentsService]');
    expect(output).toContain('[ReqID: req-123]');
    expect(output).toContain('[UserID: user-456]');

    const metadata = extractMetadataFromOutput(output);

    expect(metadata).toBeDefined();
    const typedMetadata = metadata as Record<string, unknown>;

    const details = typedMetadata.details as Record<string, unknown>;
    expect(details.token).toBe('***MASKED***');
    const nestedList = details.nested as Record<string, unknown>[];
    expect(nestedList[0]?.creditCard).toBe('***MASKED***');

    const maskedList = typedMetadata.list as unknown[];
    expect(maskedList[0]).toBe('visible');
    const maskedObject = maskedList[1] as Record<string, unknown>;
    expect(maskedObject.refreshToken).toBe('***MASKED***');
  });

  it('ghi log cảnh báo với ngữ cảnh', () => {
    service.warn('Possible issue detected', 'InventoryService');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const output = warnSpy.mock.calls[0][0] as string;
    expect(output).toContain('[WARN]');
    expect(output).toContain('[InventoryService]');
    expect(output).toContain('Possible issue detected');
  });

  it('ghi log level ERROR với trace', () => {
    service.error('Failed to process', 'stack-trace', 'OrderService');

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [message, trace] = errorSpy.mock.calls[0] as [string, string];

    expect(message).toContain('[ERROR]');
    expect(message).toContain('Failed to process');
    expect(message).toContain('OrderService');
    expect(trace).toBe('stack-trace');
  });

  it('debug không ghi log trong môi trường production', () => {
    process.env.NODE_ENV = 'production';

    service.debug('Hidden debug');

    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('debug hiển thị khi không phải production', () => {
    process.env.NODE_ENV = 'development';

    service.debug('Visible debug');

    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(debugSpy.mock.calls[0][0]).toContain('[DEBUG]');
  });

  it('verbose không log trong production', () => {
    process.env.NODE_ENV = 'production';

    service.verbose('Verbose message');

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('clearContext loại bỏ requestId và userId', () => {
    process.env.NODE_ENV = 'development';

    service.setRequestId('req-temp');
    service.setUserId('user-temp');
    service.setMetadata('public', 'value');

    service.clearContext();
    service.log('Context cleared');

    const output = logSpy.mock.calls[0][0] as string;

    expect(output).not.toContain('req-temp');
    expect(output).not.toContain('user-temp');
    expect(output).toContain('Context cleared');
  });
});
