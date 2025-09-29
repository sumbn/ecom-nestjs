import { Expose } from 'class-transformer';

/**
 * DTO cho session info response
 * - Hiển thị thông tin session cho user
 */
export class SessionResponseDto {
  @Expose()
  id: string;

  @Expose()
  deviceInfo: string;

  @Expose()
  ipAddress: string;

  @Expose()
  userAgent: string;

  @Expose()
  createdAt: Date;

  @Expose()
  expiresAt: Date;

  @Expose()
  get isCurrent(): boolean {
    // Sẽ được set trong service
    return false;
  }
}
