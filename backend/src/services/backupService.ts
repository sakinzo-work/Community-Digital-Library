import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Archiver } from 'archiver';
import {
  queryAll,
  queryOne,
  withTransaction
} from '../database/db';

export interface TableCounts {
  categories: number;
  books: number;
  users: number;
  uploaded_files: number;
  borrowings: number;
  reservations: number;
  bookmarks: number;
  reading_progress: number;
  reviews: number;
  notifications: number;
}

export interface BackupManifest {
  backupVersion: string;
  appName: string;
  exportedAt: string;
  database: {
    format: 'postgresql';
    sha256: string;
    counts: TableCounts;
  };
  assets: {
    pdfCount: number;
    coverCount: number;
    totalBytes: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  manifest?: BackupManifest;
  errors: string[];
  warnings: string[];
}

export interface RestoreResult {
  success: boolean;
  message: string;
  manifest?: BackupManifest;
  error?: string;
}

const REQUIRED_TABLES = [
  'categories',
  'books',
  'users',
  'uploaded_files',
  'borrowings',
  'reservations',
  'bookmarks',
  'reading_progress',
  'reviews',
  'notifications'
] as const;

type BackupTableName = (typeof REQUIRED_TABLES)[number];

interface BackupDatabase {
  categories: any[];
  books: any[];
  users: any[];
  uploaded_files: any[];
  borrowings: any[];
  reservations: any[];
  bookmarks: any[];
  reading_progress: any[];
  reviews: any[];
  notifications: any[];
}

function createTempDir(prefix: string): string {
  const rand = crypto.randomBytes(8).toString('hex');

  const tempPath = path.join(
    process.cwd(),
    'database',
    'tmp',
    `${prefix}_${Date.now()}_${rand}`
  );

  fs.mkdirSync(tempPath, { recursive: true });

  return tempPath;
}

async function cleanupDirectory(dirPath: string): Promise<void> {
  try {
    if (
      dirPath &&
      dirPath.includes(`${path.sep}database${path.sep}tmp${path.sep}`) &&
      fs.existsSync(dirPath)
    ) {
      await fs.promises.rm(dirPath, {
        recursive: true,
        force: true
      });
    }
  } catch (err) {
    console.warn(
      `[BackupService] Failed to clean temporary directory "${dirPath}":`,
      err
    );
  }
}

async function computeFileSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');

    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => {
      hash.update(chunk);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', reject);
  });
}

function countDatabaseRows(
  database: BackupDatabase
): TableCounts {
  return {
    categories: database.categories.length,
    books: database.books.length,
    users: database.users.length,
    uploaded_files: database.uploaded_files.length,
    borrowings: database.borrowings.length,
    reservations: database.reservations.length,
    bookmarks: database.bookmarks.length,
    reading_progress: database.reading_progress.length,
    reviews: database.reviews.length,
    notifications: database.notifications.length
  };
}

function serializeDatabaseValue(value: any): any {
  if (Buffer.isBuffer(value)) {
    return {
      __type: 'Buffer',
      base64: value.toString('base64')
    };
  }

  if (value instanceof Date) {
    return {
      __type: 'Date',
      value: value.toISOString()
    };
  }

  if (Array.isArray(value)) {
    return value.map(serializeDatabaseValue);
  }

  if (
    value !== null &&
    typeof value === 'object'
  ) {
    const result: Record<string, any> = {};

    for (const [key, item] of Object.entries(value)) {
      result[key] = serializeDatabaseValue(item);
    }

    return result;
  }

  return value;
}

function deserializeDatabaseValue(value: any): any {
  if (
    value &&
    typeof value === 'object' &&
    value.__type === 'Buffer'
  ) {
    return Buffer.from(value.base64, 'base64');
  }

  if (
    value &&
    typeof value === 'object' &&
    value.__type === 'Date'
  ) {
    return new Date(value.value);
  }

  if (Array.isArray(value)) {
    return value.map(deserializeDatabaseValue);
  }

  if (
    value !== null &&
    typeof value === 'object'
  ) {
    const result: Record<string, any> = {};

    for (const [key, item] of Object.entries(value)) {
      result[key] = deserializeDatabaseValue(item);
    }

    return result;
  }

  return value;
}

