import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';

type UserWithoutPassword = Omit<User, 'passwordHash'>;
type UserForToken = Pick<User, 'id' | 'email' | 'role'>;

/**
 * Interface cho request metadata
 */
export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
}

/**
 * Auth Service với Refresh Token support
 * - Issue access + refresh tokens
 * - Refresh access tokens
 * - Revoke tokens (logout)
 * - Session management
 */
@Injectable()
export class AuthService {
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private refreshTokenRepository: RefreshTokenRepository,
  ) {
    this.accessTokenExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
    this.refreshTokenExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
  }

  /**
   * Validate user credentials
   * @param email - Email của user
   * @param password - Password plaintext
   * @returns User object hoặc null
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.usersService.verifyPassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  /**
   * Generate access token
   * @param user - User object
   * @returns JWT access token
   */
  private generateAccessToken(user: UserForToken): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.accessTokenExpiresIn,
    });
  }

  /**
   * Generate refresh token string
   * @returns Random refresh token
   */
  private generateRefreshTokenString(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Calculate refresh token expiry date
   * @returns Expiry date
   */
  private getRefreshTokenExpiryDate(): Date {
    const expiresIn = this.refreshTokenExpiresIn;
    const match = expiresIn.match(/^(\d+)([dhm])$/);

    if (!match) {
      throw new Error('Invalid refresh token expiry format');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const now = new Date();

    switch (unit) {
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      default:
        throw new Error('Invalid time unit');
    }
  }

  /**
   * Login user và issue tokens
   * @param user - User object từ validation
   * @param metadata - Request metadata (IP, user agent, etc)
   * @returns Auth response với access + refresh tokens
   */
  async login(
    user: UserForToken,
    metadata?: RequestMetadata,
  ): Promise<AuthResponseDto> {
    // Generate access token
    const accessToken = this.generateAccessToken(user);

    // Generate refresh token
    const refreshTokenString = this.generateRefreshTokenString();
    const expiresAt = this.getRefreshTokenExpiryDate();

    // Save refresh token to database
    await this.refreshTokenRepository.createRefreshToken({
      userId: user.id,
      token: refreshTokenString,
      expiresAt,
      deviceInfo: metadata?.deviceInfo || 'Unknown',
      ipAddress: metadata?.ipAddress || 'Unknown',
      userAgent: metadata?.userAgent || 'Unknown',
    });

    return {
      accessToken,
      refreshToken: refreshTokenString,
      tokenType: 'Bearer',
      accessTokenExpiresIn: this.accessTokenExpiresIn,
      refreshTokenExpiresIn: this.refreshTokenExpiresIn,
      user: plainToInstance(UserResponseDto, user, {
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Register user mới
   * @param registerDto - Registration data
   * @param metadata - Request metadata
   * @returns Auth response với tokens
   */
  async register(
    registerDto: RegisterDto,
    metadata?: RequestMetadata,
  ): Promise<AuthResponseDto> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      role: 'user',
    });

    return this.login(user, metadata);
  }

  /**
   * Refresh access token
   * @param refreshToken - Refresh token string
   * @returns New access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    tokenType: string;
    expiresIn: string;
  }> {
    // Validate refresh token
    const tokenRecord =
      await this.refreshTokenRepository.findByToken(refreshToken);

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    // Check if revoked
    if (tokenRecord.isRevoked) {
      throw new UnauthorizedException('Refresh token đã bị thu hồi');
    }

    // Check expiry
    if (new Date() > tokenRecord.expiresAt) {
      await this.refreshTokenRepository.revokeToken(tokenRecord.id);
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }

    // Generate new access token
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = tokenRecord.user;
    const accessToken = this.generateAccessToken(userWithoutPassword);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenExpiresIn,
    };
  }

  /**
   * Logout - revoke refresh token
   * @param refreshToken - Refresh token to revoke
   * @returns Success message
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    const tokenRecord =
      await this.refreshTokenRepository.findByToken(refreshToken);

    if (!tokenRecord) {
      throw new BadRequestException('Refresh token không hợp lệ');
    }

    await this.refreshTokenRepository.revokeToken(tokenRecord.id);

    return { message: 'Đăng xuất thành công' };
  }

  /**
   * Logout from all devices - revoke all refresh tokens
   * @param userId - User ID
   * @returns Number of sessions revoked
   */
  async logoutAll(userId: string): Promise<{ message: string; count: number }> {
    const count = await this.refreshTokenRepository.revokeAllUserTokens(userId);

    return {
      message: 'Đăng xuất khỏi tất cả thiết bị thành công',
      count,
    };
  }

  /**
   * Get active sessions
   * @param userId - User ID
   * @param currentTokenId - Current token ID to mark as current
   * @returns List of active sessions
   */
  async getActiveSessions(
    userId: string,
    currentTokenId?: string,
  ): Promise<SessionResponseDto[]> {
    const sessions =
      await this.refreshTokenRepository.findActiveSessionsByUserId(userId);

    return sessions.map((session) => {
      const dto = plainToInstance(SessionResponseDto, session, {
        excludeExtraneousValues: true,
      });

      // Mark current session
      Object.defineProperty(dto, 'isCurrent', {
        value: session.id === currentTokenId,
        writable: false,
        enumerable: true,
      });

      return dto;
    });
  }

  /**
   * Revoke specific session
   * @param userId - User ID
   * @param sessionId - Session ID to revoke
   * @returns Success message
   */
  async revokeSession(
    userId: string,
    sessionId: string,
  ): Promise<{ message: string }> {
    const session = await this.refreshTokenRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new BadRequestException('Session không tồn tại');
    }

    if (session.isRevoked) {
      throw new BadRequestException('Session đã bị revoke');
    }

    await this.refreshTokenRepository.revokeToken(sessionId);

    return { message: 'Revoke session thành công' };
  }

  /**
   * Get current user info
   * @param userId - User ID
   * @returns User info
   */
  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(userId);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Cleanup expired tokens (run as cron job)
   * @returns Number of deleted tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    return this.refreshTokenRepository.deleteExpiredTokens();
  }
}
