import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from './auth.service';

/**
 * Service để cleanup expired tokens
 * - Chạy mỗi ngày lúc 2:00 AM
 * - Xóa tokens đã expire khỏi database
 */
@Injectable()
export class AuthCleanupService {
  private readonly logger = new Logger(AuthCleanupService.name);

  constructor(private authService: AuthService) {}

  /**
   * Cleanup expired tokens daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCleanup() {
    this.logger.log('Starting cleanup of expired refresh tokens...');

    try {
      const deletedCount = await this.authService.cleanupExpiredTokens();
      this.logger.log(`Cleaned up ${deletedCount} expired refresh tokens`);
    } catch (error) {
      this.logger.error('Error during token cleanup', error.stack);
    }
  }
}