async function loadCurrentDatabase(): Promise<BackupDatabase> {
  const database: BackupDatabase = {
    categories: await queryAll(
      'SELECT * FROM categories ORDER BY id'
    ),

    books: await queryAll(
      'SELECT * FROM books ORDER BY id'
    ),

    users: await queryAll(
      'SELECT * FROM users ORDER BY id'
    ),

    uploaded_files: await queryAll(
      'SELECT * FROM uploaded_files ORDER BY filename'
    ),

    borrowings: await queryAll(
      'SELECT * FROM borrowings ORDER BY id'
    ),

    reservations: await queryAll(
      'SELECT * FROM reservations ORDER BY id'
    ),

    bookmarks: await queryAll(
      'SELECT * FROM bookmarks ORDER BY id'
    ),

    reading_progress: await queryAll(
      'SELECT * FROM reading_progress ORDER BY id'
    ),

    reviews: await queryAll(
      'SELECT * FROM reviews ORDER BY id'
    ),

    notifications: await queryAll(
      'SELECT * FROM notifications ORDER BY id'
    )
  };

  return database;
}

function getDatabaseSha256(
  database: BackupDatabase
): string {
  const serialized = JSON.stringify(
    serializeDatabaseValue(database)
  );

  return crypto
    .createHash('sha256')
    .update(serialized, 'utf8')
    .digest('hex');
}

async function inspectUploads(): Promise<{
  pdfFiles: string[];
  coverFiles: string[];
  pdfCount: number;
  coverCount: number;
  totalBytes: number;
}> {
  const uploadsDir = path.join(
    process.cwd(),
    'uploads'
  );

  const pdfsDir = path.join(
    uploadsDir,
    'pdfs'
  );

  const coversDir = path.join(
    uploadsDir,
    'covers'
  );

  const pdfFiles: string[] = [];
  const coverFiles: string[] = [];

  let pdfCount = 0;
  let coverCount = 0;
  let totalBytes = 0;

  if (fs.existsSync(pdfsDir)) {
    const files = await fs.promises.readdir(pdfsDir);

    for (const file of files) {
      const filePath = path.join(
        pdfsDir,
        file
      );

      const stat = await fs.promises.stat(
        filePath
      );

      if (
        stat.isFile() &&
        file.toLowerCase().endsWith('.pdf')
      ) {
        pdfFiles.push(file);
        pdfCount++;
        totalBytes += stat.size;
      }
    }
  }

  if (fs.existsSync(coversDir)) {
    const files = await fs.promises.readdir(coversDir);

    for (const file of files) {
      const filePath = path.join(
        coversDir,
        file
      );

      const stat = await fs.promises.stat(
        filePath
      );

      if (stat.isFile()) {
        coverFiles.push(file);
        coverCount++;
        totalBytes += stat.size;
      }
    }
  }

  return {
    pdfFiles,
    coverFiles,
    pdfCount,
    coverCount,
    totalBytes
  };
}

