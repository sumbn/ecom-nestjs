# Module: categories

## 1. Overview

- **Purpose**: Quản lý danh mục sản phẩm dạng cây, hỗ trợ đa ngôn ngữ (name/description JSONB), slug unique, thao tác CRUD và tree operations (ancestors/descendants, move, reorder).
- **Dependencies**: `TypeOrmModule` với `CategoriesRepository`, `TranslatableContent` type từ `src/common/types/`, DTO validators (`class-validator`), sử dụng `TreeRepository` của TypeORM.
- **Status**: In Progress

---

## 2. Entities (tham chiếu)

- `Category` (`src/modules/categories/entities/category.entity.ts`) – bảng `categories` với closure-table `category_closure_closure`, gồm slug unique, flags `isActive`, `displayOrder`, quan hệ parent/children.

---

## 3. Guards / Middleware

- 2025-10-05: **guard** – Các endpoint bị bảo vệ bởi `JwtAuthGuard` toàn cục; một số API yêu cầu role admin qua `RolesGuard` (đăng ký ở module auth).

---

## 4. History of Changes

| Date       | Type | Module     | Description                                                           | File(s)                                                             |
| ---------- | ---- | ---------- | --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 2025-10-05 | feat | categories | Tạo entity category + closure table migration                         | `entities/category.entity.ts`, `1759309254265-CreateCategoryTable.ts` |
| 2025-10-05 | feat | categories | Xây dựng `CategoriesService` với CRUD/tree/bulk operations            | `categories.service.ts`, `repositories/categories.repository.ts`    |
| 2025-10-05 | feat | categories | REST controller với DTO validation và response mapping                | `categories.controller.ts`, `dto/*.ts`                              |
| 2025-10-05 | test | categories | Unit specs cho service/controller, e2e specs cho danh mục            | `categories.service.spec.ts`, `categories.controller.spec.ts`, `test/categories/categories.e2e-spec.ts` |

---

## 5. Next Steps

- Kiểm tra hiệu năng tree queries trên dataset lớn; cân nhắc cache layer (Redis) trước khi deploy Docker.
- Bổ sung integration test đảm bảo slug uniqueness và tree integrity khi concurrent updates.
- Hoàn thiện documentation cho cấu trúc JSONB `TranslatableContent` và enforce schema ở DTO validation.
