import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './repositories/categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MoveCategoryDto } from './dto/move-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: CategoriesRepository;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    checkSlugUnique: jest.fn(),
    checkSlugUniqueForUpdate: jest.fn(),
    validateParentExists: jest.fn(),
    hasChildren: jest.fn(),
    wouldCreateCircularReference: jest.fn(),
    findBySlug: jest.fn(),
    findWithPagination: jest.fn(),
    searchCategories: jest.fn(),
    findChildren: jest.fn(),
    findRoots: jest.fn(),
    getCategoryTree: jest.fn(),
    findWithAncestors: jest.fn(),
    findWithDescendants: jest.fn(),
    bulkUpdateDisplayOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: CategoriesRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get<CategoriesRepository>(CategoriesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category successfully', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: { en: 'Electronics', vi: 'Điện tử' },
        slug: 'electronics',
        displayOrder: 1,
        isActive: true,
      };

      const createdAt = new Date();
      const updatedAt = new Date();

      const createdCategory = {
        id: '1',
        name: createCategoryDto.name,
        description: undefined,
        slug: createCategoryDto.slug,
        displayOrder: createCategoryDto.displayOrder,
        isActive: createCategoryDto.isActive,
        parent: null,
        createdAt,
        updatedAt,
      } as const;

      mockRepository.checkSlugUnique.mockResolvedValue(true);
      mockRepository.create.mockReturnValue(createdCategory);
      mockRepository.save.mockResolvedValue(createdCategory);

      const result = await service.create(createCategoryDto);

      expect(repository.checkSlugUnique).toHaveBeenCalledWith('electronics');
      expect(repository.create).toHaveBeenCalledWith({
        name: createCategoryDto.name,
        description: undefined,
        slug: createCategoryDto.slug,
        displayOrder: createCategoryDto.displayOrder,
        isActive: createCategoryDto.isActive,
        parent: null,
      });
      expect(repository.save).toHaveBeenCalledWith(createdCategory);
      expect(result).toMatchObject({
        id: '1',
        name: 'Electronics',
        slug: 'electronics',
        displayOrder: 1,
        isActive: true,
      });
    });

    it('should throw ConflictException if slug already exists', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: { en: 'Electronics', vi: 'Điện tử' },
        slug: 'electronics',
      };

      mockRepository.checkSlugUnique.mockResolvedValue(false);

      await expect(service.create(createCategoryDto)).rejects.toThrow(
        new ConflictException("Slug đã tồn tại: 'electronics'"),
      );
    });

    it('should throw BadRequestException if parent does not exist', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: { en: 'Laptops', vi: 'Máy tính xách tay' },
        slug: 'laptops',
        parentId: 'non-existent-parent',
      };

      mockRepository.checkSlugUnique.mockResolvedValue(true);
      mockRepository.validateParentExists.mockResolvedValue(null);

      await expect(service.create(createCategoryDto)).rejects.toThrow(
        new BadRequestException('Parent category không tồn tại'),
      );
    });
  });

  describe('findOne', () => {
    it('should return a category by ID', async () => {
      const mockCategory = {
        id: '1',
        name: { en: 'Electronics', vi: 'Điện tử' },
        slug: 'electronics',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne('1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['parent', 'children'],
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        new NotFoundException("Category with ID 'non-existent' not found"),
      );
    });
  });

  describe('update', () => {
    it('should update a category successfully', async () => {
      const updateCategoryDto: UpdateCategoryDto = {
        name: { en: 'Updated Electronics', vi: 'Điện tử cập nhật' },
        slug: 'updated-electronics',
      };

      const existingCategory = {
        id: '1',
        name: { en: 'Electronics', vi: 'Điện tử' },
        slug: 'electronics',
        displayOrder: 0,
        isActive: true,
        parent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedEntity = {
        ...existingCategory,
        ...updateCategoryDto,
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(existingCategory);
      mockRepository.checkSlugUniqueForUpdate.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue(updatedEntity);

      const result = await service.update('1', updateCategoryDto);

      expect(repository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: '1' }, relations: ['parent'] }),
      );
      expect(repository.checkSlugUniqueForUpdate).toHaveBeenCalledWith(
        'updated-electronics',
        '1',
      );
      expect(repository.save).toHaveBeenCalledWith(updatedEntity);
      expect(result).toMatchObject({
        id: '1',
        name: 'Updated Electronics',
        slug: 'updated-electronics',
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      const updateCategoryDto: UpdateCategoryDto = {
        name: { en: 'Updated Electronics', vi: 'Điện tử cập nhật' },
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', updateCategoryDto),
      ).rejects.toThrow(
        new NotFoundException("Category with ID 'non-existent' not found"),
      );
    });

    it('should throw ConflictException if new slug already exists', async () => {
      const updateCategoryDto: UpdateCategoryDto = {
        slug: 'existing-slug',
      };

      const existingCategory = {
        id: '1',
        name: { en: 'Electronics', vi: 'Điện tử' },
        slug: 'electronics',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(existingCategory);
      mockRepository.checkSlugUniqueForUpdate.mockResolvedValue(false);

      await expect(service.update('1', updateCategoryDto)).rejects.toThrow(
        new ConflictException("Slug đã tồn tại: 'existing-slug'"),
      );
    });
  });

  describe('move', () => {
    it('should move a category successfully', async () => {
      const moveCategoryDto: MoveCategoryDto = {
        parentId: 'new-parent-id',
        displayOrder: 5,
      };

      const existingCategory = {
        id: '1',
        name: { en: 'Electronics', vi: 'Điện tử' },
        slug: 'electronics',
        parent: null,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const movedCategory = {
        ...existingCategory,
        parent: { id: 'new-parent-id' },
        displayOrder: 5,
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(existingCategory);
      mockRepository.validateParentExists.mockResolvedValue({
        id: 'new-parent-id',
      });
      mockRepository.wouldCreateCircularReference.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(movedCategory);

      const result = await service.move('1', moveCategoryDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['parent'],
      });
      expect(repository.validateParentExists).toHaveBeenCalledWith(
        'new-parent-id',
      );
      expect(repository.wouldCreateCircularReference).toHaveBeenCalledWith(
        '1',
        'new-parent-id',
      );
      expect(repository.save).toHaveBeenCalledWith(movedCategory);
      expect(result).toMatchObject({
        id: '1',
        displayOrder: 5,
      });
    });

    it('should throw BadRequestException for circular reference', async () => {
      const moveCategoryDto: MoveCategoryDto = {
        parentId: 'child-id',
      };

      const existingCategory = {
        id: '1',
        name: { en: 'Electronics', vi: 'Điện tử' },
        slug: 'electronics',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(existingCategory);
      mockRepository.validateParentExists.mockResolvedValue({ id: 'child-id' });
      mockRepository.wouldCreateCircularReference.mockResolvedValue(true);

      await expect(service.move('1', moveCategoryDto)).rejects.toThrow(
        new BadRequestException(
          'Cannot move category: would create circular reference',
        ),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a category successfully', async () => {
      const existingCategory = {
        id: '1',
        name: { en: 'Electronics', vi: 'Điện tử' },
        slug: 'electronics',
        isActive: true,
        parent: null,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const deletedCategory = {
        ...existingCategory,
        isActive: false,
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(existingCategory);
      mockRepository.hasChildren.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(deletedCategory);

      await service.remove('1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['parent'],
      });
      expect(repository.hasChildren).toHaveBeenCalledWith('1');
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1', isActive: false }),
      );
    });

    it('should throw BadRequestException if category has children', async () => {
      const existingCategory = {
        id: '1',
        name: { en: 'Electronics', vi: 'Điện tử' },
        slug: 'electronics',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(existingCategory);
      mockRepository.hasChildren.mockResolvedValue(true);

      await expect(service.remove('1')).rejects.toThrow(
        new BadRequestException('Không thể xóa category có category con'),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      const query: QueryCategoryDto = {
        page: 1,
        limit: 10,
        onlyActive: true,
      };

      const mockResult = {
        data: [
          {
            id: '1',
            name: { en: 'Electronics', vi: 'Điện tử' },
            slug: 'electronics',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
      };

      mockRepository.findWithPagination.mockResolvedValue(mockResult);

      const result = await service.findAll(query);

      expect(repository.findWithPagination).toHaveBeenCalledWith(1, 10, true);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should search categories when search query is provided', async () => {
      const query: QueryCategoryDto = {
        search: 'electron',
        limit: 2,
        page: 1,
      };

      const categories = [
        {
          id: '1',
          name: { en: 'Electronics', vi: 'Điện tử' },
          slug: 'electronics',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: { en: 'Home Electronics', vi: 'Điện tử gia dụng' },
          slug: 'home-electronics',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.searchCategories.mockResolvedValue(categories);

      const result = await service.findAll(query);

      expect(repository.searchCategories).toHaveBeenCalledWith(
        'electron',
        true,
      );
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
    });

    it('should fetch children when parentId is provided', async () => {
      const query: QueryCategoryDto = {
        parentId: 'parent-id',
        page: 2,
        limit: 1,
      };

      const children = [
        {
          id: '3',
          name: { en: 'Accessories', vi: 'Phụ kiện' },
          slug: 'accessories',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findChildren.mockResolvedValue(children);

      const result = await service.findAll(query);

      expect(repository.findChildren).toHaveBeenCalledWith('parent-id', true);
      expect(result.data).toHaveLength(1);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findBySlug', () => {
    it('should return category when slug exists', async () => {
      const category = {
        id: '1',
        slug: 'electronics',
        name: { en: 'Electronics', vi: 'Điện tử' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findBySlug.mockResolvedValue(category);

      const result = await service.findBySlug('electronics');

      expect(repository.findBySlug).toHaveBeenCalledWith('electronics');
      expect(result).toBeDefined();
      expect(result.slug).toBe('electronics');
    });

    it('should throw NotFoundException when slug does not exist', async () => {
      mockRepository.findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('missing')).rejects.toThrow(
        new NotFoundException("Category with slug 'missing' not found"),
      );
    });
  });

  describe('getTree', () => {
    it('should return mapped category tree', async () => {
      const tree = [
        {
          id: 'root',
          name: { en: 'Root', vi: 'Gốc' },
          slug: 'root',
          children: [
            {
              id: 'child',
              name: { en: 'Child', vi: 'Con' },
              slug: 'child',
              children: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.getCategoryTree.mockResolvedValue(tree);

      const result = await service.getTree(true);

      expect(repository.getCategoryTree).toHaveBeenCalledWith(true);
      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
    });
  });

  describe('getRoots', () => {
    it('should return root categories', async () => {
      const roots = [
        {
          id: 'root',
          name: { en: 'Root', vi: 'Gốc' },
          slug: 'root',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findRoots.mockResolvedValue(roots);

      const result = await service.getRoots(false);

      expect(repository.findRoots).toHaveBeenCalledWith(false);
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('root');
    });
  });

  describe('getChildren', () => {
    it('should return child categories', async () => {
      const children = [
        {
          id: 'child',
          name: { en: 'Child', vi: 'Con' },
          slug: 'child',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findChildren.mockResolvedValue(children);

      const result = await service.getChildren('parent-id', false);

      expect(repository.findChildren).toHaveBeenCalledWith('parent-id', false);
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('child');
    });
  });

  describe('getAncestors', () => {
    it('should return ancestors when category exists', async () => {
      const category = {
        id: 'child',
        name: { en: 'Child', vi: 'Con' },
        slug: 'child',
      };

      const ancestors = [
        {
          id: 'root',
          name: { en: 'Root', vi: 'Gốc' },
          slug: 'root',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findOne.mockResolvedValue(category);
      mockRepository.findWithAncestors.mockResolvedValue(ancestors);

      const result = await service.getAncestors('child');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'child' },
      });
      expect(repository.findWithAncestors).toHaveBeenCalledWith('child');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('root');
    });

    it('should throw NotFoundException when category is missing', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getAncestors('missing')).rejects.toThrow(
        new NotFoundException("Category with ID 'missing' not found"),
      );
    });
  });

  describe('getDescendants', () => {
    it('should return descendants tree when exists', async () => {
      const category = { id: 'root' };
      const descendantsTree = {
        children: [
          {
            id: 'child',
            name: { en: 'Child', vi: 'Con' },
            slug: 'child',
            children: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      mockRepository.findOne.mockResolvedValue(category);
      mockRepository.findWithDescendants.mockResolvedValue(descendantsTree);

      const result = await service.getDescendants('root');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'root' },
      });
      expect(repository.findWithDescendants).toHaveBeenCalledWith('root');
      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(0);
    });

    it('should return empty array when no descendants', async () => {
      const category = { id: 'root' };

      mockRepository.findOne.mockResolvedValue(category);
      mockRepository.findWithDescendants.mockResolvedValue({ children: null });

      const result = await service.getDescendants('root');

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when category missing', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getDescendants('missing')).rejects.toThrow(
        new NotFoundException("Category with ID 'missing' not found"),
      );
    });
  });

  describe('bulkUpdateDisplayOrder', () => {
    it('should delegate to repository', async () => {
      const updates = [
        { id: '1', displayOrder: 1 },
        { id: '2', displayOrder: 2 },
      ];

      mockRepository.bulkUpdateDisplayOrder.mockResolvedValue(undefined);

      await service.bulkUpdateDisplayOrder(updates);

      expect(repository.bulkUpdateDisplayOrder).toHaveBeenCalledWith(updates);
    });
  });
});
