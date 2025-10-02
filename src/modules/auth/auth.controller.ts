import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Request,
  Delete,
  Param,
  ParseUUIDPipe,
  Ip,
  Headers,
} from '@nestjs/common';
import { AuthService, RequestMetadata } from './auth.service';
import { AuthenticatedUser } from './strategies/jwt.strategy';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserResponseDto } from '../users/dto/user-response.dto';

/**
 * Auth Controller với Refresh Token support
 * - Public: login, register, refresh
 * - Protected: me, sessions, logout, logout-all
 */
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Extract request metadata
   * @param ip - Client IP
   * @param userAgent - User agent string
   * @returns Request metadata object
   */
  private getRequestMetadata(ip: string, userAgent: string): RequestMetadata {
    return {
      ipAddress: ip,
      userAgent: userAgent,
      deviceInfo: this.parseDeviceInfo(userAgent),
    };
  }

  /**
   * Parse device info from user agent
   * @param userAgent - User agent string
   * @returns Simple device description
   */
  private parseDeviceInfo(userAgent: string): string {
    if (!userAgent) return 'Unknown Device';

    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';

    return 'Unknown Device';
  }

  /**
   * Login endpoint
   * POST /api/v1/auth/login
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Request() req: { user: AuthenticatedUser },
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    const metadata = this.getRequestMetadata(ip, userAgent);
    return this.authService.login(req.user, metadata);
  }

  /**
   * Register endpoint
   * POST /api/v1/auth/register
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    const metadata = this.getRequestMetadata(ip, userAgent);
    return this.authService.register(registerDto, metadata);
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  /**
   * Logout current session
   * POST /api/v1/auth/logout
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ message: string }> {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }

  /**
   * Logout from all devices
   * POST /api/v1/auth/logout-all
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string; count: number }> {
    return this.authService.logoutAll(user.id);
  }

  /**
   * Get current user info
   * GET /api/v1/auth/me
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return this.authService.getCurrentUser(user.id);
  }

  /**
   * Get active sessions
   * GET /api/v1/auth/sessions
   */
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SessionResponseDto[]> {
    return this.authService.getActiveSessions(user.id);
  }

  /**
   * Revoke specific session
   * DELETE /api/v1/auth/sessions/:id
   */
  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) sessionId: string,
  ): Promise<{ message: string }> {
    return this.authService.revokeSession(user.id, sessionId);
  }
}
