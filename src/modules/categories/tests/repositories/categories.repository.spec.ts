import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource, QueryRunner } from 'typeorm';
import { CategoriesRepository } from '../../repositories/categories.repository';
import { Category } from '../../entities/category.entity';
import databaseConfig from '../../../../config/database.config';

describe('CategoriesRepository (Unit)', () => {
  let module: TestingModule;
  let repository: CategoriesRepository;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [databaseConfig],
        }),
        TypeOrmModule.forRoot(databaseConfig()),
        TypeOrmModule.forFeature([Category]),
      ],
      providers: [CategoriesRepository],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    // Create isolated transaction for each test
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Create repository instance using transactional entity manager
    repository = new CategoriesRepository(dataSource);

    // Override repository manager with transactional manager
    Object.assign(repository, {
      manager: queryRunner.manager,
      queryRunner: queryRunner,
    });
  });

  afterEach(async () => {
    // Rollback transaction (auto cleanup)
    if (queryRunner) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  describe('findBySlug', () => {
    it('should find category by slug', async () => {
      const category = repository.create({
        name: { en: 'Electronics', vi: 'Điện tử' },
        slug: 'electronics',
      });
      await queryRunner.manager.save(category);

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
      const parent = repository.create({
        name: { en: 'Electronics' },
        slug: 'electronics',
      });
      await queryRunner.manager.save(parent);

      const child = repository.create({
        name: { en: 'Laptops' },
        slug: 'laptops',
        parent: parent,
      });
      await queryRunner.manager.save(child);

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
      const category = repository.create({
        name: { en: 'Test' },
        slug: 'existing-slug',
      });
      await queryRunner.manager.save(category);

      const isUnique = await repository.checkSlugUnique('existing-slug');

      expect(isUnique).toBe(false);
    });
  });

  describe('checkSlugUniqueForUpdate', () => {
    it('should return true when slug is unique', async () => {
      const category = repository.create({
        name: { en: 'Test' },
        slug: 'test-slug',
      });
      await queryRunner.manager.save(category);

      const isUnique = await repository.checkSlugUniqueForUpdate(
        'new-unique-slug',
        category.id,
      );

      expect(isUnique).toBe(true);
    });

    it('should return true when slug belongs to the same category', async () => {
      const category = repository.create({
        name: { en: 'Test' },
        slug: 'test-slug',
      });
      await queryRunner.manager.save(category);

      const isUnique = await repository.checkSlugUniqueForUpdate(
        'test-slug',
        category.id,
      );

      expect(isUnique).toBe(true);
    });

    it('should return false when slug belongs to another category', async () => {
      const category1 = repository.create({
        name: { en: 'Test 1' },
        slug: 'test-1',
      });
      await queryRunner.manager.save(category1);

      const category2 = repository.create({
        name: { en: 'Test 2' },
        slug: 'test-2',
      });
      await queryRunner.manager.save(category2);

      const isUnique = await repository.checkSlugUniqueForUpdate(
        'test-1',
        category2.id,
      );

      expect(isUnique).toBe(false);
    });
  });

  describe('validateParentExists', () => {
    it('should return parent if exists and active', async () => {
      const parent = repository.create({
        name: { en: 'Parent' },
        slug: 'parent',
        isActive: true,
      });
      await queryRunner.manager.save(parent);

      const found = await repository.validateParentExists(parent.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(parent.id);
    });

    it('should return null if parent is inactive', async () => {
      const parent = repository.create({
        name: { en: 'Parent' },
        slug: 'parent',
        isActive: false,
      });
      await queryRunner.manager.save(parent);

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
      const parent = repository.create({
        name: { en: 'Parent' },
        slug: 'parent',
      });
      await queryRunner.manager.save(parent);

      const child = repository.create({
        name: { en: 'Child' },
        slug: 'child',
        parent: parent,
      });
      await queryRunner.manager.save(child);

      const hasKids = await repository.hasChildren(parent.id);

      expect(hasKids).toBe(true);
    });

    it('should return false if category has no children', async () => {
      const parent = repository.create({
        name: { en: 'Parent' },
        slug: 'parent',
      });
      await queryRunner.manager.save(parent);

      const hasKids = await repository.hasChildren(parent.id);

      expect(hasKids).toBe(false);
    });
  });

  describe('findRoots', () => {
    it('should return all root categories', async () => {
      // Delete existing data with proper foreign key handling
      await queryRunner.manager.query('DELETE FROM categories');

      const root1 = repository.create({
        name: { en: 'Root 1' },
        slug: 'findroots-root-1',
      });
      await queryRunner.manager.save(root1);

      const root2 = repository.create({
        name: { en: 'Root 2' },
        slug: 'findroots-root-2',
      });
      await queryRunner.manager.save(root2);

      const parent = repository.create({
        name: { en: 'Parent' },
        slug: 'findroots-parent',
      });
      await queryRunner.manager.save(parent);

      const child = repository.create({
        name: { en: 'Child' },
        slug: 'findroots-child',
        parent: parent,
      });
      await queryRunner.manager.save(child);

      const roots = await repository.findRoots();

      expect(roots.length).toBe(3); // Root 1, Root 2, Parent
    });

    it('should return only active roots when onlyActive=true', async () => {
      // Delete existing data with proper foreign key handling
      await queryRunner.manager.query('DELETE FROM categories');

      const activeRoot = repository.create({
        name: { en: 'Active Root' },
        slug: 'findroots-active-root',
        isActive: true,
      });
      await queryRunner.manager.save(activeRoot);

      const inactiveRoot = repository.create({
        name: { en: 'Inactive Root' },
        slug: 'findroots-inactive-root',
        isActive: false,
      });
      await queryRunner.manager.save(inactiveRoot);

      const roots = await repository.findRoots(true);

      expect(roots.length).toBe(1);
      expect(roots[0].slug).toBe('findroots-active-root');
    });

    it('should order by displayOrder', async () => {
      // Delete existing data with proper foreign key handling
      await queryRunner.manager.query('DELETE FROM categories');

      const root3 = repository.create({
        name: { en: 'Root 3' },
        slug: 'findroots-order-root-3',
        displayOrder: 3,
      });
      await queryRunner.manager.save(root3);

      const root1 = repository.create({
        name: { en: 'Root 1' },
        slug: 'findroots-order-root-1',
        displayOrder: 1,
      });
      await queryRunner.manager.save(root1);

      const root2 = repository.create({
        name: { en: 'Root 2' },
        slug: 'findroots-order-root-2',
        displayOrder: 2,
      });
      await queryRunner.manager.save(root2);

      const roots = await repository.findRoots();

      expect(roots[0].slug).toBe('findroots-order-root-1');
      expect(roots[1].slug).toBe('findroots-order-root-2');
      expect(roots[2].slug).toBe('findroots-order-root-3');
    });
  });

  describe('findChildren', () => {
    it('should return children of a category', async () => {
      const parent = repository.create({
        name: { en: 'Parent' },
        slug: 'parent',
      });
      await queryRunner.manager.save(parent);

      const child1 = repository.create({
        name: { en: 'Child 1' },
        slug: 'child-1',
        parent: parent,
      });
      await queryRunner.manager.save(child1);

      const child2 = repository.create({
        name: { en: 'Child 2' },
        slug: 'child-2',
        parent: parent,
      });
      await queryRunner.manager.save(child2);

      const children = await repository.findChildren(parent.id);

      expect(children.length).toBe(2);
    });

    it('should return only active children when onlyActive=true', async () => {
      const parent = repository.create({
        name: { en: 'Parent' },
        slug: 'parent',
      });
      await queryRunner.manager.save(parent);

      const activeChild = repository.create({
        name: { en: 'Active Child' },
        slug: 'active-child',
        parent: parent,
        isActive: true,
      });
      await queryRunner.manager.save(activeChild);

      const inactiveChild = repository.create({
        name: { en: 'Inactive Child' },
        slug: 'inactive-child',
        parent: parent,
        isActive: false,
      });
      await queryRunner.manager.save(inactiveChild);

      const children = await repository.findChildren(parent.id, true);

      expect(children.length).toBe(1);
      expect(children[0].slug).toBe('active-child');
    });
  });

  describe('searchCategories', () => {
    beforeEach(async () => {
      const electronics = repository.create({
        name: { en: 'Electronics', vi: 'Điện tử' },
        slug: 'electronics',
      });
      await queryRunner.manager.save(electronics);

      const laptops = repository.create({
        name: { en: 'Laptops', vi: 'Máy tính xách tay' },
        slug: 'laptops',
      });
      await queryRunner.manager.save(laptops);

      const phones = repository.create({
        name: { en: 'Phones', vi: 'Điện thoại' },
        slug: 'phones',
      });
      await queryRunner.manager.save(phones);
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

  describe('countCategories', () => {
    it('should count all categories', async () => {
      // Delete existing data with proper foreign key handling
      await queryRunner.manager.query('DELETE FROM categories');

      const cat1 = repository.create({
        name: { en: 'Count Cat 1' },
        slug: 'count-cat-1',
        isActive: true,
      });
      await queryRunner.manager.save(cat1);

      const cat2 = repository.create({
        name: { en: 'Count Cat 2' },
        slug: 'count-cat-2',
        isActive: false,
      });
      await queryRunner.manager.save(cat2);

      const count = await repository.countCategories();

      expect(count).toBe(2);
    });

    it('should count only active categories', async () => {
      // Delete existing data with proper foreign key handling
      await queryRunner.manager.query('DELETE FROM categories');

      const cat1 = repository.create({
        name: { en: 'Count Active Cat 1' },
        slug: 'count-active-cat-1',
        isActive: true,
      });
      await queryRunner.manager.save(cat1);

      const cat2 = repository.create({
        name: { en: 'Count Active Cat 2' },
        slug: 'count-active-cat-2',
        isActive: false,
      });
      await queryRunner.manager.save(cat2);

      const count = await repository.countCategories(true);

      expect(count).toBe(1);
    });
  });
});
