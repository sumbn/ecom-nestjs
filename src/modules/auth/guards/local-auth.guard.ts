import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Local Auth Guard
 * - Sử dụng cho login endpoint
 * - Validate credentials với LocalStrategy
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
