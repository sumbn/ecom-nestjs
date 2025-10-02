# Categories Module - Detailed Log

## 1. Module Purpose

Product category management with tree structure, multilingual content, and SEO-friendly URLs.

## 2. Files in Module

src/modules/categories/
├── entities/category.entity.ts # Category entity with closure-table tree
├── dto/ # DTOs for create, update, query, responses
├── repositories/categories.repository.ts # Custom repository with tree operations
├── categories.service.ts # Service (to be created)
├── categories.controller.ts # Controller (to be created)
└── tests/ # Unit tests for entity and DTOs

## 3. Dependencies

- `@nestjs/common`, `@nestjs/typeorm`, `typeorm`
- `class-validator`, `class-transformer`
- PostgreSQL JSONB support

## 4. Change History

### Entity & Database

| ID     | Type | File                                      | Line/Method   | Description                                       | Related IDs   |
| ------ | ---- | ----------------------------------------- | ------------- | ------------------------------------------------- | ------------- |
| CAT001 | feat | common/types/translatable-content.type.ts | -             | Create TranslatableContent type for JSONB         | -             |
| CAT002 | feat | entities/category.entity.ts               | @Entity       | Create Category entity with UUID primary key      | -             |
| CAT003 | feat | entities/category.entity.ts               | @Tree         | Configure closure-table strategy                  | -             |
| CAT004 | feat | entities/category.entity.ts               | name          | Add translatable name field (JSONB)               | CAT001        |
| CAT005 | feat | entities/category.entity.ts               | description   | Add translatable description field (JSONB)        | CAT001        |
| CAT006 | feat | entities/category.entity.ts               | slug          | Add slug field (unique, indexed)                  | -             |
| CAT007 | feat | entities/category.entity.ts               | isActive      | Add soft delete field                             | -             |
| CAT008 | feat | entities/category.entity.ts               | displayOrder  | Add display order field                           | -             |
| CAT009 | feat | entities/category.entity.ts               | @TreeParent   | Add parent relationship                           | -             |
| CAT010 | feat | entities/category.entity.ts               | @TreeChildren | Add children relationship                         | -             |
| CAT011 | feat | database/migrations/                      | Migration     | Create categories + category_closure tables       | CAT002-CAT010 |
| CAT012 | feat | common/dto/translatable-content.dto.ts    | -             | Create TranslatableContentDto with validation     | CAT001        |
| CAT013 | feat | dto/create-category.dto.ts                | -             | Create CreateCategoryDto with nested validation   | CAT012        |
| CAT014 | feat | dto/update-category.dto.ts                | -             | Create UpdateCategoryDto (partial, omit parentId) | CAT013        |
| CAT015 | feat | dto/move-category.dto.ts                  | -             | Create MoveCategoryDto for moving in tree         | -             |
| CAT016 | feat | dto/query-category.dto.ts                 | -             | Create QueryCategoryDto for filtering/pagination  | -             |
| CAT017 | feat | dto/category-response.dto.ts              | -             | Create CategoryResponseDto with @Exclude/@Expose  | -             |
| CAT018 | feat | dto/category-tree-response.dto.ts         | -             | Create CategoryTreeResponseDto for tree endpoints | CAT017        |

### DTOs

| ID     | Type     | File                                   | Line/Method | Description                                          | Related IDs   |
| ------ | -------- | -------------------------------------- | ----------- | ---------------------------------------------------- | ------------- |
| CAT012 | feat     | common/dto/translatable-content.dto.ts | -           | Create TranslatableContentDto with validation        | CAT001        |
| CAT013 | feat     | dto/create-category.dto.ts             | -           | Create CreateCategoryDto with nested validation      | CAT012        |
| CAT014 | feat     | dto/update-category.dto.ts             | -           | Create UpdateCategoryDto (partial, omit parentId)    | CAT013        |
| CAT015 | feat     | dto/move-category.dto.ts               | -           | Create MoveCategoryDto for moving in tree            | -             |
| CAT016 | feat     | dto/query-category.dto.ts              | -           | Create QueryCategoryDto for filtering/pagination     | -             |
| CAT017 | feat     | dto/category-response.dto.ts           | -           | Create CategoryResponseDto with @Exclude/@Expose     | -             |
| CAT018 | feat     | dto/category-tree-response.dto.ts      | -           | Create CategoryTreeResponseDto for tree endpoints    | CAT017        |
| CAT021 | refactor | dto/\*.dto.ts                          | all files   | Remove @ApiProperty decorators (Vercel incompatible) | CAT012-CAT018 |

