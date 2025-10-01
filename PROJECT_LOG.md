# NestJS E-Commerce Backend - Project Log

## 🎯 Project Context

- **Type**: REST API Backend
- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL + TypeORM (migrations only, NO sync)
- **Auth**: JWT (access 15m) + Refresh Token (7d)
- **Test**: Jest (≥80% coverage required)
- **Deploy Target**: Vercel (serverless)

## 🏗️ Architecture Patterns

### Code Structure

```
src/
├── common/           # Shared utilities (filters, interceptors, decorators, guards)
├── config/           # Config files (database, env validation)
├── modules/          # Feature modules (users, auth, categories, products, etc.)
│   └── <module>/
│       ├── entities/     # TypeORM entities
│       ├── dto/          # Data Transfer Objects with validation
│       ├── repositories/ # Repository pattern
│       ├── *.service.ts  # Business logic
│       ├── *.controller.ts # REST endpoints
│       └── tests/        # Unit + E2E tests
└── database/migrations/  # TypeORM migrations
```

## 📚 Library Versions (Context)

Chỉ liệt kê core dependencies ảnh hưởng trực tiếp đến code & pattern:

- **Node.js**: 20.x
- **NestJS**: 10.x
- **TypeORM**: 0.3.x
- **PostgreSQL**: 15.x
- **Jest**: 29.x
- **class-validator**: 0.14.x
- **bcrypt**: 5.x
- **passport**: 0.7.x
- **passport-jwt**: 4.x

## 🎨 Key Patterns

- **Repository Pattern**: All data access through repositories
- **DTO Validation**: class-validator on all inputs
- **Response Format**: `{ statusCode, message, data, timestamp }`
- **Error Format**: `{ statusCode, message[], path, method, timestamp }`
- **Auth Guard**: Global JWT guard, use `@Public()` for public routes
- **RBAC**: `@Roles('admin', 'user')` decorator
- **Soft Delete**: `isActive: boolean` instead of hard delete
- **Tree Structure**: Closure-table strategy for hierarchical data
- **Multilingual**: JSONB fields for en/vi content
- **Pagination**: `{ data[], total, page, limit, totalPages }`

## ✅ Testing Strategy

- **Unit Tests**: All services, repositories, guards, strategies
- **E2E Tests**: All API endpoints with authorization scenarios
- **Coverage**: Lines ≥80%, Branches ≥80%, Functions ≥80%

---

## 📊 Current Architecture State

### Database Schema

users
├── id (uuid, pk)
├── email (varchar, unique, indexed)
├── password_hash (varchar)
├── first_name (varchar)
├── last_name (varchar)
├── role (enum: user, admin)
├── is_active (boolean, for soft delete)
└── created_at, updated_at (timestamp)
refresh_tokens
├── id (uuid, pk)
├── user_id (uuid, fk -> users)
├── token (varchar, unique, indexed)
├── expires_at (timestamp)
├── is_revoked (boolean)
├── revoked_at (timestamp, nullable)
├── device_info (varchar)
├── ip_address (varchar)
├── user_agent (varchar)
└── created_at, updated_at (timestamp)
categories
├── id (uuid, pk)
├── name (jsonb, multilingual en/vi)
├── description (jsonb, nullable, multilingual en/vi)
├── slug (varchar, unique, indexed)
├── is_active (boolean)
├── display_order (integer, default 0)
├── parent_id (uuid, fk -> categories, nullable)
├── created_at, updated_at (timestamp)
└── category_closure (closure table for tree structure)

### API Endpoints

**Public:**

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /health`

**Protected (JWT Required):**

- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/sessions`
- `DELETE /api/v1/auth/sessions/:id`
- `GET /api/v1/users` (admin only)
- `POST /api/v1/users` (admin only)
- `GET /api/v1/users/:id` (admin or own user)
- `PATCH /api/v1/users/:id` (admin or own user)
- `DELETE /api/v1/users/:id` (admin only)

---

## 🚀 Development Timeline

