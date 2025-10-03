import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MoveCategoryDto } from './dto/move-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CategoryTreeResponseDto } from './dto/category-tree-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/v1/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles('admin')
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @Public()
  async findAll(
    @Query() query: QueryCategoryDto,
  ): Promise<{ data: CategoryResponseDto[]; total: number }> {
    return this.categoriesService.findAll(query);
  }

  @Get('tree')
  @Public()
  async getTree(
    @Query('onlyActive') onlyActive: boolean = true,
  ): Promise<CategoryTreeResponseDto[]> {
    return this.categoriesService.getTree(onlyActive);
  }

  @Get('roots')
  @Public()
  async getRoots(
    @Query('onlyActive') onlyActive: boolean = true,
  ): Promise<CategoryResponseDto[]> {
    return this.categoriesService.getRoots(onlyActive);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
    return this.categoriesService.findOne(id);
  }

  @Get('slug/:slug')
  @Public()
  async findBySlug(@Param('slug') slug: string): Promise<CategoryResponseDto> {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':id/children')
  @Public()
  async getChildren(
    @Param('id') id: string,
    @Query('onlyActive') onlyActive: boolean = true,
  ): Promise<CategoryResponseDto[]> {
    return this.categoriesService.getChildren(id, onlyActive);
  }

  @Get(':id/ancestors')
  @Public()
  async getAncestors(@Param('id') id: string): Promise<CategoryResponseDto[]> {
    return this.categoriesService.getAncestors(id);
  }

  @Get(':id/descendants')
  @Public()
  async getDescendants(
    @Param('id') id: string,
  ): Promise<CategoryTreeResponseDto[]> {
    return this.categoriesService.getDescendants(id);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Patch(':id/move')
  @Roles('admin')
  async move(
    @Param('id') id: string,
    @Body() moveCategoryDto: MoveCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.move(id, moveCategoryDto);
  }

  @Patch('bulk/display-order')
  @Roles('admin')
  async bulkUpdateDisplayOrder(
    @Body() updates: Array<{ id: string; displayOrder: number }>,
  ): Promise<void> {
    return this.categoriesService.bulkUpdateDisplayOrder(updates);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.categoriesService.remove(id);
  }
}
