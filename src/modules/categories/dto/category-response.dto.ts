import { Exclude, Expose, Type } from 'class-transformer';

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
}
