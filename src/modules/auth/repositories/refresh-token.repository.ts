import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';

/**
 * Repository cho RefreshToken operations
 * - CRUD operations cho refresh tokens
 * - Query active sessions
 * - Revoke operations
 */
@Injectable()
export class RefreshTokenRepository extends Repository<RefreshToken> {
  constructor(private dataSource: DataSource) {
    super(RefreshToken, dataSource.createEntityManager());
  }

  /**
   * Tìm refresh token theo token string
   * @param token - Refresh token string
   * @returns RefreshToken hoặc null
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.findOne({
      where: { token, isRevoked: false },
      relations: ['user'],
    });
  }

  /**
   * Tạo refresh token mới
   * @param tokenData - Partial refresh token data
   * @returns RefreshToken đã lưu
   */
  async createRefreshToken(
    tokenData: Partial<RefreshToken>,
  ): Promise<RefreshToken> {
    const refreshToken = this.create(tokenData);
    return this.save(refreshToken);
  }

  /**
   * Revoke một refresh token
   * @param tokenId - UUID của token
   * @returns Success status
   */
  async revokeToken(tokenId: string): Promise<boolean> {
    const result = await this.update(tokenId, {
      isRevoked: true,
      revokedAt: new Date(),
    });
    return result.affected > 0;
  }

  /**
   * Revoke tất cả tokens của user
   * @param userId - UUID của user
   * @returns Number of tokens revoked
   */
  async revokeAllUserTokens(userId: string): Promise<number> {
    const result = await this.update(
      { userId, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
      },
    );
    return result.affected || 0;
  }

  /**
   * Lấy tất cả active sessions của user
   * @param userId - UUID của user
   * @returns Array of active refresh tokens
   */
  async findActiveSessionsByUserId(userId: string): Promise<RefreshToken[]> {
    return this.find({
      where: {
        userId,
        isRevoked: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Xóa expired tokens (cleanup job)
   * @returns Number of deleted tokens
   */
  async deleteExpiredTokens(): Promise<number> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(RefreshToken)
      .where('expiresAt < NOW()')
      .execute();
    return result.affected || 0;
  }

  /**
   * Kiểm tra token có valid không (chưa revoke và chưa expire)
   * @param token - Token string
   * @returns True nếu valid
   */
  async isTokenValid(token: string): Promise<boolean> {
    const refreshToken = await this.findOne({
      where: { token },
      select: ['isRevoked', 'expiresAt'],
    });

    if (!refreshToken || refreshToken.isRevoked) {
      return false;
    }

    return new Date() < refreshToken.expiresAt;
  }
}
