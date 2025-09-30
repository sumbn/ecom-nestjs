import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';
import { ROLES_KEY } from '../../../../common/decorators/roles.decorator';

interface MockRequest {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: MockRequest;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);

    mockRequest = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      },
    };

    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as jest.Mocked<ExecutionContext>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if no roles are required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true if user has required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['user']);
      mockRequest.user.role = 'user';

      const result = guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it('should return false if user does not have required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin']);
      mockRequest.user.role = 'user';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return true if user has one of multiple required roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        'admin',
        'moderator',
        'user',
      ]);
      mockRequest.user.role = 'user';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle admin role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin']);
      mockRequest.user.role = 'admin';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return false if user object is missing', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['user']);
      mockRequest.user = undefined;

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return false if user role is missing', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['user']);
      mockRequest.user = { id: 'user-123', email: 'test@example.com' };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should handle empty roles array', () => {
      mockReflector.getAllAndOverride.mockReturnValue([]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should be case-sensitive for roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Admin']);
      mockRequest.user.role = 'admin';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should check both handler and class for roles metadata', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['user']);

      guard.canActivate(mockExecutionContext);

      expect(mockExecutionContext.getHandler).toHaveBeenCalled();
      expect(mockExecutionContext.getClass).toHaveBeenCalled();
    });
  });
});
