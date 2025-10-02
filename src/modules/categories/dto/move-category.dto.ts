import { IsUUID, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
