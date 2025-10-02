import 'reflect-metadata';
import { validate } from 'class-validator';
import { MoveCategoryDto } from '../../dto/move-category.dto';

describe('MoveCategoryDto', () => {
  it('should pass with valid data', async () => {
    const dto = new MoveCategoryDto();
    dto.parentId = '123e4567-e89b-12d3-a456-426614174000';
    dto.displayOrder = 5;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with only parentId', async () => {
    const dto = new MoveCategoryDto();
    dto.parentId = '123e4567-e89b-12d3-a456-426614174000';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with only displayOrder', async () => {
    const dto = new MoveCategoryDto();
    dto.displayOrder = 5;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with null parentId', async () => {
    const dto = new MoveCategoryDto();
    dto.parentId = null;
    dto.displayOrder = 5;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid parentId format', async () => {
    const dto = new MoveCategoryDto();
    dto.parentId = 'invalid-uuid';
    dto.displayOrder = 5;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('parentId');
  });

  it('should fail with negative displayOrder', async () => {
    const dto = new MoveCategoryDto();
    dto.parentId = '123e4567-e89b-12d3-a456-426614174000';
    dto.displayOrder = -1;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('displayOrder');
  });

  it('should fail with non-integer displayOrder', async () => {
    const dto = new MoveCategoryDto();
    dto.parentId = '123e4567-e89b-12d3-a456-426614174000';
    dto.displayOrder = 5.5;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('displayOrder');
  });

  it('should pass with empty object', async () => {
    const dto = new MoveCategoryDto();

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
