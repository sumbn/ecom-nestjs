import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

/**
 * JWT Payload interface
 */
export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: string;
}

/**
 * Authenticated user object attached to request
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

/**
 * JWT Strategy để validate access tokens
 * - Extract token từ Authorization header
 * - Verify token signature
 * - Load user từ database
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Validate JWT payload và load user
   * @param payload - JWT payload đã decode
   * @returns User object (attached vào request.user)
   * @throws UnauthorizedException nếu user không tồn tại hoặc inactive
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findOne(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'User không tồn tại hoặc đã bị vô hiệu hóa',
      );
    }

    // Object này sẽ được attach vào request.user
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