export async function createBackupArchive(
  outputZipPath: string
): Promise<{
  manifest: BackupManifest;
  archivePath: string;
}> {
  const stagingDir = createTempDir(
    'cdl_export'
  );

  try {
    const database =
      await loadCurrentDatabase();

    const databasePayload =
      serializeDatabaseValue(database);

    const databaseJsonPath = path.join(
      stagingDir,
      'database.json'
    );

    await fs.promises.writeFile(
      databaseJsonPath,
      JSON.stringify(
        databasePayload,
        null,
        2
      ),
      'utf8'
    );

    const databaseSha256 =
      await computeFileSha256(
        databaseJsonPath
      );

    const uploads =
      await inspectUploads();

    const counts =
      countDatabaseRows(database);

    const databaseBytes = (
      await fs.promises.stat(
        databaseJsonPath
      )
    ).size;

    const manifest: BackupManifest = {
      backupVersion: '2.0',
      appName: 'Community Digital Library',
      exportedAt: new Date().toISOString(),

      database: {
        format: 'postgresql',
        sha256: databaseSha256,
        counts
      },

      assets: {
        pdfCount: uploads.pdfCount,
        coverCount: uploads.coverCount,
        totalBytes:
          databaseBytes +
          uploads.totalBytes
      }
    };

    const manifestPath = path.join(
      stagingDir,
      'manifest.json'
    );

    await fs.promises.writeFile(
      manifestPath,
      JSON.stringify(
        manifest,
        null,
        2
      ),
      'utf8'
    );

    type ArchiverFactory = (
      format: 'zip',
      options: {
        zlib: {
          level: number;
        };
      }
    ) => Archiver;

    const { default: createArchiver } =
      (await import('archiver')) as unknown as {
        default: ArchiverFactory;
      };

    await new Promise<void>(
      (resolve, reject) => {
        const outputStream =
          fs.createWriteStream(
            outputZipPath
          );

        const zip = createArchiver(
          'zip',
          {
            zlib: {
              level: 6
            }
          }
        );

        outputStream.on(
          'close',
          () => resolve()
        );

        outputStream.on(
          'error',
          reject
        );

        zip.on(
          'error',
          reject
        );

        zip.pipe(outputStream);

        zip.file(
          manifestPath,
          {
            name: 'manifest.json'
          }
        );

        zip.file(
          databaseJsonPath,
          {
            name: 'database.json'
          }
        );

        for (
          const pdf of uploads.pdfFiles
        ) {
          zip.file(
            path.join(
              process.cwd(),
              'uploads',
              'pdfs',
              pdf
            ),
            {
              name:
                `uploads/pdfs/${pdf}`
            }
          );
        }

        for (
          const cover of uploads.coverFiles
        ) {
          zip.file(
            path.join(
              process.cwd(),
              'uploads',
              'covers',
              cover
            ),
            {
              name:
                `uploads/covers/${cover}`
            }
          );
        }

        void zip.finalize();
      }
    );

    return {
      manifest,
      archivePath: outputZipPath
    };
  } finally {
    await cleanupDirectory(
      stagingDir
    );
  }
}

export function isSafeArchivePath(
  entryPath: string
): boolean {
  if (
    !entryPath ||
    typeof entryPath !== 'string' ||
    entryPath.trim().length === 0
  ) {
    return false;
  }

  if (
    entryPath.startsWith('/') ||
    entryPath.startsWith('\\')
  ) {
    return false;
  }

  if (
    /^[a-zA-Z]:[\\/]/.test(entryPath) ||
    /^[a-zA-Z]:$/.test(entryPath)
  ) {
    return false;
  }

  if (
    /[\x00-\x1f\x7f]/.test(entryPath)
  ) {
    return false;
  }

  const rawSegments =
    entryPath.split(/[\\/]+/);

  for (
    const segment of rawSegments
  ) {
    if (segment === '..') {
      return false;
    }
  }

  const posixPath =
    entryPath.replace(/\\/g, '/');

  const normalized =
    path.posix.normalize(
      posixPath
    );

  if (
    normalized.startsWith('../') ||
    normalized === '..' ||
    normalized.includes('/../') ||
    path.posix.isAbsolute(
      normalized
    )
  ) {
    return false;
  }

  return true;
}

