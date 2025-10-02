import { CategoryResponseDto } from './category-response.dto';
import { Category } from '../entities/category.entity';

/**
 * DTO cho tree response
 * GET /categories/tree
 *
 * Trả về full tree structure với unlimited nesting
 */
export class CategoryTreeResponseDto extends CategoryResponseDto {
  children: CategoryTreeResponseDto[];

  constructor(category?: Category) {
    super(category);
    if (category && category.children) {
      this.children = category.children.map(child => new CategoryTreeResponseDto(child));
    } else {
      this.children = [];
    }
  }
}
