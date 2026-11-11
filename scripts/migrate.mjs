import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import nextEnv from '@next/env';
import pg from 'pg';

nextEnv.loadEnvConfig(process.cwd());

// Migrations need a direct (non-pooled) connection on Neon; fall back to DATABASE_URL elsewhere.
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL is required to run migrations.');
}

const client = new pg.Client({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

await client.connect();
try {
  const migrationFiles = (await readdir(resolve(process.cwd(), 'migrations')))
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => `migrations/${name}`);

  for (const file of migrationFiles) {
    const migration = await readFile(resolve(process.cwd(), file), 'utf8');
    await client.query(migration);
  }
  console.log('Database migration completed.');
} finally {
  await client.end();
}
