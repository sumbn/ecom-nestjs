import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type RequestWithUser<T = unknown> = {
  user?: T;
};

export const extractCurrentUser = <T = unknown>(
  ctx: ExecutionContext,
): T | undefined => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser<T>>();

  return request?.user;
};

/**
 * @CurrentUser() decorator
 * - Lấy user object từ request (đã được attach bởi JWT strategy)
 * - Sử dụng: @CurrentUser() user: any
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => extractCurrentUser(ctx),
);