### Repository

| ID     | Type | File                                  | Line/Method                  | Description                                                       | Related IDs   |
| ------ | ---- | ------------------------------------- | ---------------------------- | ----------------------------------------------------------------- | ------------- |
| CAT023 | feat | repositories/categories.repository.ts | @Injectable                  | Create CategoriesRepository extending Repository + TreeRepository | -             |
| CAT024 | feat | repositories/categories.repository.ts | constructor                  | Initialize TreeRepository instance                                | CAT023        |
| CAT025 | feat | repositories/categories.repository.ts | findBySlug                   | Add findBySlug method for URL lookup                              | CAT023        |
| CAT026 | feat | repositories/categories.repository.ts | findWithAncestors            | Add findWithAncestors method for breadcrumbs                      | CAT023        |
| CAT027 | feat | repositories/categories.repository.ts | findWithDescendants          | Add findWithDescendants method for subtrees                       | CAT023        |
| CAT028 | feat | repositories/categories.repository.ts | getCategoryTree              | Add getCategoryTree with active filtering                         | CAT023        |
| CAT029 | feat | repositories/categories.repository.ts | filterActiveCategories       | Add helper for recursive active filtering                         | CAT028        |
| CAT030 | feat | repositories/categories.repository.ts | findRoots                    | Add findRoots method for root categories                          | CAT023        |
| CAT031 | feat | repositories/categories.repository.ts | findChildren                 | Add findChildren method for direct children                       | CAT023        |
| CAT032 | feat | repositories/categories.repository.ts | checkSlugUnique              | Add checkSlugUnique for create validation                         | CAT023        |
| CAT033 | feat | repositories/categories.repository.ts | checkSlugUniqueForUpdate     | Add checkSlugUniqueForUpdate for update validation                | CAT023        |
| CAT034 | feat | repositories/categories.repository.ts | validateParentExists         | Add validateParentExists method                                   | CAT023        |
| CAT035 | feat | repositories/categories.repository.ts | hasChildren                  | Add hasChildren method for delete validation                      | CAT023        |
| CAT036 | feat | repositories/categories.repository.ts | wouldCreateCircularReference | Add circular reference prevention                                 | CAT023        |
| CAT037 | feat | repositories/categories.repository.ts | searchCategories             | Add searchCategories with JSONB query                             | CAT023        |
| CAT038 | feat | repositories/categories.repository.ts | findWithPagination           | Add findWithPagination method                                     | CAT023        |
| CAT039 | feat | repositories/categories.repository.ts | countCategories              | Add countCategories method                                        | CAT023        |
| CAT040 | feat | repositories/categories.repository.ts | bulkUpdateDisplayOrder       | Add bulkUpdateDisplayOrder method                                 | CAT023        |
| CAT041 | fix  | repositories/categories.repository.ts | whereCondition types         | Replace 'any' with FindOptionsWhere<Category> for type safety     | CAT023-CAT040 |

### Tests

