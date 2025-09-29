import { SetMetadata } from '@nestjs/common';

/**
 * Key cho Roles decorator metadata
 */
export const ROLES_KEY = 'roles';

/**
 * @Roles() decorator
 * - Chỉ định roles được phép access route
 * - Sử dụng: @Roles('admin', 'user')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
