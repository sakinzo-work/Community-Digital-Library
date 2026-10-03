import { DatabaseSync } from 'node:sqlite';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const SQLITE_PATH = 'migration-temp/database.sqlite3';

const sqlite = new DatabaseSync(SQLITE_PATH);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  console.log('Reading original SQLite database...');

  const tables = sqlite
    .prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)
    .all() as { name: string }[];

  console.log('SQLite tables:', tables);

  const client = await pool.connect();

  try {
    await client.query('SELECT 1');
    console.log('PostgreSQL connection successful.');

    await client.query('BEGIN');

    /*
     * IMPORTANT:
     * We are clearing only the application tables in PostgreSQL.
     * The original SQLite database is untouched.
     */

    const clearTables = [
      'bookmarks',
      'reading_progress',
      'borrowings',
      'reviews',
      'reservations',
      'notifications',
      'uploaded_files',
      'books',
      'categories',
      'users',
    ];

    for (const table of clearTables) {
      await client.query(`DELETE FROM "${table}"`);
    }

    const tableOrder = [
      'users',
      'categories',
      'books',
      'bookmarks',
      'reading_progress',
      'borrowings',
      'reviews',
      'reservations',
      'notifications',
      'uploaded_files',
    ];

    for (const table of tableOrder) {
      console.log(`\nMigrating ${table}...`);

      const rows = sqlite
        .prepare(`SELECT * FROM "${table}"`)
        .all() as Record<string, unknown>[];

      if (rows.length === 0) {
        console.log(`${table}: 0 rows`);
        continue;
      }

      const columns = Object.keys(rows[0]);

      for (const row of rows) {
        const values = columns.map((column) => {
          const value = row[column];

          /*
           * SQLite booleans are normally stored as 0/1.
           * Convert them for PostgreSQL BOOLEAN columns.
           */
          if (
            [
              'is_available',
              'featured',
              'is_read',
            ].includes(column)
          ) {
            return value === 1 || value === true;
          }

          /*
           * SQLite stores uploaded file data as Uint8Array/Buffer.
           * pg accepts Buffer directly for BYTEA.
           */
          if (
            table === 'uploaded_files' &&
            column === 'data' &&
            value != null
          ) {
            return Buffer.from(value as Uint8Array);
          }

          return value;
        });

        const placeholders = values
          .map((_, index) => `$${index + 1}`)
          .join(', ');

        const quotedColumns = columns
          .map((column) => `"${column}"`)
          .join(', ');

        await client.query(
          `
          INSERT INTO "${table}" (${quotedColumns})
          VALUES (${placeholders})
          ON CONFLICT DO NOTHING
          `,
          values
        );
      }

      console.log(`${table}: ${rows.length} rows migrated`);
    }

    await client.query('COMMIT');

    console.log('\n========================================');
    console.log('MIGRATION COMPLETED SUCCESSFULLY');
    console.log('========================================');
    console.log('Original SQLite database was NOT modified.');
    console.log('PostgreSQL now contains the migrated data.');
  } catch (error) {
    await client.query('ROLLBACK');

    console.error('\nMIGRATION FAILED.');
    console.error(error);

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();