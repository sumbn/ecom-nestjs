import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

describe('AuthService - Additional Tests', () => {
  let service: AuthService;
  let refreshTokenRepository: RefreshTokenRepository;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed',
    firstName: 'Test',
    lastName: 'User',
    role: 'user' as const,
    isActive: true,
  };

  const mockRefreshToken = {
    id: 'token-123',
    userId: 'user-123',
    token: 'refresh-token-string',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isRevoked: false,
    deviceInfo: 'Test Device',
    ipAddress: '127.0.0.1',
    user: mockUser,
  };

  const mockRefreshTokenRepository = {
    findByToken: jest.fn(),
    createRefreshToken: jest.fn(),
    revokeToken: jest.fn(),
    revokeAllUserTokens: jest.fn(),
    findActiveSessionsByUserId: jest.fn(),
    findOne: jest.fn(),
    deleteExpiredTokens: jest.fn(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    verifyPassword: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mock-access-token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
      return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RefreshTokenRepository,
          useValue: mockRefreshTokenRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    refreshTokenRepository = module.get<RefreshTokenRepository>(
      RefreshTokenRepository,
    );

    jest.clearAllMocks();
  });

  describe('login with metadata', () => {
    it('should store device info in refresh token', async () => {
      mockRefreshTokenRepository.createRefreshToken.mockResolvedValue(
        mockRefreshToken,
      );

      const metadata = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        deviceInfo: 'Chrome on Windows',
      };

      await service.login(mockUser, metadata);

      expect(refreshTokenRepository.createRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceInfo: 'Chrome on Windows',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      );
    });

    it('should use default values if metadata not provided', async () => {
      mockRefreshTokenRepository.createRefreshToken.mockResolvedValue(
        mockRefreshToken,
      );

      await service.login(mockUser);

      expect(refreshTokenRepository.createRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceInfo: 'Unknown',
          ipAddress: 'Unknown',
          userAgent: 'Unknown',
        }),
      );
    });
  });

  describe('getActiveSessions', () => {
    it('should return sessions with isCurrent flag', async () => {
      const sessions = [
        { ...mockRefreshToken, id: 'token-1' },
        { ...mockRefreshToken, id: 'token-2' },
      ];
      mockRefreshTokenRepository.findActiveSessionsByUserId.mockResolvedValue(
        sessions,
      );

      const result = await service.getActiveSessions('user-123', 'token-1');

      expect(result).toHaveLength(2);
      expect(result[0].isCurrent).toBe(true);
      expect(result[1].isCurrent).toBe(false);
    });

    it('should return empty array if no sessions', async () => {
      mockRefreshTokenRepository.findActiveSessionsByUserId.mockResolvedValue(
        [],
      );

      const result = await service.getActiveSessions('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('revokeSession', () => {
    it('should revoke specific session', async () => {
      mockRefreshTokenRepository.findOne.mockResolvedValue(mockRefreshToken);
      mockRefreshTokenRepository.revokeToken.mockResolvedValue(true);

      const result = await service.revokeSession('user-123', 'token-123');

      expect(refreshTokenRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'token-123', userId: 'user-123' },
      });
      expect(refreshTokenRepository.revokeToken).toHaveBeenCalledWith(
        'token-123',
      );
      expect(result).toEqual({ message: 'Revoke session thành công' });
    });

    it('should throw BadRequestException if session not found', async () => {
      mockRefreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(
        service.revokeSession('user-123', 'non-existent-id'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.revokeSession('user-123', 'non-existent-id'),
      ).rejects.toThrow('Session không tồn tại');
    });

    it('should throw BadRequestException if session already revoked', async () => {
      mockRefreshTokenRepository.findOne.mockResolvedValue({
        ...mockRefreshToken,
        isRevoked: true,
      });

      await expect(
        service.revokeSession('user-123', 'token-123'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.revokeSession('user-123', 'token-123'),
      ).rejects.toThrow('Session đã bị revoke');
    });

    it('should not allow revoking other user sessions', async () => {
      mockRefreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(
        service.revokeSession('user-123', 'other-user-session-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should return number of deleted tokens', async () => {
      mockRefreshTokenRepository.deleteExpiredTokens = jest
        .fn()
        .mockResolvedValue(10);

      const result = await service.cleanupExpiredTokens();

      expect(result).toBe(10);
    });

    it('should return 0 if no expired tokens', async () => {
      mockRefreshTokenRepository.deleteExpiredTokens = jest
        .fn()
        .mockResolvedValue(0);

      const result = await service.cleanupExpiredTokens();

      expect(result).toBe(0);
    });
  });

  describe('token expiry calculation', () => {
    it('should calculate correct expiry for days', async () => {
      mockRefreshTokenRepository.createRefreshToken.mockResolvedValue(
        mockRefreshToken,
      );

      await service.login(mockUser);

      const createCall =
        mockRefreshTokenRepository.createRefreshToken.mock.calls[0][0];
      const expiresAt = createCall.expiresAt as Date;
      const now = new Date();
      const diffDays = Math.floor(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      expect(diffDays).toBeGreaterThanOrEqual(6);
      expect(diffDays).toBeLessThanOrEqual(7);
    });

    it('should calculate correct expiry for hours', async () => {
      // Tạo service mới với config khác
      const tempConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'JWT_REFRESH_EXPIRES_IN') return '24h';
          if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
          return null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tempService = new AuthService(
        mockUsersService as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        mockJwtService as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        tempConfigService as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        mockRefreshTokenRepository as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      );

      mockRefreshTokenRepository.createRefreshToken.mockResolvedValue(
        mockRefreshToken,
      );

      await tempService.login(mockUser);

      const createCall =
        mockRefreshTokenRepository.createRefreshToken.mock.calls[0][0];
      const expiresAt = createCall.expiresAt as Date;
      const now = new Date();
      const diffHours = Math.floor(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60),
      );

      expect(diffHours).toBeGreaterThanOrEqual(23);
      expect(diffHours).toBeLessThanOrEqual(24);
    });

    it('should calculate correct expiry for minutes', async () => {
      // Tạo service mới với config khác
      const tempConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'JWT_REFRESH_EXPIRES_IN') return '60m';
          if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
          return null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tempService = new AuthService(
        mockUsersService as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        mockJwtService as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        tempConfigService as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        mockRefreshTokenRepository as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      );

      mockRefreshTokenRepository.createRefreshToken.mockResolvedValue(
        mockRefreshToken,
      );

      await tempService.login(mockUser);

      const createCall =
        mockRefreshTokenRepository.createRefreshToken.mock.calls[0][0];
      const expiresAt = createCall.expiresAt as Date;
      const now = new Date();
      const diffMinutes = Math.floor(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60),
      );

      expect(diffMinutes).toBeGreaterThanOrEqual(59);
      expect(diffMinutes).toBeLessThanOrEqual(60);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockRefreshTokenRepository.createRefreshToken.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.login(mockUser)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle JWT signing errors', async () => {
      mockJwtService.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      await expect(service.login(mockUser)).rejects.toThrow(
        'JWT signing failed',
      );
    });
  });
});
