import { CategoryResponseDto } from './category-response.dto';

/**
 * DTO cho tree response
 * GET /categories/tree
 *
 * Trả về full tree structure với unlimited nesting
 */
export class CategoryTreeResponseDto extends CategoryResponseDto {
  children: CategoryTreeResponseDto[];
}
