import { Injectable } from '@nestjs/common';
import {
  DataSource,
  Repository,
  TreeRepository,
  IsNull,
  FindOptionsWhere,
} from 'typeorm';
import { Category } from '../entities/category.entity';

/**
 * Categories Repository
 *
 * Extends Repository + TreeRepository để có cả custom queries và tree operations
 *
 * Tree methods từ TypeORM:
 * - findTrees(): Lấy toàn bộ tree structure
 * - findRoots(): Lấy root categories
 * - findDescendants(entity): Lấy tất cả con cháu
 * - findAncestors(entity): Lấy tất cả cha ông
 * - findDescendantsTree(entity): Lấy subtree từ entity
 *
 * Custom methods:
 * - findBySlug(): Tìm theo slug
 * - findActiveCategories(): Lấy categories active
 * - checkSlugUnique(): Validate unique slug
 */
@Injectable()
export class CategoriesRepository extends Repository<Category> {
  protected treeRepository: TreeRepository<Category>;

  constructor(private dataSource: DataSource) {
    super(Category, dataSource.createEntityManager());
    this.treeRepository = dataSource.getTreeRepository(Category);
  }

  /**
   * Tìm category theo slug
   * @param slug - URL-friendly identifier
   * @returns Category hoặc null
   */
  async findBySlug(slug: string): Promise<Category | null> {
    return this.findOne({
      where: { slug },
      relations: ['parent', 'children'],
    });
  }

  /**
   * Lấy category với tất cả ancestors (cha ông)
   * Ví dụ: Gaming Laptops → [Electronics, Laptops, Gaming Laptops]
   *
   * @param id - Category ID
   * @returns Category với ancestors array
   */
  async findWithAncestors(id: string): Promise<Category | null> {
    const category = await this.findOne({ where: { id } });
    if (!category) return null;

    return this.treeRepository.findAncestorsTree(category);
  }

  /**
   * Lấy category với tất cả descendants (con cháu)
   * Ví dụ: Electronics → [Laptops, Gaming Laptops, Business Laptops, ...]
   *
   * @param id - Category ID
   * @returns Category với descendants tree
   */
  async findWithDescendants(id: string): Promise<Category | null> {
    const category = await this.findOne({ where: { id } });
    if (!category) return null;

    return this.treeRepository.findDescendantsTree(category);
  }

  /**
   * Lấy toàn bộ category tree
   * @param onlyActive - Chỉ lấy categories active
   * @returns Array of root categories với children nested
   */
  async getCategoryTree(onlyActive: boolean = false): Promise<Category[]> {
    if (onlyActive) {
      // TypeORM findTrees() không hỗ trợ where condition
      // Phải query roots trước, rồi build tree manually
      const roots = await this.find({
        where: { parent: IsNull(), isActive: true },
        order: { displayOrder: 'ASC' },
      });

      // Load children recursively cho mỗi root
      const trees = await Promise.all(
        roots.map(async (root) => {
          const tree = await this.treeRepository.findDescendantsTree(root);
          // Filter chỉ lấy active children
          this.filterActiveCategories(tree);
          return tree;
        }),
      );

      return trees;
    }

    // Lấy tất cả (kể cả inactive)
    return this.treeRepository.findTrees();
  }

  /**
   * Helper: Filter chỉ giữ lại active categories trong tree
   */
  private filterActiveCategories(category: Category): void {
    if (category.children && category.children.length > 0) {
      category.children = category.children.filter((child) => child.isActive);
      category.children.forEach((child) => this.filterActiveCategories(child));
    }
  }

