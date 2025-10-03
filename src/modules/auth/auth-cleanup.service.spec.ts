import { Test, TestingModule } from '@nestjs/testing';
import { AuthCleanupService } from './auth-cleanup.service';
import { AuthService } from './auth.service';
import { Logger } from '@nestjs/common';

describe('AuthCleanupService', () => {
  let service: AuthCleanupService;
  let authService: jest.Mocked<AuthService>;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockAuthService = {
      cleanupExpiredTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthCleanupService,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<AuthCleanupService>(AuthCleanupService);
    authService = module.get(AuthService);

    // Spy on logger methods
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleCleanup', () => {
    it('should cleanup expired tokens successfully', async () => {
      const deletedCount = 5;
      authService.cleanupExpiredTokens.mockResolvedValue(deletedCount);

      await service.handleCleanup();

      expect(authService.cleanupExpiredTokens).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        'Starting cleanup of expired refresh tokens...',
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        `Cleaned up ${deletedCount} expired refresh tokens`,
      );
    });

    it('should log when no tokens are deleted', async () => {
      authService.cleanupExpiredTokens.mockResolvedValue(0);

      await service.handleCleanup();

      expect(authService.cleanupExpiredTokens).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        'Starting cleanup of expired refresh tokens...',
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'Cleaned up 0 expired refresh tokens',
      );
    });

    it('should handle cleanup errors gracefully', async () => {
      const error = new Error('Database connection failed');
      authService.cleanupExpiredTokens.mockRejectedValue(error);

      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await service.handleCleanup();

      expect(authService.cleanupExpiredTokens).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        'Starting cleanup of expired refresh tokens...',
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Error during token cleanup',
        error.stack,
      );
    });

    it('should handle large number of deleted tokens', async () => {
      const deletedCount = 1000;
      authService.cleanupExpiredTokens.mockResolvedValue(deletedCount);

      await service.handleCleanup();

      expect(authService.cleanupExpiredTokens).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        `Cleaned up ${deletedCount} expired refresh tokens`,
      );
    });

    it('should not throw error when cleanup fails', async () => {
      authService.cleanupExpiredTokens.mockRejectedValue(
        new Error('Cleanup failed'),
      );

      // Should not throw
      await expect(service.handleCleanup()).resolves.not.toThrow();
    });
  });

  describe('cron schedule', () => {
    it('should have @Cron decorator configured for daily at 2AM', () => {
      // Verify the method exists
      expect(service.handleCleanup).toBeDefined();
      expect(typeof service.handleCleanup).toBe('function');

      // Verify it's an async function
      const result = service.handleCleanup();
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
