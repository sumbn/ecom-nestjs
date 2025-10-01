import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateCategoryDto } from '../../dto/create-category.dto';

describe('CreateCategoryDto', () => {
  it('should pass with valid data (no slug)', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: {
        en: 'Electronics',
        vi: 'Điện tử',
      },
      description: {
        en: 'Electronic devices',
        vi: 'Thiết bị điện tử',
      },
      isActive: true,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with valid slug', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: { en: 'Electronics' },
      slug: 'electronics',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with valid slug containing hyphens', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: { en: 'Electronics' },
      slug: 'dien-tu-thiet-bi',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail with invalid slug (uppercase)', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: { en: 'Electronics' },
      slug: 'Electronics',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('slug');
  });

  it('should fail with invalid slug (special chars)', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: { en: 'Electronics' },
      slug: 'electronics_gadgets',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid slug (spaces)', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: { en: 'Electronics' },
      slug: 'electronics gadgets',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail without name', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      slug: 'electronics',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should pass with valid parentId', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: { en: 'Laptops' },
      parentId: '123e4567-e89b-12d3-a456-426614174000',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail with invalid parentId', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: { en: 'Laptops' },
      parentId: 'invalid-uuid',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with valid displayOrder', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: { en: 'Electronics' },
      displayOrder: 5,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail with negative displayOrder', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: { en: 'Electronics' },
      displayOrder: -1,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
