import 'reflect-metadata';
import { validate } from 'class-validator';
import { QueryCategoryDto } from '../../dto/query-category.dto';

describe('QueryCategoryDto', () => {
  it('should pass with valid data', async () => {
    const dto = new QueryCategoryDto();
    dto.page = 1;
    dto.limit = 10;
    dto.onlyActive = true;
    dto.search = 'electronics';
    dto.parentId = '123e4567-e89b-12d3-a456-426614174000';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with minimal data', async () => {
    const dto = new QueryCategoryDto();

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with negative page', async () => {
    const dto = new QueryCategoryDto();
    dto.page = -1;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('page');
  });

  it('should fail with zero page', async () => {
    const dto = new QueryCategoryDto();
    dto.page = 0;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('page');
  });

  it('should fail with negative limit', async () => {
    const dto = new QueryCategoryDto();
    dto.limit = -1;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('limit');
  });

  it('should fail with zero limit', async () => {
    const dto = new QueryCategoryDto();
    dto.limit = 0;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('limit');
  });

  it('should fail with limit exceeding maximum', async () => {
    const dto = new QueryCategoryDto();
    dto.limit = 101;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('limit');
  });

  it('should fail with invalid parentId format', async () => {
    const dto = new QueryCategoryDto();
    dto.parentId = 'invalid-uuid';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('parentId');
  });

  it('should pass with null parentId', async () => {
    const dto = new QueryCategoryDto();
    dto.parentId = null;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with boolean onlyActive', async () => {
    const dto = new QueryCategoryDto();
    dto.onlyActive = false;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with string search', async () => {
    const dto = new QueryCategoryDto();
    dto.search = 'test search';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with empty string search', async () => {
    const dto = new QueryCategoryDto();
    dto.search = '';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
