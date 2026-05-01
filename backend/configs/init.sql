-- ContApp local PostgreSQL initialization.
--
-- This file is executed by the official postgres Docker image only when the
-- database volume is created for the first time.
--
-- Keep schema/table creation in versioned migrations. This file should only
-- contain database-level setup that local development needs before migrations
-- run.

\connect contapp2

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

ALTER DATABASE contapp2 SET timezone TO 'Europe/Bucharest';
ALTER DATABASE contapp2 SET search_path TO public;

ALTER ROLE app_user SET timezone TO 'Europe/Bucharest';
ALTER ROLE app_user SET search_path TO public;

COMMENT ON DATABASE contapp2 IS 'ContApp2 local development database.';
