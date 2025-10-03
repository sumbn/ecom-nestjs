import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthenticatedUser } from './strategies/jwt.strategy';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
// User role type from entity

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockUserResponseData: UserResponseDto = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserResponseDto;

  const mockAuthResponse: AuthResponseDto = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d',
    user: mockUserResponseData,
  };

  const mockSession: SessionResponseDto = {
    id: 'session-123',
    deviceInfo: 'Windows PC',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isCurrent: true,
  };

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
      register: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn(),
      logoutAll: jest.fn(),
      getCurrentUser: jest.fn(),
      getActiveSessions: jest.fn(),
      revokeSession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    const mockRequest = { user: mockUser };
    const ip = '127.0.0.1';
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

    it('should login successfully with Windows PC device', async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(
        mockRequest,
        loginDto,
        ip,
        userAgent,
      );

      expect(result).toEqual(mockAuthResponse);
      expect(authService.login).toHaveBeenCalledWith(mockUser, {
        ipAddress: ip,
        userAgent: userAgent,
        deviceInfo: 'Windows PC',
      });
    });

    it('should detect Mobile device', async () => {
      const mobileUserAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) Mobile';
      authService.login.mockResolvedValue(mockAuthResponse);

      await controller.login(mockRequest, loginDto, ip, mobileUserAgent);

      expect(authService.login).toHaveBeenCalledWith(mockUser, {
        ipAddress: ip,
        userAgent: mobileUserAgent,
        deviceInfo: 'Mobile Device',
      });
    });

    it('should detect Tablet device', async () => {
      const tabletUserAgent =
        'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) Tablet';
      authService.login.mockResolvedValue(mockAuthResponse);

      await controller.login(mockRequest, loginDto, ip, tabletUserAgent);

      expect(authService.login).toHaveBeenCalledWith(mockUser, {
        ipAddress: ip,
        userAgent: tabletUserAgent,
        deviceInfo: 'Tablet',
      });
    });

    it('should detect Mac device', async () => {
      const macUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';
      authService.login.mockResolvedValue(mockAuthResponse);

      await controller.login(mockRequest, loginDto, ip, macUserAgent);

      expect(authService.login).toHaveBeenCalledWith(mockUser, {
        ipAddress: ip,
        userAgent: macUserAgent,
        deviceInfo: 'Mac',
      });
    });

    it('should detect Linux device', async () => {
      const linuxUserAgent = 'Mozilla/5.0 (X11; Linux x86_64)';
      authService.login.mockResolvedValue(mockAuthResponse);

      await controller.login(mockRequest, loginDto, ip, linuxUserAgent);

      expect(authService.login).toHaveBeenCalledWith(mockUser, {
        ipAddress: ip,
        userAgent: linuxUserAgent,
        deviceInfo: 'Linux',
      });
    });

    it('should handle unknown device when user agent is empty', async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      await controller.login(mockRequest, loginDto, ip, '');

      expect(authService.login).toHaveBeenCalledWith(mockUser, {
        ipAddress: ip,
        userAgent: '',
        deviceInfo: 'Unknown Device',
      });
    });

    it('should handle unknown device when user agent is unrecognized', async () => {
      const unknownUserAgent = 'CustomBrowser/1.0';
      authService.login.mockResolvedValue(mockAuthResponse);

      await controller.login(mockRequest, loginDto, ip, unknownUserAgent);

      expect(authService.login).toHaveBeenCalledWith(mockUser, {
        ipAddress: ip,
        userAgent: unknownUserAgent,
        deviceInfo: 'Unknown Device',
      });
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User',
    };

    const ip = '127.0.0.1';
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

    it('should register successfully', async () => {
      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto, ip, userAgent);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto, {
        ipAddress: ip,
        userAgent: userAgent,
        deviceInfo: 'Windows PC',
      });
    });

    it('should register with mobile device info', async () => {
      const mobileUserAgent = 'Mozilla/5.0 (iPhone) Mobile';
      authService.register.mockResolvedValue(mockAuthResponse);

      await controller.register(registerDto, ip, mobileUserAgent);

      expect(authService.register).toHaveBeenCalledWith(registerDto, {
        ipAddress: ip,
        userAgent: mobileUserAgent,
        deviceInfo: 'Mobile Device',
      });
    });
  });

  describe('refresh', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should refresh access token successfully', async () => {
      const mockRefreshResponse = {
        accessToken: 'new-access-token',
        tokenType: 'Bearer',
        expiresIn: '15m',
      };

      authService.refreshAccessToken.mockResolvedValue(mockRefreshResponse);

      const result = await controller.refresh(refreshTokenDto);

      expect(result).toEqual(mockRefreshResponse);
      expect(authService.refreshAccessToken).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
    });
  });

  describe('logout', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should logout successfully', async () => {
      const mockLogoutResponse = { message: 'Logged out successfully' };
      authService.logout.mockResolvedValue(mockLogoutResponse);

      const result = await controller.logout(refreshTokenDto);

      expect(result).toEqual(mockLogoutResponse);
      expect(authService.logout).toHaveBeenCalledWith('valid-refresh-token');
    });
  });

  describe('logoutAll', () => {
    it('should logout from all devices successfully', async () => {
      const mockLogoutAllResponse = {
        message: 'Logged out from all devices',
        count: 3,
      };

      authService.logoutAll.mockResolvedValue(mockLogoutAllResponse);

      const result = await controller.logoutAll(mockUser);

      expect(result).toEqual(mockLogoutAllResponse);
      expect(authService.logoutAll).toHaveBeenCalledWith('user-123');
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user info successfully', async () => {
      authService.getCurrentUser.mockResolvedValue(mockUserResponseData);

      const result = await controller.getCurrentUser(mockUser);

      expect(result).toEqual(mockUserResponseData);
      expect(authService.getCurrentUser).toHaveBeenCalledWith('user-123');
    });
  });

  describe('getSessions', () => {
    it('should get active sessions successfully', async () => {
      const mockSessions = [mockSession];
      authService.getActiveSessions.mockResolvedValue(mockSessions);

      const result = await controller.getSessions(mockUser);

      expect(result).toEqual(mockSessions);
      expect(authService.getActiveSessions).toHaveBeenCalledWith('user-123');
    });

    it('should return empty array when no active sessions', async () => {
      authService.getActiveSessions.mockResolvedValue([]);

      const result = await controller.getSessions(mockUser);

      expect(result).toEqual([]);
      expect(authService.getActiveSessions).toHaveBeenCalledWith('user-123');
    });
  });

  describe('revokeSession', () => {
    const sessionId = 'session-123';

    it('should revoke session successfully', async () => {
      const mockRevokeResponse = { message: 'Session revoked successfully' };
      authService.revokeSession.mockResolvedValue(mockRevokeResponse);

      const result = await controller.revokeSession(mockUser, sessionId);

      expect(result).toEqual(mockRevokeResponse);
      expect(authService.revokeSession).toHaveBeenCalledWith(
        'user-123',
        sessionId,
      );
    });
  });

  describe('parseDeviceInfo', () => {
    it('should prioritize Mobile over other platforms', async () => {
      // Mobile có trong Windows user agent
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Mobile';
      authService.login.mockResolvedValue(mockAuthResponse);

      await controller.login(
        { user: mockUser },
        {} as LoginDto,
        '127.0.0.1',
        userAgent,
      );

      expect(authService.login).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          deviceInfo: 'Mobile Device',
        }),
      );
    });

    it('should prioritize Tablet over Windows/Mac/Linux', async () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0) Tablet';
      authService.login.mockResolvedValue(mockAuthResponse);

      await controller.login(
        { user: mockUser },
        {} as LoginDto,
        '127.0.0.1',
        userAgent,
      );

      expect(authService.login).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          deviceInfo: 'Tablet',
        }),
      );
    });
  });
});
