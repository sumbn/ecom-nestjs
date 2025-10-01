import 'dotenv/config';
import { registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Cấu hình database cho TypeORM
 * - Sử dụng environment variables để bảo mật
 * - Connection pooling cho production
 * - Migrations thay vì synchronize
 */
const getConfig = () => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/database/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  synchronize: false, // QUAN TRỌNG: Luôn false - sử dụng migrations thay vì auto-sync
  logging: process.env.NODE_ENV === 'development',
  // Connection pooling cho production
  extra: {
    max: parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10) || 100,
    min: 5,
    acquireTimeoutMillis: 60000,
    idleTimeoutMillis: 600000,
  },
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

export default registerAs('database', () => getConfig());

// DataSource cho TypeORM CLI (dùng cho migrations)
export const connectionSource = new DataSource(
  getConfig() as DataSourceOptions,
);
