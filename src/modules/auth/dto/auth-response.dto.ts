import { UserResponseDto } from '../../users/dto/user-response.dto';

/**
 * DTO cho authentication response
 * - Access token (short-lived)
 * - Refresh token (long-lived)
 * - User info
 */
export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
  user: UserResponseDto;
}
