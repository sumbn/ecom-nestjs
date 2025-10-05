# Module: common

## 1. Overview

- **Purpose**: Cung cấp hạ tầng dùng chung cho toàn ứng dụng: logger đa kênh, bộ nhớ cache trừu tượng, decorators (`@Public`), filters (`HttpExceptionFilter`), interceptors (`TransformInterceptor`), DTO helpers.
- **Dependencies**: Nest providers (`LoggerService`), `winston`/`pino` adapters (kiểm tra cụ thể trong các service), `class-transformer`, `rxjs`. Một số thành phần được sử dụng toàn cục bởi `AppModule`.
- **Status**: Active (được tái sử dụng bởi nhiều module).

---

## 2. Entities (tham chiếu)

- Không áp dụng (module hạ tầng không định nghĩa entity riêng).

---

## 3. Guards / Middleware

- 2025-10-05: **interceptor** – `TransformInterceptor` đăng ký global trong `AppModule` để chuẩn hóa response (`src/common/interceptors/transform.interceptor.ts`).
- 2025-10-05: **filter** – `HttpExceptionFilter` đăng ký global xử lý lỗi chuẩn hóa (`src/common/filters/http-exception.filter.ts`).
- 2025-10-05: **decorator** – `Public` decorator giúp bỏ qua `JwtAuthGuard` cho các endpoint (ví dụ `health`).

---

## 4. History of Changes

| Date       | Type | Module | Description                                                   | File(s)                                             |
| ---------- | ---- | ------ | ------------------------------------------------------------- | --------------------------------------------------- |
| 2025-10-05 | feat | common | Tạo module logger đa kênh (console/file) với interface chung  | `logger/*.ts`                                       |
| 2025-10-05 | feat | common | Thêm cache service interfaces + memory cache implementation   | `cache/*.ts`                                        |
| 2025-10-05 | feat | common | Định nghĩa decorators `@Public`, interceptors, filters        | `decorators/*.ts`, `interceptors/*.ts`, `filters/*.ts` |
| 2025-10-05 | test | common | Unit tests cho logger, cache, filter/interceptor              | `logger/tests/*.spec.ts`, `cache/tests/*.spec.ts`   |

---

## 5. Next Steps

- Chuẩn hoá logger sang structured JSON output và tích hợp external transport trước khi migrate Docker.
- Bổ sung cache adapter kết nối Redis (song song memory cache) để chuẩn bị cho production environment.
- Đảm bảo coverage ≥90% cho từng service, cập nhật sau khi chạy `npm run test:cov`.
