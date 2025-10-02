import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ILoggerService, LogLevel, LogEntry } from './logger.interface';
import * as fs from 'fs';
import * as path from 'path';

/**
 * File logger implementation for production
 * Writes JSON logs to file system with rotation
 */
@Injectable()
export class FileLoggerService implements ILoggerService, NestLoggerService {
  private context: {
    requestId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  } = {};

  private readonly logDir: string;
  private readonly maxFileSize: number;
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

  constructor() {
    this.logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
    this.maxFileSize = parseInt(process.env.LOG_MAX_SIZE || '10485760', 10); // 10MB default
    this.ensureLogDirectory();
  }

  error(message: string, trace?: string, context?: string): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context);
    if (trace) {
      entry.metadata = { ...entry.metadata, trace };
    }
    this.writeLog('error', entry);
    // Also log to console in production for immediate visibility
    console.error(this.formatConsoleMessage(entry), trace || '');
  }

  warn(message: string, context?: string): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.writeLog('warn', entry);
  }

  log(message: string, context?: string): void {
    const entry = this.createLogEntry(LogLevel.LOG, message, context);
    this.writeLog('info', entry);
  }

  debug(message: string, context?: string): void {
    if (process.env.NODE_ENV === 'production') return;
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.writeLog('debug', entry);
  }

  verbose(message: string, context?: string): void {
    if (process.env.NODE_ENV === 'production') return;
    const entry = this.createLogEntry(LogLevel.VERBOSE, message, context);
    this.writeLog('verbose', entry);
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
   * Write log to file
   */
  private writeLog(filename: string, entry: LogEntry): void {
    try {
      const logFile = this.getLogFilePath(filename);
      const logLine = JSON.stringify(entry) + '\n';

      // Check file size and rotate if needed
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        if (stats.size >= this.maxFileSize) {
          this.rotateLogFile(logFile);
        }
      }

      fs.appendFileSync(logFile, logLine, 'utf8');
    } catch (error) {
      // Fallback to console if file write fails
      console.error('Failed to write log to file:', error);
      console.error(this.formatConsoleMessage(entry));
    }
  }

  /**
   * Get log file path for current date
   */
  private getLogFilePath(filename: string): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDir, `${filename}-${date}.log`);
  }

  /**
   * Rotate log file when it exceeds max size
   */
  private rotateLogFile(logFile: string): void {
    const timestamp = Date.now();
    const rotatedFile = logFile.replace('.log', `.${timestamp}.log`);
    fs.renameSync(logFile, rotatedFile);
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Format message for console fallback
   */
  private formatConsoleMessage(entry: LogEntry): string {
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
