import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Tree,
  TreeChildren,
  TreeParent,
  Index,
} from 'typeorm';
import { TranslatableContent } from '../../../common/types/translatable-content.type';

/**
 * Category Entity - Quản lý danh mục sản phẩm
 *
 * Sử dụng closure-table strategy cho tree structure:
 * - Tạo bảng phụ category_closure để lưu relationships
 * - Hỗ trợ unlimited nesting levels
 * - Query hiệu quả cho ancestors/descendants
 *
 * Translatable fields (JSONB):
 * - name: Tên danh mục { en: "...", vi: "..." }
 * - description: Mô tả { en: "...", vi: "..." }
 */
@Entity('categories')
@Tree('closure-table', {
  closureTableName: 'category_closure', // Tên bảng phụ
  ancestorColumnName: (column) => 'ancestor_' + column.propertyName,
  descendantColumnName: (column) => 'descendant_' + column.propertyName,
})
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Tên danh mục (đa ngôn ngữ)
   * Lưu dạng JSONB: { "en": "Electronics", "vi": "Điện tử" }
   */
  @Column({
    type: 'jsonb',
    comment: 'Multilingual category name',
  })
  name: TranslatableContent;

  /**
   * Mô tả danh mục (đa ngôn ngữ)
   * Lưu dạng JSONB: { "en": "...", "vi": "..." }
   */
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Multilingual category description',
  })
  description: TranslatableContent;

  /**
   * Slug - URL-friendly identifier
   * Ví dụ: "dien-tu", "laptop-gaming"
   *
   * - Unique constraint
   * - Indexed để tăng tốc lookup
   * - Admin có thể tự định nghĩa hoặc auto-generate
   */
  @Column({ unique: true })
  @Index()
  slug: string;

  /**
   * Trạng thái hoạt động (soft delete)
   * true: Active, hiển thị trên website
   * false: Inactive, ẩn khỏi website
   */
  @Column({ default: true })
  isActive: boolean;

  /**
   * Thứ tự hiển thị trong cùng level
   * Số nhỏ hơn hiển thị trước
   * Default: 0
   */
  @Column({ default: 0 })
  displayOrder: number;

  /**
   * Tree relationship: Parent category
   * null nếu là root category
   */
  @TreeParent()
  parent: Category;

  /**
   * Tree relationship: Child categories
   * Empty array nếu là leaf category
   */
  @TreeChildren()
  children: Category[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
