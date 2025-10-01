import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
  Matches,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TranslatableContentDto } from '../../../common/dto/translatable-content.dto';

/**
 * DTO để tạo category mới
 *
 * Slug strategy: Auto-suggest + Manual override
 * - Nếu không gửi slug: Backend auto-generate từ name.vi hoặc name.en
 * - Nếu gửi slug: Backend validate format và unique
 */
export class CreateCategoryDto {
  @ValidateNested()
  @Type(() => TranslatableContentDto)
  @IsNotEmpty()
  name: TranslatableContentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TranslatableContentDto)
  description?: TranslatableContentDto;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Slug must contain only lowercase letters, numbers, and hyphens (e.g., "dien-tu-thiet-bi")',
  })
  slug?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
