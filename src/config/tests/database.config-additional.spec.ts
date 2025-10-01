import databaseConfig from '../database.config';

describe('Database Configuration - Additional Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should handle missing DATABASE_MAX_CONNECTIONS', () => {
    process.env = {
      ...originalEnv,
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: '5432',
      DATABASE_USERNAME: 'test_user',
      DATABASE_PASSWORD: 'test_pass',
      DATABASE_NAME: 'test_db',
      NODE_ENV: 'test',
    };

    const config = databaseConfig();

    expect(config.extra.max).toBe(100); // Default value
  });

  it('should parse DATABASE_MAX_CONNECTIONS correctly', () => {
    process.env = {
      ...originalEnv,
      DATABASE_MAX_CONNECTIONS: '50',
      NODE_ENV: 'test',
    };

    const config = databaseConfig();

    expect(config.extra.max).toBe(50);
  });

  it('should handle DATABASE_SSL=true', () => {
    process.env = {
      ...originalEnv,
      DATABASE_SSL: 'true',
      NODE_ENV: 'production',
    };

    const config = databaseConfig();

    expect(config.ssl).toEqual({ rejectUnauthorized: false });
  });

  it('should handle DATABASE_SSL=false', () => {
    process.env = {
      ...originalEnv,
      DATABASE_SSL: 'false',
      NODE_ENV: 'development',
    };

    const config = databaseConfig();

    expect(config.ssl).toBe(false);
  });

  it('should set synchronize to false always', () => {
    const envs = ['development', 'production', 'test'];

    envs.forEach((env) => {
      process.env.NODE_ENV = env;
      const config = databaseConfig();
      expect(config.synchronize).toBe(false);
    });
  });

  it('should enable logging only in development', () => {
    process.env.NODE_ENV = 'development';
    let config = databaseConfig();
    expect(config.logging).toBe(true);

    process.env.NODE_ENV = 'production';
    config = databaseConfig();
    expect(config.logging).toBe(false);

    process.env.NODE_ENV = 'test';
    config = databaseConfig();
    expect(config.logging).toBe(false);
  });

  it('should set correct entity paths', () => {
    const config = databaseConfig();

    expect(config.entities).toContain('dist/**/*.entity{.ts,.js}');
  });

  it('should set correct migration paths', () => {
    const config = databaseConfig();

    expect(config.migrations).toContain('dist/database/migrations/*{.ts,.js}');
  });

  it('should set migrations table name', () => {
    const config = databaseConfig();

    expect(config.migrationsTableName).toBe('migrations');
  });

  it('should configure connection pool with default values', () => {
    const config = databaseConfig();

    expect(config.extra.min).toBe(5);
    expect(config.extra.acquireTimeoutMillis).toBe(60000);
    expect(config.extra.idleTimeoutMillis).toBe(600000);
  });
});
