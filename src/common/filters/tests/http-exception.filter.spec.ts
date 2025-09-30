import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from '../http-exception.filter';

type MockResponse = {
  status: jest.MockedFunction<(code: number) => MockResponse>;
  json: jest.MockedFunction<(body: unknown) => MockResponse>;
};

type MockRequest = { url: string; method: string };

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: MockResponse;
  let mockRequest: MockRequest;

  beforeEach(async () => {
    filter = new HttpExceptionFilter();

    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock request object
    mockRequest = {
      url: '/test-url',
      method: 'GET',
    };

    // Mock ArgumentsHost
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle HttpException with string message', () => {
      const exception = new HttpException(
        'Test error message',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: ['Test error message'],
          path: '/test-url',
          method: 'GET',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        {
          message: ['Error 1', 'Error 2'],
          errors: { field: 'Invalid field' },
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: ['Error 1', 'Error 2'],
          errors: { field: 'Invalid field' },
        }),
      );
    });

    it('should handle HttpException with array message', () => {
      const exception = new HttpException(
        { message: ['Error 1', 'Error 2'] },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: ['Error 1', 'Error 2'],
        }),
      );
    });

    it('should handle generic Error', () => {
      const exception = new Error('Generic error');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: ['Generic error'],
        }),
      );
    });

    it('should handle unknown exception type', () => {
      const exception = 'String exception';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: ['Internal server error'],
        }),
      );
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const exception = new Error('Test error with stack');
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: expect.any(String),
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should NOT include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const exception = new Error('Test error');
      filter.catch(exception, mockArgumentsHost);

      const jsonCallArg = mockResponse.json.mock.calls[0][0];
      expect(jsonCallArg).not.toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });

    it('should include timestamp in ISO format', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      const jsonCallArg = mockResponse.json.mock.calls[0][0] as {
        timestamp?: unknown;
      };
      expect(String(jsonCallArg.timestamp)).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });

    it('should include request path and method', () => {
      mockRequest.url = '/api/v1/users';
      mockRequest.method = 'POST';

      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/v1/users',
          method: 'POST',
        }),
      );
    });

    it('should handle exception with custom status codes', () => {
      const testCases = [
        HttpStatus.NOT_FOUND,
        HttpStatus.UNAUTHORIZED,
        HttpStatus.FORBIDDEN,
        HttpStatus.CONFLICT,
        HttpStatus.UNPROCESSABLE_ENTITY,
      ];

      testCases.forEach((status) => {
        const exception = new HttpException('Test', status);
        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.status).toHaveBeenCalledWith(status);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: status,
          }),
        );
      });
    });
  });
});
