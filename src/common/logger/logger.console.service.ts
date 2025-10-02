import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ILoggerService, LogLevel, LogEntry } from './logger.interface';

/**
 * Console logger implementation for development
 * Uses NestJS built-in logger with colored output
 */
@Injectable()
export class ConsoleLoggerService implements ILoggerService, NestLoggerService {
  private context: {
    requestId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  } = {};

  /**
   * Sensitive fields to mask in logs
   */
  private readonly sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'creditCard',
    'cvv',
  ];

  error(message: string, trace?: string, context?: string): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context);
    console.error(this.formatMessage(entry), trace || '');
  }

  warn(message: string, context?: string): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    console.warn(this.formatMessage(entry));
  }

  log(message: string, context?: string): void {
    const entry = this.createLogEntry(LogLevel.LOG, message, context);
    console.log(this.formatMessage(entry));
  }

  debug(message: string, context?: string): void {
    if (process.env.NODE_ENV === 'production') return;
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    console.debug(this.formatMessage(entry));
  }

  verbose(message: string, context?: string): void {
    if (process.env.NODE_ENV === 'production') return;
    const entry = this.createLogEntry(LogLevel.VERBOSE, message, context);
    console.log(this.formatMessage(entry));
  }

  setRequestId(requestId: string): void {
    this.context.requestId = requestId;
  }

  setUserId(userId: string): void {
    this.context.userId = userId;
  }

  setMetadata(key: string, value: unknown): void {
    if (!this.context.metadata) {
      this.context.metadata = {};
    }
    this.context.metadata[key] = this.maskSensitiveData(value);
  }

  clearContext(): void {
    this.context = {};
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
  ): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      requestId: this.context.requestId,
      userId: this.context.userId,
      metadata: this.context.metadata,
    };
  }

  /**
   * Format message for console output
   */
  private formatMessage(entry: LogEntry): string {
    const parts: string[] = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
    ];

    if (entry.context) {
      parts.push(`[${entry.context}]`);
    }

    if (entry.requestId) {
      parts.push(`[ReqID: ${entry.requestId}]`);
    }

    if (entry.userId) {
      parts.push(`[UserID: ${entry.userId}]`);
    }

    parts.push(entry.message);

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      parts.push(JSON.stringify(entry.metadata, null, 2));
    }

    return parts.join(' ');
  }

  /**
   * Mask sensitive data in logs
   */
  private maskSensitiveData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.maskSensitiveData(item));
    }

    const masked = { ...data };
    for (const key in masked) {
      if (this.isSensitiveField(key)) {
        masked[key] = '***MASKED***';
      } else if (typeof masked[key] === 'object') {
        masked[key] = this.maskSensitiveData(masked[key]);
      }
    }

    return masked;
  }

  /**
   * Check if field name is sensitive
   */
  private isSensitiveField(fieldName: string): boolean {
    const lowerFieldName = fieldName.toLowerCase();
    return this.sensitiveFields.some((sensitive) =>
      lowerFieldName.includes(sensitive.toLowerCase()),
    );
  }
}
