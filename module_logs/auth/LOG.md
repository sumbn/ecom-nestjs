# Module: auth

## 1. Overview

- **Purpose**: Cung cấp tính năng xác thực (đăng ký, đăng nhập, refresh token, quản lý session) cho toàn hệ thống.
- **Dependencies**: `UsersModule`, `ConfigModule`, `JwtModule`, `TypeOrmModule` (repository `RefreshTokenRepository`), shared decorators/interceptors trong `src/common/`.
- **Status**: Completed

---

## 2. Entities (tham chiếu)

- `RefreshToken` (`src/modules/auth/entities/refresh-token.entity.ts`) – quản lý refresh token, metadata thiết bị, trạng thái revoke.

---

## 3. Guards / Middleware

- 2025-10-05: **guard** – `JwtAuthGuard` đăng ký global trong `AppModule` để bảo vệ mọi route (`src/modules/auth/guards/jwt-auth.guard.ts`).
- 2025-10-05: **guard** – `RolesGuard` hỗ trợ kiểm soát quyền truy cập theo role (`src/modules/auth/guards/roles.guard.ts`).
- 2025-10-05: **guard** – `LocalAuthGuard` xử lý login với email/password (`src/modules/auth/guards/local-auth.guard.ts`).

---

## 4. History of Changes

| Date       | Type | Module | Description                                                        | File(s)                                                   |
| ---------- | ---- | ------ | ------------------------------------------------------------------ | --------------------------------------------------------- |
| 2025-10-05 | feat | auth   | Xây dựng `AuthService` với login/refresh/logout/session management | `src/modules/auth/auth.service.ts`, `repositories/*.ts`   |
| 2025-10-05 | feat | auth   | Thêm controller + DTO cho register/login/refresh/logout/sessions   | `src/modules/auth/auth.controller.ts`, `dto/*.ts`         |
| 2025-10-05 | feat | auth   | Tạo entity & migration cho refresh token store                     | `entities/refresh-token.entity.ts`, `1759400000000-*.ts`  |
| 2025-10-05 | test | auth   | Viết unit & e2e specs bao phủ luồng auth và refresh token          | `auth.service.spec.ts`, `auth.controller.spec.ts`, `test/` |

---

## 5. Next Steps

- Tạo cron job (hoặc schedule) gọi `AuthService.cleanupExpiredTokens()` và bổ sung integration test cho luồng này.
- Bổ sung test bao phủ concurrency khi refresh token bị revoke đồng thời.
- Đảm bảo coverage 100% (yêu cầu module critical) sau khi chạy lại `npm run test:cov`.
