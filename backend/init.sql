-- ============================================================
--  JCAS Database Initialisation Script
--  Runs once when the PostgreSQL container is first created
-- ============================================================

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";          -- fuzzy / full-text search
CREATE EXTENSION IF NOT EXISTS "unaccent";          -- accent-insensitive search

-- Full-text search configuration
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS jcas_english (COPY = english);
ALTER TEXT SEARCH CONFIGURATION jcas_english
    ALTER MAPPING FOR hword, hword_part, word WITH unaccent, english_stem;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE jcas_db TO jcas_user;
