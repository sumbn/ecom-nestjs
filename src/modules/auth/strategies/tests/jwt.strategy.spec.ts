import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../jwt.strategy';
import { UsersService } from '../../../users/users.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      return null;
    }),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user' as const,
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const payload = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'user' as const,
    };

    it('should return user object if user exists and is active', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(usersService.findOne).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'User không tồn tại hoặc đã bị vô hiệu hóa',
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      mockUsersService.findOne.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle UsersService errors', async () => {
      mockUsersService.findOne.mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(payload)).rejects.toThrow(
        'Database error',
      );
    });

    it('should work with different payload structures', async () => {
      const customPayload = {
        sub: 'user-456',
        email: 'custom@example.com',
        role: 'admin' as const,
      };

      mockUsersService.findOne.mockResolvedValue({
        ...mockUser,
        id: 'user-456',
        email: 'custom@example.com',
        role: 'admin' as const,
      });

      const result = await strategy.validate(customPayload);

      expect(usersService.findOne).toHaveBeenCalledWith('user-456');
      expect(result.role).toBe('admin');
    });
  });

  describe('constructor', () => {
    it('should configure JWT strategy with correct options', async () => {
      // Create a new spy to track constructor calls
      const getSpy = jest.spyOn(mockConfigService, 'get');

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: UsersService,
            useValue: mockUsersService,
          },
        ],
      }).compile();

      const testStrategy = module.get<JwtStrategy>(JwtStrategy);

      expect(testStrategy).toBeDefined();
      expect(getSpy).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
});
