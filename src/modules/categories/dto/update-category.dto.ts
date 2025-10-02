import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';

/**
 * DTO để cập nhật category
 *
 * Inherit từ CreateCategoryDto nhưng:
 * - Tất cả fields đều optional
 * - Cho phép update parentId (sẽ validate trong service)
 *
 * Note: Moving category trong tree structure cần validation phức tạp
 * (không thể move parent thành con của chính nó)
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
