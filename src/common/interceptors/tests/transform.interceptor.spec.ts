import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from '../transform.interceptor';
import { classToPlain } from 'class-transformer';

jest.mock('class-transformer', () => ({
  classToPlain: jest.fn((data) => data),
}));

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<Record<string, unknown>>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockResponse: { statusCode: number };

  beforeEach(async () => {
    interceptor = new TransformInterceptor();

    mockResponse = {
      statusCode: 200,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as ExecutionContext;

    mockCallHandler = {
      handle: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should wrap data in standard response format', (done) => {
      const testData = { id: '123', name: 'Test' };
      mockCallHandler.handle = jest.fn(() => of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (response) => {
          expect(response).toEqual({
            statusCode: 200,
            message: 'Success',
            data: testData,
            timestamp: expect.any(String),
          });
          done();
        },
      });
    });

    it('should apply classToPlain transformation', (done) => {
      const testData = { id: '123', name: 'Test', secret: 'hidden' };
      mockCallHandler.handle = jest.fn(() => of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(classToPlain).toHaveBeenCalledWith(testData);
          done();
        },
      });
    });

    it('should use correct status code from response', (done) => {
      mockResponse.statusCode = 201;
      const testData = { id: '123' };
      mockCallHandler.handle = jest.fn(() => of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (response) => {
          expect(response.statusCode).toBe(201);
          done();
        },
      });
    });

    it('should handle null data', (done) => {
      mockCallHandler.handle = jest.fn(() => of(null));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (response) => {
          expect(response.data).toBeNull();
          expect(response.message).toBe('Success');
          done();
        },
      });
    });

    it('should handle undefined data', (done) => {
      mockCallHandler.handle = jest.fn(() => of(undefined));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (response) => {
          expect(response.data).toBeUndefined();
          done();
        },
      });
    });

    it('should handle array data', (done) => {
      const testData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];
      mockCallHandler.handle = jest.fn(() => of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (response) => {
          expect(response.data).toEqual(testData);
          expect(Array.isArray(response.data)).toBe(true);
          done();
        },
      });
    });

    it('should handle nested objects', (done) => {
      const testData = {
        user: { id: '123', name: 'Test' },
        meta: { total: 10 },
      };
      mockCallHandler.handle = jest.fn(() => of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (response) => {
          expect(response.data).toEqual(testData);
          done();
        },
      });
    });

    it('should include timestamp in ISO format', (done) => {
      mockCallHandler.handle = jest.fn(() => of({ test: true }));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (response) => {
          expect(response.timestamp).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
          );
          done();
        },
      });
    });

    it('should handle empty object', (done) => {
      mockCallHandler.handle = jest.fn(() => of({}));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (response) => {
          expect(response.data).toEqual({});
          done();
        },
      });
    });

    it('should handle string data', (done) => {
      mockCallHandler.handle = jest.fn(() => of('Success message'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (response) => {
          expect(response.data).toBe('Success message');
          done();
        },
      });
    });

    it('should handle boolean data', (done) => {
      mockCallHandler.handle = jest.fn(() => of(true));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (response) => {
          expect(response.data).toBe(true);
          done();
        },
      });
    });

    it('should handle number data', (done) => {
      mockCallHandler.handle = jest.fn(() => of(42));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (response) => {
          expect(response.data).toBe(42);
          done();
        },
      });
    });
  });
});