| ID     | Type | File                                                   | Line/Method     | Description                                                        | Related IDs   |
| ------ | ---- | ------------------------------------------------------ | --------------- | ------------------------------------------------------------------ | ------------- |
| CAT019 | test | tests/dto/translatable-content.dto.spec.ts             | -               | Unit tests for TranslatableContentDto (6 cases)                    | CAT012        |
| CAT020 | test | tests/dto/create-category.dto.spec.ts                  | -               | Unit tests for CreateCategoryDto (12 cases)                        | CAT013        |
| CAT022 | fix  | tests/dto/create-category.dto.spec.ts                  | imports         | Add reflect-metadata import to fix Type() decorator                | CAT020        |
| CAT042 | test | tests/repositories/categories.repository.spec.ts       | -               | Create repository integration tests (29 test cases)                | CAT023-CAT040 |
| CAT043 | fix  | tests/repositories/categories.repository.spec.ts       | beforeAll       | Enable synchronize:true for test environment                       | CAT042        |
| CAT044 | fix  | tests/repositories/categories.repository.spec.ts       | beforeAll       | Manually create category_closure table (TypeORM tree issue)        | CAT043        |
| CAT045 | fix  | tests/repositories/categories.repository.spec.ts       | beforeEach      | Use DELETE instead of TRUNCATE for test cleanup                    | CAT042        |
| CAT046 | fix  | tests/repositories/categories.repository.spec.ts       | line 78         | Fix test bug: create 'laptops' child before finding it             | CAT042        |
| CAT047 | fix  | tests/repositories/categories.repository.spec.ts       | line 145        | Fix test bug: create 'test-1' category before checking slug        | CAT042        |
| CAT048 | fix  | tests/repositories/categories.repository.spec.ts       | line 438        | Use Promise.all for faster bulk insert (25 categories)             | CAT042        |
| CAT049 | fix  | tests/repositories/categories.repository.spec.ts       | line 451        | Increase timeout to 10s for bulk insert beforeEach                 | CAT048        |
| CAT050 | test | tests/category-entity.spec.ts                          | -               | Create entity integration tests (4 test cases)                     | CAT002-CAT010 |
| CAT051 | fix  | tests/category-entity.spec.ts                          | line 90-96      | Fix unique slug constraint test with async function wrapper        | CAT050        |
| CAT052 | fix  | tests/repositories/categories.repository.spec.ts       | test isolation  | Fix test isolation issues - replace clear() with DELETE queries    | CAT042        |
| CAT053 | fix  | tests/repositories/categories.repository.spec.ts       | findRoots tests | Fix foreign key constraint violations using DELETE FROM categories | CAT052        |
| CAT054 | fix  | tests/repositories/categories.repository.spec.ts       | countCategories | Fix duplicate slug violations with unique test-specific slugs      | CAT052        |
| CAT055 | fix  | tests/repositories/categories.repository.spec.ts       | all tests       | Fix test expectations to match actual data created in tests        | CAT052        |
| CAT056 | test | tests/repositories/categories-tree.integration.spec.ts | -               | Create tree operations integration tests (10 test cases)           | CAT023-CAT040 |
| CAT057 | fix  | repositories/categories.repository.ts                  | treeRepository  | Change treeRepository from private to protected for test override  | CAT023        |
| CAT058 | fix  | tests/repositories/categories-tree.integration.spec.ts | beforeEach      | Fix transactional context for tree repository in tests             | CAT056        |
| CAT059 | fix  | tests/repositories/categories-tree.integration.spec.ts | test slugs      | Make all test slugs unique with 'tree-' prefix to avoid conflicts  | CAT056        |
| CAT060 | fix  | tests/repositories/categories-tree.integration.spec.ts | beforeEach      | Add TRUNCATE CASCADE for proper test isolation                     | CAT058        |
| CAT061 | fix  | tests/repositories/categories.repository.spec.ts       | beforeEach      | Add TRUNCATE CASCADE for proper test isolation                     | CAT042        |

## 5. Current State

- **Files**: 3 source files, 6 test files
- **Lines of Code**: ~1540 LOC (150 entity + 328 repository + 100 DTO + 962 tests)
- **Test Coverage**: Entity + Repository fully tested (55 passing tests: 4 entity + 24 repository + 10 tree integration + 17 DTO tests)
- **Database Tables**: 2 (categories, category_closure)
- **Indexes**: 4 (slug, isActive, closure ancestor, closure descendant)
- **Status**: ✅ Entity and Repository complete and tested (all test issues fixed, including tree operations)

## 6. Implementation Patterns

### Repository Methods

