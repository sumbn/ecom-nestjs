import { DynamicModule, Module, Provider, Global } from '@nestjs/common';
import { LOGGER_SERVICE } from './logger.interface';
import { ConsoleLoggerService } from './logger.console.service';
import { FileLoggerService } from './logger.file.service';

/**
 * Logger Module with switchable adapters
 *
 * Environment variable:
 * - LOG_DRIVER=console (default for development)
 * - LOG_DRIVER=file (for production)
 *
 * Usage:
 * ```typescript
 * // app.module.ts
 * @Module({
 *   imports: [LoggerModule.register()],
 * })
 *
 * // any.service.ts
 * constructor(
 *   @Inject(LOGGER_SERVICE) private readonly logger: ILoggerService
 * ) {}
 * ```
 */
@Global() // Make logger available globally
@Module({})
export class LoggerModule {
  static register(): DynamicModule {
    const driver = process.env.LOG_DRIVER || 'console';

    let provider: Provider = {
      provide: LOGGER_SERVICE,
      useClass: ConsoleLoggerService,
    };

    if (driver === 'file') {
      provider = {
        provide: LOGGER_SERVICE,
        useClass: FileLoggerService,
      };
    }

    return {
      module: LoggerModule,
      providers: [provider],
      exports: [provider],
    };
  }
}
