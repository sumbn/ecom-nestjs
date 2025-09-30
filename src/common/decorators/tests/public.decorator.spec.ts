import { SetMetadata } from '@nestjs/common';
import { Public, IS_PUBLIC_KEY } from '../public.decorator';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn((key, value) => ({ key, value })),
}));

describe('Public Decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set metadata with IS_PUBLIC_KEY', () => {
    const result = Public();

    expect(SetMetadata).toHaveBeenCalledWith(IS_PUBLIC_KEY, true);
    expect(result).toEqual({
      key: IS_PUBLIC_KEY,
      value: true,
    });
  });

  it('should export IS_PUBLIC_KEY constant', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });

  it('should be callable multiple times', () => {
    Public();
    Public();
    Public();

    expect(SetMetadata).toHaveBeenCalledTimes(3);
  });
});
