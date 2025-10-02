import { Inject } from '@nestjs/common';
import { LOGGER_SERVICE, ILoggerService } from '../logger.interface';

/**
 * Method decorator for automatic logging
 *
 * Logs method entry, exit, and errors
 *
 * Usage:
 * ```typescript
 * @Log()
 * async createUser(dto: CreateUserDto) {
 *   // method implementation
 * }
 * ```
 *
 * Output:
 * - [LOG] [UserService] → createUser(dto)
 * - [LOG] [UserService] ← createUser() completed in 123ms
 * - [ERROR] [UserService] ✗ createUser() failed: error message
 */
export function Log(): MethodDecorator {
  const injectLogger = Inject(LOGGER_SERVICE);

  return (
    target: unknown,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    // Inject logger into class if not already present
    if (!target.logger) {
      injectLogger(target, 'logger');
    }

    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(propertyKey);

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      const logger: ILoggerService = (this as { logger: ILoggerService })
        .logger;
      const startTime = Date.now();

      // Log method entry
      logger.debug(`→ ${methodName}(${args.length} args)`, className);

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        // Log successful completion
        logger.debug(`← ${methodName}() completed in ${duration}ms`, className);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        // Log error
        logger.error(
          `✗ ${methodName}() failed after ${duration}ms: ${error.message}`,
          error.stack,
          className,
        );

        throw error;
      }
    };

    return descriptor;
  };
}
