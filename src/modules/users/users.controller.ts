import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * User Controller
 * - Tất cả endpoints đều protected (JWT guard global)
 * - Admin-only endpoints: create, delete, list all
 * - User có thể get/update chính mình
 */
@Controller('api/v1/users')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Tạo user mới (admin only)
   * POST /api/v1/users
   */
  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Lấy danh sách users (admin only)
   * GET /api/v1/users?page=1&limit=10
   */
  @Get()
  @Roles('admin')
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    const maxLimit = Math.min(limit, 100);
    const result = await this.usersService.findAll(page, maxLimit);

    return {
      ...result,
      data: result.data.map((user) =>
        plainToInstance(UserResponseDto, user, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  /**
   * Lấy user theo ID
   * GET /api/v1/users/:id
   * - Admin: có thể xem tất cả
   * - User: chỉ xem chính mình
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: any,
  ): Promise<UserResponseDto> {
    // Kiểm tra permission: admin hoặc chính user đó
    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      throw new HttpException('Không có quyền truy cập', HttpStatus.FORBIDDEN);
    }

    const user = await this.usersService.findOne(id);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Update user
   * PATCH /api/v1/users/:id
   * - Admin: có thể update tất cả
   * - User: chỉ update chính mình
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ): Promise<UserResponseDto> {
    // Kiểm tra permission
    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      throw new HttpException('Không có quyền truy cập', HttpStatus.FORBIDDEN);
    }

    const user = await this.usersService.update(id, updateUserDto);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Xóa user (admin only)
   * DELETE /api/v1/users/:id
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
