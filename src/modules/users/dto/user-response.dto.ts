import { Exclude, Expose } from 'class-transformer';

/**
 * DTO cho response trả về client
 * - Loại bỏ passwordHash khỏi response
 * - Expose chỉ những field cần thiết
 */
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  role: 'user' | 'admin';

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  passwordHash: string;

  /**
   * Computed property: full name
   */
  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
