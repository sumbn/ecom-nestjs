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

    // Clean up any existing data in the transaction using TRUNCATE CASCADE
    await queryRunner.manager.query(
      'TRUNCATE TABLE categories RESTART IDENTITY CASCADE',
    );

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

  describe('findWithPagination', () => {
    it('should apply pagination and return total count', async () => {
      const cat1 = repository.create({
        name: { en: 'Cat 1' },
        slug: 'pagination-cat-1',
        displayOrder: 1,
      });
      const cat2 = repository.create({
        name: { en: 'Cat 2' },
        slug: 'pagination-cat-2',
        displayOrder: 2,
      });
      const cat3 = repository.create({
        name: { en: 'Cat 3' },
        slug: 'pagination-cat-3',
        displayOrder: 3,
      });

      await queryRunner.manager.save([cat1, cat2, cat3]);

      const { data, total } = await repository.findWithPagination(2, 1);

      expect(total).toBe(3);
      expect(data).toHaveLength(1);
      expect(data[0].slug).toBe('pagination-cat-2');
    });

    it('should filter inactive categories when onlyActive flag is true', async () => {
      const active = repository.create({
        name: { en: 'Active' },
        slug: 'pagination-active',
        isActive: true,
        displayOrder: 1,
      });
      const inactive = repository.create({
        name: { en: 'Inactive' },
        slug: 'pagination-inactive',
        isActive: false,
        displayOrder: 2,
      });

      await queryRunner.manager.save([active, inactive]);

      const { data, total } = await repository.findWithPagination(1, 10, true);

      expect(total).toBe(1);
      expect(data).toHaveLength(1);
      expect(data[0].slug).toBe('pagination-active');
    });

    it('should include parent relation in results', async () => {
      const parent = repository.create({
        name: { en: 'Parent' },
        slug: 'pagination-parent',
      });
      await queryRunner.manager.save(parent);

      const child = repository.create({
        name: { en: 'Child' },
        slug: 'pagination-child',
        parent,
        displayOrder: 1,
      });
      await queryRunner.manager.save(child);

      const { data } = await repository.findWithPagination(1, 10);

      const childRecord = data.find((item) => item.slug === 'pagination-child');
      expect(childRecord?.parent?.id).toBe(parent.id);
    });
  });

  describe('countCategories', () => {
    it('should count all categories by default', async () => {
      const cat1 = repository.create({
        name: { en: 'Count 1' },
        slug: 'count-cat-1',
        isActive: true,
      });
      const cat2 = repository.create({
        name: { en: 'Count 2' },
        slug: 'count-cat-2',
        isActive: false,
      });

      await queryRunner.manager.save([cat1, cat2]);

      const total = await repository.countCategories();

      expect(total).toBe(2);
    });

    it('should only count active categories when onlyActive=true', async () => {
      const active = repository.create({
        name: { en: 'Active Count' },
        slug: 'count-active',
        isActive: true,
      });
      const inactive = repository.create({
        name: { en: 'Inactive Count' },
        slug: 'count-inactive',
        isActive: false,
      });

      await queryRunner.manager.save([active, inactive]);

      const totalActive = await repository.countCategories(true);

      expect(totalActive).toBe(1);
    });
  });

  describe('bulkUpdateDisplayOrder', () => {
    it('should update multiple categories displayOrder atomically', async () => {
      const cat1 = repository.create({
        name: { en: 'Bulk 1' },
        slug: 'bulk-cat-1',
        displayOrder: 1,
      });
      const cat2 = repository.create({
        name: { en: 'Bulk 2' },
        slug: 'bulk-cat-2',
        displayOrder: 2,
      });

      await queryRunner.manager.save([cat1, cat2]);

      await repository.bulkUpdateDisplayOrder([
        { id: cat1.id, displayOrder: 5 },
        { id: cat2.id, displayOrder: 3 },
      ]);

      const updated1 = await repository.findOne({ where: { id: cat1.id } });
      const updated2 = await repository.findOne({ where: { id: cat2.id } });

      expect(updated1?.displayOrder).toBe(5);
      expect(updated2?.displayOrder).toBe(3);
    });

    it('should rollback entire batch when any update fails', async () => {
      const cat1 = repository.create({
        name: { en: 'Rollback 1' },
        slug: 'bulk-rollback-1',
        displayOrder: 1,
      });
      const cat2 = repository.create({
        name: { en: 'Rollback 2' },
        slug: 'bulk-rollback-2',
        displayOrder: 2,
      });

      await queryRunner.manager.save([cat1, cat2]);

      await expect(
        repository.bulkUpdateDisplayOrder([
          { id: cat1.id, displayOrder: 10 },
          { id: 'non-existent-id', displayOrder: 20 },
        ]),
      ).rejects.toThrow();

      const reloaded1 = await repository.findOne({ where: { id: cat1.id } });
      const reloaded2 = await repository.findOne({ where: { id: cat2.id } });

      expect(reloaded1?.displayOrder).toBe(1);
      expect(reloaded2?.displayOrder).toBe(2);
    });
  });
});
