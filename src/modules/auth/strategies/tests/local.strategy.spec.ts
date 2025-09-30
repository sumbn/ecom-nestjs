import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from '../local.strategy';
import { AuthService } from '../../auth.service';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user if credentials are valid', async () => {
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate('test@example.com', 'password123');

      expect(authService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(
        strategy.validate('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        strategy.validate('test@example.com', 'wrongpassword'),
      ).rejects.toThrow('Email hoặc mật khẩu không đúng');
    });

    it('should handle empty email', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate('', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle empty password', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate('test@example.com', '')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle AuthService errors', async () => {
      mockAuthService.validateUser.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        strategy.validate('test@example.com', 'password123'),
      ).rejects.toThrow('Database connection failed');
    });

    it('should work with different email formats', async () => {
      const testCases = [
        'user@domain.com',
        'user.name@domain.co.uk',
        'user+tag@domain.com',
      ];

      for (const email of testCases) {
        mockAuthService.validateUser.mockResolvedValue({
          ...mockUser,
          email,
        });

        const result = await strategy.validate(email, 'password123');
        expect(result.email).toBe(email);
      }
    });
  });
});
