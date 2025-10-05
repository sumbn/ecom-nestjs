import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MoveCategoryDto } from './dto/move-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CategoryTreeResponseDto } from './dto/category-tree-response.dto';
import { Category } from './entities/category.entity';

// Helper function to create mock Category objects
const createMockCategory = (overrides: Partial<Category> = {}): Category => ({
  id: '1',
  name: { en: 'Electronics', vi: 'Điện tử' },
  description: { en: 'Electronic devices', vi: 'Thiết bị điện tử' },
  slug: 'electronics',
  isActive: true,
  displayOrder: 0,
  parent: null,
  children: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockCategoriesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findBySlug: jest.fn(),
    update: jest.fn(),
    move: jest.fn(),
    remove: jest.fn(),
    getTree: jest.fn(),
    getRoots: jest.fn(),
    getChildren: jest.fn(),
    getAncestors: jest.fn(),
    getDescendants: jest.fn(),
    bulkUpdateDisplayOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: { en: 'Electronics', vi: 'Điện tử' },
        slug: 'electronics',
        displayOrder: 1,
        isActive: true,
      };

      const mockCategory = createMockCategory({
        name: createCategoryDto.name,
        description: createCategoryDto.description,
        slug: createCategoryDto.slug,
        displayOrder: createCategoryDto.displayOrder,
        isActive: createCategoryDto.isActive,
      });

      const mockResult = new CategoryResponseDto(mockCategory);

      mockCategoriesService.create.mockResolvedValue(mockResult);

      const result = await controller.create(createCategoryDto);

      expect(service.create).toHaveBeenCalledWith(createCategoryDto);
      expect(result).toEqual(mockResult);
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
          new CategoryResponseDto(
            createMockCategory({
              id: '1',
              slug: 'electronics',
            }),
          ),
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockCategoriesService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getTree', () => {
    it('should return category tree', async () => {
      const mockTree = [
        new CategoryTreeResponseDto(
          createMockCategory({
            id: '1',
            slug: 'electronics',
          }),
        ),
      ];

      mockCategoriesService.getTree.mockResolvedValue(mockTree);

      const result = await controller.getTree(true);

      expect(service.getTree).toHaveBeenCalledWith(true);
      expect(result).toEqual(mockTree);
    });
  });

  describe('getRoots', () => {
    it('should return root categories', async () => {
      const mockRoots = [
        new CategoryResponseDto(
          createMockCategory({
            id: '1',
            slug: 'electronics',
          }),
        ),
      ];

      mockCategoriesService.getRoots.mockResolvedValue(mockRoots);

      const result = await controller.getRoots(true);

      expect(service.getRoots).toHaveBeenCalledWith(true);
      expect(result).toEqual(mockRoots);
    });
  });

  describe('findOne', () => {
    it('should return a category by ID', async () => {
      const mockCategory = new CategoryResponseDto(
        createMockCategory({ id: '1' }),
      );

      mockCategoriesService.findOne.mockResolvedValue(mockCategory);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCategory);
    });
  });

  describe('findBySlug', () => {
    it('should return a category by slug', async () => {
      const mockCategory = new CategoryResponseDto(
        createMockCategory({ slug: 'electronics' }),
      );

      mockCategoriesService.findBySlug.mockResolvedValue(mockCategory);

      const result = await controller.findBySlug('electronics');

      expect(service.findBySlug).toHaveBeenCalledWith('electronics');
      expect(result).toEqual(mockCategory);
    });
  });

  describe('getChildren', () => {
    it('should return children of a category', async () => {
      const mockChildren = [
        new CategoryResponseDto(
          createMockCategory({ id: '2', slug: 'laptops' }),
        ),
      ];

      mockCategoriesService.getChildren.mockResolvedValue(mockChildren);

      const result = await controller.getChildren('1', true);

      expect(service.getChildren).toHaveBeenCalledWith('1', true);
      expect(result).toEqual(mockChildren);
    });
  });

  describe('getAncestors', () => {
    it('should return ancestors of a category', async () => {
      const mockAncestors = [
        new CategoryResponseDto(
          createMockCategory({ id: '1', slug: 'electronics' }),
        ),
      ];

      mockCategoriesService.getAncestors.mockResolvedValue(mockAncestors);

      const result = await controller.getAncestors('2');

      expect(service.getAncestors).toHaveBeenCalledWith('2');
      expect(result).toEqual(mockAncestors);
    });
  });

  describe('getDescendants', () => {
    it('should return descendants of a category', async () => {
      const mockDescendants = [
        new CategoryTreeResponseDto(
          createMockCategory({ id: '2', slug: 'laptops' }),
        ),
      ];

      mockCategoriesService.getDescendants.mockResolvedValue(mockDescendants);

      const result = await controller.getDescendants('1');

      expect(service.getDescendants).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockDescendants);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateCategoryDto: UpdateCategoryDto = {
        name: { en: 'Updated Electronics', vi: 'Điện tử cập nhật' },
        slug: 'updated-electronics',
      };

      const updatedCategory = createMockCategory({
        id: '1',
        name: updateCategoryDto.name,
        slug: updateCategoryDto.slug ?? 'updated-electronics',
      });

      const mockResult = new CategoryResponseDto(updatedCategory);

      mockCategoriesService.update.mockResolvedValue(mockResult);

      const result = await controller.update('1', updateCategoryDto);

      expect(service.update).toHaveBeenCalledWith('1', updateCategoryDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('move', () => {
    it('should move a category', async () => {
      const moveCategoryDto: MoveCategoryDto = {
        parentId: 'new-parent-id',
        displayOrder: 5,
      };

      const movedCategory = createMockCategory({
        id: '1',
        displayOrder: moveCategoryDto.displayOrder ?? 0,
      });

      const mockResult = new CategoryResponseDto(movedCategory);

      mockCategoriesService.move.mockResolvedValue(mockResult);

      const result = await controller.move('1', moveCategoryDto);

      expect(service.move).toHaveBeenCalledWith('1', moveCategoryDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('bulkUpdateDisplayOrder', () => {
    it('should bulk update display order', async () => {
      const updates = [
        { id: '1', displayOrder: 1 },
        { id: '2', displayOrder: 2 },
      ];

      mockCategoriesService.bulkUpdateDisplayOrder.mockResolvedValue(undefined);

      await controller.bulkUpdateDisplayOrder(updates);

      expect(service.bulkUpdateDisplayOrder).toHaveBeenCalledWith(updates);
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      mockCategoriesService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
