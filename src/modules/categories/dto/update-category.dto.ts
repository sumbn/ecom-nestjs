import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';

/**
 * DTO để cập nhật category
 *
 * Inherit từ CreateCategoryDto nhưng:
 * - Tất cả fields đều optional
 * - Không cho phép update parentId (phải dùng endpoint riêng để move category)
 *
 * Note: Moving category trong tree structure cần validation phức tạp
 * (không thể move parent thành con của chính nó)
 */
export class UpdateCategoryDto extends PartialType(
  OmitType(CreateCategoryDto, ['parentId'] as const),
) {}
