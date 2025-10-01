import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateRefreshTokensTable1759400000000
  implements MigrationInterface
{
  name = 'CreateRefreshTokensTable1759400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create refresh_tokens table
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'token',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'device_info',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'is_revoked',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'revoked_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_refresh_tokens_user_revoked',
        columnNames: ['user_id', 'is_revoked'],
      }),
    );

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_refresh_tokens_token',
        columnNames: ['token'],
      }),
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'refresh_tokens',
      new TableForeignKey({
        name: 'FK_refresh_tokens_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey(
      'refresh_tokens',
      'FK_refresh_tokens_user',
    );

    // Drop indexes
    await queryRunner.dropIndex('refresh_tokens', 'IDX_refresh_tokens_token');
    await queryRunner.dropIndex(
      'refresh_tokens',
      'IDX_refresh_tokens_user_revoked',
    );

    // Drop table
    await queryRunner.dropTable('refresh_tokens');
  }
}
