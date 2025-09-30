import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UsersRepository } from '../repositories/users.repository';
import { User } from '../entities/user.entity';

type MockEntityManager = {
  save: jest.Mock;
  create: jest.Mock;
  findOne: jest.Mock;
  findAndCount: jest.Mock;
  update: jest.Mock;
};

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let mockEntityManager: MockEntityManager;

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockEntityManager = {
      save: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
    };

    const mockDataSource = {
      createEntityManager: jest.fn().mockReturnValue(mockEntityManager),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);

    jest
      .spyOn(repository, 'findOne')
      .mockImplementation(mockEntityManager.findOne);
    jest
      .spyOn(repository, 'findAndCount')
      .mockImplementation(mockEntityManager.findAndCount);
    jest
      .spyOn(repository, 'create')
      .mockImplementation(mockEntityManager.create);
    jest.spyOn(repository, 'save').mockImplementation(mockEntityManager.save);
    jest
      .spyOn(repository, 'update')
      .mockImplementation(mockEntityManager.update);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should be case-sensitive for email', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await repository.findByEmail('Test@Example.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'Test@Example.com' },
      });
    });
  });

  describe('findActiveById', () => {
    it('should find active user by id', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockUser);

      const result = await repository.findActiveById('user-123');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123', isActive: true },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null for inactive user', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      const result = await repository.findActiveById('inactive-user-id');

      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      const result = await repository.findActiveById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create and save a user', async () => {
      const userData = {
        email: 'new@example.com',
        passwordHash: 'hashed',
        firstName: 'New',
        lastName: 'User',
      };

      mockEntityManager.create.mockReturnValue(userData);
      mockEntityManager.save.mockResolvedValue({
        ...userData,
        id: 'new-user-id',
      });

      const result = await repository.createUser(userData);

      expect(repository.create).toHaveBeenCalledWith(userData);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('should handle partial user data', async () => {
      const partialData = {
        email: 'partial@example.com',
        passwordHash: 'hashed',
      };

      mockEntityManager.create.mockReturnValue(partialData);
      mockEntityManager.save.mockResolvedValue(partialData);

      const result = await repository.createUser(partialData);

      expect(result).toBeDefined();
    });
  });

  describe('updateUser', () => {
    it('should update user and return updated user', async () => {
      const updateData = { firstName: 'Updated' };
      const updatedUser = { ...mockUser, ...updateData };

      mockEntityManager.update.mockResolvedValue({ affected: 1 });
      mockEntityManager.findOne.mockResolvedValue(updatedUser);

      const result = await repository.updateUser('user-123', updateData);

      expect(repository.update).toHaveBeenCalledWith('user-123', updateData);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should return null if user not found', async () => {
      mockEntityManager.update.mockResolvedValue({ affected: 0 });
      mockEntityManager.findOne.mockResolvedValue(null);

      const result = await repository.updateUser('non-existent-id', {
        firstName: 'Updated',
      });

      expect(result).toBeNull();
    });

    it('should handle multiple field updates', async () => {
      const updateData = {
        firstName: 'New First',
        lastName: 'New Last',
        isActive: false,
      };

      mockEntityManager.update.mockResolvedValue({ affected: 1 });
      mockEntityManager.findOne.mockResolvedValue({
        ...mockUser,
        ...updateData,
      });

      await repository.updateUser('user-123', updateData);

      expect(repository.update).toHaveBeenCalledWith('user-123', updateData);
    });
  });

  describe('softDeleteUser', () => {
    it('should soft delete user by setting isActive to false', async () => {
      mockEntityManager.update.mockResolvedValue({ affected: 1 });

      const result = await repository.softDeleteUser('user-123');

      expect(repository.update).toHaveBeenCalledWith('user-123', {
        isActive: false,
      });
      expect(result).toBe(true);
    });

    it('should return false if user not found', async () => {
      mockEntityManager.update.mockResolvedValue({ affected: 0 });

      const result = await repository.softDeleteUser('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('findAllActive', () => {
    it('should return paginated active users', async () => {
      const users = [mockUser, { ...mockUser, id: 'user-456' }];
      mockEntityManager.findAndCount.mockResolvedValue([users, 2]);

      const result = await repository.findAllActive(0, 10);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([users, 2]);
    });

    it('should handle custom pagination parameters', async () => {
      mockEntityManager.findAndCount.mockResolvedValue([[], 0]);

      await repository.findAllActive(20, 5);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 5,
        }),
      );
    });

    it('should return empty array if no active users', async () => {
      mockEntityManager.findAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findAllActive(0, 10);

      expect(result).toEqual([[], 0]);
    });

    it('should order by createdAt DESC', async () => {
      mockEntityManager.findAndCount.mockResolvedValue([[], 0]);

      await repository.findAllActive(0, 10);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
        }),
      );
    });
  });
});
