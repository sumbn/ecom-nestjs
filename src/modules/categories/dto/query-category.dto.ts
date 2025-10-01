import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsUUID,
  IsString,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * DTO cho query parameters
 * GET /categories?page=1&limit=20&isActive=true&parentId=xxx
 */
export class QueryCategoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['en', 'vi'])
  locale?: string = 'en';
}
