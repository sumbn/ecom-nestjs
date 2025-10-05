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
  name?: string;

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
  parent?: CategoryResponseDto | null;

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

      const localizedName = CategoryResponseDto.extractLocalizedString(
        category.name,
      );
      if (localizedName !== null) {
        this.name = localizedName;
      }

      const localizedDescription = CategoryResponseDto.extractLocalizedString(
        category.description,
      );
      if (localizedDescription !== null) {
        this.description = localizedDescription;
      }

      this.slug = category.slug;
      this.isActive = category.isActive;
      this.displayOrder = category.displayOrder;
      this.parent = category.parent
        ? new CategoryResponseDto(category.parent)
        : null;
      this.children = category.children
        ? category.children.map((child) => new CategoryResponseDto(child))
        : [];
      this.createdAt = category.createdAt;
      this.updatedAt = category.updatedAt;
    }
  }

  private static extractLocalizedString(
    value?: { en?: string; vi?: string } | null,
  ): string | null {
    if (!value) {
      return null;
    }

    if (value.en) {
      return value.en;
    }

    if (value.vi) {
      return value.vi;
    }

    for (const localeKey of Object.keys(value) as Array<keyof typeof value>) {
      const localizedValue = value[localeKey];
      if (typeof localizedValue === 'string' && localizedValue.length > 0) {
        return localizedValue;
      }
    }

    return null;
  }
}