async function readManifest(
  stagedDir: string
): Promise<BackupManifest> {
  const manifestPath =
    path.join(
      stagedDir,
      'manifest.json'
    );

  if (
    !fs.existsSync(manifestPath)
  ) {
    throw new Error(
      'Archive is missing "manifest.json".'
    );
  }

  const raw =
    await fs.promises.readFile(
      manifestPath,
      'utf8'
    );

  const manifest =
    JSON.parse(raw);

  if (
    !manifest ||
    typeof manifest !== 'object'
  ) {
    throw new Error(
      'Invalid backup manifest.'
    );
  }

  return manifest as BackupManifest;
}

async function readStagedDatabase(
  stagedDir: string
): Promise<BackupDatabase> {
  const databasePath =
    path.join(
      stagedDir,
      'database.json'
    );

  if (
    !fs.existsSync(databasePath)
  ) {
    throw new Error(
      'Archive is missing "database.json".'
    );
  }

  const raw =
    await fs.promises.readFile(
      databasePath,
      'utf8'
    );

  const parsed =
    JSON.parse(raw);

  return deserializeDatabaseValue(
    parsed
  ) as BackupDatabase;
}

function validateRequiredTables(
  database: any
): string[] {
  const errors: string[] = [];

  for (
    const table of REQUIRED_TABLES
  ) {
    if (
      !Array.isArray(
        database?.[table]
      )
    ) {
      errors.push(
        `Database backup is missing table data for "${table}".`
      );
    }
  }

  return errors;
}

function validateRelationships(
  database: BackupDatabase
): string[] {
  const errors: string[] = [];

  const categoryIds =
    new Set(
      database.categories.map(
        (row) => row.id
      )
    );

  const userIds =
    new Set(
      database.users.map(
        (row) => row.id
      )
    );

  const bookIds =
    new Set(
      database.books.map(
        (row) => row.id
      )
    );

  for (
    const book of database.books
  ) {
    if (
      !categoryIds.has(
        book.category_id
      )
    ) {
      errors.push(
        `Book "${book.id}" references missing category "${book.category_id}".`
      );
    }
  }

  const childTables = [
    'borrowings',
    'reservations',
    'bookmarks',
    'reading_progress',
    'reviews'
  ] as const;

  for (
    const table of childTables
  ) {
    for (
      const row of database[table]
    ) {
      if (
        !userIds.has(row.user_id)
      ) {
        errors.push(
          `Table "${table}" record "${row.id}" references missing user "${row.user_id}".`
        );
      }

      if (
        !bookIds.has(row.book_id)
      ) {
        errors.push(
          `Table "${table}" record "${row.id}" references missing book "${row.book_id}".`
        );
      }
    }
  }

  for (
    const row of database.notifications
  ) {
    if (
      !userIds.has(row.user_id)
    ) {
      errors.push(
        `Notification "${row.id}" references missing user "${row.user_id}".`
      );
    }
  }

  return errors;
}

function validatePdfFiles(
  database: BackupDatabase,
  stagedDir: string,
  errors: string[]
): void {
  for (
    const book of database.books
  ) {
    if (
      !book.pdf_path ||
      String(book.pdf_path).trim() === ''
    ) {
      continue;
    }

    const rawPdfPath =
      String(book.pdf_path);

    const filename =
      path.basename(
        rawPdfPath
      );

    if (
      !isSafeArchivePath(filename)
    ) {
      errors.push(
        `Book "${book.title}" contains an unsafe PDF filename.`
      );

      continue;
    }

    const stagedPdfPath =
      path.join(
        stagedDir,
        'uploads',
        'pdfs',
        filename
      );

    if (
      !fs.existsSync(
        stagedPdfPath
      )
    ) {
      continue;
    }

    try {
      const fd =
        fs.openSync(
          stagedPdfPath,
          'r'
        );

      const header =
        Buffer.alloc(5);

      fs.readSync(
        fd,
        header,
        0,
        5,
        0
      );

      fs.closeSync(fd);

      if (
        header.toString(
          'utf8'
        ) !== '%PDF-'
      ) {
        errors.push(
          `PDF "${filename}" for book "${book.title}" has an invalid PDF header.`
        );
      }
    } catch (error: any) {
      errors.push(
        `Could not inspect PDF "${filename}": ${error.message}`
      );
    }
  }
}

