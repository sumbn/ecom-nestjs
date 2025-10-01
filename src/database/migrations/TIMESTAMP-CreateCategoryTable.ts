import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoryTable1234567890123 implements MigrationInterface {
  name = 'CreateCategoryTable1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tạo bảng categories
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" jsonb NOT NULL,
        "description" jsonb,
        "slug" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "parentId" uuid,
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_categories_id" PRIMARY KEY ("id")
      )
    `);

    // Tạo index cho slug
    await queryRunner.query(`
      CREATE INDEX "IDX_categories_slug" ON "categories" ("slug")
    `);

    // Tạo index cho isActive (để query categories active)
    await queryRunner.query(`
      CREATE INDEX "IDX_categories_isActive" ON "categories" ("isActive")
    `);

    // Tạo bảng closure table
    await queryRunner.query(`
      CREATE TABLE "category_closure" (
        "id_ancestor" uuid NOT NULL,
        "id_descendant" uuid NOT NULL,
        CONSTRAINT "PK_category_closure" PRIMARY KEY ("id_ancestor", "id_descendant")
      )
    `);

    // Tạo indexes cho closure table (tối ưu query)
    await queryRunner.query(`
      CREATE INDEX "IDX_category_closure_ancestor" ON "category_closure" ("id_ancestor")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_category_closure_descendant" ON "category_closure" ("id_descendant")
    `);

    // Tạo foreign key cho parent relationship
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD CONSTRAINT "FK_categories_parentId"
      FOREIGN KEY ("parentId")
      REFERENCES "categories"("id")
      ON DELETE SET NULL
    `);

    // Tạo foreign keys cho closure table
    await queryRunner.query(`
      ALTER TABLE "category_closure"
      ADD CONSTRAINT "FK_category_closure_ancestor"
      FOREIGN KEY ("id_ancestor")
      REFERENCES "categories"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "category_closure"
      ADD CONSTRAINT "FK_category_closure_descendant"
      FOREIGN KEY ("id_descendant")
      REFERENCES "categories"("id")
      ON DELETE CASCADE
    `);

    // Thêm comments cho documentation
    await queryRunner.query(`
      COMMENT ON COLUMN "categories"."name" IS 'Multilingual category name'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "categories"."description" IS 'Multilingual category description'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`
      ALTER TABLE "category_closure" DROP CONSTRAINT "FK_category_closure_descendant"
    `);

    await queryRunner.query(`
      ALTER TABLE "category_closure" DROP CONSTRAINT "FK_category_closure_ancestor"
    `);

    await queryRunner.query(`
      ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_parentId"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "IDX_category_closure_descendant"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_category_closure_ancestor"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_categories_isActive"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_categories_slug"
    `);

    // Drop tables
    await queryRunner.query(`
      DROP TABLE "category_closure"
    `);

    await queryRunner.query(`
      DROP TABLE "categories"
    `);
  }
}
