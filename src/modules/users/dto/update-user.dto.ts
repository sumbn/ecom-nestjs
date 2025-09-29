import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/**
 * DTO cho việc update user
 * - Tất cả fields đều optional
 * - Không cho phép update password qua DTO này (dùng endpoint riêng)
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}
