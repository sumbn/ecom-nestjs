import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../../../../common/decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);

    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as ExecutionContext;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if route is marked as public', () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it('should call super.canActivate if route is not public', () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      // Mock super class method
      jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if super.canActivate returns false', () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(false);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should check both handler and class for public metadata', () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      guard.canActivate(mockExecutionContext);

      expect(mockExecutionContext.getHandler).toHaveBeenCalled();
      expect(mockExecutionContext.getClass).toHaveBeenCalled();
    });

    it('should prioritize public metadata if present', () => {
      // First call returns true (public)
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      // Should not call super if public
      expect(result).toBe(true);
    });
  });
});
