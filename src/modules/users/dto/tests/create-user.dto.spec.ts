import { validate } from 'class-validator';
import { CreateUserDto } from '../create-user.dto';

describe('CreateUserDto', () => {
  let dto: CreateUserDto;

  beforeEach(() => {
    dto = new CreateUserDto();
  });

  describe('email validation', () => {
    it('should pass with valid email', async () => {
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'User';

      const errors = await validate(dto);
      const emailErrors = errors.filter((error) => error.property === 'email');
      expect(emailErrors.length).toBe(0);
    });

    it('should fail with invalid email', async () => {
      dto.email = 'invalid-email';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'User';

      const errors = await validate(dto);
      const emailErrors = errors.filter((error) => error.property === 'email');
      expect(emailErrors.length).toBe(1);
      expect(emailErrors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail with empty email', async () => {
      dto.email = '';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'User';

      const errors = await validate(dto);
      const emailErrors = errors.filter((error) => error.property === 'email');
      expect(emailErrors.length).toBe(1);
    });
  });

  describe('password validation', () => {
    it('should pass with valid password (8+ characters)', async () => {
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'User';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(
        (error) => error.property === 'password',
      );
      expect(passwordErrors.length).toBe(0);
    });

    it('should fail with password too short', async () => {
      dto.email = 'test@example.com';
      dto.password = '123';
      dto.firstName = 'Test';
      dto.lastName = 'User';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(
        (error) => error.property === 'password',
      );
      expect(passwordErrors.length).toBe(1);
      expect(passwordErrors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail with password too long', async () => {
      dto.email = 'test@example.com';
      dto.password = 'a'.repeat(101);
      dto.firstName = 'Test';
      dto.lastName = 'User';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(
        (error) => error.property === 'password',
      );
      expect(passwordErrors.length).toBe(1);
      expect(passwordErrors[0].constraints).toHaveProperty('maxLength');
    });

    it('should fail with empty password', async () => {
      dto.email = 'test@example.com';
      dto.password = '';
      dto.firstName = 'Test';
      dto.lastName = 'User';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(
        (error) => error.property === 'password',
      );
      expect(passwordErrors.length).toBe(1);
    });
  });

  describe('firstName validation', () => {
    it('should pass with valid firstName', async () => {
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'John';
      dto.lastName = 'User';

      const errors = await validate(dto);
      const firstNameErrors = errors.filter(
        (error) => error.property === 'firstName',
      );
      expect(firstNameErrors.length).toBe(0);
    });

    it('should fail with empty firstName', async () => {
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = '';
      dto.lastName = 'User';

      const errors = await validate(dto);
      const firstNameErrors = errors.filter(
        (error) => error.property === 'firstName',
      );
      expect(firstNameErrors.length).toBe(1);
      expect(firstNameErrors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail with firstName too long', async () => {
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'a'.repeat(51);
      dto.lastName = 'User';

      const errors = await validate(dto);
      const firstNameErrors = errors.filter(
        (error) => error.property === 'firstName',
      );
      expect(firstNameErrors.length).toBe(1);
      expect(firstNameErrors[0].constraints).toHaveProperty('maxLength');
    });
  });

  describe('lastName validation', () => {
    it('should pass with valid lastName', async () => {
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const lastNameErrors = errors.filter(
        (error) => error.property === 'lastName',
      );
      expect(lastNameErrors.length).toBe(0);
    });

    it('should fail with empty lastName', async () => {
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = '';

      const errors = await validate(dto);
      const lastNameErrors = errors.filter(
        (error) => error.property === 'lastName',
      );
      expect(lastNameErrors.length).toBe(1);
      expect(lastNameErrors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail with lastName too long', async () => {
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'a'.repeat(51);

      const errors = await validate(dto);
      const lastNameErrors = errors.filter(
        (error) => error.property === 'lastName',
      );
      expect(lastNameErrors.length).toBe(1);
      expect(lastNameErrors[0].constraints).toHaveProperty('maxLength');
    });
  });

  describe('role validation', () => {
    it('should pass with valid role "user"', async () => {
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'User';
      dto.role = 'user';

      const errors = await validate(dto);
      const roleErrors = errors.filter((error) => error.property === 'role');
      expect(roleErrors.length).toBe(0);
    });

    it('should pass with valid role "admin"', async () => {
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'User';
      dto.role = 'admin';

      const errors = await validate(dto);
      const roleErrors = errors.filter((error) => error.property === 'role');
      expect(roleErrors.length).toBe(0);
    });

    it('should pass without role (optional)', async () => {
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'User';
      // role is optional

      const errors = await validate(dto);
      const roleErrors = errors.filter((error) => error.property === 'role');
      expect(roleErrors.length).toBe(0);
    });

    it('should fail with invalid role', async () => {
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'User';
      (dto as { role: string }).role = 'invalid';

      const errors = await validate(dto);
      const roleErrors = errors.filter((error) => error.property === 'role');
      expect(roleErrors.length).toBe(1);
      expect(roleErrors[0].constraints).toHaveProperty('isEnum');
    });
  });

  describe('complete validation', () => {
    it('should pass with all valid fields', async () => {
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'User';
      dto.role = 'user';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with multiple validation errors', async () => {
      dto.email = 'invalid';
      dto.password = '123';
      dto.firstName = '';
      dto.lastName = '';

      const errors = await validate(dto);
      expect(errors.length).toBe(4); // email, password, firstName, lastName
    });
  });
});
