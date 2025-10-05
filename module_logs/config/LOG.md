# Module: config

## 1. Overview

- **Purpose**: Quản lý cấu hình hệ thống (environment variables, database config, validation) bảo đảm ứng dụng chạy ổn định trên Vercel và Docker.
- **Dependencies**: `@nestjs/config`, `class-validator`, `joi`/`zod` (kiểm tra cụ thể), `TypeOrmModule` (thông qua `connectionSource`).
- **Status**: Completed

---

## 2. Entities (tham chiếu)

- Không áp dụng (module cấu hình không định nghĩa entity).

---

## 3. Guards / Middleware

- Không có guard/middleware riêng; module cung cấp providers cấu hình dùng chung.

---

## 4. History of Changes

| Date       | Type | Module | Description                                                     | File(s)                                     |
| ---------- | ---- | ------ | --------------------------------------------------------------- | ------------------------------------------- |
| 2025-10-05 | feat | config | Thiết lập `database.config.ts` load thông số từ environment     | `src/config/database.config.ts`             |
| 2025-10-05 | feat | config | Thêm validation schema cho biến môi trường                     | `src/config/env.validation.ts`              |
| 2025-10-05 | test | config | Unit tests đảm bảo validation hoạt động đúng                   | `src/config/tests/*.spec.ts`                |
| 2025-10-05 | chore | config | Expose `connectionSource` cho TypeORM CLI (migrations workflow) | `src/config/database.config.ts`             |

---

## 5. Next Steps

- Cập nhật checklist env cho giai đoạn Docker (mapping secrets rõ ràng).
- Tài liệu hóa các biến cấu hình bắt buộc trong `README.md` hoặc wiki.
- Bổ sung test đảm bảo cấu hình fallback hoạt động khi thiếu env trên Vercel.
