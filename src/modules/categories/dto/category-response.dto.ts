import { Exclude, Expose, Type } from 'class-transformer';
import { Category } from '../entities/category.entity';

/**
 * DTO cho API response
 *
 * Transformation flow:
 * 1. Category entity → CategoryResponseDto
 * 2. LocalizeInterceptor → Transform JSONB to string (based on locale)
 * 3. TransformInterceptor → Wrap in standard response format
 */
@Exclude()
export class CategoryResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string; // Sẽ là string sau khi qua LocalizeInterceptor

  @Expose()
  description?: string;

  @Expose()
  slug: string;

  @Expose()
  isActive: boolean;

  @Expose()
  displayOrder: number;

  @Expose()
  @Type(() => CategoryResponseDto)
  parent?: CategoryResponseDto;

  @Expose()
  @Type(() => CategoryResponseDto)
  children: CategoryResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(category?: Category) {
    if (category) {
      this.id = category.id;
      this.name = category.name as any;
      this.description = category.description as any;
      this.slug = category.slug;
      this.isActive = category.isActive;
      this.displayOrder = category.displayOrder;
      this.parent = category.parent ? new CategoryResponseDto(category.parent) : undefined;
      this.children = category.children ? category.children.map(child => new CategoryResponseDto(child)) : [];
      this.createdAt = category.createdAt;
      this.updatedAt = category.updatedAt;
    }
  }
}
