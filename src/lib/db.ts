import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { getEnv } from '@/lib/env';

declare global {
  var pgPool: Pool | undefined;
}

function createPool(): Pool {
  return new Pool({
    connectionString: getEnv().DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

export const pool: Pool = global.pgPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  global.pgPool = pool;
}

pool.on('error', (error) => {
  // Idle client errors should never crash the process.
  console.error(
    JSON.stringify({
      level: 'error',
      scope: 'db.pool',
      message: error.message,
      timestamp: new Date().toISOString(),
    })
  );
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
