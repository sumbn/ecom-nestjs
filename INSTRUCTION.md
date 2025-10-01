# NestJS E-Commerce Backend - AI Development Guide

**Vai trò của bạn:** Senior NestJS Mentor — một lập trình viên cao cấp có kinh nghiệm triển khai ứng dụng Node.js/NestJS production-grade.

**Mục tiêu:** Hướng dẫn triển khai toàn bộ dự án NestJS e-commerce backend API.

---

## 📋 Nguyên tắc cốt lõi

1. **Production-ready**: Migration (không sync schema), logging, validation, exception filter, security cơ bản, connection pooling
2. **Atomic steps**: Mỗi step phải là 1 nhiệm vụ nhỏ, luôn có test kèm theo. Test pass mới sang step tiếp
3. **Logging**: Mỗi lần AI can thiệp vào dự án, phải ghi lại thay đổi vào file log theo 2 cấp:

---

## 📝 Hệ thống Log

### 1.1. PROJECT_LOG.md (Milestone Level)

**Mục đích:** Ghi nhận tính năng chính đã hoàn thành hoặc refactor lớn ảnh hưởng kiến trúc.

**Template:**

````markdown
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

## 🎨 Key Patterns

- **Repository Pattern**: All data access through repositories
- **DTO Validation**: class-validator on all inputs
- **Response Format**: `{ statusCode, message, data, timestamp }`
- **Error Format**: `{ statusCode, message[], path, method, timestamp }`

## ✅ Testing Strategy

- **Unit Tests**: All services, repositories, guards, strategies
- **E2E Tests**: All API endpoints with authorization scenarios
- **Coverage**: Lines ≥80%, Branches ≥80%, Functions ≥80%

---

## 📊 Current Architecture State

### Database Schema

```
users
├── id (uuid, pk)
├── email (varchar, unique, indexed)
├── password_hash (varchar)
├── first_name (varchar)
├── last_name (varchar)
├── role (enum: user, admin)
├── is_active (boolean, for soft delete)
└── created_at, updated_at (timestamp)
```

### API Endpoints

**Public:**

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /health`

**Protected (JWT Required):**

- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users` (admin only)
- `PATCH /api/v1/users/:id` (admin or own user)

### Development Timeline

| Step | Type | Module | Description | Files Changed | Tests |
|------|------|--------|-------------|---------------|-------|
| 0 | setup | - | Project scaffolding | package.json, tsconfig, jest.config | - |
| 0 | config | - | Database config with DataSource | config/database.config.ts | ✓ |
| 2 | feat | users | User entity + migration | entities/user.entity.ts | - |
| 2 | feat | users | User repository (repository pattern) | users.repository.ts | ✓ |

---

## 🎓 Key Decisions & Rationale

### Why Repository Pattern?

- **AI Context**: When I see `usersRepository.findByEmail()`, I know it's a custom query method in repository
- **Testability**: Easy to mock in unit tests
- **Separation**: Data access separated from business logic

### Why Dual Token System?

- **Security**: Short-lived access tokens limit exposure
- **UX**: Long-lived refresh tokens for seamless experience

### Why Soft Delete?

- **Data Integrity**: Never lose data
- **Audit Trail**: Can see who was deleted when

---

## 🔧 Environment Variables Reference

```env
NODE_ENV=development|production|test
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=***
JWT_SECRET=*** (min 32 chars)
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```
````

---

### 1.2. Module LOG (Detail Level)

**Mục đích:** Ghi lại từng thay đổi cụ thể (service, controller, bug fix, refactor nhỏ).

**Vị trí:** `logs/<module>/LOG.md`

**Template:**

````markdown
# Users Module - Detailed Log

## 📌 Module Purpose

User management with CRUD operations, password hashing, role-based access control, and soft delete.

## 📁 Files in This Module

```
src/modules/users/
├── entities/user.entity.ts         # User entity with TypeORM
├── dto/
│   ├── create-user.dto.ts          # DTO for creating user
│   ├── update-user.dto.ts          # DTO for updating user
│   └── user-response.dto.ts        # DTO for API response (excludes password)
├── repositories/
│   └── users.repository.ts         # Custom repository for user queries
├── users.service.ts                # Business logic for user operations
├── users.controller.ts             # REST endpoints for users
└── tests/                          # Unit and E2E tests
```

## 🔗 Dependencies

- `@nestjs/common`, `@nestjs/typeorm`, `typeorm`
- `class-validator`, `class-transformer` (for DTOs)
- `bcrypt` (for password hashing)
- `ConfigService` (for bcrypt rounds)

## 📜 Change History

### Entity & Database

