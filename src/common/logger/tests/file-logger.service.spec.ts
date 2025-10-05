import { FileLoggerService } from '../logger.file.service';
import { LogEntry } from '../logger.interface';
import * as fs from 'fs';

jest.mock('fs');

describe('FileLoggerService', () => {
  const fsMock = fs as jest.Mocked<typeof fs>;

  let service: FileLoggerService;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.LOG_DIR = '/tmp/logs';
    process.env.LOG_MAX_SIZE = '1024';
    process.env.NODE_ENV = 'development';

    fsMock.existsSync.mockReturnValue(false);
    fsMock.mkdirSync.mockImplementation(() => undefined as never);
    fsMock.statSync.mockReturnValue({ size: 0 } as unknown as fs.Stats);
    fsMock.appendFileSync.mockImplementation(() => undefined as never);
    fsMock.renameSync.mockImplementation(() => undefined as never);

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

    service = new FileLoggerService();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleDebugSpy.mockRestore();

    delete process.env.LOG_DIR;
    delete process.env.LOG_MAX_SIZE;
    delete process.env.NODE_ENV;
  });

  it('tạo thư mục log khi chưa tồn tại', () => {
    expect(fsMock.existsSync).toHaveBeenCalledWith('/tmp/logs');
    expect(fsMock.mkdirSync).toHaveBeenCalledWith('/tmp/logs', {
      recursive: true,
    });
  });

  it('ghi log khi file chưa tồn tại', () => {
    fsMock.existsSync.mockReturnValueOnce(false);

    service.log('initial write', 'InitContext');

    expect(fsMock.statSync).not.toHaveBeenCalled();
    expect(fsMock.renameSync).not.toHaveBeenCalled();
    expect(fsMock.appendFileSync).toHaveBeenCalled();
  });

  it('không gọi stat khi file log chưa tồn tại', () => {
    fsMock.existsSync.mockReset();
    fsMock.mkdirSync.mockReset();
    fsMock.statSync.mockReset();
    fsMock.appendFileSync.mockReset();
    fsMock.renameSync.mockReset();

    fsMock.existsSync.mockImplementation((target: fs.PathLike) => {
      const pathStr = target.toString();
      if (pathStr === '/tmp/logs') {
        return true;
      }
      return false;
    });
    fsMock.mkdirSync.mockImplementation(() => undefined as never);
    fsMock.statSync.mockImplementation(
      () => ({ size: 0 }) as unknown as fs.Stats,
    );
    fsMock.appendFileSync.mockImplementation(() => undefined as never);
    fsMock.renameSync.mockImplementation(() => undefined as never);

    service = new FileLoggerService();

    fsMock.statSync.mockClear();
    fsMock.appendFileSync.mockClear();

    service.log('fresh-file', 'FreshContext');

    expect(fsMock.statSync).not.toHaveBeenCalled();
    expect(fsMock.appendFileSync).toHaveBeenCalled();
  });

  it('ghi log khi metadata đã tồn tại từ trước', () => {
    service.setMetadata('foo', 'bar');

    fsMock.existsSync.mockReturnValue(true);
    fsMock.statSync.mockReturnValue({ size: 50 } as unknown as fs.Stats);

    service.log('metadata persists', 'MetaContext');

    const logCall = fsMock.appendFileSync.mock.calls.slice(-1)[0];
    const payload = JSON.parse(logCall[1] as string) as LogEntry;

    expect(payload.metadata?.foo).toBe('bar');
  });

  it('giữ lại metadata cũ khi context đã có và ghi log', () => {
    const serviceWithContext = service as unknown as {
      context: { metadata?: Record<string, unknown> };
    };

    serviceWithContext.context.metadata = { existing: 'value' };

    service.setMetadata('another', 'value');

    fsMock.existsSync.mockReturnValue(true);
    fsMock.statSync.mockReturnValue({ size: 10 } as unknown as fs.Stats);

    service.log('existing metadata log', 'ExistingMetaContext');

    const logCall = fsMock.appendFileSync.mock.calls.slice(-1)[0];
    const payload = JSON.parse(logCall[1] as string) as LogEntry;

    expect(payload.metadata?.existing).toBe('value');
    expect(payload.metadata?.another).toBe('value');
  });

  it('không khởi tạo metadata mới khi context đã tồn tại', () => {
    const internalService = service as unknown as {
      context: {
        metadata?: Record<string, unknown>;
      };
    };

    internalService.context.metadata = { existing: 'value' };

    service.setMetadata('another', 'value');

    expect(internalService.context.metadata).toMatchObject({
      existing: 'value',
      another: 'value',
    });
  });

  it('không gọi stat hoặc rotate khi file log chưa tồn tại', () => {
    fsMock.existsSync.mockImplementation((target: fs.PathLike) => {
      const raw = target.toString();
      if (raw === '/tmp/logs') return true;
      return false;
    });
    fsMock.statSync.mockClear();
    fsMock.appendFileSync.mockClear();

    service.log('no-file-yet', 'NoFileContext');

    expect(fsMock.statSync).not.toHaveBeenCalled();
    expect(fsMock.renameSync).not.toHaveBeenCalled();
    expect(fsMock.appendFileSync).toHaveBeenCalledTimes(1);
  });

  it('giữ nguyên metadata hiện tại khi setMetadata được gọi lại', () => {
    service.setMetadata('info', { foo: 'bar' });
    service.setMetadata('metrics', { count: 1 });
    const serviceWithContext = service as unknown as {
      context: {
        metadata?: Record<string, unknown>;
      };
    };
    const initialMetadataRef = serviceWithContext.context.metadata;

    service.setMetadata('extra', 'value');

    const updatedMetadataRef = serviceWithContext.context.metadata;
    expect(updatedMetadataRef).toBe(initialMetadataRef);
    expect(updatedMetadataRef).toMatchObject({
      info: { foo: 'bar' },
      extra: 'value',
    });
  });

  it('không rotate khi file chưa đạt ngưỡng tối đa', () => {
    fsMock.existsSync.mockReturnValue(true);
    fsMock.statSync.mockReturnValue({ size: 512 } as unknown as fs.Stats);

    service.log('no-rotate', 'NoRotateContext');

    expect(fsMock.renameSync).not.toHaveBeenCalled();
    expect(fsMock.appendFileSync).toHaveBeenCalled();
  });

  it('rotate file khi vượt quá dung lượng cho phép', () => {
    process.env.LOG_MAX_SIZE = '1';
    fsMock.existsSync.mockReturnValue(true);
    fsMock.statSync.mockReturnValue({ size: 5 } as unknown as fs.Stats);

    service = new FileLoggerService();

    fsMock.existsSync.mockReturnValue(true);
    fsMock.statSync.mockReturnValue({ size: 5 } as unknown as fs.Stats);

    service.log('rotate-test', 'RotateContext');

    expect(fsMock.renameSync).toHaveBeenCalled();
    expect(fsMock.appendFileSync).toHaveBeenCalled();
  });

  it('bỏ qua debug và verbose trong môi trường production', () => {
    process.env.NODE_ENV = 'production';

    service = new FileLoggerService();
    fsMock.appendFileSync.mockClear();

    service.debug('skip-debug');
    service.verbose('skip-verbose');

    expect(fsMock.appendFileSync).not.toHaveBeenCalled();
  });

  it('fallback về console khi ghi file thất bại', () => {
    service.setRequestId('req-777');
    service.setUserId('user-888');
    fsMock.appendFileSync.mockImplementationOnce(() => {
      throw new Error('disk-full');
    });

    service.log('should fallback', 'ErrorContext');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to write log to file:',
      expect.any(Error),
    );
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);

    const [formattedMessage] = consoleErrorSpy.mock.calls[1];
    expect(formattedMessage).toContain('[ReqID: req-777]');
    expect(formattedMessage).toContain('[UserID: user-888]');

    service.clearContext();
  });

  it('writeLog tạo file mới và ghi log khi file chưa tồn tại', () => {
    fsMock.existsSync.mockImplementation((target: fs.PathLike) => {
      const raw = target.toString();
      if (raw === '/tmp/logs') return true;
      return false;
    });
    fsMock.appendFileSync.mockClear();

    service.log('file-not-exist', 'CreateFileContext');

    expect(fsMock.statSync).not.toHaveBeenCalled();
    expect(fsMock.renameSync).not.toHaveBeenCalled();
    expect(fsMock.appendFileSync).toHaveBeenCalledTimes(1);
  });

  it('mask metadata nhạy cảm trước khi ghi', () => {
    service.setMetadata('password', 'secret');
    service.setMetadata('count', 1);
    service.setMetadata('details', {
      token: 'abc',
      nested: [{ creditCard: '4111-1111-1111-1111', code: 'OK' }],
    });
    service.setMetadata('profile', { contact: { email: 'user@example.com' } });
    service.setMetadata('preferences', {
      theme: 'dark',
      notifications: { email: true },
    });

    service.log('with metadata', 'MetadataContext');

    const appendCall = fsMock.appendFileSync.mock.calls[0];
    const payload = appendCall[1] as string;
    const parsed = JSON.parse(payload);

    expect(parsed.metadata.password).toBe('secret');
    expect(parsed.metadata.details.token).toBe('***MASKED***');
    expect(parsed.metadata.details.nested[0].creditCard).toBe('***MASKED***');
    expect(parsed.metadata.details.nested[0].code).toBe('OK');
    expect(parsed.metadata.profile.contact.email).toBe('user@example.com');
    expect(parsed.metadata.preferences.notifications.email).toBe(true);
  });

  it('error log hiển thị requestId và userId', () => {
    service.setRequestId('req-333');
    service.setUserId('user-444');

    consoleErrorSpy.mockClear();

    service.error('error-with-ids', undefined, 'ErrorContext');

    const [message] = consoleErrorSpy.mock.calls[0];

    expect(message).toContain('[ReqID: req-333]');
    expect(message).toContain('[UserID: user-444]');
  });

  it('formatConsoleMessage hiển thị context khi không có request/user id', () => {
    service.clearContext();
    consoleErrorSpy.mockClear();

    service.error('error with context', undefined, 'ContextOnly');

    const [contextMessage] = consoleErrorSpy.mock.calls[0];

    expect(contextMessage).toContain('[ERROR]');
    expect(contextMessage).toContain('[ContextOnly]');
    expect(contextMessage).toContain('error with context');
    expect(contextMessage).not.toContain('ReqID');
    expect(contextMessage).not.toContain('UserID');
    service.setRequestId('req-999');
    service.setUserId('user-555');

    fsMock.existsSync.mockReturnValue(true);
    fsMock.statSync.mockReturnValue({ size: 100 } as unknown as fs.Stats);

    service.log('with identifiers', 'IdentContext');

    const logCall = fsMock.appendFileSync.mock.calls.slice(-1)[0];
    const payload = JSON.parse(logCall[1] as string) as LogEntry;

    expect(payload.requestId).toBe('req-999');
    expect(payload.userId).toBe('user-555');

    const formattedMessage = (
      service as unknown as {
        formatConsoleMessage(target: LogEntry): string;
      }
    ).formatConsoleMessage(payload);

    expect(formattedMessage).toContain('[ReqID: req-999]');
    expect(formattedMessage).toContain('[UserID: user-555]');
  });

  it('maskSensitiveData giữ nguyên dữ liệu an toàn', () => {
    service.setMetadata('preferences', {
      settings: {
        locale: 'vi-VN',
        flags: { beta: true },
      },
    });

    fsMock.existsSync.mockReturnValue(true);
    fsMock.statSync.mockReturnValue({ size: 123 } as unknown as fs.Stats);

    service.log('safe-metadata', 'SafeMetaContext');

    const logCall = fsMock.appendFileSync.mock.calls.slice(-1)[0];
    const payload = JSON.parse(logCall[1] as string) as LogEntry & {
      metadata: {
        preferences: {
          settings: {
            locale: string;
            flags: { beta: boolean };
          };
        };
      };
    };

    expect(payload.metadata.preferences.settings.locale).toBe('vi-VN');
    expect(payload.metadata.preferences.settings.flags.beta).toBe(true);
  });

  it('ghi log với metadata đã tồn tại', () => {
    service.setMetadata('foo', 'bar');
    service.setMetadata('baz', 'qux');

    fsMock.existsSync.mockReturnValue(true);
    fsMock.statSync.mockReturnValue({ size: 100 } as unknown as fs.Stats);

    service.log('with existing metadata', 'MetadataContext');

    const logCall = fsMock.appendFileSync.mock.calls.slice(-1)[0];
    const payload = JSON.parse(logCall[1] as string) as LogEntry;

    expect(payload.metadata.foo).toBe('bar');
    expect(payload.metadata.baz).toBe('qux');
    service.clearContext();
  });
});
