import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO cho login request
 * - Email và password validation
 */
export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Password không được để trống' })
  password: string;
}
