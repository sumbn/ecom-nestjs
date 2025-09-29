import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO cho refresh token request
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token không được để trống' })
  refreshToken: string;
}
