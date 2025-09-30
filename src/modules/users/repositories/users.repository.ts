import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

/**
 * Repository pattern cho User entity
 * - Tách biệt logic database khỏi business logic
 * - Dễ dàng mock trong unit tests
 * - Reusable query methods
 */
@Injectable()
export class UsersRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  /**
   * Tìm user theo email
   * @param email - Email của user
   * @returns User hoặc null nếu không tìm thấy
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  /**
   * Tìm user theo ID và kiểm tra active status
   * @param id - UUID của user
   * @returns Active user hoặc null
   */
  async findActiveById(id: string): Promise<User | null> {
    return this.findOne({ where: { id, isActive: true } });
  }

  /**
   * Tạo user mới
   * @param userData - Partial user data
   * @returns User đã được lưu
   */
  async createUser(userData: Partial<User>): Promise<User> {
    const user = this.create(userData);
    return this.save(user);
  }

  /**
   * Update user
   * @param id - UUID của user
   * @param updateData - Data cần update
   * @returns User đã được update hoặc null
   */
  async updateUser(
    id: string,
    updateData: Partial<User>,
  ): Promise<User | null> {
    await this.update(id, updateData);
    return this.findOne({ where: { id } });
  }

  /**
   * Soft delete user (set isActive = false)
   * @param id - UUID của user
   * @returns Success status
   */
  async softDeleteUser(id: string): Promise<boolean> {
    const result = await this.update(id, { isActive: false });
    return result.affected > 0;
  }

  /**
   * Lấy tất cả active users với pagination
   * @param skip - Số records bỏ qua
   * @param take - Số records lấy ra
   * @returns Array users và total count
   */
  async findAllActive(skip = 0, take = 10): Promise<[User[], number]> {
    return this.findAndCount({
      where: { isActive: true },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }
}
