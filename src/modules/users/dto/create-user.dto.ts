import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';

/**
 * DTO cho việc tạo user mới
 * - Validate email format
 * - Password tối thiểu 8 ký tự
 * - Role mặc định là 'user'
 */
export class CreateUserDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @MaxLength(100, { message: 'Mật khẩu không được vượt quá 100 ký tự' })
  password: string;

  @IsString()
  @MinLength(1, { message: 'Họ không được để trống' })
  @MaxLength(50, { message: 'Họ không được vượt quá 50 ký tự' })
  firstName: string;

  @IsString()
  @MinLength(1, { message: 'Tên không được để trống' })
  @MaxLength(50, { message: 'Tên không được vượt quá 50 ký tự' })
  lastName: string;

  @IsOptional()
  @IsEnum(['user', 'admin'], { message: 'Role phải là user hoặc admin' })
  role?: 'user' | 'admin';
}