export async function validateStagedBackup(
  stagedDir: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  let manifest: BackupManifest;

  try {
    manifest =
      await readManifest(
        stagedDir
      );
  } catch (error: any) {
    errors.push(
      error.message
    );

    return {
      valid: false,
      errors,
      warnings
    };
  }

  if (
    !manifest.backupVersion
  ) {
    errors.push(
      'Manifest is missing backupVersion.'
    );
  }

  if (
    !manifest.exportedAt
  ) {
    errors.push(
      'Manifest is missing exportedAt.'
    );
  }

  if (
    !manifest.database
  ) {
    errors.push(
      'Manifest is missing database metadata.'
    );
  }

  if (
    manifest.database &&
    manifest.database.format !== 'postgresql'
  ) {
    errors.push(
      `Unsupported backup database format "${manifest.database.format}". Expected "postgresql".`
    );
  }

  let database: BackupDatabase;

  try {
    database =
      await readStagedDatabase(
        stagedDir
      );
  } catch (error: any) {
    errors.push(
      error.message
    );

    return {
      valid: false,
      manifest,
      errors,
      warnings
    };
  }

  errors.push(
    ...validateRequiredTables(
      database
    )
  );

  if (
    errors.length > 0
  ) {
    return {
      valid: false,
      manifest,
      errors,
      warnings
    };
  }

  const actualHash =
    getDatabaseSha256(
      database
    );

  if (
    manifest.database?.sha256 &&
    actualHash !==
      manifest.database.sha256
  ) {
    errors.push(
      `Database SHA-256 checksum mismatch. Expected "${manifest.database.sha256}", got "${actualHash}".`
    );
  }

  const actualCounts =
    countDatabaseRows(
      database
    );

  if (
    manifest.database?.counts
  ) {
    for (
      const table of REQUIRED_TABLES
    ) {
      const expected =
        manifest.database.counts[
          table
        ];

      const actual =
        actualCounts[
          table
        ];

      if (
        expected !== actual
      ) {
        warnings.push(
          `Table "${table}" count differs from manifest: manifest=${expected}, backup=${actual}.`
        );
      }
    }
  }

  errors.push(
    ...validateRelationships(
      database
    )
  );

  validatePdfFiles(
    database,
    stagedDir,
    errors
  );

  const uploadsDir =
    path.join(
      stagedDir,
      'uploads'
    );

  if (
    manifest.assets?.pdfCount >
      0 &&
    !fs.existsSync(
      path.join(
        uploadsDir,
        'pdfs'
      )
    )
  ) {
    warnings.push(
      'Manifest reports PDF files, but uploads/pdfs is missing from the archive.'
    );
  }

  if (
    manifest.assets?.coverCount >
      0 &&
    !fs.existsSync(
      path.join(
        uploadsDir,
        'covers'
      )
    )
  ) {
    warnings.push(
      'Manifest reports cover files, but uploads/covers is missing from the archive.'
    );
  }

  return {
    valid:
      errors.length === 0,
    manifest,
    errors,
    warnings
  };
}

const RESTORE_DELETE_ORDER: BackupTableName[] = [
  'notifications',
  'reviews',
  'reading_progress',
  'bookmarks',
  'reservations',
  'borrowings',
  'uploaded_files',
  'books',
  'categories',
  'users'
];

const RESTORE_INSERT_ORDER: BackupTableName[] = [
  'users',
  'categories',
  'books',
  'uploaded_files',
  'borrowings',
  'reservations',
  'bookmarks',
  'reading_progress',
  'reviews',
  'notifications'
];

const TABLE_COLUMNS: Record<
  BackupTableName,
  string[]
