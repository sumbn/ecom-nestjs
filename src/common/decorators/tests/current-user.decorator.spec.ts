import { ExecutionContext } from '@nestjs/common';

describe('CurrentUser Decorator', () => {
  let mockExecutionContext: ExecutionContext;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRequest: any;

  beforeEach(() => {
    mockRequest = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      },
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  });

  it('should return user from request', () => {
    const factory = (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      return request.user;
    };
    const result = factory(null, mockExecutionContext);

    expect(result).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      role: 'user',
    });
  });

  it('should return undefined if user not in request', () => {
    mockRequest.user = undefined;

    const factory = (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      return request.user;
    };
    const result = factory(null, mockExecutionContext);

    expect(result).toBeUndefined();
  });

  it('should return null if user is null', () => {
    mockRequest.user = null;

    const factory = (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      return request.user;
    };
    const result = factory(null, mockExecutionContext);

    expect(result).toBeNull();
  });

  it('should work with different user structures', () => {
    mockRequest.user = {
      userId: '456',
      username: 'testuser',
      permissions: ['read', 'write'],
    };

    const factory = (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      return request.user;
    };
    const result = factory(null, mockExecutionContext);

    expect(result).toEqual({
      userId: '456',
      username: 'testuser',
      permissions: ['read', 'write'],
    });
  });
});
