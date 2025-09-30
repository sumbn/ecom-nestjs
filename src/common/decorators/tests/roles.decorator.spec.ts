import { SetMetadata } from '@nestjs/common';
import { Roles, ROLES_KEY } from '../roles.decorator';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn((key, value) => ({ key, value })),
}));

describe('Roles Decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set metadata with single role', () => {
    const result = Roles('admin');

    expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['admin']);
    expect(result).toEqual({
      key: ROLES_KEY,
      value: ['admin'],
    });
  });

  it('should set metadata with multiple roles', () => {
    const result = Roles('admin', 'user', 'moderator');

    expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, [
      'admin',
      'user',
      'moderator',
    ]);
    expect(result).toEqual({
      key: ROLES_KEY,
      value: ['admin', 'user', 'moderator'],
    });
  });

  it('should export ROLES_KEY constant', () => {
    expect(ROLES_KEY).toBe('roles');
  });

  it('should handle empty roles array', () => {
    const result = Roles();

    expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, []);
    expect(result).toEqual({
      key: ROLES_KEY,
      value: [],
    });
  });
});
