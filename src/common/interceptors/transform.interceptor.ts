import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { classToPlain } from 'class-transformer';

/**
 * Interface cho response wrapper chuẩn
 */
export interface Response {
  statusCode: number;
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * Interceptor để transform response thành format chuẩn
 * - Wrap data trong object với metadata
 * - Apply class-transformer để exclude sensitive fields
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response> {
    return next.handle().pipe(
      map((data) => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        message: 'Success',
        data: classToPlain(data), // Apply @Exclude() decorators
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
