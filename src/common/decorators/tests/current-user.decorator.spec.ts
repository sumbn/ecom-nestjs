import { ExecutionContext } from '@nestjs/common';
import { CurrentUser, extractCurrentUser } from '../current-user.decorator';

describe('CurrentUser Decorator', () => {
  interface MockRequest {
    user?: unknown;
  }

  interface HttpArgumentsHostStub {
    getRequest: () => MockRequest | undefined;
  }

  const buildExecutionContext = (request?: MockRequest): ExecutionContext => {
    const httpHost: HttpArgumentsHostStub = {
      getRequest: (): MockRequest | undefined => request,
    };

    const context = {
      switchToHttp: (): HttpArgumentsHostStub => httpHost,
    };

    return context as ExecutionContext;
  };

  it('should expose decorator factory function', () => {
    expect(typeof CurrentUser).toBe('function');
  });

  it('should extract user using helper function', () => {
    const ctx = buildExecutionContext({ user: { id: 'abc' } });

    expect(extractCurrentUser(ctx)).toEqual({ id: 'abc' });
  });

  it('should return undefined when request is missing user property', () => {
    const ctx = buildExecutionContext({});

    expect(extractCurrentUser(ctx)).toBeUndefined();
  });

  it('should return undefined when request is nullish', () => {
    const ctx = buildExecutionContext(undefined);

    expect(extractCurrentUser(ctx)).toBeUndefined();
  });
});