| Step | Type     | Module     | Description                                                   | Files Changed                            | Tests |
| ---- | -------- | ---------- | ------------------------------------------------------------- | ---------------------------------------- | ----- |
| 0    | setup    | -          | Project scaffolding                                           | package.json, tsconfig, jest.config      | -     |
| 0    | config   | -          | ESLint, Prettier setup                                        | .eslintrc.js, .prettierrc                | -     |
| 0    | config   | -          | Database config with DataSource                               | config/database.config.ts                | ✓     |
| 0    | config   | -          | Env validation schema                                         | config/env.validation.ts                 | ✓     |
| 1    | feat     | database   | Database connection + health check                            | app.controller.ts                        | -     |
| 2    | feat     | users      | User entity + migration                                       | entities/user.entity.ts                  | -     |
| 2    | feat     | users      | User DTOs with validation                                     | dto/\*.ts                                | -     |
| 2    | feat     | users      | User repository (repository pattern)                          | users.repository.ts                      | ✓     |
| 2    | feat     | users      | User service (CRUD + business logic)                          | users.service.ts                         | ✓     |
| 2    | feat     | users      | User controller (REST API)                                    | users.controller.ts                      | ✓     |
| 2    | test     | users      | E2E tests for all endpoints                                   | tests/\*.e2e-spec.ts                     | ✓     |
| 3    | feat     | common     | Global exception filter                                       | filters/http-exception.filter.ts         | ✓     |
| 3    | feat     | common     | Transform interceptor                                         | interceptors/transform.interceptor.ts    | ✓     |
| 3    | feat     | common     | Custom decorators (@Public, @Roles, @CurrentUser)             | decorators/\*.ts                         | ✓     |
| 4    | feat     | auth       | Auth DTOs (Login, Register, AuthResponse)                     | dto/\*.ts                                | -     |
| 4    | feat     | auth       | JWT strategy                                                  | strategies/jwt.strategy.ts               | ✓     |
| 4    | feat     | auth       | Local strategy                                                | strategies/local.strategy.ts             | ✓     |
| 4    | feat     | auth       | Guards (JWT, Local, Roles)                                    | guards/\*.ts                             | ✓     |
| 4    | feat     | auth       | Auth service (login, register)                                | auth.service.ts                          | ✓     |
| 4    | feat     | auth       | Auth controller (/login, /register, /me)                      | auth.controller.ts                       | -     |
| 4    | test     | auth       | E2E tests for auth flow                                       | tests/\*.e2e-spec.ts                     | ✓     |
| 4.1  | feat     | auth       | RefreshToken entity + migration                               | entities/refresh-token.entity.ts         | -     |
| 4.1  | feat     | auth       | RefreshToken repository                                       | repositories/refresh-token.repository.ts | ✓     |
| 4.1  | refactor | auth       | Dual token system (access + refresh)                          | auth.service.ts                          | ✓     |
| 4.1  | feat     | auth       | Session management endpoints                                  | auth.controller.ts                       | -     |
| 4.1  | feat     | auth       | Device tracking (IP, User-Agent)                              | auth.service.ts, auth.controller.ts      | -     |
| 4.1  | test     | auth       | E2E tests for refresh tokens & sessions                       | tests/\*.e2e-spec.ts                     | ✓     |
| 5    | test     | all        | Complete test coverage (≥80%)                                 | tests/\*.spec.ts                         | ✓     |
| 5.1  | bugfix   | config     | Fix reflect-metadata import in env.validation tests           | config/tests/env.validation.spec.ts      | ✓     |
| 6    | feat     | categories | Category entity with tree structure                           | entities/category.entity.ts              | -     |
| 6    | test     | categories | Category integration tests                                    | tests/category-entity.spec.ts            | ✓     |
| 6.1  | bugfix   | config     | Add test environment support for entities/synchronize/logging | config/database.config.ts                | ✓     |
| 6.2  | bugfix   | config     | Enforce production-ready config (always synchronize:false)    | config/database.config.ts                | ✓     |

---

## 🎓 Key Decisions & Rationale

### Why Repository Pattern?

- **AI Context**: When I see `usersRepository.findByEmail()`, I know it's a custom query method in repository
- **Testability**: Easy to mock in unit tests
- **Separation**: Data access separated from business logic

### Why Dual Token System?

- **Security**: Short-lived access tokens limit exposure
- **UX**: Long-lived refresh tokens for seamless experience
- **Control**: Can revoke refresh tokens (logout from all devices)

### Why Soft Delete?

- **Data Integrity**: Never lose data
- **Audit Trail**: Can see who was deleted when
- **Reversible**: Can reactivate accounts

### Why Global Guards?

- **Security First**: Protected by default, explicit @Public() for public routes
- **AI Context**: When I see a controller without @Public(), I know it needs auth

---

## 🔧 Environment Variables Reference

```env
# Required
NODE_ENV=development|production|test
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=***
DATABASE_NAME=nest_ecom
JWT_SECRET=*** (min 32 chars)

# Optional with defaults
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
DATABASE_MAX_CONNECTIONS=100
DATABASE_SSL=false
PORT=3000
```

---

## 🎓 Key Decisions & Rationale

### Why Repository Pattern?

- **AI Context**: When I see `usersRepository.findByEmail()`, I know it's a custom query method in repository
- **Testability**: Easy to mock in unit tests
- **Separation**: Data access separated from business logic

### Why Dual Token System?

- **Security**: Short-lived access tokens limit exposure
- **UX**: Long-lived refresh tokens for seamless experience
- **Control**: Can revoke refresh tokens (logout from all devices)

### Why Soft Delete?

- **Data Integrity**: Never lose data
- **Audit Trail**: Can see who was deleted when
- **Reversible**: Can reactivate accounts

### Why Global Guards?

- **Security First**: Protected by default, explicit @Public() for public routes
- **AI Context**: When I see a controller without @Public(), I know it needs auth

---
