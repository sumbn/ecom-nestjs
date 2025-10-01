import 'reflect-metadata';
import { validate, EnvironmentVariables, Environment } from '../env.validation';

describe('Environment Validation', () => {
  const validConfig = {
    NODE_ENV: 'development',
    DATABASE_HOST: 'localhost',
    DATABASE_PORT: 5432,
    DATABASE_USERNAME: 'postgres',
    DATABASE_PASSWORD: 'password',
    DATABASE_NAME: 'test_db',
    JWT_SECRET: 'test-secret',
  };

  it('should validate correct configuration', () => {
    expect(() => validate(validConfig)).not.toThrow();
  });

  it('should throw error if NODE_ENV is invalid', () => {
    const invalidConfig = {
      ...validConfig,
      NODE_ENV: 'invalid-env',
    };

    expect(() => validate(invalidConfig)).toThrow();
  });

  it('should accept valid NODE_ENV values', () => {
    const envValues = ['development', 'production', 'test'];

    envValues.forEach((env) => {
      const config = { ...validConfig, NODE_ENV: env };
      expect(() => validate(config)).not.toThrow();
    });
  });

  it('should throw error if DATABASE_HOST is missing', () => {
    const { DATABASE_HOST: _DATABASE_HOST, ...invalidConfig } = validConfig;
    void _DATABASE_HOST;

    expect(() => validate(invalidConfig)).toThrow();
  });

  it('should throw error if DATABASE_PORT is not a number', () => {
    const invalidConfig = {
      ...validConfig,
      DATABASE_PORT: 'not-a-number',
    };

    expect(() => validate(invalidConfig)).toThrow();
  });

  it('should throw error if DATABASE_USERNAME is missing', () => {
    const { DATABASE_USERNAME: _DATABASE_USERNAME, ...invalidConfig } =
      validConfig;
    void _DATABASE_USERNAME;

    expect(() => validate(invalidConfig)).toThrow();
  });

  it('should throw error if DATABASE_PASSWORD is missing', () => {
    const { DATABASE_PASSWORD: _DATABASE_PASSWORD, ...invalidConfig } =
      validConfig;
    void _DATABASE_PASSWORD;

    expect(() => validate(invalidConfig)).toThrow();
  });

  it('should throw error if DATABASE_NAME is missing', () => {
    const { DATABASE_NAME: _DATABASE_NAME, ...invalidConfig } = validConfig;
    void _DATABASE_NAME;

    expect(() => validate(invalidConfig)).toThrow();
  });

  it('should throw error if JWT_SECRET is missing', () => {
    const { JWT_SECRET: _JWT_SECRET, ...invalidConfig } = validConfig;
    void _JWT_SECRET;

    expect(() => validate(invalidConfig)).toThrow();
  });

  it('should accept optional DATABASE_MAX_CONNECTIONS', () => {
    const config = {
      ...validConfig,
      DATABASE_MAX_CONNECTIONS: 100,
    };

    expect(() => validate(config)).not.toThrow();
  });

  it('should accept optional DATABASE_SSL', () => {
    const config = {
      ...validConfig,
      DATABASE_SSL: 'true',
    };

    expect(() => validate(config)).not.toThrow();
  });

  it('should accept optional JWT_EXPIRES_IN', () => {
    const config = {
      ...validConfig,
      JWT_EXPIRES_IN: '1d',
    };

    expect(() => validate(config)).not.toThrow();
  });

  it('should accept optional BCRYPT_ROUNDS', () => {
    const config = {
      ...validConfig,
      BCRYPT_ROUNDS: 12,
    };

    expect(() => validate(config)).not.toThrow();
  });

  it('should accept optional PORT', () => {
    const config = {
      ...validConfig,
      PORT: 3000,
    };

    expect(() => validate(config)).not.toThrow();
  });

  it('should convert string numbers to numbers', () => {
    const config = {
      ...validConfig,
      DATABASE_PORT: '5432',
      PORT: '3000',
    };

    const result = validate(config);

    expect(typeof result.DATABASE_PORT).toBe('number');
    expect(typeof result.PORT).toBe('number');
  });

  it('should return validated config object', () => {
    const result = validate(validConfig);

    expect(result).toBeInstanceOf(EnvironmentVariables);
    expect(result.NODE_ENV).toBe(Environment.Development);
    expect(result.DATABASE_HOST).toBe('localhost');
  });

  it('should handle multiple validation errors', () => {
    const invalidConfig = {
      NODE_ENV: 'invalid',
      DATABASE_PORT: 'not-a-number',
    };

    expect(() => validate(invalidConfig)).toThrow();
  });
});
