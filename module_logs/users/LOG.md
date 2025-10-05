# Module: users

## 1. Overview

- **Purpose**: Quản lý thông tin tài khoản người dùng, cung cấp CRUD, hashing mật khẩu, và phục vụ dữ liệu cho các module phụ thuộc (auth, admin management).
- **Dependencies**: `TypeOrmModule` (`User` repository), `bcrypt`, `class-validator/transformer`, chia sẻ DTO từ `src/modules/users/dto/`.
- **Status**: Completed

---

## 2. Entities (tham chiếu)

- `User` (`src/modules/users/entities/user.entity.ts`) – bảng `users` với UUID, thông tin profile, enum role (`user` | `admin`), cờ `isActive`, timestamps.

---

## 3. Guards / Middleware

- 2025-10-05: **guard** – Quyền truy cập Admin được enforced thông qua `RolesGuard` từ module auth (áp dụng ở controller-level).

---

## 4. History of Changes

| Date       | Type | Module | Description                                             | File(s)                                                     |
| ---------- | ---- | ------ | ------------------------------------------------------- | ----------------------------------------------------------- |
| 2025-10-05 | feat | users  | Tạo `UsersService` với CRUD + hashing mật khẩu bằng bcrypt | `src/modules/users/users.service.ts`, `repositories/*.ts`    |
| 2025-10-05 | feat | users  | Tạo controller RESTful cho CRUD và admin search         | `src/modules/users/users.controller.ts`, `dto/*.ts`          |
| 2025-10-05 | feat | users  | Entity & migration bảng users                           | `entities/user.entity.ts`, `1759125777052-CreateUsersTable.ts` |
| 2025-10-05 | test | users  | Unit & e2e tests cho service/controller                 | `tests/*.spec.ts`, `test/users/users.e2e-spec.ts`            |

---

## 5. Next Steps

- Đảm bảo mọi endpoint có E2E coverage ≥100%, chạy lại `npm run test:cov` để xác nhận.
- Bổ sung rate limiting hoặc audit logging cho các action admin (future security enhancement).
- Mapping chi tiết user activity (login history) nên được phối hợp cùng module auth.
