/**
 * Database migration runner.
 * Reads SQL files from the migrations/ directory and executes them in order.
 * Tracks applied migrations in a `schema_migrations` table.
 *
 * Usage: npx tsx src/db/migrate.ts
 * Production: node dist/db/migrate.js
 */

import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

async function migrate() {
  const pool = new Pool({
    connectionString: config.DATABASE_URL,
    ssl: config.DATABASE_SSL ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();

  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Find migration files
    const migrationsDir = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '../../migrations',
    );

    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found. Skipping.');
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    // Get already applied migrations
    const { rows: applied } = await client.query<{ version: string }>(
      'SELECT version FROM schema_migrations ORDER BY version',
    );
    const appliedSet = new Set(applied.map((r) => r.version));

    // Apply pending migrations
    let count = 0;
    for (const file of files) {
      if (appliedSet.has(file)) continue;

      console.log(`Applying migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
        count++;
        console.log(`  ✓ ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ✗ ${file} — FAILED`);
        throw err;
      }
    }

    if (count === 0) {
      console.log('Database is up to date. No migrations to apply.');
    } else {
      console.log(`\nApplied ${count} migration(s) successfully.`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
