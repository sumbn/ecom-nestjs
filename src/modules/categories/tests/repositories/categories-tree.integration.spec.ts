import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource, QueryRunner } from 'typeorm';
import { CategoriesRepository } from '../../repositories/categories.repository';
import { Category } from '../../entities/category.entity';
import databaseConfig from '../../../../config/database.config';

describe('CategoriesRepository - Tree Operations (Integration)', () => {
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

    // Also override the treeRepository to use the transactional manager
    const treeRepository = queryRunner.manager.getTreeRepository(Category);
    Object.assign(repository, {
      treeRepository: treeRepository,
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

  describe('getCategoryTree', () => {
    it('should build complete tree structure', async () => {
      // Create tree:
      // Electronics
      // ├─ Laptops
      // │  ├─ Gaming Laptops
      // │  └─ Business Laptops
      // └─ Phones
      //    └─ Smartphones

      const electronics = repository.create({
        name: { en: 'Electronics', vi: 'Điện tử' },
        slug: 'tree-electronics',
        displayOrder: 1,
      });
      await queryRunner.manager.save(electronics);

      const laptops = repository.create({
        name: { en: 'Laptops', vi: 'Máy tính xách tay' },
        slug: 'tree-laptops',
        parent: electronics,
        displayOrder: 1,
      });
      await queryRunner.manager.save(laptops);

      const phones = repository.create({
        name: { en: 'Phones', vi: 'Điện thoại' },
        slug: 'tree-phones',
        parent: electronics,
        displayOrder: 2,
      });
      await queryRunner.manager.save(phones);

      const gamingLaptops = repository.create({
        name: { en: 'Gaming Laptops', vi: 'Laptop Gaming' },
        slug: 'tree-gaming-laptops',
        parent: laptops,
        displayOrder: 1,
      });
      await queryRunner.manager.save(gamingLaptops);

      const businessLaptops = repository.create({
        name: { en: 'Business Laptops', vi: 'Laptop Văn phòng' },
        slug: 'tree-business-laptops',
        parent: laptops,
        displayOrder: 2,
      });
      await queryRunner.manager.save(businessLaptops);

      const smartphones = repository.create({
        name: { en: 'Smartphones', vi: 'Điện thoại thông minh' },
        slug: 'tree-smartphones',
        parent: phones,
        displayOrder: 1,
      });
      await queryRunner.manager.save(smartphones);

      // Get tree using TreeRepository
      const treeRepo = queryRunner.manager.getTreeRepository(Category);
      const tree = await treeRepo.findTrees();

      expect(tree.length).toBe(1); // 1 root (Electronics)
      expect(tree[0].slug).toBe('tree-electronics');
      expect(tree[0].children.length).toBe(2); // Laptops, Phones

      // Find laptops and phones by slug (order may vary by displayOrder)
      const laptopsNode = tree[0].children.find(
        (child) => child.slug === 'tree-laptops',
      );
      const phonesNode = tree[0].children.find(
        (child) => child.slug === 'tree-phones',
      );

      expect(laptopsNode).toBeDefined();
      expect(phonesNode).toBeDefined();
      expect(laptopsNode.children.length).toBe(2); // Gaming, Business
      expect(phonesNode.children.length).toBe(1); // Smartphones
    });

    it('should handle multiple root categories', async () => {
      const electronics = repository.create({
        name: { en: 'Electronics' },
        slug: 'tree-multi-electronics',
      });
      await queryRunner.manager.save(electronics);

      const fashion = repository.create({
        name: { en: 'Fashion' },
        slug: 'tree-multi-fashion',
      });
      await queryRunner.manager.save(fashion);

      const homeGarden = repository.create({
        name: { en: 'Home & Garden' },
        slug: 'tree-multi-home-garden',
      });
      await queryRunner.manager.save(homeGarden);

      const treeRepo = queryRunner.manager.getTreeRepository(Category);
      const tree = await treeRepo.findTrees();

      expect(tree.length).toBe(3);
    });

    it('should handle empty tree', async () => {
      const treeRepo = queryRunner.manager.getTreeRepository(Category);
      const tree = await treeRepo.findTrees();

      expect(tree).toEqual([]);
    });
  });

  describe('findWithAncestors', () => {
    it('should return category with all ancestors', async () => {
      const grandparent = repository.create({
        name: { en: 'Electronics' },
        slug: 'tree-ancestors-electronics',
      });
      await queryRunner.manager.save(grandparent);

      const parent = repository.create({
        name: { en: 'Laptops' },
        slug: 'tree-ancestors-laptops',
        parent: grandparent,
      });
      await queryRunner.manager.save(parent);

      const child = repository.create({
        name: { en: 'Gaming Laptops' },
        slug: 'tree-ancestors-gaming-laptops',
        parent: parent,
      });
      await queryRunner.manager.save(child);

      const result = await repository.findWithAncestors(child.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(child.id);
    });

    it('should return null for non-existent category', async () => {
      const result = await repository.findWithAncestors(
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(result).toBeNull();
    });
  });

  describe('findWithDescendants', () => {
    it('should return category with all descendants', async () => {
      const grandparent = repository.create({
        name: { en: 'Electronics' },
        slug: 'tree-descendants-electronics',
      });
      await queryRunner.manager.save(grandparent);

      const parent = repository.create({
        name: { en: 'Laptops' },
        slug: 'tree-descendants-laptops',
        parent: grandparent,
      });
      await queryRunner.manager.save(parent);

      const child1 = repository.create({
        name: { en: 'Gaming Laptops' },
        slug: 'tree-descendants-gaming-laptops',
        parent: parent,
      });
      await queryRunner.manager.save(child1);

      const child2 = repository.create({
        name: { en: 'Business Laptops' },
        slug: 'tree-descendants-business-laptops',
        parent: parent,
      });
      await queryRunner.manager.save(child2);

      const result = await repository.findWithDescendants(grandparent.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(grandparent.id);
      expect(result?.children).toBeDefined();
      expect(result?.children.length).toBeGreaterThan(0);
    });
  });

  describe('wouldCreateCircularReference', () => {
    it('should detect circular reference at any depth', async () => {
      // Create deep tree: A → B → C → D → E
      const a = repository.create({
        name: { en: 'A' },
        slug: 'tree-circular-a',
      });
      await queryRunner.manager.save(a);

      const b = repository.create({
        name: { en: 'B' },
        slug: 'tree-circular-b',
        parent: a,
      });
      await queryRunner.manager.save(b);

      const c = repository.create({
        name: { en: 'C' },
        slug: 'tree-circular-c',
        parent: b,
      });
      await queryRunner.manager.save(c);

      const d = repository.create({
        name: { en: 'D' },
        slug: 'tree-circular-d',
        parent: c,
      });
      await queryRunner.manager.save(d);

      const e = repository.create({
        name: { en: 'E' },
        slug: 'tree-circular-e',
        parent: d,
      });
      await queryRunner.manager.save(e);

      // Try to move A under E (would create: A → B → C → D → E → A)
      const wouldBeCircular = await repository.wouldCreateCircularReference(
        a.id,
        e.id,
      );

      expect(wouldBeCircular).toBe(true);
    });

    it('should allow moving to sibling', async () => {
      const parent = repository.create({
        name: { en: 'Parent' },
        slug: 'tree-sibling-parent',
      });
      await queryRunner.manager.save(parent);

      const child1 = repository.create({
        name: { en: 'Child 1' },
        slug: 'tree-sibling-child-1',
        parent: parent,
      });
      await queryRunner.manager.save(child1);

      const child2 = repository.create({
        name: { en: 'Child 2' },
        slug: 'tree-sibling-child-2',
        parent: parent,
      });
      await queryRunner.manager.save(child2);

      // Move child1 under child2 (siblings, no circular)
      const wouldBeCircular = await repository.wouldCreateCircularReference(
        child1.id,
        child2.id,
      );

      expect(wouldBeCircular).toBe(false);
    });

    it('should return false for non-existent categories', async () => {
      const wouldBeCircular = await repository.wouldCreateCircularReference(
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
      );

      expect(wouldBeCircular).toBe(false);
    });
  });

  describe('bulkUpdateDisplayOrder', () => {
    it('should update display order for multiple categories in transaction', async () => {
      const cat1 = repository.create({
        name: { en: 'Category 1' },
        slug: 'tree-bulk-cat-1',
        displayOrder: 1,
      });
      await queryRunner.manager.save(cat1);

      const cat2 = repository.create({
        name: { en: 'Category 2' },
        slug: 'tree-bulk-cat-2',
        displayOrder: 2,
      });
      await queryRunner.manager.save(cat2);

      const cat3 = repository.create({
        name: { en: 'Category 3' },
        slug: 'tree-bulk-cat-3',
        displayOrder: 3,
      });
      await queryRunner.manager.save(cat3);

      // Swap order: cat3 → 1, cat2 → 2, cat1 → 3
      await repository.bulkUpdateDisplayOrder([
        { id: cat3.id, displayOrder: 1 },
        { id: cat2.id, displayOrder: 2 },
        { id: cat1.id, displayOrder: 3 },
      ]);

      const updated1 = await repository.findOne({ where: { id: cat1.id } });
      const updated2 = await repository.findOne({ where: { id: cat2.id } });
      const updated3 = await repository.findOne({ where: { id: cat3.id } });

      expect(updated1?.displayOrder).toBe(3);
      expect(updated2?.displayOrder).toBe(2);
      expect(updated3?.displayOrder).toBe(1);
    });
  });
});
