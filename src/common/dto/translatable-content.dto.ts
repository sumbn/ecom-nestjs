import { IsString, ValidateIf, IsNotEmpty } from 'class-validator';

/**
 * DTO cho nội dung đa ngôn ngữ
 * Validation: Ít nhất 1 ngôn ngữ phải có (en hoặc vi)
 *
 * Ví dụ valid:
 * - { en: "Electronics" }
 * - { vi: "Điện tử" }
 * - { en: "Electronics", vi: "Điện tử" }
 *
 * Ví dụ invalid:
 * - {} (empty object)
 * - { en: "" } (empty string)
 */
export class TranslatableContentDto {
  @ValidateIf((o) => o.en !== undefined || !o.vi) // Validate if en exists or vi doesn't exist
  @IsString()
  @IsNotEmpty()
  en?: string;

  @ValidateIf((o) => o.vi !== undefined || !o.en) // Validate if vi exists or en doesn't exist
  @IsString()
  @IsNotEmpty()
  vi?: string;
}
