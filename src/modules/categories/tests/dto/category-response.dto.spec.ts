import { CategoryResponseDto } from '../../dto/category-response.dto';
import { Category } from '../../entities/category.entity';

describe('CategoryResponseDto', () => {
  it('should create from Category entity', () => {
    const category = new Category();
    category.id = '123e4567-e89b-12d3-a456-426614174000';
    category.name = { en: 'Electronics', vi: 'Điện tử' };
    category.slug = 'electronics';
    category.displayOrder = 1;
    category.isActive = true;
    category.createdAt = new Date('2024-01-01T00:00:00Z');
    category.updatedAt = new Date('2024-01-01T00:00:00Z');

    const dto = new CategoryResponseDto(category);

    expect(dto.id).toBe(category.id);
    expect(dto.name).toEqual(category.name);
    expect(dto.slug).toBe(category.slug);
    expect(dto.displayOrder).toBe(category.displayOrder);
    expect(dto.isActive).toBe(category.isActive);
    expect(dto.createdAt).toBe(category.createdAt);
    expect(dto.updatedAt).toBe(category.updatedAt);
  });

  it('should create empty DTO without entity', () => {
    const dto = new CategoryResponseDto();

    expect(dto.id).toBeUndefined();
    expect(dto.name).toBeUndefined();
    expect(dto.slug).toBeUndefined();
    expect(dto.displayOrder).toBeUndefined();
    expect(dto.isActive).toBeUndefined();
    expect(dto.createdAt).toBeUndefined();
    expect(dto.updatedAt).toBeUndefined();
  });

  it('should handle null entity', () => {
    const dto = new CategoryResponseDto(null as unknown as Category);

    expect(dto.id).toBeUndefined();
    expect(dto.name).toBeUndefined();
    expect(dto.slug).toBeUndefined();
    expect(dto.displayOrder).toBeUndefined();
    expect(dto.isActive).toBeUndefined();
    expect(dto.createdAt).toBeUndefined();
    expect(dto.updatedAt).toBeUndefined();
  });

  it('should handle entity with partial data', () => {
    const category = new Category();
    category.id = '123e4567-e89b-12d3-a456-426614174000';
    category.name = { en: 'Electronics' };

    const dto = new CategoryResponseDto(category);

    expect(dto.id).toBe(category.id);
    expect(dto.name).toEqual(category.name);
    expect(dto.slug).toBeUndefined();
    expect(dto.displayOrder).toBeUndefined();
    expect(dto.isActive).toBeUndefined();
    expect(dto.createdAt).toBeUndefined();
    expect(dto.updatedAt).toBeUndefined();
  });
});
