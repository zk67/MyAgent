import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import nextEnv from '@next/env';
import pg from 'pg';

nextEnv.loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required to run migrations.');
}

const client = new pg.Client({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

await client.connect();
try {
  const migrationFiles = [
    'migrations/001_persistent_google_sessions.sql',
    'migrations/002_pending_deletions.sql',
    'migrations/003_chat_rate_limit.sql',
  ];

  for (const file of migrationFiles) {
    const migration = await readFile(resolve(process.cwd(), file), 'utf8');
    await client.query(migration);
  }
  console.log('Database migration completed.');
} finally {
  await client.end();
}
