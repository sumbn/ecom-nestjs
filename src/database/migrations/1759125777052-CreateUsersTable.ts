import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1759125777052 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      `);

    await queryRunner.query(`
          CREATE TYPE user_role AS ENUM('user', 'admin');
      `);

    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password_hash" character varying NOT NULL,
                "first_name" character varying NOT NULL,
                "last_name" character varying NOT NULL,
                "role" user_role NOT NULL DEFAULT 'user',
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_96aac0725512ac478c29883e810e" PRIMARY KEY ("id")
            );
        `);

    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email");
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_4a57de7721ee5ad431e444bff7" ON "users" ("email");
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_4a57de7721ee5ad431e444bff7"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role`);
  }
}
