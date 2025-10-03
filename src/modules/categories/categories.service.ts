import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CategoriesRepository } from './repositories/categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MoveCategoryDto } from './dto/move-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CategoryTreeResponseDto } from './dto/category-tree-response.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    // Check if slug is unique
    const isSlugUnique = await this.categoriesRepository.checkSlugUnique(
      createCategoryDto.slug,
    );
    if (!isSlugUnique) {
      throw new ConflictException(
        `Slug đã tồn tại: '${createCategoryDto.slug}'`,
      );
    }

    // Validate parent exists if provided
    if (createCategoryDto.parentId) {
      const parentExists = await this.categoriesRepository.validateParentExists(
        createCategoryDto.parentId,
      );
      if (!parentExists) {
        throw new BadRequestException(`Parent category không tồn tại`);
      }
    }

    const categoryData = {
      name: createCategoryDto.name,
      description: createCategoryDto.description,
      slug: createCategoryDto.slug,
      displayOrder: createCategoryDto.displayOrder || 0,
      isActive:
        createCategoryDto.isActive !== undefined
          ? createCategoryDto.isActive
          : true,
      parent: createCategoryDto.parentId
        ? ({ id: createCategoryDto.parentId } as Category)
        : null,
    };

    const category = this.categoriesRepository.create(categoryData);

    const savedCategory = await this.categoriesRepository.save(category);
    return new CategoryResponseDto(savedCategory);
  }

  async findAll(query: QueryCategoryDto): Promise<{
    data: CategoryResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, onlyActive = true, search, parentId } = query;
    const skip = (page - 1) * limit;

    let categories: Category[];
    let total: number;

    if (search) {
      // Search categories
      categories = await this.categoriesRepository.searchCategories(
        search,
        onlyActive,
      );
      total = categories.length;
      // Apply pagination to search results
      categories = categories.slice(skip, skip + limit);
    } else if (parentId) {
      // Get children of specific parent
      categories = await this.categoriesRepository.findChildren(
        parentId,
        onlyActive,
      );
      total = categories.length;
      // Apply pagination
      categories = categories.slice(skip, skip + limit);
    } else {
      // Get all categories with pagination
      const result = await this.categoriesRepository.findWithPagination(
        page,
        limit,
        onlyActive,
      );
      categories = result.data;
      total = result.total;
    }

    const totalPages = Math.ceil(total / limit);

    return {
      data: categories.map((category) => new CategoryResponseDto(category)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    return new CategoryResponseDto(category);
  }

  async findBySlug(slug: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    return new CategoryResponseDto(category);
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['parent'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    // Check slug uniqueness if slug is being updated
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const isSlugUnique =
        await this.categoriesRepository.checkSlugUniqueForUpdate(
          updateCategoryDto.slug,
          id,
        );
      if (!isSlugUnique) {
        throw new ConflictException(
          `Slug đã tồn tại: '${updateCategoryDto.slug}'`,
        );
      }
    }

    // Validate parent exists if provided
    if (updateCategoryDto.parentId) {
      const parentExists = await this.categoriesRepository.validateParentExists(
        updateCategoryDto.parentId,
      );
      if (!parentExists) {
        throw new BadRequestException(`Parent category không tồn tại`);
      }
    }

    // Update category (exclude parentId from direct assignment)
    const { parentId, ...updateData } = updateCategoryDto;
    Object.assign(category, updateData);

    if (parentId) {
      category.parent = { id: parentId } as Category;
    }

    const updatedCategory = await this.categoriesRepository.save(category);
    return new CategoryResponseDto(updatedCategory);
  }

  async move(
    id: string,
    moveCategoryDto: MoveCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['parent'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    // Check if target parent exists
    if (moveCategoryDto.parentId) {
      const parentExists = await this.categoriesRepository.validateParentExists(
        moveCategoryDto.parentId,
      );
      if (!parentExists) {
        throw new BadRequestException(`Parent category không tồn tại`);
      }

      // Check for circular reference
      const wouldCreateCircular =
        await this.categoriesRepository.wouldCreateCircularReference(
          id,
          moveCategoryDto.parentId,
        );
      if (wouldCreateCircular) {
        throw new BadRequestException(
          'Cannot move category: would create circular reference',
        );
      }
    }

    // Update parent
    category.parent = moveCategoryDto.parentId
      ? ({ id: moveCategoryDto.parentId } as Category)
      : null;

    // Update display order if provided
    if (moveCategoryDto.displayOrder !== undefined) {
      category.displayOrder = moveCategoryDto.displayOrder;
    }

    const updatedCategory = await this.categoriesRepository.save(category);
    return new CategoryResponseDto(updatedCategory);
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['parent'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    // Check if category has children
    const hasChildren = await this.categoriesRepository.hasChildren(id);
    if (hasChildren) {
      throw new BadRequestException('Không thể xóa category có category con');
    }

    // Soft delete
    category.isActive = false;
    await this.categoriesRepository.save(category);
  }

  async getTree(
    onlyActive: boolean = true,
  ): Promise<CategoryTreeResponseDto[]> {
    const tree = await this.categoriesRepository.getCategoryTree(onlyActive);
    return tree.map((category) => new CategoryTreeResponseDto(category));
  }

  async getRoots(onlyActive: boolean = true): Promise<CategoryResponseDto[]> {
    const roots = await this.categoriesRepository.findRoots(onlyActive);
    return roots.map((category) => new CategoryResponseDto(category));
  }

  async getChildren(
    parentId: string,
    onlyActive: boolean = true,
  ): Promise<CategoryResponseDto[]> {
    const children = await this.categoriesRepository.findChildren(
      parentId,
      onlyActive,
    );
    return children.map((category) => new CategoryResponseDto(category));
  }

  async getAncestors(id: string): Promise<CategoryResponseDto[]> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    const ancestors = await this.categoriesRepository.findWithAncestors(id);
    return ancestors.map((category) => new CategoryResponseDto(category));
  }

  async getDescendants(id: string): Promise<CategoryTreeResponseDto[]> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    const descendantsTree =
      await this.categoriesRepository.findWithDescendants(id);
    if (!descendantsTree || !descendantsTree.children) {
      return [];
    }

    return descendantsTree.children.map(
      (child) => new CategoryTreeResponseDto(child),
    );
  }

  async bulkUpdateDisplayOrder(
    updates: Array<{ id: string; displayOrder: number }>,
  ): Promise<void> {
    await this.categoriesRepository.bulkUpdateDisplayOrder(updates);
  }
}
