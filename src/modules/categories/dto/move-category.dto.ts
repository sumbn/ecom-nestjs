import { IsUUID, IsOptional } from 'class-validator';

/**
 * DTO để di chuyển category trong tree
 *
 * Endpoint riêng: PATCH /categories/:id/move
 * Validation phức tạp:
 * - Parent phải tồn tại
 * - Không thể move parent thành con của chính nó
 * - Không thể tạo circular reference
 */
export class MoveCategoryDto {
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
