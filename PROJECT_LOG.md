# Project Log

## 1. Project Overview

- **Name**: NestJS E-Commerce API
- **Purpose**: Production-ready backend for an e-commerce platform with authentication, catalog management, and health monitoring.
- **Deployment**: Current target is **Vercel** (serverless-ready). Migration path to **Docker** planned with portable configuration.
- **Tech Stack**: NestJS 11, TypeORM 0.3, PostgreSQL, JWT, bcrypt, class-validator/transformer, Helmet, Schedule, Throttler.

---

## 2. Project Structure

#### Project Tree

```
src/
├── app.module.ts                # Root module wiring global guards/filters/interceptors
├── common/                      # Shared infrastructure (cache, decorators, filters, interceptors, logger)
├── config/                      # Config module, env validation, database config
├── database/                    # TypeORM data source + migrations
├── health/                      # Health check endpoints (public)
├── main.ts                      # Application bootstrap
└── modules/
    ├── auth/                    # Authentication, sessions, guards, DTOs, repositories
    ├── categories/              # Category tree management (closure table, DTOs, repository)
    └── users/                   # User CRUD, password hashing, DTOs, repositories
```

#### Technical Notes

- `AppModule` registers global `HttpExceptionFilter`, `TransformInterceptor`, and `JwtAuthGuard` (`src/app.module.ts`).
- Configuration uses `ConfigModule.forRoot` with validated schemas (`src/config/env.validation.ts`) and layered `.env` files.
- Database access via `TypeOrmModule`, loading connection options from `database.config.ts`.
- Shared utilities in `src/common/` include logging, caching abstractions, and the `@Public()` decorator used by `health` endpoints.

---

## 3. Entities

- **User** (`src/modules/users/entities/user.entity.ts`)
  - UUID primary key `id`, unique indexed `email`, hashed password storage (`passwordHash`).
  - Profile fields `firstName`, `lastName`, role enum (`user` | `admin`), `isActive`, audit timestamps.

- **RefreshToken** (`src/modules/auth/entities/refresh-token.entity.ts`)
  - UUID primary key, FK to `users` with cascade delete.
  - Unique token string, device/IP/user-agent metadata, expiry, revoked flags, timestamps.

- **Category** (`src/modules/categories/entities/category.entity.ts`)
  - UUID primary key, multilingual `name`/`description` stored as JSONB (`TranslatableContent`).
  - Unique indexed `slug`, `isActive`, `displayOrder`, tree relationships via closure-table strategy, audit timestamps.

- **Closure Table (Category)**
  - Auxiliary table `category_closure_closure` maintained by TypeORM for ancestors/descendants (`1759309254265-CreateCategoryTable.ts`).

---

## 4. Module Status & Test Coverage Summary

| Module      | Status      | Unit Coverage        | Integration            | E2E                            | Notes |
| ----------- | ----------- | -------------------- | ---------------------- | ------------------------------ | ----- |
| auth        | Completed   | Specs present (service/controller/cleanup) – rerun coverage to confirm | Token repository covered via service specs | `test/auth/auth.e2e-spec.ts`, `test/auth/auth-refresh.e2e-spec.ts` | Refresh token lifecycle implemented |
| users       | Completed   | Service/controller specs available | Integration behaviour exercised via auth flows | `test/users/users.e2e-spec.ts` | Password hashing & role management |
| categories  | In Progress | Service/controller specs ≥95% lines / 82% branches (latest `2025-10-05`) | Repository + tree integration specs (coverage ≈74% branches) | `test/categories/categories.e2e-spec.ts` | Tiếp tục tối ưu branch coverage cho DTO/Repository |
| health      | Completed   | Controller/service specs | N/A | `test/health/health.e2e-spec.ts` | Public endpoints via `@Public()` |
| common      | Active      | Logger/cache unit specs (partial) | N/A | N/A | Foundation utilities for other modules |
| config      | Completed   | Validation/config tests in `src/config/tests/` | N/A | N/A | Supports multi-env deployment |

> **Action**: Execute `npm run lint` then `npm run test:cov` to refresh actual coverage metrics; update the table with numeric values afterward.

---

## 5. Module History (Summary)

| Date       | Summary                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| 2025-10-05 | Reconstructed project-wide log after accidental deletion; validated module boundaries and existing test suites.    |
| Legacy     | Migrations `1759125777052`, `1759134340003`, `1759309254265`, `1759400000000` define current DB schema (users, categories tree, refresh tokens). |
| Legacy     | Auth module already implements JWT access/refresh tokens, session management, and guards (`auth.service.ts`).      |
| Legacy     | Categories module provides closure-table repository utilities and DTO validation for CRUD/tree mutations.         |
| Legacy     | Users module manages user CRUD, password hashing, and role-based access for admins.                              |

---

## 6. Upcoming Milestones

- **[auth]** Add scheduled job for `AuthService.cleanupExpiredTokens()` and integration test coverage for concurrent refresh revocation.
- **[categories]** Benchmark deep tree operations, introduce caching layer (Redis) ahead of Docker migration.
- **[observability]** Extend logger to structured logging (JSON) and integrate with external monitoring before Docker deployment.
- **[devops]** Prepare Docker-ready environment variables checklist to ensure parity with Vercel configuration.
