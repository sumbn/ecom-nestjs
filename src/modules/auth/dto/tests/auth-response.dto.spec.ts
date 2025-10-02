import { AuthResponseDto } from '../auth-response.dto';
import { UserResponseDto } from '../../../users/dto/user-response.dto';

describe('AuthResponseDto', () => {
  it('should create with valid data', () => {
    const user = new UserResponseDto();
    user.id = '123e4567-e89b-12d3-a456-426614174000';
    user.email = 'test@example.com';
    user.firstName = 'John';
    user.lastName = 'Doe';

    const dto = new AuthResponseDto();
    dto.user = user;
    dto.accessToken = 'access-token';
    dto.refreshToken = 'refresh-token';

    expect(dto.user).toEqual(user);
    expect(dto.accessToken).toBe('access-token');
    expect(dto.refreshToken).toBe('refresh-token');
  });

  it('should create empty DTO', () => {
    const dto = new AuthResponseDto();

    expect(dto.user).toBeUndefined();
    expect(dto.accessToken).toBeUndefined();
    expect(dto.refreshToken).toBeUndefined();
  });
});