- **findBySlug(slug: string)**: `this.findOne({ where: { slug }, relations: ['parent', 'children'] })`
- **findWithAncestors(id: string)**: `this.treeRepository.findAncestorsTree(category)`
- **findWithDescendants(id: string)**: `this.treeRepository.findDescendantsTree(category)`
- **getCategoryTree(onlyActive: boolean)**: Roots query + recursive filter for active categories
- **findRoots(onlyActive: boolean)**: `this.find({ where: FindOptionsWhere<Category>, order: { displayOrder: 'ASC' } })`
- **findChildren(parentId: string, onlyActive: boolean)**: `this.find({ where: FindOptionsWhere<Category>, order: { displayOrder: 'ASC' } })`
- **checkSlugUnique(slug: string)**: `this.count({ where: { slug } }) === 0`
- **checkSlugUniqueForUpdate(slug: string, excludeId: string)**: Count then check existing id !== excludeId
- **validateParentExists(parentId: string)**: `this.findOne({ where: { id: parentId, isActive: true } })`
- **hasChildren(id: string)**: `this.count({ where: { parent: { id } } }) > 0`
- **wouldCreateCircularReference(categoryId, targetParentId)**: Check if targetParent is descendant of category
- **searchCategories(keyword, onlyActive)**: QueryBuilder with ILIKE on JSONB fields (name->>'en', name->>'vi')
- **findWithPagination(page, limit, onlyActive)**: `this.findAndCount()` with FindOptionsWhere<Category> and skip/take
- **countCategories(onlyActive)**: `this.count({ where: FindOptionsWhere<Category> })`
- **bulkUpdateDisplayOrder(updates)**: Transactional update loop for multiple categories

### Validation Rules

- **Slug uniqueness**: Checked before create/update operations
- **Parent existence**: Parent category must exist and be active
- **Circular reference prevention**: Cannot move category under its own descendant
- **Tree constraints**: Category cannot be its own parent, parent must be different category

## 7. Module Dependencies

### Imports

- **@nestjs/common**: Injectable decorator
- **typeorm**: DataSource, Repository, TreeRepository, IsNull, FindOptionsWhere

### Exports

- **CategoriesRepository**: Injected into CategoriesService (next module step)

### Module Relationships

- **Depends on**: Category entity, database configuration
- **Used by**: CategoriesService (pending implementation)

## 8. Business Rules

### Constraints

- **Soft delete**: Uses isActive flag, never performs hard delete
- **Tree integrity**: Closure table maintains ancestor/descendant relationships automatically
- **Unique slug**: Enforced at application level (supported by database unique index)
- **Active filtering**: Optional boolean parameter on all query methods
- **Display order**: ASC ordering for consistent category presentation

### Calculations

- **Tree depth**: Unlimited depth (closure table advantage over adjacency list)
- **Category count**: Separate methods for total vs active-only counts
- **Pagination**: Page-based pagination with total record count

### Behaviors

- **Root categories**: Identified by parent IS NULL
- **Child categories**: Identified by parent IS NOT NULL
- **Recursive active filter**: Filters children recursively in tree operations
- **JSONB search**: Case-insensitive search in name.en and name.vi fields
- **Bulk ordering**: Transactional updates prevent partial failure states

## 🎓 Key Implementation Details

### Tree Structure (Closure Table)

### Translatable Content (JSONB)

```typescript
name: { en: "Electronics", vi: "Điện tử" }
description: { en: "Electronic devices", vi: "Thiết bị điện tử" }

Configuration Decisions

Tree Strategy: closure-table (scalable, 3NF compliant)
Default Locale: en (English)
Translation Validation: At least one language required
Slug Strategy: Auto-suggest + manual override
Empty Children: Return empty array
---

## 🎓 Technical Decisions

### 1. Why Closure Table?
- ✅ Scalable for large trees
- ✅ 3NF compliant (separate relationship table)
- ✅ Fast ancestor/descendant queries
- ✅ No depth limitations

### 2. Why JSONB for translations?
- ✅ No extra join tables needed
- ✅ PostgreSQL JSONB is indexed and fast
- ✅ Easy to add new languages
- ✅ Query với `name->>'vi'` directly

### 3. Why displayOrder field?
- ✅ Admin có thể sắp xếp categories trong cùng level
- ✅ Không phụ thuộc vào alphabet
- ✅ Flexible ordering

---
```
