import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { RefreshTokenRepository } from '../refresh-token.repository';
import { RefreshToken } from '../../entities/refresh-token.entity';

interface MockEntityManager {
  save: jest.Mock;
  create: jest.Mock;
  findOne: jest.Mock;
  find: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  createQueryBuilder: jest.Mock;
}

interface MockQueryBuilder {
  select: jest.Mock;
  getQuery: jest.Mock;
  delete: jest.Mock;
  from: jest.Mock;
  where: jest.Mock;
  execute: jest.Mock;
}

describe('RefreshTokenRepository', () => {
  let repository: RefreshTokenRepository;
  let dataSource: DataSource;
  let mockEntityManager: MockEntityManager;
  let mockQueryBuilder: MockQueryBuilder;

  const mockRefreshToken: Partial<RefreshToken> = {
    id: 'token-123',
    userId: 'user-123',
    token: 'refresh-token-string',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isRevoked: false,
    deviceInfo: 'Test Device',
    ipAddress: '127.0.0.1',
    userAgent: 'Test Agent',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      getQuery: jest.fn().mockReturnValue('NOW()'),
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 0 }),
    };

    mockEntityManager = {
      save: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockDataSource = {
      createEntityManager: jest.fn().mockReturnValue(mockEntityManager),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenRepository,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    repository = module.get<RefreshTokenRepository>(RefreshTokenRepository);
    dataSource = module.get<DataSource>(DataSource);

    // Mock repository methods
    jest
      .spyOn(repository, 'findOne')
      .mockImplementation(mockEntityManager.findOne);
    jest.spyOn(repository, 'find').mockImplementation(mockEntityManager.find);
    jest
      .spyOn(repository, 'create')
      .mockImplementation(mockEntityManager.create);
    jest.spyOn(repository, 'save').mockImplementation(mockEntityManager.save);
    jest
      .spyOn(repository, 'update')
      .mockImplementation(mockEntityManager.update);
    jest
      .spyOn(repository, 'delete')
      .mockImplementation(mockEntityManager.delete);

    jest
      .spyOn(repository, 'createQueryBuilder')
      .mockImplementation(mockEntityManager.createQueryBuilder);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByToken', () => {
    it('should find refresh token by token string', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockRefreshToken);

      const result = await repository.findByToken('refresh-token-string');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { token: 'refresh-token-string', isRevoked: false },
        relations: ['user'],
      });
      expect(result).toEqual(mockRefreshToken);
    });

    it('should return null if token not found', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      const result = await repository.findByToken('non-existent-token');

      expect(result).toBeNull();
    });

    it('should not return revoked tokens', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await repository.findByToken('revoked-token');

      expect(repository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isRevoked: false }),
        }),
      );
    });
  });

  describe('createRefreshToken', () => {
    it('should create and save a refresh token', async () => {
      const tokenData = {
        userId: 'user-123',
        token: 'new-token',
        expiresAt: new Date(),
        deviceInfo: 'Device',
        ipAddress: '127.0.0.1',
      };

      mockEntityManager.create.mockReturnValue(mockRefreshToken);
      mockEntityManager.save.mockResolvedValue(mockRefreshToken);

      const result = await repository.createRefreshToken(tokenData);

      expect(repository.create).toHaveBeenCalledWith(tokenData);
      expect(repository.save).toHaveBeenCalledWith(mockRefreshToken);
      expect(result).toEqual(mockRefreshToken);
    });

    it('should handle partial token data', async () => {
      const partialData = {
        userId: 'user-123',
        token: 'token',
        expiresAt: new Date(),
      };

      mockEntityManager.create.mockReturnValue(partialData);
      mockEntityManager.save.mockResolvedValue(partialData);

      const result = await repository.createRefreshToken(partialData);

      expect(result).toBeDefined();
    });
  });

  describe('revokeToken', () => {
    it('should revoke a token by id', async () => {
      mockEntityManager.update.mockResolvedValue({ affected: 1 });

      const result = await repository.revokeToken('token-123');

      expect(repository.update).toHaveBeenCalledWith('token-123', {
        isRevoked: true,
        revokedAt: expect.any(Date),
      });
      expect(result).toBe(true);
    });

    it('should return false if token not found', async () => {
      mockEntityManager.update.mockResolvedValue({ affected: 0 });

      const result = await repository.revokeToken('non-existent-id');

      expect(result).toBe(false);
    });

    it('should set revokedAt timestamp', async () => {
      const beforeRevoke = new Date();
      mockEntityManager.update.mockResolvedValue({ affected: 1 });

      await repository.revokeToken('token-123');

      const updateCall = (repository.update as jest.Mock).mock.calls[0][1];
      expect(updateCall.revokedAt).toBeInstanceOf(Date);
      expect(updateCall.revokedAt.getTime()).toBeGreaterThanOrEqual(
        beforeRevoke.getTime(),
      );
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for a user', async () => {
      mockEntityManager.update.mockResolvedValue({ affected: 3 });

      const result = await repository.revokeAllUserTokens('user-123');

      expect(repository.update).toHaveBeenCalledWith(
        { userId: 'user-123', isRevoked: false },
        {
          isRevoked: true,
          revokedAt: expect.any(Date),
        },
      );
      expect(result).toBe(3);
    });

    it('should return 0 if no tokens to revoke', async () => {
      mockEntityManager.update.mockResolvedValue({ affected: 0 });

      const result = await repository.revokeAllUserTokens('user-no-tokens');

      expect(result).toBe(0);
    });

    it('should only revoke non-revoked tokens', async () => {
      mockEntityManager.update.mockResolvedValue({ affected: 2 });

      await repository.revokeAllUserTokens('user-123');

      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({ isRevoked: false }),
        expect.any(Object),
      );
    });
  });

  describe('findActiveSessionsByUserId', () => {
    it('should return active sessions for a user', async () => {
      const activeSessions = [
        { ...mockRefreshToken, id: 'token-1' },
        { ...mockRefreshToken, id: 'token-2' },
      ];
      mockEntityManager.find.mockResolvedValue(activeSessions);

      const result = await repository.findActiveSessionsByUserId('user-123');

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isRevoked: false,
        },
        order: {
          createdAt: 'DESC',
        },
      });
      expect(result).toEqual(activeSessions);
    });

    it('should return empty array if no active sessions', async () => {
      mockEntityManager.find.mockResolvedValue([]);

      const result =
        await repository.findActiveSessionsByUserId('user-no-sessions');

      expect(result).toEqual([]);
    });

    it('should order by createdAt DESC', async () => {
      mockEntityManager.find.mockResolvedValue([]);

      await repository.findActiveSessionsByUserId('user-123');

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
        }),
      );
    });
  });

  describe('deleteExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 5 });

      const result = await repository.deleteExpiredTokens();

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(RefreshToken);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('expiresAt < NOW()');
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
      expect(result).toBe(5);
    });

    it('should return 0 if no expired tokens', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 0 });

      const result = await repository.deleteExpiredTokens();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('expiresAt < NOW()');
      expect(result).toBe(0);
    });
  });

  describe('isTokenValid', () => {
    it('should return true for valid token', async () => {
      mockEntityManager.findOne.mockResolvedValue({
        isRevoked: false,
        expiresAt: new Date(Date.now() + 1000000),
      });

      const result = await repository.isTokenValid('valid-token');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { token: 'valid-token' },
        select: ['isRevoked', 'expiresAt'],
      });
      expect(result).toBe(true);
    });

    it('should return false for revoked token', async () => {
      mockEntityManager.findOne.mockResolvedValue({
        isRevoked: true,
        expiresAt: new Date(Date.now() + 1000000),
      });

      const result = await repository.isTokenValid('revoked-token');

      expect(result).toBe(false);
    });

    it('should return false for expired token', async () => {
      mockEntityManager.findOne.mockResolvedValue({
        isRevoked: false,
        expiresAt: new Date(Date.now() - 1000000),
      });

      const result = await repository.isTokenValid('expired-token');

      expect(result).toBe(false);
    });

    it('should return false if token not found', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      const result = await repository.isTokenValid('non-existent-token');

      expect(result).toBe(false);
    });
  });
});
