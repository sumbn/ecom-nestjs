import { validate } from 'class-validator';
import { RefreshTokenDto } from '../refresh-token.dto';

describe('RefreshTokenDto', () => {
  it('should pass with valid refresh token', async () => {
    const dto = new RefreshTokenDto();
    dto.refreshToken = 'valid-refresh-token';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with empty refresh token', async () => {
    const dto = new RefreshTokenDto();
    dto.refreshToken = '';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('refreshToken');
  });

  it('should fail with undefined refresh token', async () => {
    const dto = new RefreshTokenDto();

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('refreshToken');
  });

  it('should fail with null refresh token', async () => {
    const dto = new RefreshTokenDto();
    dto.refreshToken = null as any;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('refreshToken');
  });
});
