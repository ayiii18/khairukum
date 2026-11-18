#!/usr/bin/env node
/**
 * Prints a quick health summary of the database so the team can verify that
 * migrations were applied without opening a SQL client.
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

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 8000,
  statement_timeout: 15000,
});

try {
  await client.connect();
  const version = await client.query('SHOW server_version');
  console.log('database:', version.rows[0].server_version);

  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' ORDER BY table_name`
  );
  console.log(
    'tables:',
    tables.rows.map((r) => r.table_name).join(', ') || '(none)'
  );

  const applied = await client.query(
    `SELECT version FROM schema_migrations ORDER BY version`
  ).catch(() => ({ rows: [] }));
  console.log(
    'migrations:',
    applied.rows.map((r) => r.version).join(', ') || '(none recorded)'
  );

  const columns = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users'
       AND column_name IN ('must_change_password', 'last_login_at')`
  );
  console.log(
    'security columns:',
    columns.rows.map((r) => r.column_name).join(', ') || '(missing)'
  );

  const counts = await client.query(`
    SELECT
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM students) AS students,
      (SELECT COUNT(*)::int FROM login_audit) AS login_audit,
      (SELECT COUNT(*)::int FROM app_settings) AS app_settings
  `).catch(() => ({ rows: [{}] }));
  console.log('counts:', JSON.stringify(counts.rows[0]));
} catch (error) {
  console.error('db-status failed:', error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