> = {
  users: [
    'id',
    'full_name',
    'email',
    'password_hash',
    'phone',
    'role',
    'bio',
    'interests',
    'library_card_number',
    'membership_type',
    'created_at',
    'updated_at'
  ],

  categories: [
    'id',
    'name',
    'description',
    'icon_name',
    'created_at'
  ],

  books: [
    'id',
    'title',
    'author',
    'category_id',
    'description',
    'publication_year',
    'pages',
    'language',
    'isbn',
    'cover_path',
    'pdf_path',
    'is_available',
    'publisher',
    'featured',
    'chapters_json',
    'rating',
    'reviews_count',
    'created_at',
    'updated_at'
  ],

  uploaded_files: [
    'filename',
    'file_path',
    'mime_type',
    'file_size',
    'data',
    'created_at'
  ],

  borrowings: [
    'id',
    'user_id',
    'book_id',
    'borrowed_at',
    'due_date',
    'returned_at',
    'status'
  ],

  reservations: [
    'id',
    'user_id',
    'book_id',
    'reserved_at',
    'status',
    'queue_position',
    'ready_at',
    'expires_at'
  ],

  bookmarks: [
    'id',
    'user_id',
    'book_id',
    'created_at'
  ],

  reading_progress: [
    'id',
    'user_id',
    'book_id',
    'current_page',
    'total_pages',
    'progress_percentage',
    'last_read_at'
  ],

  reviews: [
    'id',
    'user_id',
    'book_id',
    'rating',
    'comment',
    'created_at',
    'updated_at'
  ],

  notifications: [
    'id',
    'user_id',
    'title',
    'message',
    'type',
    'link',
    'is_read',
    'created_at'
  ]
};

async function verifyLiveSchema(): Promise<void> {
  for (
    const table of REQUIRED_TABLES
  ) {
    const rows =
      await queryAll<{
        column_name: string;
      }>(
        `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ?
        ORDER BY ordinal_position
        `,
        [table]
      );

    const actualColumns =
      rows.map(
        (row) =>
          row.column_name
      );

    const expectedColumns =
      TABLE_COLUMNS[table];

    for (
      const column of expectedColumns
    ) {
      if (
        !actualColumns.includes(
          column
        )
      ) {
        throw new Error(
          `PostgreSQL table "${table}" is missing required column "${column}".`
        );
      }
    }
  }
}

function buildInsertQuery(
  table: BackupTableName,
  row: Record<string, any>
): {
  sql: string;
  values: any[];
} {
  const columns =
    TABLE_COLUMNS[table].filter(
      (column) =>
        Object.prototype.hasOwnProperty.call(
          row,
          column
        )
    );

  if (
    columns.length === 0
  ) {
    throw new Error(
      `Backup row for "${table}" contains no recognized columns.`
    );
  }

  const placeholders =
    columns.map(
      () => '?'
    );

  const values =
    columns.map(
      (column) =>
        row[column] === undefined
          ? null
          : row[column]
    );

  return {
    sql: `
      INSERT INTO ${table}
      (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
    `,
    values
  };
}

async function replaceDatabase(
  database: BackupDatabase
): Promise<void> {
  await verifyLiveSchema();

  await withTransaction(
    async ({
      run
    }) => {
      for (
        const table of RESTORE_DELETE_ORDER
      ) {
        await run(
          `DELETE FROM ${table}`
        );
      }

      for (
        const table of RESTORE_INSERT_ORDER
      ) {
        for (
          const rawRow of database[
            table
          ]
        ) {
          const row =
            deserializeDatabaseValue(
              rawRow
            );

          const insert =
            buildInsertQuery(
              table,
              row
            );

          await run(
            insert.sql,
            insert.values
          );
        }
      }

      const integrity =
        await queryOne<{
          users: number;
          categories: number;
          books: number;
        }>(
          `
          SELECT
            (SELECT COUNT(*) FROM users) AS users,
            (SELECT COUNT(*) FROM categories) AS categories,
            (SELECT COUNT(*) FROM books) AS books
          `
        );

      if (!integrity) {
        throw new Error(
          'PostgreSQL restore verification failed.'
        );
      }
    }
  );
}

