import { validate } from 'class-validator';
import { LoginDto } from '../login.dto';

describe('LoginDto', () => {
  let dto: LoginDto;

  beforeEach(() => {
    dto = new LoginDto();
  });

  describe('email validation', () => {
    it('should pass with valid email', async () => {
      dto.email = 'user@example.com';
      dto.password = 'password123';

      const errors = await validate(dto);
      const emailErrors = errors.filter((error) => error.property === 'email');
      expect(emailErrors.length).toBe(0);
    });

    it('should fail with invalid email format', async () => {
      dto.email = 'invalid-email';
      dto.password = 'password123';

      const errors = await validate(dto);
      const emailErrors = errors.filter((error) => error.property === 'email');
      expect(emailErrors.length).toBe(1);
      expect(emailErrors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail with empty email', async () => {
      dto.email = '';
      dto.password = 'password123';

      const errors = await validate(dto);
      const emailErrors = errors.filter((error) => error.property === 'email');
      expect(emailErrors.length).toBe(1);
    });
  });

  describe('password validation', () => {
    it('should pass with non-empty password', async () => {
      dto.email = 'user@example.com';
      dto.password = 'password123';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(
        (error) => error.property === 'password',
      );
      expect(passwordErrors.length).toBe(0);
    });

    it('should pass with single character password', async () => {
      dto.email = 'user@example.com';
      dto.password = 'a';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(
        (error) => error.property === 'password',
      );
      expect(passwordErrors.length).toBe(0);
    });

    it('should fail with empty password', async () => {
      dto.email = 'user@example.com';
      dto.password = '';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(
        (error) => error.property === 'password',
      );
      expect(passwordErrors.length).toBe(1);
      expect(passwordErrors[0].constraints).toHaveProperty('minLength');
    });
  });

  describe('complete validation', () => {
    it('should pass with valid email and password', async () => {
      dto.email = 'user@example.com';
      dto.password = 'securepassword';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with invalid email and empty password', async () => {
      dto.email = 'invalid';
      dto.password = '';

      const errors = await validate(dto);
      expect(errors.length).toBe(2); // email and password errors
    });
  });
});
