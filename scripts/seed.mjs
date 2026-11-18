#!/usr/bin/env node
/**
 * Applies database/seed.sql to the configured database.
 *
 * The seed file is written to be idempotent (ON CONFLICT / guarded inserts), so
 * re-running it is safe in development and staging.
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

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env.local first.');
  process.exit(1);
}

// The seed file contains demo accounts with a well-known password. Never let it
// run against production by accident.
if (process.env.NODE_ENV === 'production' && process.env.FORCE_SEED !== '1') {
  console.error(
    'Refusing to seed a production database. Set FORCE_SEED=1 only if you are certain.'
  );
  process.exit(1);
}

const seedFile = join(root, 'database', 'seed.sql');
const client = new pg.Client({ connectionString });

try {
  await client.connect();
  console.log('seeding database/seed.sql ...');
  await client.query('BEGIN');
  await client.query(readFileSync(seedFile, 'utf8'));
  await client.query('COMMIT');
  console.log('seed complete.');
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