async function backupLiveUploads(
  rollbackUploadsDir: string
): Promise<void> {
  const liveUploadsDir =
    path.join(
      process.cwd(),
      'uploads'
    );

  if (
    !fs.existsSync(
      liveUploadsDir
    )
  ) {
    return;
  }

  await fs.promises.cp(
    liveUploadsDir,
    rollbackUploadsDir,
    {
      recursive: true
    }
  );
}

async function restoreUploads(
  stagedDir: string
): Promise<void> {
  const stagedUploadsDir =
    path.join(
      stagedDir,
      'uploads'
    );

  const liveUploadsDir =
    path.join(
      process.cwd(),
      'uploads'
    );

  if (
    !fs.existsSync(
      stagedUploadsDir
    )
  ) {
    return;
  }

  await fs.promises.rm(
    liveUploadsDir,
    {
      recursive: true,
      force: true
    }
  );

  await fs.promises.cp(
    stagedUploadsDir,
    liveUploadsDir,
    {
      recursive: true
    }
  );
}

export async function restoreValidatedBackup(
  stagedDir: string
): Promise<RestoreResult> {
  const validation =
    await validateStagedBackup(
      stagedDir
    );

  if (
    !validation.valid
  ) {
    return {
      success: false,
      message:
        'Restore aborted: Backup failed pre-flight validation.',
      manifest:
        validation.manifest,
      error:
        validation.errors.join(
          '; '
        )
    };
  }

  const database =
    await readStagedDatabase(
      stagedDir
    );

  const rollbackTag =
    `rollback_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const rollbackUploadsDir =
    path.join(
      process.cwd(),
      `uploads.${rollbackTag}`
    );

  let databaseRestored =
    false;
  let uploadsRestored =
    false;

  try {
    /*
     * PostgreSQL transaction handles the database atomically.
     */
    await replaceDatabase(
      database
    );

    databaseRestored = true;

    /*
     * Keep a filesystem rollback copy before replacing uploads.
     */
    await backupLiveUploads(
      rollbackUploadsDir
    );

    await restoreUploads(
      stagedDir
    );

    uploadsRestored = true;

    return {
      success: true,
      message:
        'Community Library PostgreSQL database and uploads were restored successfully.',
      manifest:
        validation.manifest
    };
  } catch (error: any) {
    console.error(
      '[BackupService] PostgreSQL restoration failed:',
      error
    );

    /*
     * Database restoration is already transactional.
     * If replaceDatabase() throws, PostgreSQL rolled it back.
     *
     * If uploads were replaced and a rollback copy exists,
     * restore the previous filesystem state.
     */
    if (
      uploadsRestored &&
      fs.existsSync(
        rollbackUploadsDir
      )
    ) {
      try {
        const liveUploadsDir =
          path.join(
            process.cwd(),
            'uploads'
          );

        await fs.promises.rm(
          liveUploadsDir,
          {
            recursive: true,
            force: true
          }
        );

        await fs.promises.cp(
          rollbackUploadsDir,
          liveUploadsDir,
          {
            recursive: true
          }
        );
      } catch (rollbackError) {
        console.error(
          '[BackupService] CRITICAL: Upload rollback failed:',
          rollbackError
        );
      }
    }

    return {
      success: false,
      message:
        databaseRestored
          ? 'Library restoration failed. Database was restored transactionally, but the filesystem restore failed.'
          : 'Library restoration failed. PostgreSQL transaction was rolled back.',
      error:
        error?.message ||
        'Unknown restoration error'
    };
  } finally {
    await fs.promises.rm(
      rollbackUploadsDir,
      {
        recursive: true,
        force: true
      }
    );
  }
}
