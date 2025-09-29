import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';

/**
 * Local Strategy cho username/password authentication
 * - Sử dụng email thay vì username
 * - Validate credentials trước khi issue JWT
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Sử dụng email thay vì username
      passwordField: 'password',
    });
  }

  /**
   * Validate user credentials
   * @param email - Email của user
   * @param password - Password plaintext
   * @returns User object nếu credentials hợp lệ
   * @throws UnauthorizedException nếu credentials sai
   */
  async validate(
    email: string,
    password: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    return user;
  }
}
