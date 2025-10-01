import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { CategoriesRepository } from '../../repositories/categories.repository';
import { Category } from '../../entities/category.entity';
import databaseConfig from '../../../../config/database.config';

describe('CategoriesRepository', () => {
  let module: TestingModule;
  let repository: CategoriesRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [databaseConfig],
        }),
        TypeOrmModule.forRoot({
          ...databaseConfig(),
          synchronize: true, // Enable synchronize for tests to create category_closure table
        }),
        TypeOrmModule.forFeature([Category]),
      ],
      providers: [CategoriesRepository],
    }).compile();

    repository = module.get<CategoriesRepository>(CategoriesRepository);
    dataSource = module.get<DataSource>(DataSource);

    // Wait for synchronization to complete and ensure closure table exists
    await dataSource.synchronize();

    // Manually create category_closure table if it doesn't exist
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS category_closure (
        id_ancestor uuid NOT NULL,
        id_descendant uuid NOT NULL,
        PRIMARY KEY (id_ancestor, id_descendant)
      )
    `);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    // Delete from category_closure first, then categories
    await dataSource.query('DELETE FROM category_closure');
    await dataSource.query('DELETE FROM categories');
  });

  describe('findBySlug', () => {
    it('should find category by slug', async () => {
      const category = await repository.save({
        name: { en: 'Electronics', vi: 'Điện tử' },
        slug: 'electronics',
      });

      const found = await repository.findBySlug('electronics');

      expect(found).toBeDefined();
      expect(found?.id).toBe(category.id);
      expect(found?.slug).toBe('electronics');
    });

    it('should return null for non-existent slug', async () => {
      const found = await repository.findBySlug('non-existent');

      expect(found).toBeNull();
    });

    it('should include parent and children relations', async () => {
      const parent = await repository.save({
        name: { en: 'Electronics' },
        slug: 'electronics',
      });

      await repository.save({
        name: { en: 'Laptops' },
        slug: 'laptops',
        parent: parent,
      });

      const found = await repository.findBySlug('laptops');

      expect(found?.parent).toBeDefined();
      expect(found?.parent.id).toBe(parent.id);
    });
  });

  describe('checkSlugUnique', () => {
    it('should return true for unique slug', async () => {
      const isUnique = await repository.checkSlugUnique('unique-slug');

      expect(isUnique).toBe(true);
    });

    it('should return false for existing slug', async () => {
      await repository.save({
        name: { en: 'Test' },
        slug: 'existing-slug',
      });

      const isUnique = await repository.checkSlugUnique('existing-slug');

      expect(isUnique).toBe(false);
    });
  });

  describe('checkSlugUniqueForUpdate', () => {
    it('should return true when slug is unique', async () => {
      const category = await repository.save({
        name: { en: 'Test' },
        slug: 'test-slug',
      });

      const isUnique = await repository.checkSlugUniqueForUpdate(
        'new-unique-slug',
        category.id,
      );

      expect(isUnique).toBe(true);
    });

    it('should return true when slug belongs to the same category', async () => {
      const category = await repository.save({
        name: { en: 'Test' },
        slug: 'test-slug',
      });

      const isUnique = await repository.checkSlugUniqueForUpdate(
        'test-slug',
        category.id,
      );

      expect(isUnique).toBe(true);
    });

    it('should return false when slug belongs to another category', async () => {
      await repository.save({
        name: { en: 'Test 1' },
        slug: 'test-1',
      });

      const category2 = await repository.save({
        name: { en: 'Test 2' },
        slug: 'test-2',
      });

      const isUnique = await repository.checkSlugUniqueForUpdate(
        'test-1',
        category2.id,
      );

      expect(isUnique).toBe(false);
    });
  });

  describe('validateParentExists', () => {
    it('should return parent if exists and active', async () => {
      const parent = await repository.save({
        name: { en: 'Parent' },
        slug: 'parent',
        isActive: true,
      });

      const found = await repository.validateParentExists(parent.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(parent.id);
    });

    it('should return null if parent is inactive', async () => {
      const parent = await repository.save({
        name: { en: 'Parent' },
        slug: 'parent',
        isActive: false,
      });

      const found = await repository.validateParentExists(parent.id);

      expect(found).toBeNull();
    });

    it('should return null if parent does not exist', async () => {
      const found = await repository.validateParentExists(
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(found).toBeNull();
    });
  });

  describe('hasChildren', () => {
    it('should return true if category has children', async () => {
      const parent = await repository.save({
        name: { en: 'Parent' },
        slug: 'parent',
      });

      await repository.save({
        name: { en: 'Child' },
        slug: 'child',
        parent: parent,
      });

      const hasKids = await repository.hasChildren(parent.id);

      expect(hasKids).toBe(true);
    });

    it('should return false if category has no children', async () => {
      const parent = await repository.save({
        name: { en: 'Parent' },
        slug: 'parent',
      });

      const hasKids = await repository.hasChildren(parent.id);

      expect(hasKids).toBe(false);
    });
  });

  describe('findRoots', () => {
    it('should return all root categories', async () => {
      await repository.save({
        name: { en: 'Root 1' },
        slug: 'root-1',
      });

      await repository.save({
        name: { en: 'Root 2' },
        slug: 'root-2',
      });

      const parent = await repository.save({
        name: { en: 'Parent' },
        slug: 'parent',
      });

      await repository.save({
        name: { en: 'Child' },
        slug: 'child',
        parent: parent,
      });

      const roots = await repository.findRoots();

      expect(roots.length).toBe(3); // Root 1, Root 2, Parent
    });

    it('should return only active roots when onlyActive=true', async () => {
      await repository.save({
        name: { en: 'Active Root' },
        slug: 'active-root',
        isActive: true,
      });

      await repository.save({
        name: { en: 'Inactive Root' },
        slug: 'inactive-root',
        isActive: false,
      });

      const roots = await repository.findRoots(true);

      expect(roots.length).toBe(1);
      expect(roots[0].slug).toBe('active-root');
    });

    it('should order by displayOrder', async () => {
      await repository.save({
        name: { en: 'Root 3' },
        slug: 'root-3',
        displayOrder: 3,
      });

      await repository.save({
        name: { en: 'Root 1' },
        slug: 'root-1',
        displayOrder: 1,
      });

      await repository.save({
        name: { en: 'Root 2' },
        slug: 'root-2',
        displayOrder: 2,
      });

      const roots = await repository.findRoots();

      expect(roots[0].slug).toBe('root-1');
      expect(roots[1].slug).toBe('root-2');
      expect(roots[2].slug).toBe('root-3');
    });
  });

  describe('findChildren', () => {
    it('should return children of a category', async () => {
      const parent = await repository.save({
        name: { en: 'Parent' },
        slug: 'parent',
      });

      await repository.save({
        name: { en: 'Child 1' },
        slug: 'child-1',
        parent: parent,
      });

      await repository.save({
        name: { en: 'Child 2' },
        slug: 'child-2',
        parent: parent,
      });

      const children = await repository.findChildren(parent.id);

      expect(children.length).toBe(2);
    });

    it('should return only active children when onlyActive=true', async () => {
      const parent = await repository.save({
        name: { en: 'Parent' },
        slug: 'parent',
      });

      await repository.save({
        name: { en: 'Active Child' },
        slug: 'active-child',
        parent: parent,
        isActive: true,
      });

      await repository.save({
        name: { en: 'Inactive Child' },
        slug: 'inactive-child',
        parent: parent,
        isActive: false,
      });

      const children = await repository.findChildren(parent.id, true);

      expect(children.length).toBe(1);
      expect(children[0].slug).toBe('active-child');
    });
  });

  describe('searchCategories', () => {
    beforeEach(async () => {
      await repository.save({
        name: { en: 'Electronics', vi: 'Điện tử' },
        slug: 'electronics',
      });

      await repository.save({
        name: { en: 'Laptops', vi: 'Máy tính xách tay' },
        slug: 'laptops',
      });

      await repository.save({
        name: { en: 'Phones', vi: 'Điện thoại' },
        slug: 'phones',
      });
    });

    it('should find categories by English keyword', async () => {
      const results = await repository.searchCategories('laptop');

      expect(results.length).toBe(1);
      expect(results[0].slug).toBe('laptops');
    });

    it('should find categories by Vietnamese keyword', async () => {
      const results = await repository.searchCategories('điện');

      expect(results.length).toBe(2); // Điện tử, Điện thoại
    });

    it('should be case-insensitive', async () => {
      const results = await repository.searchCategories('ELECTRONICS');

      expect(results.length).toBe(1);
    });

    it('should return empty array if no match', async () => {
      const results = await repository.searchCategories('nonexistent');

      expect(results.length).toBe(0);
    });
  });

  describe('wouldCreateCircularReference', () => {
    it('should return true if moving parent to be child of its descendant', async () => {
      const grandparent = await repository.save({
        name: { en: 'Grandparent' },
        slug: 'grandparent',
      });

      const parent = await repository.save({
        name: { en: 'Parent' },
        slug: 'parent',
        parent: grandparent,
      });

      const child = await repository.save({
        name: { en: 'Child' },
        slug: 'child',
        parent: parent,
      });

      // Try to move grandparent under child (circular!)
      const wouldBeCircular = await repository.wouldCreateCircularReference(
        grandparent.id,
        child.id,
      );

      expect(wouldBeCircular).toBe(true);
    });

    it('should return false for valid move', async () => {
      const category1 = await repository.save({
        name: { en: 'Category 1' },
        slug: 'category-1',
      });

      const category2 = await repository.save({
        name: { en: 'Category 2' },
        slug: 'category-2',
      });

      const wouldBeCircular = await repository.wouldCreateCircularReference(
        category1.id,
        category2.id,
      );

      expect(wouldBeCircular).toBe(false);
    });
  });

  describe('findWithPagination', () => {
    beforeEach(async () => {
      // Use Promise.all for faster bulk insert
      const categories = [];
      for (let i = 1; i <= 25; i++) {
        categories.push(
          repository.save({
            name: { en: `Category ${i}` },
            slug: `category-${i}`,
            displayOrder: i,
          }),
        );
      }
      await Promise.all(categories);
    }, 10000);

    it('should return paginated results', async () => {
      const result = await repository.findWithPagination(1, 10);

      expect(result.data.length).toBe(10);
      expect(result.total).toBe(25);
    });

    it('should return correct page', async () => {
      const result = await repository.findWithPagination(2, 10);

      expect(result.data.length).toBe(10);
      expect(result.data[0].slug).toBe('category-11');
    });

    it('should return remaining items on last page', async () => {
      const result = await repository.findWithPagination(3, 10);

      expect(result.data.length).toBe(5); // 25 items, page 3 has 5
    });
  });

  describe('countCategories', () => {
    it('should count all categories', async () => {
      await repository.save({
        name: { en: 'Cat 1' },
        slug: 'cat-1',
        isActive: true,
      });

      await repository.save({
        name: { en: 'Cat 2' },
        slug: 'cat-2',
        isActive: false,
      });

      const count = await repository.countCategories();

      expect(count).toBe(2);
    });

    it('should count only active categories', async () => {
      await repository.save({
        name: { en: 'Cat 1' },
        slug: 'cat-1',
        isActive: true,
      });

      await repository.save({
        name: { en: 'Cat 2' },
        slug: 'cat-2',
        isActive: false,
      });

      const count = await repository.countCategories(true);

      expect(count).toBe(1);
    });
  });
});
