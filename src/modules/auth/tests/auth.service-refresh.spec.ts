import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

describe('AuthService - Refresh Token', () => {
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
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
    }),
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

  describe('login', () => {
    it('should return both access and refresh tokens', async () => {
      mockRefreshTokenRepository.createRefreshToken.mockResolvedValue(
        mockRefreshToken,
      );

      const result = await service.login(mockUser, {
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        deviceInfo: 'Test Device',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('accessTokenExpiresIn', '15m');
      expect(result).toHaveProperty('refreshTokenExpiresIn', '7d');
      expect(refreshTokenRepository.createRefreshToken).toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    it('should return new access token with valid refresh token', async () => {
      mockRefreshTokenRepository.findByToken.mockResolvedValue(
        mockRefreshToken,
      );

      const result = await service.refreshAccessToken('refresh-token-string');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('tokenType', 'Bearer');
      expect(result).toHaveProperty('expiresIn', '15m');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockRefreshTokenRepository.findByToken.mockResolvedValue(null);

      await expect(service.refreshAccessToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };
      mockRefreshTokenRepository.findByToken.mockResolvedValue(expiredToken);
      mockRefreshTokenRepository.revokeToken.mockResolvedValue(true);

      await expect(service.refreshAccessToken('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(refreshTokenRepository.revokeToken).toHaveBeenCalledWith(
        expiredToken.id,
      );
    });
  });

  describe('logout', () => {
    it('should revoke refresh token successfully', async () => {
      mockRefreshTokenRepository.findByToken.mockResolvedValue(
        mockRefreshToken,
      );
      mockRefreshTokenRepository.revokeToken.mockResolvedValue(true);

      const result = await service.logout('refresh-token-string');

      expect(result).toEqual({ message: 'Đăng xuất thành công' });
      expect(refreshTokenRepository.revokeToken).toHaveBeenCalledWith(
        mockRefreshToken.id,
      );
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockRefreshTokenRepository.findByToken.mockResolvedValue(null);

      await expect(service.logout('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('logoutAll', () => {
    it('should revoke all user tokens', async () => {
      mockRefreshTokenRepository.revokeAllUserTokens.mockResolvedValue(3);

      const result = await service.logoutAll('user-123');

      expect(result).toEqual({
        message: 'Đăng xuất khỏi tất cả thiết bị thành công',
        count: 3,
      });
      expect(refreshTokenRepository.revokeAllUserTokens).toHaveBeenCalledWith(
        'user-123',
      );
    });
  });

  describe('getActiveSessions', () => {
    it('should return list of active sessions', async () => {
      const sessions = [
        mockRefreshToken,
        { ...mockRefreshToken, id: 'token-456' },
      ];
      mockRefreshTokenRepository.findActiveSessionsByUserId.mockResolvedValue(
        sessions,
      );

      const result = await service.getActiveSessions('user-123', 'token-123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('token-123');
      expect(result[0].isCurrent).toBe(true);
      expect(result[1].isCurrent).toBe(false);
    });
  });

  describe('revokeSession', () => {
    it('should revoke specific session', async () => {
      mockRefreshTokenRepository.findOne.mockResolvedValue(mockRefreshToken);
      mockRefreshTokenRepository.revokeToken.mockResolvedValue(true);

      const result = await service.revokeSession('user-123', 'token-123');

      expect(result).toEqual({ message: 'Revoke session thành công' });
      expect(refreshTokenRepository.revokeToken).toHaveBeenCalledWith(
        'token-123',
      );
    });

    it('should throw BadRequestException if session not found', async () => {
      mockRefreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(
        service.revokeSession('user-123', 'invalid-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if session already revoked', async () => {
      mockRefreshTokenRepository.findOne.mockResolvedValue({
        ...mockRefreshToken,
        isRevoked: true,
      });

      await expect(
        service.revokeSession('user-123', 'token-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
