import { validate } from 'class-validator';
import { UpdateCategoryDto } from '../../dto/update-category.dto';
import { TranslatableContentDto } from '../../../../common/dto/translatable-content.dto';

describe('UpdateCategoryDto', () => {
  it('should pass with valid data', async () => {
    const dto = new UpdateCategoryDto();
    dto.name = new TranslatableContentDto();
    dto.name.en = 'Updated Electronics';
    dto.name.vi = 'Điện tử cập nhật';
    dto.slug = 'updated-electronics';
    dto.description = new TranslatableContentDto();
    dto.description.en = 'Updated description';
    dto.description.vi = 'Mô tả cập nhật';
    dto.displayOrder = 5;
    dto.isActive = true;
    dto.parentId = '123e4567-e89b-12d3-a456-426614174000';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with partial data', async () => {
    const dto = new UpdateCategoryDto();
    dto.name = new TranslatableContentDto();
    dto.name.en = 'Updated Electronics';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with empty object', async () => {
    const dto = new UpdateCategoryDto();

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid slug format', async () => {
    const dto = new UpdateCategoryDto();
    dto.slug = 'Invalid Slug!';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('slug');
  });

  it('should fail with negative displayOrder', async () => {
    const dto = new UpdateCategoryDto();
    dto.displayOrder = -1;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('displayOrder');
  });

  it('should fail with non-integer displayOrder', async () => {
    const dto = new UpdateCategoryDto();
    dto.displayOrder = 5.5;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('displayOrder');
  });

  it('should fail with invalid parentId format', async () => {
    const dto = new UpdateCategoryDto();
    dto.parentId = 'invalid-uuid';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('parentId');
  });

  it('should pass with null parentId', async () => {
    const dto = new UpdateCategoryDto();
    dto.parentId = null;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with boolean isActive', async () => {
    const dto = new UpdateCategoryDto();
    dto.isActive = false;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid name structure', async () => {
    const dto = new UpdateCategoryDto();
    dto.name = {} as any;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid description structure', async () => {
    const dto = new UpdateCategoryDto();
    dto.description = {} as any;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
