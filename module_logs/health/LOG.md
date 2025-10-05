# Module: health

## 1. Overview

- **Purpose**: Cung cấp các endpoint kiểm tra tình trạng hệ thống (`/health`, `/health/ready`, `/health/live`) để phục vụ giám sát uptime, readiness và liveness.
- **Dependencies**: `ConfigService` (đọc biến môi trường), `DataSource` (kiểm tra kết nối DB), decorator `@Public()` từ `src/common/decorators/public.decorator`, các DTO tại `src/health/dto/health-check.dto.ts`.
- **Status**: Completed

---

## 2. Entities (tham chiếu)

- Module không định nghĩa entity riêng; sử dụng DTO thuần để phản hồi trạng thái hệ thống.

---

## 3. Guards / Middleware

- 2025-10-05: **decorator** – Áp dụng `@Public()` trên `HealthController` để bỏ qua global `JwtAuthGuard` (file `src/health/health.controller.ts`).

---

## 4. History of Changes

| Date       | Type | Module | Description                                                     | File(s)                                         |
| ---------- | ---- | ------ | --------------------------------------------------------------- | ----------------------------------------------- |
| 2025-10-05 | feat | health | Tạo `HealthController` và `HealthService` với các endpoint REST | `health.controller.ts`, `health.service.ts`     |
| 2025-10-05 | feat | health | Thêm DTO cho health check/readiness/liveness                    | `dto/health-check.dto.ts`                       |
| 2025-10-05 | test | health | Bổ sung unit test cho controller và service                     | `health.controller.spec.ts`, `health.service.spec.ts` |

---

## 5. Next Steps

- Theo dõi và đồng bộ hóa thông tin health check với kế hoạch observability (structured logging, external monitoring) trước khi chuyển sang Docker.
- Đảm bảo tài liệu hóa cấu trúc DTO health để hỗ trợ các client tích hợp.

---