  /**
   * Lấy root categories (không có parent)
   * @param onlyActive - Chỉ lấy active
   * @returns Array of root categories
   */
  async findRoots(onlyActive: boolean = false): Promise<Category[]> {
    const whereCondition: FindOptionsWhere<Category> = { parent: IsNull() };
    if (onlyActive) {
      whereCondition.isActive = true;
    }

    return this.find({
      where: whereCondition,
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * Lấy children của một category
   * @param parentId - Parent category ID
   * @param onlyActive - Chỉ lấy active
   * @returns Array of child categories
   */
  async findChildren(
    parentId: string,
    onlyActive: boolean = false,
  ): Promise<Category[]> {
    const whereCondition: FindOptionsWhere<Category> = {
      parent: { id: parentId },
    };
    if (onlyActive) {
      whereCondition.isActive = true;
    }

    return this.find({
      where: whereCondition,
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * Check slug có unique không (cho create)
   * @param slug - Slug cần check
   * @returns true nếu unique, false nếu đã tồn tại
   */
  async checkSlugUnique(slug: string): Promise<boolean> {
    const count = await this.count({ where: { slug } });
    return count === 0;
  }

  /**
   * Check slug có unique không (cho update)
   * @param slug - Slug cần check
   * @param excludeId - ID của category đang update (bỏ qua)
   * @returns true nếu unique, false nếu đã tồn tại
   */
  async checkSlugUniqueForUpdate(
    slug: string,
    excludeId: string,
  ): Promise<boolean> {
    const count = await this.count({
      where: { slug },
    });

    if (count === 0) return true;

    // Nếu có 1 record, check xem có phải là chính nó không
    const existing = await this.findOne({ where: { slug } });
    return existing?.id === excludeId;
  }

  /**
   * Validate parent category tồn tại và active
   * @param parentId - Parent category ID
   * @returns Category nếu valid, null nếu không tồn tại hoặc inactive
   */
  async validateParentExists(parentId: string): Promise<Category | null> {
    return this.findOne({
      where: { id: parentId, isActive: true },
    });
  }

  /**
   * Check category có children không
   * Dùng để validate trước khi delete
   * @param id - Category ID
   * @returns true nếu có children, false nếu không
   */
  async hasChildren(id: string): Promise<boolean> {
    const count = await this.count({
      where: { parent: { id } },
    });
    return count > 0;
  }

  /**
   * Check category có phải là ancestor của target không
   * Dùng để prevent circular reference khi move category
   *
   * Ví dụ: Không thể move Electronics làm con của Gaming Laptops
   * (vì Gaming Laptops là con cháu của Electronics)
   *
   * @param categoryId - Category ID muốn move
   * @param targetParentId - Target parent ID
   * @returns true nếu sẽ tạo circular reference
   */
  async wouldCreateCircularReference(
    categoryId: string,
    targetParentId: string,
  ): Promise<boolean> {
    const category = await this.findOne({ where: { id: categoryId } });
    if (!category) return false;

    const targetParent = await this.findOne({ where: { id: targetParentId } });
    if (!targetParent) return false;

    // Check nếu targetParent là descendant của category
    const descendants = await this.treeRepository.findDescendants(category);
    return descendants.some((desc) => desc.id === targetParentId);
  }

  /**
   * Search categories theo keyword (tìm trong name.en và name.vi)
   * @param keyword - Search keyword
   * @param onlyActive - Chỉ lấy active
   * @returns Array of matching categories
   */
  async searchCategories(
    keyword: string,
    onlyActive: boolean = false,
  ): Promise<Category[]> {
    const queryBuilder = this.createQueryBuilder('category');

    // Search trong JSONB field (PostgreSQL specific)
    queryBuilder.where(
      `(category.name->>'en' ILIKE :keyword OR category.name->>'vi' ILIKE :keyword)`,
      { keyword: `%${keyword}%` },
    );

    if (onlyActive) {
      queryBuilder.andWhere('category.isActive = :isActive', {
        isActive: true,
      });
    }

    queryBuilder.orderBy('category.displayOrder', 'ASC');

    return queryBuilder.getMany();
  }

  /**
   * Lấy categories với pagination
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @param onlyActive - Chỉ lấy active
   * @returns { data, total }
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 20,
    onlyActive: boolean = false,
  ): Promise<{ data: Category[]; total: number }> {
    const whereCondition: FindOptionsWhere<Category> = {};
    if (onlyActive) {
      whereCondition.isActive = true;
    }

    const [data, total] = await this.findAndCount({
      where: whereCondition,
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['parent'],
    });

    return { data, total };
  }

  /**
   * Count tổng số categories
   * @param onlyActive - Chỉ đếm active
   * @returns Total count
   */
  async countCategories(onlyActive: boolean = false): Promise<number> {
    const whereCondition: FindOptionsWhere<Category> = {};
    if (onlyActive) {
      whereCondition.isActive = true;
    }

    return this.count({ where: whereCondition });
  }

  /**
   * Bulk update displayOrder
   * @param updates - Array of { id, displayOrder }
   */
  async bulkUpdateDisplayOrder(
    updates: Array<{ id: string; displayOrder: number }>,
  ): Promise<void> {
    await this.manager.transaction(async (transactionalEntityManager) => {
      for (const update of updates) {
        await transactionalEntityManager.update(
          Category,
          { id: update.id },
          { displayOrder: update.displayOrder },
        );
      }
    });
  }
}
