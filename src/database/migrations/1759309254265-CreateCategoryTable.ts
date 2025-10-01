import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCategoryTable1759309254265 implements MigrationInterface {
    name = 'CreateCategoryTable1759309254265'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "category_closure_closure" ("ancestor_id" uuid NOT NULL, "descendant_id" uuid NOT NULL, CONSTRAINT "PK_d9d3ea3acf527f98cba5502f1af" PRIMARY KEY ("ancestor_id", "descendant_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a77c180077b1cd5d55539d396a" ON "category_closure_closure" ("ancestor_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_cef5852fefd02e5ee7fe62db96" ON "category_closure_closure" ("descendant_id") `);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "image_url"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "display_order"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "displayOrder" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`COMMENT ON COLUMN "categories"."name" IS 'Multilingual category name'`);
        await queryRunner.query(`COMMENT ON COLUMN "categories"."description" IS 'Multilingual category description'`);
        await queryRunner.query(`ALTER TABLE "category_closure_closure" ADD CONSTRAINT "FK_a77c180077b1cd5d55539d396ad" FOREIGN KEY ("ancestor_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "category_closure_closure" ADD CONSTRAINT "FK_cef5852fefd02e5ee7fe62db96f" FOREIGN KEY ("descendant_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category_closure_closure" DROP CONSTRAINT "FK_cef5852fefd02e5ee7fe62db96f"`);
        await queryRunner.query(`ALTER TABLE "category_closure_closure" DROP CONSTRAINT "FK_a77c180077b1cd5d55539d396ad"`);
        await queryRunner.query(`COMMENT ON COLUMN "categories"."description" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "categories"."name" IS NULL`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "displayOrder"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "display_order" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "image_url" character varying`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cef5852fefd02e5ee7fe62db96"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a77c180077b1cd5d55539d396a"`);
        await queryRunner.query(`DROP TABLE "category_closure_closure"`);
    }

}
