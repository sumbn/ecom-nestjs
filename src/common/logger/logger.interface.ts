/**
 * Token for Dependency Injection
 */
export const LOGGER_SERVICE = Symbol('LOGGER_SERVICE');

/**
 * Log levels following NestJS convention
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  LOG = 'log',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

/**
 * Structured log entry
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logger interface - all implementations must follow this contract
 */
export interface ILoggerService {
  /**
   * Log an error message
   */
  error(message: string, trace?: string, context?: string): void;

  /**
   * Log a warning message
   */
  warn(message: string, context?: string): void;

  /**
   * Log an informational message
   */
  log(message: string, context?: string): void;

  /**
   * Log a debug message (development only)
   */
  debug(message: string, context?: string): void;

  /**
   * Log a verbose message (detailed debugging)
   */
  verbose(message: string, context?: string): void;

  /**
   * Set request ID for tracking (from middleware)
   */
  setRequestId(requestId: string): void;

  /**
   * Set user ID for audit trail (from auth guard)
   */
  setUserId(userId: string): void;

  /**
   * Add metadata to current log context
   */
  setMetadata(key: string, value: unknown): void;

  /**
   * Clear context (call at end of request)
   */
  clearContext(): void;
}
