import { RequestIdMiddleware } from '../middleware/request-id.middleware';
import { ILoggerService } from '../logger.interface';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'generated-uuid'),
}));

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

type MutableRequest = Request & { requestId?: string };

type MockResponse = Response & {
  triggerFinish: () => void;
};

describe('RequestIdMiddleware', () => {
  let logger: jest.Mocked<ILoggerService>;
  let middleware: RequestIdMiddleware;

  const createResponse = (): MockResponse => {
    let finishHandler: (() => void) | undefined;

    const res = {
      statusCode: 200,
      setHeader: jest.fn().mockReturnThis(),
      on: jest.fn((event: string, handler: () => void) => {
        if (event === 'finish') {
          finishHandler = handler;
        }

        return res;
      }),
      triggerFinish: () => finishHandler?.(),
    } as unknown as MockResponse;

    return res;
  };

  beforeEach(() => {
    logger = createMockLogger();
    middleware = new RequestIdMiddleware(logger);
    jest.clearAllMocks();
  });

  it('sử dụng request id có sẵn', () => {
    const req = {
      headers: { 'x-request-id': 'existing-id', 'user-agent': 'jest' },
      method: 'GET',
      originalUrl: '/health',
      ip: '127.0.0.1',
    } as unknown as MutableRequest;

    const res = createResponse();
    const next = jest.fn() as NextFunction;

    middleware.use(req as Request, res as Response, next);

    expect(req.requestId).toBe('existing-id');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', 'existing-id');
    expect(logger.setRequestId).toHaveBeenCalledWith('existing-id');
    expect(logger.setMetadata).toHaveBeenNthCalledWith(1, 'ip', '127.0.0.1');
    expect(logger.setMetadata).toHaveBeenNthCalledWith(2, 'userAgent', 'jest');

    expect(logger.log).toHaveBeenCalledWith(
      'GET /health',
      'RequestIdMiddleware',
    );
    expect(next).toHaveBeenCalled();

    res.triggerFinish();

    expect(logger.log).toHaveBeenCalledWith(
      'GET /health - 200',
      'RequestIdMiddleware',
    );
    expect(logger.clearContext).toHaveBeenCalled();
    expect(uuidv4).not.toHaveBeenCalled();
  });

  it('tạo mới request id khi không có header', () => {
    const req = {
      headers: {},
      method: 'POST',
      originalUrl: '/api/orders',
      ip: '10.0.0.1',
    } as unknown as MutableRequest;

    const res = createResponse();
    const next = jest.fn() as NextFunction;

    middleware.use(req as Request, res as Response, next);

    expect(uuidv4).toHaveBeenCalled();
    expect(req.requestId).toBe('generated-uuid');
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Request-ID',
      'generated-uuid',
    );
    expect(logger.setRequestId).toHaveBeenCalledWith('generated-uuid');

    res.triggerFinish();
    expect(logger.clearContext).toHaveBeenCalled();
  });
});
