import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users.service';
import { UsersRepository } from '../users.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  // Mock data
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    passwordHash: 'hashedPassword123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersRepository = {
    findByEmail: jest.fn(),
    findActiveById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    softDeleteUser: jest.fn(),
    findAllActive: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'BCRYPT_ROUNDS') return 10;
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'SecurePassword123',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should successfully create a user', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUsersRepository.createUser.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(repository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(repository.createUser).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.createUser).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [mockUser];
      mockUsersRepository.findAllActive.mockResolvedValue([mockUsers, 1]);

      const result = await service.findAll(1, 10);

      expect(repository.findAllActive).toHaveBeenCalledWith(0, 10);
      expect(result).toEqual({
        data: mockUsers,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUsersRepository.findActiveById.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(repository.findActiveById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersRepository.findActiveById.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
    };

    it('should successfully update a user', async () => {
      mockUsersRepository.findActiveById.mockResolvedValue(mockUser);
      mockUsersRepository.updateUser.mockResolvedValue({
        ...mockUser,
        ...updateUserDto,
      });

      const result = await service.update(mockUser.id, updateUserDto);

      expect(repository.findActiveById).toHaveBeenCalledWith(mockUser.id);
      expect(repository.updateUser).toHaveBeenCalledWith(
        mockUser.id,
        updateUserDto,
      );
      expect(result.firstName).toBe('Updated');
    });

    it('should throw ConflictException when updating to existing email', async () => {
      const anotherUser = { ...mockUser, id: 'different-id' };
      mockUsersRepository.findActiveById.mockResolvedValue(mockUser);
      mockUsersRepository.findByEmail.mockResolvedValue(anotherUser);

      await expect(
        service.update(mockUser.id, { email: 'existing@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should successfully soft delete a user', async () => {
      mockUsersRepository.findActiveById.mockResolvedValue(mockUser);
      mockUsersRepository.softDeleteUser.mockResolvedValue(true);

      const result = await service.remove(mockUser.id);

      expect(repository.findActiveById).toHaveBeenCalledWith(mockUser.id);
      expect(repository.softDeleteUser).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ message: 'Xóa user thành công' });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersRepository.findActiveById.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.verifyPassword('password', 'hashedPassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.verifyPassword(
        'wrongpassword',
        'hashedPassword',
      );

      expect(result).toBe(false);
    });
  });
});
