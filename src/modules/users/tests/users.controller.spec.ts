import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed',
    firstName: 'Test',
    lastName: 'User',
    role: 'user' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'new@example.com',
      password: 'SecurePassword123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should create a new user', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should transform response to UserResponseDto', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const paginatedResult = {
        data: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockUsersService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(1, 10);

      expect(service.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(
        expect.objectContaining({
          total: 1,
          page: 1,
          limit: 10,
        }),
      );
    });

    it('should use default pagination values', async () => {
      mockUsersService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should limit max records to 100', async () => {
      mockUsersService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      });

      await controller.findAll(1, 200);

      expect(service.findAll).toHaveBeenCalledWith(1, 100);
    });

    it('should exclude passwordHash from response', async () => {
      const paginatedResult = {
        data: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockUsersService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(1, 10);

      result.data.forEach((user) => {
        expect(user).not.toHaveProperty('passwordHash');
      });
    });
  });

  describe('findOne', () => {
    const currentUser = { ...mockUser };

    it('should return user by id if user is admin', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      currentUser.role = 'admin';

      const result = await controller.findOne('user-456', currentUser);

      expect(service.findOne).toHaveBeenCalledWith('user-456');
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should return user by id if user is requesting their own data', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-123', currentUser);

      expect(service.findOne).toHaveBeenCalledWith('user-123');
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if user tries to access other user data', async () => {
      currentUser.role = 'user';

      await expect(
        controller.findOne('other-user-id', currentUser),
      ).rejects.toThrow(HttpException);

      await expect(
        controller.findOne('other-user-id', currentUser),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.FORBIDDEN,
        }),
      );
    });

    it('should exclude passwordHash from response', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      currentUser.role = 'admin';

      const result = await controller.findOne('user-456', currentUser);

      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
    };

    const currentUser = { ...mockUser };

    it('should update user if user is admin', async () => {
      mockUsersService.update.mockResolvedValue({
        ...mockUser,
        ...updateUserDto,
      });
      currentUser.role = 'admin';

      const result = await controller.update(
        'user-456',
        updateUserDto,
        currentUser,
      );

      expect(service.update).toHaveBeenCalledWith('user-456', updateUserDto);
      expect(result.firstName).toBe('Updated');
    });

    it('should update user if user is updating their own data', async () => {
      mockUsersService.update.mockResolvedValue({
        ...mockUser,
        ...updateUserDto,
      });

      const result = await controller.update(
        'user-123',
        updateUserDto,
        currentUser,
      );

      expect(service.update).toHaveBeenCalledWith('user-123', updateUserDto);
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if user tries to update other user', async () => {
      currentUser.role = 'user';

      await expect(
        controller.update('other-user-id', updateUserDto, currentUser),
      ).rejects.toThrow(HttpException);

      await expect(
        controller.update('other-user-id', updateUserDto, currentUser),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.FORBIDDEN,
        }),
      );
    });

    it('should exclude passwordHash from response', async () => {
      mockUsersService.update.mockResolvedValue({
        ...mockUser,
        ...updateUserDto,
      });
      currentUser.role = 'admin';

      const result = await controller.update(
        'user-456',
        updateUserDto,
        currentUser,
      );

      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('remove', () => {
    it('should delete user', async () => {
      mockUsersService.remove.mockResolvedValue({
        message: 'Xóa user thành công',
      });

      const result = await controller.remove('user-123');

      expect(service.remove).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ message: 'Xóa user thành công' });
    });

    it('should handle service errors', async () => {
      mockUsersService.remove.mockRejectedValue(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );

      await expect(controller.remove('non-existent-id')).rejects.toThrow(
        HttpException,
      );
    });
  });
});
