import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { ConfigService } from '@nestjs/config';

/**
 * Service xử lý business logic cho User
 * - Hash password với bcrypt
 * - Validate business rules
 * - Error handling chuẩn
 */
@Injectable()
export class UsersService {
  private readonly bcryptRounds: number;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {
    this.bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS') || 12;
  }

  /**
   * Tạo user mới
   * @param createUserDto - DTO chứa thông tin user
   * @returns User đã tạo (không bao gồm password)
   * @throws ConflictException nếu email đã tồn tại
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Kiểm tra email đã tồn tại
    const existingUser = await this.usersRepository.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    try {
      // Hash password
      const passwordHash = await bcrypt.hash(
        createUserDto.password,
        this.bcryptRounds,
      );

      // Tạo user
      const user = await this.usersRepository.createUser({
        email: createUserDto.email,
        passwordHash,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: createUserDto.role || 'user',
      });

      return user;
    } catch (error) {
      throw new InternalServerErrorException('Không thể tạo user:' + error);
    }
  }

  /**
   * Lấy danh sách users với pagination
   * @param page - Số trang (bắt đầu từ 1)
   * @param limit - Số records mỗi trang
   * @returns Object chứa users array và metadata
   */
  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const [users, total] = await this.usersRepository.findAllActive(
      skip,
      limit,
    );

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Tìm user theo ID
   * @param id - UUID của user
   * @returns User tìm được
   * @throws NotFoundException nếu không tìm thấy
   */
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findActiveById(id);

    if (!user) {
      throw new NotFoundException(`User với ID ${id} không tồn tại`);
    }

    return user;
  }

  /**
   * Tìm user theo email (dùng cho authentication)
   * @param email - Email của user
   * @returns User hoặc null
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  /**
   * Update user
   * @param id - UUID của user
   * @param updateUserDto - DTO chứa data cần update
   * @returns User đã update
   * @throws NotFoundException nếu không tìm thấy
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Kiểm tra user tồn tại
    await this.findOne(id);

    // Nếu update email, kiểm tra trùng
    if (updateUserDto.email) {
      const existingUser = await this.usersRepository.findByEmail(
        updateUserDto.email,
      );
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    const updatedUser = await this.usersRepository.updateUser(
      id,
      updateUserDto,
    );

    if (!updatedUser) {
      throw new InternalServerErrorException('Không thể update user');
    }

    return updatedUser;
  }

  /**
   * Xóa user (soft delete)
   * @param id - UUID của user
   * @returns Success message
   * @throws NotFoundException nếu không tìm thấy
   */
  async remove(id: string): Promise<{ message: string }> {
    // Kiểm tra user tồn tại
    await this.findOne(id);

    const deleted = await this.usersRepository.softDeleteUser(id);

    if (!deleted) {
      throw new InternalServerErrorException('Không thể xóa user');
    }

    return { message: 'Xóa user thành công' };
  }

  /**
   * Verify password của user
   * @param plainPassword - Password plaintext
   * @param hashedPassword - Password đã hash
   * @returns True nếu password đúng
   */
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
