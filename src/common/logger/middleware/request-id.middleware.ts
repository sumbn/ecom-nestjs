import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LOGGER_SERVICE, ILoggerService } from '../logger.interface';

/**
 * Request ID Middleware
 *
 * Generates unique ID for each request and injects it into:
 * - Logger context (for tracking)
 * - Response headers (for client debugging)
 *
 * Usage:
 * ```typescript
 * // app.module.ts
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer.apply(RequestIdMiddleware).forRoutes('*');
 *   }
 * }
 * ```
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(
    @Inject(LOGGER_SERVICE) private readonly logger: ILoggerService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Check if request already has ID (from load balancer, proxy, etc.)
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    // Store in request object for later use
    (req as Request & { requestId: string }).requestId = requestId;

    // Set in logger context
    this.logger.setRequestId(requestId);

    // Add to response headers for debugging
    res.setHeader('X-Request-ID', requestId);

    // Log incoming request
    this.logger.log(`${req.method} ${req.originalUrl}`, 'RequestIdMiddleware');
    this.logger.setMetadata('ip', req.ip);
    this.logger.setMetadata('userAgent', req.headers['user-agent']);

    // Clear context after response is sent
    res.on('finish', () => {
      this.logger.log(
        `${req.method} ${req.originalUrl} - ${res.statusCode}`,
        'RequestIdMiddleware',
      );
      this.logger.clearContext();
    });

    next();
  }
}
