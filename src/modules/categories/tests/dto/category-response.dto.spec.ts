import { CategoryResponseDto } from '../../dto/category-response.dto';
import { Category } from '../../entities/category.entity';
import { TranslatableContent } from '../../../../common/types/translatable-content.type';

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
    expect(dto.name).toBe('Electronics'); // Converted to string (en first)
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
    expect(dto.name).toBe('Electronics'); // Converted to string
    expect(dto.slug).toBeUndefined();
    expect(dto.displayOrder).toBeUndefined();
    expect(dto.isActive).toBeUndefined();
    expect(dto.createdAt).toBeUndefined();
    expect(dto.updatedAt).toBeUndefined();
  });

  it('should use Vietnamese fallback when English translation missing', () => {
    const category = new Category();
    category.id = 'fallback-vi';
    category.name = { vi: 'Điện tử' };
    category.description = { vi: 'Mô tả' };

    const dto = new CategoryResponseDto(category);

    expect(dto.name).toBe('Điện tử');
    expect(dto.description).toBe('Mô tả');
  });

  it('should use first available locale when standard locales missing', () => {
    const category = new Category();
    category.id = 'fallback-fr';
    const localizedName: TranslatableContent = { fr: 'Électronique' };
    const localizedDescription: TranslatableContent = { es: 'Descripción' };
    category.name = localizedName;
    category.description = localizedDescription;

    const dto = new CategoryResponseDto(category);

    expect(dto.name).toBe('Électronique');
    expect(dto.description).toBe('Descripción');
  });

  it('should omit localized fields when values are empty strings', () => {
    const category = new Category();
    category.id = 'empty';
    const emptyName: TranslatableContent = { en: '' };
    const emptyDescription: TranslatableContent = { vi: '' };
    category.name = emptyName;
    category.description = emptyDescription;

    const dto = new CategoryResponseDto(category);

    expect(dto.name).toBeUndefined();
    expect(dto.description).toBeUndefined();
  });

  it('should map nested parent and children recursively', () => {
    const parent = new Category();
    parent.id = 'parent-id';
    parent.name = { en: 'Parent' };
    parent.slug = 'parent';
    parent.children = [];
    parent.createdAt = new Date();
    parent.updatedAt = new Date();

    const child = new Category();
    child.id = 'child-id';
    child.name = { en: 'Child' };
    child.slug = 'child';
    child.children = [];
    child.createdAt = new Date();
    child.updatedAt = new Date();

    const category = new Category();
    category.id = 'root-id';
    category.name = { en: 'Root' };
    category.slug = 'root';
    category.parent = parent;
    category.children = [child];
    category.createdAt = new Date();
    category.updatedAt = new Date();

    const dto = new CategoryResponseDto(category);

    expect(dto.parent?.id).toBe('parent-id');
    expect(dto.children).toHaveLength(1);
    expect(dto.children[0].id).toBe('child-id');
  });
});
