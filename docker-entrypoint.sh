#!/bin/sh
set -e

echo "Running database migrations..."

# Apply each migration file in order. The IF NOT EXISTS clauses
# make them safe to re-run (idempotent).
for file in migrations/*.sql; do
  if [ -f "$file" ]; then
    echo "  Applying $file"
    node -e "
      const { Pool } = require('pg');
      const fs = require('fs');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false } });
      pool.query(fs.readFileSync('$file', 'utf8')).then(() => { pool.end(); }).catch(err => { console.error(err.message); pool.end(); process.exit(1); });
    "
  fi
done

echo "Migrations complete. Starting server..."
exec node server.js
