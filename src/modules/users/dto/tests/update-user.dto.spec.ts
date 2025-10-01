import { validate } from 'class-validator';
import { UpdateUserDto } from '../update-user.dto';

describe('UpdateUserDto', () => {
  let dto: UpdateUserDto;

  beforeEach(() => {
    dto = new UpdateUserDto();
  });

  describe('field optionality', () => {
    it('should pass with empty object (all fields optional)', async () => {
      // Empty object - all fields are optional
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass with partial fields', async () => {
      dto.firstName = 'Updated';
      // Only updating firstName

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('email validation', () => {
    it('should pass with valid email', async () => {
      dto.email = 'updated@example.com';

      const errors = await validate(dto);
      const emailErrors = errors.filter(error => error.property === 'email');
      expect(emailErrors.length).toBe(0);
    });

    it('should fail with invalid email', async () => {
      dto.email = 'invalid-email';

      const errors = await validate(dto);
      const emailErrors = errors.filter(error => error.property === 'email');
      expect(emailErrors.length).toBe(1);
    });
  });

  describe('firstName validation', () => {
    it('should pass with valid firstName', async () => {
      dto.firstName = 'Updated';

      const errors = await validate(dto);
      const firstNameErrors = errors.filter(error => error.property === 'firstName');
      expect(firstNameErrors.length).toBe(0);
    });

    it('should fail with empty firstName', async () => {
      dto.firstName = '';

      const errors = await validate(dto);
      const firstNameErrors = errors.filter(error => error.property === 'firstName');
      expect(firstNameErrors.length).toBe(1);
    });

    it('should fail with firstName too long', async () => {
      dto.firstName = 'a'.repeat(51);

      const errors = await validate(dto);
      const firstNameErrors = errors.filter(error => error.property === 'firstName');
      expect(firstNameErrors.length).toBe(1);
    });
  });

  describe('lastName validation', () => {
    it('should pass with valid lastName', async () => {
      dto.lastName = 'Updated';

      const errors = await validate(dto);
      const lastNameErrors = errors.filter(error => error.property === 'lastName');
      expect(lastNameErrors.length).toBe(0);
    });

    it('should fail with empty lastName', async () => {
      dto.lastName = '';

      const errors = await validate(dto);
      const lastNameErrors = errors.filter(error => error.property === 'lastName');
      expect(lastNameErrors.length).toBe(1);
    });

    it('should fail with lastName too long', async () => {
      dto.lastName = 'a'.repeat(51);

      const errors = await validate(dto);
      const lastNameErrors = errors.filter(error => error.property === 'lastName');
      expect(lastNameErrors.length).toBe(1);
    });
  });

  describe('role validation', () => {
    it('should pass with valid role "user"', async () => {
      dto.role = 'user';

      const errors = await validate(dto);
      const roleErrors = errors.filter(error => error.property === 'role');
      expect(roleErrors.length).toBe(0);
    });

    it('should pass with valid role "admin"', async () => {
      dto.role = 'admin';

      const errors = await validate(dto);
      const roleErrors = errors.filter(error => error.property === 'role');
      expect(roleErrors.length).toBe(0);
    });

    it('should fail with invalid role', async () => {
      (dto as any).role = 'invalid';

      const errors = await validate(dto);
      const roleErrors = errors.filter(error => error.property === 'role');
      expect(roleErrors.length).toBe(1);
    });
  });

  describe('password exclusion', () => {
    it('should not have password field (excluded by OmitType)', () => {
      // UpdateUserDto should not have password property since it's omitted
      expect(dto).not.toHaveProperty('password');
    });
  });

  describe('complete validation', () => {
    it('should pass with all valid optional fields', async () => {
      dto.email = 'updated@example.com';
      dto.firstName = 'Updated';
      dto.lastName = 'Name';
      dto.role = 'admin';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with multiple validation errors', async () => {
      dto.email = 'invalid';
      dto.firstName = '';
      dto.lastName = 'a'.repeat(51);
      (dto as any).role = 'invalid';

      const errors = await validate(dto);
      expect(errors.length).toBe(4); // email, firstName, lastName, role
    });
  });
});
