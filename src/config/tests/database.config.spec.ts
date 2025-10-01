import databaseConfig from '../database.config';

describe('Database Configuration', () => {
  /**
   * Test cấu hình database với default values
   */
  it('should return default database configuration', () => {
    // Backup original env
    const originalEnv = process.env;

    // Set test environment
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

    expect(config.type).toBe('postgres');
    expect(config.host).toBe('localhost');
    expect(config.port).toBe(5432);
    expect(config.username).toBe('test_user');
    expect(config.synchronize).toBe(false); // Always false - use migrations only
    expect(config.logging).toBe(false); // Should be false in test

    // Restore original env
    process.env = originalEnv;
  });

  /**
   * Test production config có SSL và connection pooling
   */
  it('should configure production settings correctly', () => {
    const originalEnv = process.env;

    process.env = {
      ...originalEnv,
      DATABASE_HOST: 'prod.example.com',
      DATABASE_PORT: '5432',
      DATABASE_USERNAME: 'test_user',
      DATABASE_PASSWORD: 'test_pass',
      DATABASE_NAME: 'test_db',
      DATABASE_SSL: 'true',
      DATABASE_MAX_CONNECTIONS: '50',
      NODE_ENV: 'production',
    };

    const config = databaseConfig();

    expect(config.ssl).toEqual({ rejectUnauthorized: false });
    expect(config.extra.max).toBe(50);
    expect(config.logging).toBe(false); // No logging in production

    process.env = originalEnv;
  });
});
