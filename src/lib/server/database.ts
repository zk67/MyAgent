import { Pool, type PoolClient, type QueryResultRow } from 'pg';

const globalForDatabase = globalThis as typeof globalThis & {
  myAgentDatabasePool?: Pool;
};

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }

  let ssl: false | { rejectUnauthorized: false } = {
    rejectUnauthorized: false,
  };

  if (process.env.DATABASE_SSL === 'false') {
    ssl = false;
  }

  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl,
  });
}

export function getDatabasePool() {
  if (!globalForDatabase.myAgentDatabasePool) {
    globalForDatabase.myAgentDatabasePool = createPool();
  }

  return globalForDatabase.myAgentDatabasePool;
}

export function query<Row extends QueryResultRow>(text: string, values: unknown[] = []) {
  return getDatabasePool().query<Row>(text, values);
}

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>) {
  const client = await getDatabasePool().connect();
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
