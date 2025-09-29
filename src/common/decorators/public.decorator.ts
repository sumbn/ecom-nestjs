import { SetMetadata } from '@nestjs/common';

/**
 * Key cho Public decorator metadata
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() decorator
 * - Đánh dấu route không cần authentication
 * - Sử dụng: @Public() trên controller method
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
