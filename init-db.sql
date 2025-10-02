-- Initialize database for NestJS E-Commerce
-- This script runs when PostgreSQL container starts for the first time

-- Create database if not exists (handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS nest_ecom;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance (will be created by migrations)
-- These are just examples, actual indexes will be created by TypeORM migrations

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE nest_ecom TO postgres;
