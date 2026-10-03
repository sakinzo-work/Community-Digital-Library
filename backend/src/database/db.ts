import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Check your .env file.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected pool error:', err);
});

console.log('PostgreSQL database configuration loaded.');

function convertPlaceholders(sql: string): string {
  let parameterIndex = 0;

  return sql.replace(/\?/g, () => {
    parameterIndex++;
    return `$${parameterIndex}`;
  });
}

function sanitizeParams(params: any[] = []): any[] {
  return params.map((p) => (p === undefined ? null : p));
}

export async function queryAll<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const convertedSql = convertPlaceholders(sql);
  const values = sanitizeParams(params);

  const result = await pool.query(convertedSql, values);

  return result.rows as T[];
}

export async function queryOne<T = any>(
  sql: string,
  params: any[] = []
): Promise<T | undefined> {
  const convertedSql = convertPlaceholders(sql);
  const values = sanitizeParams(params);

  const result = await pool.query(convertedSql, values);

  return result.rows[0] as T | undefined;
}

export async function run(
  sql: string,
  params: any[] = []
): Promise<{ lastID: number; changes: number }> {
  const convertedSql = convertPlaceholders(sql);
  const values = sanitizeParams(params);

  const result = await pool.query(convertedSql, values);

  return {
    lastID: 0,
    changes: result.rowCount ?? 0
  };
}

export async function exec(sql: string): Promise<void> {
  await pool.query(sql);
}

/**
 * Execute operations inside a PostgreSQL transaction.
 */
export async function withTransaction<T>(
  callback: (helpers: {
    queryAll: typeof queryAll;
    queryOne: typeof queryOne;
    run: typeof run;
  }) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const transactionQueryAll = async <R = any>(
      sql: string,
      params: any[] = []
    ): Promise<R[]> => {
      const convertedSql = convertPlaceholders(sql);
      const values = sanitizeParams(params);

      const result = await client.query(convertedSql, values);

      return result.rows as R[];
    };

    const transactionQueryOne = async <R = any>(
      sql: string,
      params: any[] = []
    ): Promise<R | undefined> => {
      const convertedSql = convertPlaceholders(sql);
      const values = sanitizeParams(params);

      const result = await client.query(convertedSql, values);

      return result.rows[0] as R | undefined;
    };

    const transactionRun = async (
      sql: string,
      params: any[] = []
    ): Promise<{ lastID: number; changes: number }> => {
      const convertedSql = convertPlaceholders(sql);
      const values = sanitizeParams(params);

      const result = await client.query(convertedSql, values);

      return {
        lastID: 0,
        changes: result.rowCount ?? 0
      };
    };

    const result = await callback({
      queryAll: transactionQueryAll as typeof queryAll,
      queryOne: transactionQueryOne as typeof queryOne,
      run: transactionRun
    });

    await client.query('COMMIT');

    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('[PostgreSQL] Rollback failed:', rollbackError);
    }

    throw error;
  } finally {
    client.release();
  }
}

/**
 * PostgreSQL does not need the SQLite closeDb/resetDb
 * functions, but they are kept as harmless compatibility
 * functions so existing imports do not immediately break.
 */
export function closeDb(): void {
  // PostgreSQL uses a connection pool.
  // The pool remains available for the running application.
}

export function resetDb(): any {
  return pool;
}

/**
 * Compatibility export.
 * SQLite code should no longer use DB_PATH after migration.
 */
export const DB_PATH = '';