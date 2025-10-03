# Common Utilities - Detailed Log

# Module Purpose

Shared utilities for the application: global exception handling, response transformation, custom decorators, and guards.

# Files in This Module

src/common/
filters/
http-exception.filter.ts # Global exception filter
interceptors/
transform.interceptor.ts # Response transformation interceptor
decorators/
public.decorator.ts # @Public() decorator
roles.decorator.ts # @Roles() decorator
current-user.decorator.ts # @CurrentUser() decorator
guards/
jwt-auth.guard.ts # Global JWT guard
cache/
cache.interface.ts # Cache service interface
cache.memory.service.ts # In-memory cache implementation
cache.module.ts # Cache module with DI

# Dependencies

- `@nestjs/common`, `@nestjs/core`
- `class-transformer`
- `reflect-metadata`

# Change History

## Filters

| ID   | Type | File                             | Line/Method | Description                                 | Related IDs |
| ---- | ---- | -------------------------------- | ----------- | ------------------------------------------- | ----------- |
| C001 | feat | filters/http-exception.filter.ts | -           | Create global HTTP exception filter         | -           |
| C002 | feat | filters/http-exception.filter.ts | catch       | Implement catch method for error formatting | -           |

## Interceptors

| ID   | Type | File                                  | Line/Method | Description                                    | Related IDs |
| ---- | ---- | ------------------------------------- | ----------- | ---------------------------------------------- | ----------- |
| C003 | feat | interceptors/transform.interceptor.ts | -           | Create transform interceptor                   | -           |
| C004 | feat | interceptors/transform.interceptor.ts | intercept   | Implement intercept method for response format | -           |

## Decorators

| ID   | Type | File                                 | Line/Method | Description                     | Related IDs |
| ---- | ---- | ------------------------------------ | ----------- | ------------------------------- | ----------- |
| C005 | feat | decorators/public.decorator.ts       | -           | Create @Public() decorator      | -           |
| C006 | feat | decorators/roles.decorator.ts        | -           | Create @Roles() decorator       | -           |
| C007 | feat | decorators/current-user.decorator.ts | -           | Create @CurrentUser() decorator | -           |

## Guards

| ID   | Type | File                     | Line/Method | Description                  | Related IDs |
| ---- | ---- | ------------------------ | ----------- | ---------------------------- | ----------- |
| C008 | feat | guards/jwt-auth.guard.ts | -           | Create global JWT auth guard | -           |

## DTOs

| ID   | Type | File                            | Line/Method | Description                                                             | Related IDs |
| ---- | ---- | ------------------------------- | ----------- | ----------------------------------------------------------------------- | ----------- |
| C010 | feat | dto/translatable-content.dto.ts | -           | Create TranslatableContentDto for multilingual support                  | -           |
| C011 | fix  | dto/translatable-content.dto.ts | @ValidateIf | Fix validation logic: remove @IsOptional, enforce at least one language | C010        |

## Tests

| ID   | Type | File                 | Line/Method | Description                     | Related IDs |
| ---- | ---- | -------------------- | ----------- | ------------------------------- | ----------- |
| C009 | test | tests/common.spec.ts | -           | Unit tests for common utilities | C001-C008   |

## Cache

| ID   | Type | File                                     | Line/Method | Description                                      | Related IDs |
| ---- | ---- | ---------------------------------------- | ----------- | ------------------------------------------------ | ----------- |
| C012 | feat | cache/cache.interface.ts                 | -           | Define CacheService interface and DI token       | -           |
| C013 | feat | cache/cache.memory.service.ts            | -           | Implement in-memory cache service                | C012        |
| C014 | feat | cache/cache.module.ts                    | register    | Create dynamic cache module with adapter pattern | C012,C013   |
| C015 | test | cache/tests/cache.interface.spec.ts      | -           | Unit tests for cache interface                   | C012        |
| C016 | test | cache/tests/cache.memory.service.spec.ts | -           | Unit tests for memory cache service              | C013        |
| C017 | test | cache/tests/cache.module.spec.ts         | -           | Integration tests for cache module               | C014        |

## Logger

| ID   | Type | File                                     | Line/Method | Description                                      | Related IDs |
| ---- | ---- | ---------------------------------------- | ----------- | ------------------------------------------------ | ----------- |
| C018 | test | logger/tests/logger.file.service.spec.ts | -           | Unit tests for FileLoggerService (27 tests)      | -           |

[Applied Workflow]: ✅ Tested incrementally (C012 → C018)
[ESLint]: ✅ Checked after each step

# Current State

- Files: 10 source files, 5 test files
- Lines of Code: ~600 LOC
- Test Coverage: 80.45% (statements), 73.82% (branches), 79.13% (functions), 80.01% (lines)
- API Endpoints: 0
- Database Tables: 0
- Unit Tests: 35+ tests (cache: 8, logger: 27)

## 6. Implementation Patterns

```typescript
// Sử dụng decorators trong controller
@Controller('users')
@UseGuards(JwtAuthGuard) // Global guard
class UsersController {
  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Public() // Không cần auth
  @Get('public-info')
  getPublicInfo() {
    return 'Public data';
  }

  @Roles('admin') // Chỉ admin
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    // ...
  }
}

// Response transformation tự động
// Tất cả responses sẽ có format: { statusCode, message, data, timestamp }

// Using cache service
@Controller('products')
class ProductsController {
  constructor(@Inject(CACHE_SERVICE) private readonly cache: CacheService) {}

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    const cacheKey = `product:${id}`;

    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    // Fetch from service
    const product = await this.productService.findById(id);

    // Cache result (TTL 5 minutes)
    await this.cache.set(cacheKey, product, 300);

    return product;
  }
}
```

## 7. Module Dependencies

- **Imports**: Không import gì (shared utilities)
- **Exports**: HttpExceptionFilter, TransformInterceptor, JwtAuthGuard, decorators (@Public, @Roles, @CurrentUser), CacheModule, CacheService
- **Injects**: Không inject, được sử dụng globally hoặc trong modules khác

## 8. Business Rules

- **Global Auth**: Tất cả endpoints đều cần JWT trừ khi dùng @Public()
- **Response Format**: Tất cả responses đều được transform thành { statusCode, message, data, timestamp }
- **Error Handling**: Exceptions được catch và format thành HTTP errors
- **Role-Based Access**: Sử dụng @Roles() để kiểm soát quyền admin/user
- **Current User**: Dùng @CurrentUser() để lấy user từ JWT payload
- **Caching**: Use CacheService for performance optimization, TTL in seconds, adapter pattern for different environments
