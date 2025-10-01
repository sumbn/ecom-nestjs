/**
 * Type cho nội dung đa ngôn ngữ
 * Lưu trữ dưới dạng JSONB trong PostgreSQL
 *
 * Ví dụ: { "en": "Electronics", "vi": "Điện tử" }
 */
export type TranslatableContent = {
  en?: string;
  vi?: string;
  [key: string]: string | undefined; // Cho phép mở rộng thêm ngôn ngữ
};