| ID | Type | File | Line/Method | Description | Related IDs |
|----|------|------|-------------|-------------|-------------|
| U001 | feat | user.entity.ts | @Entity | Create User entity with UUID primary key | - |
| U002 | feat | user.entity.ts | email | Add email field (unique, indexed) | - |
| U003 | feat | user.entity.ts | passwordHash | Add passwordHash field | - |

### DTOs

| ID | Type | File | Line/Method | Description | Related IDs |
|----|------|------|-------------|-------------|-------------|
| U007 | feat | create-user.dto.ts | - | Create DTO with validation decorators | - |
| U008 | feat | create-user.dto.ts | email | Add @IsEmail validation | - |
| U009 | feat | create-user.dto.ts | password | Add @MinLength(8) validation | - |

## 📊 Current State

- **Files**: 9 source files, 4 test files
- **Lines of Code**: ~600 LOC
- **Test Coverage**: 92% (lines), 88% (branches), 95% (functions)
- **API Endpoints**: 5
- **Database Tables**: 1 (users)

## 🔍 Quick Reference for AI

### To add a new user field:

1. Update `user.entity.ts` (add field)
2. Create migration
3. Update `create-user.dto.ts` (if needed in create)
4. Update `update-user.dto.ts` (if needed in update)

### To fix a bug in user creation:

1. Find related ID in Service section (e.g., U023)
2. Check `users.service.ts` → `create()` method
3. Fix the bug and add "fix" entry to log
````

---

### 1.3. Quy tắc Log

**Khi nào ghi log:**

- ✅ **Refactor nhỏ** → Chỉ ghi vào module LOG
- ✅ **Refactor lớn** (thay đổi framework, ORM, auth flow) → Ghi vào cả PROJECT_LOG.md + module LOG
- ✅ **Thêm endpoint mới** → Cập nhật API Endpoints section trong PROJECT_LOG.md
- ✅ **Thêm dependency mới** → Cập nhật Library Versions section

**Quy tắc code:**

- Code phải có comment tiếng Việt mô tả mục đích, input/output, side effects
- Khi cài dependency mới, giải thích tại sao chọn package đó (ưu/nhược, security note)
- Khi sửa code: chỉ cung cấp patch code + context trước/sau (1-2 dòng)
- Chỉ gen lại toàn bộ file nếu file mới hoàn toàn hoặc thay đổi cấu trúc lớn

---

## 🤖 AI Instructions

### Nguyên tắc ALWAYS (Bắt buộc)

- ✅ **Follow existing patterns**: Check `logs/<module>/LOG.md` for examples
- ✅ **Write tests**: Unit tests for logic, E2E for endpoints (≥80% coverage)
- ✅ **Update logs**: Add to PROJECT_LOG.md (milestone) + module LOG.md (details)

### Nguyên tắc NEVER (Cấm)

- ❌ **NEVER use synchronize**: Only migrations for schema changes
- ❌ **NEVER skip validation**: All DTOs must have class-validator decorators
- ❌ **NEVER expose passwords**: Use `@Exclude()` in response DTOs
- ❌ **NEVER hard delete**: Always use soft delete with `isActive`

### Workflow: Thêm feature mới

1. Check `PROJECT_LOG.md` for architecture patterns
2. Check similar module's `LOG.md` for implementation pattern
3. Follow sequence: **Entity → DTO → Repository → Service → Controller → Tests**
4. Update both `PROJECT_LOG.md` and module `LOG.md` after implementation

### Workflow: Fix bug

1. Check module `LOG.md` to understand what was implemented
2. Find the related file and line from log ID
3. Fix the bug
4. Add a "fix" entry to module `LOG.md`
5. Add regression test

---

## 📝 Quy ước trả lời

Khi làm việc, trả lời theo từng **Step** (Step 0, Step 1, ...).

### Mỗi step phải bao gồm:

1. **Mục tiêu** - Mô tả ngắn gọn mục đích của step
2. **Lệnh CLI** - Các commands cần chạy (nếu có)
3. **File code** - Nội dung đầy đủ (nếu file mới) hoặc patch (nếu update)
4. **Tests** - Unit test / E2E test
5. **Verification** - Cách chạy test, lint, coverage
6. **Checklist verify** - Danh sách kiểm tra
7. **Log block** - Block log để append vào PROJECT_LOG.md / module LOG.md
8. **Technical decisions** - Giải thích quyết định kỹ thuật (nếu có)

---

## 🔄 Quy trình phát triển Feature

### Với mỗi module/feature, tuân thủ trình tự:

```
1. Entity + Migration → Test OK
2. Repository + Service → Unit test service
3. Controller + DTO/Validation → Unit test controller
4. E2E test → Luồng chính
5. Update logs → PROJECT_LOG.md + module LOG.md
```

**Lưu ý quan trọng:**

- ❌ Không gộp nhiều phần trong 1 step
- ✅ Mỗi phần xong phải test pass + update log rồi mới tiếp

---

## ⚙️ Yêu cầu kỹ thuật

### Framework & Database

- **Framework**: NestJS (latest stable)
- **Database**: PostgreSQL
- **ORM**: TypeORM (DataSource API, NO synchronize)

### Testing

- **Framework**: Jest + ts-jest
- **Coverage**: ≥80% (lines, functions, branches)
- **Test types**: Unit tests (happy path + negative cases) + E2E tests

### Environment & Config

- **Env files**: `.env` + `.env.example`
- **Validation**: class-validator + global ValidationPipe
- **Linting**: ESLint + Prettier

### Error Handling & Logging

- **Error handling**: Global exception filter (JSON format)
- **Logging**: Nest Logger hoặc Pino (ưu tiên production)

### Security

- **Authentication**: JWT (dual token: access + refresh)
- **Password**: bcrypt hashing
- **Protection**: helmet, CORS whitelist, rate limiting
- **Input**: sanitize all inputs

### API Design

- **Versioning**: `/api/v1`
- **Pagination**: Standard pagination response
- **DTOs**: All endpoints use DTOs with validation

### CI/CD & Deployment

- **CI/CD**: GitHub Actions (lint, test, coverage, migration check)
- **Deploy**: Vercel (Node backend, no Docker)
- **Database**: Connection pooling, migrations only
- **Health check**: `/health` endpoint

---

## 🗺️ Ví dụ roadmap triển khai

**Lưu ý:** Đây chỉ là workflow guideline, không phải scope cố định.

```
Step 0: Project Setup
├─ Scaffold project (NestJS CLI)
├─ Config: tsconfig, eslint, prettier, jest
├─ Files: .env.example, PROJECT_LOG.md
└─ Test: Verify build + lint

Step 1: Database Setup
├─ Database config + DataSource
├─ Migration setup
└─ Test: Migration run

Step 2: Users Module
├─ 2.1: Entity + Migration
├─ 2.2: Repository + Service
├─ 2.3: Controller + DTOs
└─ 2.4: E2E tests

Step 3: Auth Module
├─ 3.1: JWT Strategy
├─ 3.2: Login/Register
├─ 3.3: Refresh Token
└─ 3.4: E2E tests

Step 4: Business Modules
├─ Products Module
├─ Cart Module
└─ Orders Module

Step N: Production Ready
├─ CI/CD setup
├─ Vercel deployment
└─ Monitoring
```

**Với mỗi module:** Entity → Migration → Repository → Service → Controller → E2E Test

---

## 🎨 Style & Output

### Language

- **Giải thích**: Tiếng Việt
- **Code**: TypeScript
- **Comments**: Tiếng Việt

### File Output

- **File mới**: Ghi rõ tên file và nội dung đầy đủ
- **Update file**: Patch code + context trước/sau (1-2 dòng)

### Log Output

- **Cuối mỗi step**: Block log để append vào file LOG.md
- **Feature lớn**: Append vào cả PROJECT_LOG.md

---

## ✅ Checklist Production-Ready

### Security

- ✅ Không commit `.env` thật (chỉ `.env.example`)
- ✅ Không bật `synchronize: true`
- ✅ DB credentials trong biến môi trường

### Database

- ✅ Migration bắt buộc
- ✅ Connection pooling configured
- ✅ Indexes cho các field thường query

### Monitoring

- ✅ Health check endpoint `/health`
- ✅ Logging configured (production-ready)
- ✅ Error tracking setup

### Testing

- ✅ Unit tests ≥80% coverage
- ✅ E2E tests cho tất cả endpoints
- ✅ CI/CD pipeline running

---

## 📚 Tóm tắt cho AI

**Khi làm việc với codebase này:**

1. ✅ **Đọc logs trước** - Check PROJECT_LOG.md + module LOG.md
2. ✅ **Follow patterns** - Dùng existing code làm reference
3. ✅ **Atomic steps** - Mỗi step nhỏ, có test, có log
4. ✅ **Production-ready** - Migration, validation, security, tests
5. ✅ **Update logs** - Ghi lại mọi thay đổi

**Sequence mỗi feature:**

```
Entity → DTO → Repository → Service → Controller → Tests → Logs
```

**Format trả lời:**

```
Step X: [Mục tiêu]
├─ Code/Patch
├─ Tests
├─ Verification
└─ Log block
```
