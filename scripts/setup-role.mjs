#!/usr/bin/env node
/**
 * Creates (or rotates) the least-privilege PostgreSQL role used by the app.
 *
 * Run this once as a database owner/superuser:
 *   APP_DB_PASSWORD='...' node scripts/setup-role.mjs
 *
 * Then point the application's DATABASE_URL at that role instead of the
 * `postgres` superuser. The role can only read/write data (no DDL), which
 * limits the damage of a leaked connection string.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const rawLine of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(join(root, '.env.local'));
loadEnvFile(join(root, '.env'));

const role = process.env.APP_DB_ROLE || 'quran_app';
const password = process.env.APP_DB_PASSWORD;
const adminUrl = process.env.DATABASE_URL;

if (!adminUrl) {
  console.error('DATABASE_URL (owner/superuser connection string) is required.');
  process.exit(1);
}
if (!/^[a-z_][a-z0-9_]{0,62}$/.test(role)) {
  console.error('APP_DB_ROLE must be a simple lowercase identifier.');
  process.exit(1);
}
if (!password || password.length < 16) {
  console.error('APP_DB_PASSWORD must be at least 16 characters long.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: adminUrl });

try {
  await client.connect();

  const quotedPassword = (await client.query('SELECT quote_literal($1) AS value', [password]))
    .rows[0].value;
  const quotedRole = (await client.query('SELECT quote_ident($1) AS value', [role]))
    .rows[0].value;
  const database = (await client.query('SELECT current_database() AS name')).rows[0].name;
  const quotedDb = (await client.query('SELECT quote_ident($1) AS value', [database]))
    .rows[0].value;

  const exists = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [role]);
  if (exists.rows.length === 0) {
    await client.query(`CREATE ROLE ${quotedRole} LOGIN PASSWORD ${quotedPassword}`);
    console.log(`created role ${role}`);
  } else {
    await client.query(`ALTER ROLE ${quotedRole} WITH LOGIN PASSWORD ${quotedPassword}`);
    console.log(`rotated password for role ${role}`);
  }

  await client.query(`GRANT CONNECT ON DATABASE ${quotedDb} TO ${quotedRole}`);
  await client.query(`GRANT USAGE ON SCHEMA public TO ${quotedRole}`);
  await client.query(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${quotedRole}`
  );
  await client.query(
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${quotedRole}`
  );
  await client.query(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public
     GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${quotedRole}`
  );
  await client.query(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public
     GRANT USAGE, SELECT ON SEQUENCES TO ${quotedRole}`
  );

  console.log('least-privilege grants applied.');
  console.log(
    `Set DATABASE_URL=postgresql://${role}:<password>@<host>:5432/${database} in .env.local`
  );
} catch (error) {
  console.error('setup-role failed:', error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
