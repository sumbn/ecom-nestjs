import { CategoryTreeResponseDto } from '../../dto/category-tree-response.dto';
import { Category } from '../../entities/category.entity';

describe('CategoryTreeResponseDto', () => {
  it('should create from Category entity with children', () => {
    const parentCategory = new Category();
    parentCategory.id = '123e4567-e89b-12d3-a456-426614174000';
    parentCategory.name = { en: 'Electronics', vi: 'Điện tử' };
    parentCategory.slug = 'electronics';
    parentCategory.displayOrder = 1;
    parentCategory.isActive = true;
    parentCategory.createdAt = new Date('2024-01-01T00:00:00Z');
    parentCategory.updatedAt = new Date('2024-01-01T00:00:00Z');

    const childCategory = new Category();
    childCategory.id = '123e4567-e89b-12d3-a456-426614174001';
    childCategory.name = { en: 'Laptops', vi: 'Máy tính xách tay' };
    childCategory.slug = 'laptops';
    childCategory.displayOrder = 1;
    childCategory.isActive = true;
    childCategory.createdAt = new Date('2024-01-01T00:00:00Z');
    childCategory.updatedAt = new Date('2024-01-01T00:00:00Z');

    // Mock the children property
    Object.defineProperty(parentCategory, 'children', {
      value: [childCategory],
      writable: true,
    });

    const dto = new CategoryTreeResponseDto(parentCategory);

    expect(dto.id).toBe(parentCategory.id);
    expect(dto.name).toEqual(parentCategory.name);
    expect(dto.slug).toBe(parentCategory.slug);
    expect(dto.displayOrder).toBe(parentCategory.displayOrder);
    expect(dto.isActive).toBe(parentCategory.isActive);
    expect(dto.createdAt).toBe(parentCategory.createdAt);
    expect(dto.updatedAt).toBe(parentCategory.updatedAt);
    expect(dto.children).toHaveLength(1);
    expect(dto.children[0]).toBeInstanceOf(CategoryTreeResponseDto);
    expect(dto.children[0].id).toBe(childCategory.id);
  });

  it('should create from Category entity without children', () => {
    const category = new Category();
    category.id = '123e4567-e89b-12d3-a456-426614174000';
    category.name = { en: 'Electronics', vi: 'Điện tử' };
    category.slug = 'electronics';
    category.displayOrder = 1;
    category.isActive = true;
    category.createdAt = new Date('2024-01-01T00:00:00Z');
    category.updatedAt = new Date('2024-01-01T00:00:00Z');

    // Mock empty children
    Object.defineProperty(category, 'children', {
      value: [],
      writable: true,
    });

    const dto = new CategoryTreeResponseDto(category);

    expect(dto.id).toBe(category.id);
    expect(dto.name).toEqual(category.name);
    expect(dto.slug).toBe(category.slug);
    expect(dto.displayOrder).toBe(category.displayOrder);
    expect(dto.isActive).toBe(category.isActive);
    expect(dto.createdAt).toBe(category.createdAt);
    expect(dto.updatedAt).toBe(category.updatedAt);
    expect(dto.children).toHaveLength(0);
  });

  it('should create empty DTO without entity', () => {
    const dto = new CategoryTreeResponseDto();

    expect(dto.id).toBeUndefined();
    expect(dto.name).toBeUndefined();
    expect(dto.slug).toBeUndefined();
    expect(dto.displayOrder).toBeUndefined();
    expect(dto.isActive).toBeUndefined();
    expect(dto.createdAt).toBeUndefined();
    expect(dto.updatedAt).toBeUndefined();
    expect(dto.children).toEqual([]);
  });

  it('should handle null entity', () => {
    const dto = new CategoryTreeResponseDto(null as any);

    expect(dto.id).toBeUndefined();
    expect(dto.name).toBeUndefined();
    expect(dto.slug).toBeUndefined();
    expect(dto.displayOrder).toBeUndefined();
    expect(dto.isActive).toBeUndefined();
    expect(dto.createdAt).toBeUndefined();
    expect(dto.updatedAt).toBeUndefined();
    expect(dto.children).toEqual([]);
  });

  it('should handle entity with undefined children', () => {
    const category = new Category();
    category.id = '123e4567-e89b-12d3-a456-426614174000';
    category.name = { en: 'Electronics', vi: 'Điện tử' };

    // Mock undefined children
    Object.defineProperty(category, 'children', {
      value: undefined,
      writable: true,
    });

    const dto = new CategoryTreeResponseDto(category);

    expect(dto.id).toBe(category.id);
    expect(dto.name).toEqual(category.name);
    expect(dto.children).toEqual([]);
  });
});
