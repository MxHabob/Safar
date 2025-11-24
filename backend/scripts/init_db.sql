-- Initialize PostGIS extension
-- This script runs automatically when PostgreSQL container starts for the first time

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create additional extensions if needed
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For text search
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- For encryption functions

-- Grant permissions (if needed)
-- GRANT ALL PRIVILEGES ON DATABASE safar_db TO safar_user;

