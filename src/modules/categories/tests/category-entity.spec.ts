import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Category } from '../entities/category.entity';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from '../../../config/database.config';

describe('Category Entity (Integration)', () => {
  let module: TestingModule;
  let repository: Repository<Category>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [databaseConfig],
        }),
        TypeOrmModule.forRoot({
          ...databaseConfig(),
          entities: [Category],
        } as TypeOrmModuleOptions),
      ],
    }).compile();

    const dataSource = module.get<DataSource>(DataSource);
    repository = dataSource.getRepository(Category);
  });

  beforeEach(async () => {
    // Clear all categories before each test (for tree entities, need to clear closure table too)
    await repository.manager.query('DELETE FROM category_closure_closure');
    await repository.manager.query('DELETE FROM categories');
  });

  afterAll(async () => {
    await module.close();
  });

  it('should create a root category', async () => {
    const category = repository.create({
      name: { en: 'Electronics', vi: 'Điện tử' },
      description: { en: 'Electronic devices', vi: 'Thiết bị điện tử' },
      slug: 'electronics',
      isActive: true,
    });

    const saved = await repository.save(category);

    expect(saved.id).toBeDefined();
    expect(saved.name.en).toBe('Electronics');
    expect(saved.name.vi).toBe('Điện tử');
    expect(saved.slug).toBe('electronics');
    expect(saved.children).toBeUndefined();
  });

  it('should create a child category', async () => {
    // Tạo parent
    const parent = await repository.save({
      name: { en: 'Electronics', vi: 'Điện tử' },
      slug: 'electronics-2',
    });

    // Tạo child
    const child = repository.create({
      name: { en: 'Laptops', vi: 'Máy tính xách tay' },
      slug: 'laptops',
      parent: parent,
    });

    const saved = await repository.save(child);

    expect(saved.parent.id).toBe(parent.id);
  });

  it('should query category tree', async () => {
    const trees = await repository.manager
      .getTreeRepository(Category)
      .findTrees();

    expect(Array.isArray(trees)).toBe(true);
  });

  it('should enforce unique slug constraint', async () => {
    await repository.save({
      name: { en: 'Test', vi: 'Test' },
      slug: 'unique-slug-test',
    });

    await expect(
      repository.save({
        name: { en: 'Test 2', vi: 'Test 2' },
        slug: 'unique-slug-test', // Duplicate
      }),
    ).rejects.toThrow();
  });
});
