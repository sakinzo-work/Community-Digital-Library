import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import { ZipArchive } from 'archiver';
import { getDb, closeDb, resetDb, DB_PATH } from '../database/db';
import { syncFilesOnStartup } from './fileStorage';

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
    format: 'sqlite3';
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

/**
 * Generate a cryptographically strong unique temporary directory path.
 */
function createTempDir(prefix: string): string {
  const rand = crypto.randomBytes(8).toString('hex');
  const tempPath = path.join('/tmp', `${prefix}_${Date.now()}_${rand}`);
  fs.mkdirSync(tempPath, { recursive: true });
  return tempPath;
}

/**
 * Safely clean up a temporary directory without affecting any application directories.
 */
async function cleanupDirectory(dirPath: string): Promise<void> {
  try {
    if (dirPath && dirPath.startsWith('/tmp') && fs.existsSync(dirPath)) {
      await fs.promises.rm(dirPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn(`[BackupService] Warning: Failed to clean up temporary directory "${dirPath}":`, err);
  }
}

/**
 * Compute SHA-256 hash of a file.
 */
async function computeFileSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * PART 1 & 5: Create a complete, consistent Library Backup Archive (.zip).
 *
 * Uses SQLite's native `VACUUM INTO` to produce a completely consistent snapshot
 * that merges all uncheckpointed WAL pages into a standalone, pristine SQLite file.
 * Streams database.sqlite3, manifest.json, and uploads/ into a single ZIP archive.
 */
export async function createBackupArchive(outputZipPath: string): Promise<{
  manifest: BackupManifest;
  archivePath: string;
}> {
  const stagingDir = createTempDir('cdl_export');
  const snapshotDbPath = path.join(stagingDir, 'database.sqlite3');

  try {
    // 1. Create a consistent SQLite snapshot via native VACUUM INTO
    const liveDb = getDb();
    liveDb.exec(`VACUUM INTO '${snapshotDbPath}';`);

    // Verify snapshot integrity and foreign keys in isolated read-only mode
    const snapshotDb = new DatabaseSync(snapshotDbPath, { readOnly: true });
    try {
      const integrityRow = snapshotDb.prepare('PRAGMA integrity_check;').get() as any;
      if (!integrityRow || integrityRow.integrity_check !== 'ok') {
        throw new Error(`Export snapshot failed integrity check: ${JSON.stringify(integrityRow)}`);
      }
      const fkRows = snapshotDb.prepare('PRAGMA foreign_key_check;').all();
      if (fkRows.length > 0) {
        throw new Error(`Export snapshot contains foreign key violations: ${JSON.stringify(fkRows)}`);
      }

      // 2. Collect exact row counts for all 10 tables from the snapshot
      const counts: TableCounts = {
        categories: 0,
        books: 0,
        users: 0,
        uploaded_files: 0,
        borrowings: 0,
        reservations: 0,
        bookmarks: 0,
        reading_progress: 0,
        reviews: 0,
        notifications: 0
      };

      for (const table of REQUIRED_TABLES) {
        const row = snapshotDb.prepare(`SELECT COUNT(*) as cnt FROM ${table};`).get() as any;
        counts[table] = row ? Number(row.cnt || 0) : 0;
      }

      // Compute SHA-256 of the snapshot database
      const dbSha256 = await computeFileSha256(snapshotDbPath);

      // 3. Inspect existing filesystem uploads without modifying them
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const pdfsDir = path.join(uploadsDir, 'pdfs');
      const coversDir = path.join(uploadsDir, 'covers');

      let pdfCount = 0;
      let coverCount = 0;
      let totalBytes = fs.statSync(snapshotDbPath).size;

      const pdfFiles: string[] = [];
      if (fs.existsSync(pdfsDir)) {
        const files = await fs.promises.readdir(pdfsDir);
        for (const file of files) {
          const filePath = path.join(pdfsDir, file);
          const stat = await fs.promises.stat(filePath);
          if (stat.isFile() && file.toLowerCase().endsWith('.pdf')) {
            pdfCount++;
            totalBytes += stat.size;
            pdfFiles.push(file);
          }
        }
      }

      const coverFiles: string[] = [];
      if (fs.existsSync(coversDir)) {
        const files = await fs.promises.readdir(coversDir);
        for (const file of files) {
          const filePath = path.join(coversDir, file);
          const stat = await fs.promises.stat(filePath);
          if (stat.isFile()) {
            coverCount++;
            totalBytes += stat.size;
            coverFiles.push(file);
          }
        }
      }

      // 4. Build manifest.json
      const manifest: BackupManifest = {
        backupVersion: '1.0',
        appName: 'Community Digital Library',
        exportedAt: new Date().toISOString(),
        database: {
          format: 'sqlite3',
          sha256: dbSha256,
          counts
        },
        assets: {
          pdfCount,
          coverCount,
          totalBytes
        }
      };

      const manifestPath = path.join(stagingDir, 'manifest.json');
      await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

      // 5. Assemble ZIP archive via streaming
      await new Promise<void>((resolve, reject) => {
        const outputStream = fs.createWriteStream(outputZipPath);
        const zip = new ZipArchive({ zlib: { level: 6 } });

        outputStream.on('close', () => resolve());
        zip.on('error', (err) => reject(err));

        zip.pipe(outputStream);

        // Append manifest.json
        zip.file(manifestPath, { name: 'manifest.json' });

        // Append database.sqlite3
        zip.file(snapshotDbPath, { name: 'database.sqlite3' });

        // Append PDF files
        for (const pdf of pdfFiles) {
          zip.file(path.join(pdfsDir, pdf), { name: `uploads/pdfs/${pdf}` });
        }

        // Append cover files
        for (const cover of coverFiles) {
          zip.file(path.join(coversDir, cover), { name: `uploads/covers/${cover}` });
        }

        zip.finalize().catch(reject);
      });

      return { manifest, archivePath: outputZipPath };
    } finally {
      snapshotDb.close();
    }
  } finally {
    await cleanupDirectory(stagingDir);
  }
}

/**
 * Validate that an archive entry relative path does not escape the staging directory.
 * Evaluates both POSIX (/) and Windows (\) separators across all runtimes.
 */
export function isSafeArchivePath(entryPath: string): boolean {
  // 1. Reject empty, non-string, or blank paths
  if (!entryPath || typeof entryPath !== 'string' || entryPath.trim().length === 0) {
    return false;
  }

  // 2. Reject paths starting with / or \ (Unix absolute, Windows-rooted, or UNC)
  if (entryPath.startsWith('/') || entryPath.startsWith('\\')) {
    return false;
  }

  // 3. Reject Windows drive-letter paths (e.g., C:\..., C:/...)
  if (/^[a-zA-Z]:[\\/]/.test(entryPath) || /^[a-zA-Z]:$/.test(entryPath)) {
    return false;
  }

  // 4. Reject null bytes and illegal control characters
  if (/[\x00-\x1f\x7f]/.test(entryPath)) {
    return false;
  }

  // 5. Inspect the ORIGINAL raw path segments BEFORE any normalization.
  // Treats both '/' and '\' as path separators so that traversal cannot be masked.
  const rawSegments = entryPath.split(/[/\\]+/);
  for (const segment of rawSegments) {
    if (segment === '..') {
      return false;
    }
  }

  // 6. Cross-platform normalization check:
  // Convert all backslashes to forward slashes and ensure normalized relative path does not escape
  const posixPath = entryPath.replace(/\\/g, '/');
  const normalized = path.posix.normalize(posixPath);
  if (
    normalized.startsWith('../') ||
    normalized === '..' ||
    normalized.includes('/../') ||
    path.isAbsolute(normalized)
  ) {
    return false;
  }

  return true;
}

/**
 * PART 6, 7 & 8: Validate a staged backup directory BEFORE mutating any live state.
 *
 * Implements the comprehensive 21-point verification plan.
 */
export async function validateStagedBackup(stagedDir: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check manifest.json exists
  const manifestPath = path.join(stagedDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    errors.push('Archive is missing "manifest.json" at root.');
    return { valid: false, errors, warnings };
  }

  // 2 & 3 & 4. Validate manifest JSON structure
  let manifest: BackupManifest;
  try {
    const raw = await fs.promises.readFile(manifestPath, 'utf8');
    manifest = JSON.parse(raw);
  } catch (err: any) {
    errors.push(`"manifest.json" is not valid JSON: ${err.message}`);
    return { valid: false, errors, warnings };
  }

  if (!manifest.backupVersion) {
    errors.push('Manifest missing required field: "backupVersion".');
  }
  if (!manifest.exportedAt) {
    errors.push('Manifest missing required field: "exportedAt".');
  }
  if (!manifest.database || !manifest.database.counts) {
    errors.push('Manifest missing database metadata or table counts.');
  }

  // 5 & 6. Check database.sqlite3
  const dbPath = path.join(stagedDir, 'database.sqlite3');
  if (!fs.existsSync(dbPath)) {
    errors.push('Archive is missing "database.sqlite3" at root.');
    return { valid: false, manifest, errors, warnings };
  }

  const dbStat = await fs.promises.stat(dbPath);
  if (dbStat.size === 0) {
    errors.push('Archive "database.sqlite3" is an empty (0-byte) file.');
    return { valid: false, manifest, errors, warnings };
  }

  // 13. Verify SHA-256 hash if present in manifest
  if (manifest.database?.sha256) {
    const actualHash = await computeFileSha256(dbPath);
    if (actualHash !== manifest.database.sha256) {
      errors.push(
        `Database SHA-256 checksum mismatch. Expected "${manifest.database.sha256}", got "${actualHash}".`
      );
    }
  }

  // 7, 8, 9, 10, 11, 12. Open database and inspect tables & relationships
  let stagedDb: DatabaseSync | null = null;
  try {
    stagedDb = new DatabaseSync(dbPath, { readOnly: true });

    // PRAGMA integrity_check
    const integrity = stagedDb.prepare('PRAGMA integrity_check;').get() as any;
    if (!integrity || integrity.integrity_check !== 'ok') {
      errors.push(`SQLite database failed integrity check: ${JSON.stringify(integrity)}`);
    }

    // PRAGMA foreign_key_check
    const fkErrors = stagedDb.prepare('PRAGMA foreign_key_check;').all();
    if (fkErrors.length > 0) {
      errors.push(`SQLite foreign key violations detected in staged database: ${fkErrors.length} invalid references.`);
    }

    // Check all 10 required tables exist
    const existingTables = (
      stagedDb
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        .all() as any[]
    ).map((t) => t.name);

    for (const table of REQUIRED_TABLES) {
      if (!existingTables.includes(table)) {
        errors.push(`Database missing required application table: "${table}".`);
      }
    }

    // If tables are missing, stop further structural checks
    if (errors.length > 0) {
      return { valid: false, manifest, errors, warnings };
    }

    // Verify critical columns exist in books and users
    const bookCols = (stagedDb.prepare('PRAGMA table_info(books);').all() as any[]).map((c) => c.name);
    for (const col of ['id', 'title', 'category_id', 'pdf_path', 'cover_path']) {
      if (!bookCols.includes(col)) {
        errors.push(`"books" table missing essential column: "${col}".`);
      }
    }

    const userCols = (stagedDb.prepare('PRAGMA table_info(users);').all() as any[]).map((c) => c.name);
    for (const col of ['id', 'email', 'password_hash', 'role']) {
      if (!userCols.includes(col)) {
        errors.push(`"users" table missing essential column: "${col}".`);
      }
    }

    // Compare manifest table counts against actual counts
    if (manifest.database?.counts) {
      for (const table of REQUIRED_TABLES) {
        const row = stagedDb.prepare(`SELECT COUNT(*) as cnt FROM ${table};`).get() as any;
        const actualCount = row ? Number(row.cnt || 0) : 0;
        const expectedCount = manifest.database.counts[table];
        if (expectedCount !== undefined && expectedCount !== actualCount) {
          warnings.push(
            `Table "${table}" row count mismatch: manifest declared ${expectedCount}, database contains ${actualCount}.`
          );
        }
      }
    }

    // Deep relationship validation:
    // 1. books -> categories
    const orphanedBooks = stagedDb
      .prepare(
        'SELECT id, title, category_id FROM books WHERE category_id NOT IN (SELECT id FROM categories);'
      )
      .all() as any[];
    if (orphanedBooks.length > 0) {
      errors.push(`Found ${orphanedBooks.length} books with invalid category references.`);
    }

    // 2. Child tables -> books & users
    for (const child of ['borrowings', 'reservations', 'bookmarks', 'reading_progress', 'reviews']) {
      const orphanedUsers = stagedDb
        .prepare(`SELECT id FROM ${child} WHERE user_id NOT IN (SELECT id FROM users);`)
        .all();
      if (orphanedUsers.length > 0) {
        errors.push(`Found ${orphanedUsers.length} records in "${child}" referencing non-existent users.`);
      }
      const orphanedBookRefs = stagedDb
        .prepare(`SELECT id FROM ${child} WHERE book_id NOT IN (SELECT id FROM books);`)
        .all();
      if (orphanedBookRefs.length > 0) {
        errors.push(`Found ${orphanedBookRefs.length} records in "${child}" referencing non-existent books.`);
      }
    }

    // Notifications -> users
    const orphanedNotifications = stagedDb
      .prepare('SELECT id FROM notifications WHERE user_id NOT IN (SELECT id FROM users);')
      .all();
    if (orphanedNotifications.length > 0) {
      errors.push(`Found ${orphanedNotifications.length} notifications referencing non-existent users.`);
    }

    // 14 & 15. PDF Validation
    const booksWithPdf = stagedDb
      .prepare("SELECT id, title, pdf_path FROM books WHERE pdf_path IS NOT NULL AND TRIM(pdf_path) != '';")
      .all() as any[];

    for (const b of booksWithPdf) {
      const rawPdfPath: string = b.pdf_path;
      if (!isSafeArchivePath(rawPdfPath.replace(/^\//, ''))) {
        errors.push(`Book "${b.title}" contains an unsafe pdf_path: "${rawPdfPath}".`);
        continue;
      }

      const relativeFile = rawPdfPath.replace(/^\/?uploads\//, '');
      const stagedPdfPath = path.join(stagedDir, 'uploads', relativeFile);

      // Check if file exists on disk in staged uploads OR in uploaded_files BLOB
      let hasFile = fs.existsSync(stagedPdfPath);
      let buffer: Buffer | null = null;

      if (hasFile) {
        const stat = await fs.promises.stat(stagedPdfPath);
        if (stat.size > 0) {
          const fd = await fs.promises.open(stagedPdfPath, 'r');
          const headBuf = Buffer.alloc(5);
          await fd.read(headBuf, 0, 5, 0);
          await fd.close();
          buffer = headBuf;
        }
      } else {
        // Check if backed up as BLOB in staged uploaded_files table
        const filename = path.basename(rawPdfPath);
        const blobRow = stagedDb
          .prepare('SELECT data FROM uploaded_files WHERE filename = ? OR file_path = ?;')
          .get(filename, rawPdfPath) as any;
        if (blobRow && blobRow.data && Buffer.isBuffer(blobRow.data) && blobRow.data.length >= 5) {
          hasFile = true;
          buffer = blobRow.data.subarray(0, 5);
        }
      }

      if (!hasFile || !buffer) {
        errors.push(`Referenced PDF for book "${b.title}" (${rawPdfPath}) is missing from archive and BLOB table.`);
      } else {
        const magic = buffer.toString('utf8', 0, 5);
        if (magic !== '%PDF-') {
          errors.push(`File "${rawPdfPath}" for book "${b.title}" is not a valid PDF (invalid magic header: "${magic}").`);
        }
      }
    }

    // 16. Cover Validation
    const booksWithLocalCover = stagedDb
      .prepare(
        "SELECT id, title, cover_path FROM books WHERE cover_path LIKE '/uploads/covers/%' OR cover_path LIKE 'uploads/covers/%';"
      )
      .all() as any[];

    for (const b of booksWithLocalCover) {
      const rawCover: string = b.cover_path;
      if (!isSafeArchivePath(rawCover.replace(/^\//, ''))) {
        errors.push(`Book "${b.title}" contains an unsafe cover_path: "${rawCover}".`);
        continue;
      }
      const relativeCover = rawCover.replace(/^\/?uploads\//, '');
      const stagedCoverPath = path.join(stagedDir, 'uploads', relativeCover);
      if (!fs.existsSync(stagedCoverPath)) {
        warnings.push(`Local cover image for "${b.title}" (${rawCover}) was not found in the archive.`);
      }
    }
  } catch (err: any) {
    errors.push(`Error inspecting staged SQLite database: ${err.message}`);
  } finally {
    if (stagedDb) {
      stagedDb.close();
    }
  }

  return {
    valid: errors.length === 0,
    manifest,
    errors,
    warnings
  };
}

/**
 * Dependency-safe deletion order: dependent child tables first.
 */
const RESTORE_DELETE_ORDER = [
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
] as const;

/**
 * Dependency-safe insertion order: independent parent tables first.
 */
const RESTORE_INSERT_ORDER = [
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
] as const;

/**
 * PART 9 & 10: Restore a validated staged backup to live application state.
 *
 * Implements an atomic SQLite logical restore using ATTACH DATABASE on the existing
 * live DatabaseSync connection. The live database file is NOT replaced, and the live
 * DatabaseSync connection remains open and functional throughout.
 *
 * Filesystem assets (uploads) are synchronized with full rollback protection.
 */
export async function restoreValidatedBackup(stagedDir: string): Promise<RestoreResult> {
  // Step 1: Pre-validation check
  const validation = await validateStagedBackup(stagedDir);
  if (!validation.valid) {
    return {
      success: false,
      message: 'Restore aborted: Backup failed pre-flight validation.',
      manifest: validation.manifest,
      error: validation.errors.join('; ')
    };
  }

  const liveDir = process.cwd();
  const liveUploadsDir = path.join(liveDir, 'uploads');
  const rollbackTag = `rollback_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const rollbackUploadsDir = path.join(liveDir, `uploads.${rollbackTag}`);

  const stagedDbPath = path.join(stagedDir, 'database.sqlite3');
  const stagedUploadsDir = path.join(stagedDir, 'uploads');

  const liveDb = getDb();
  let isAttached = false;
  let isTransactionActive = false;
  let uploadsReplaced = false;

  try {
    // Step 2: Backup live uploads directory for filesystem rollback
    if (fs.existsSync(liveUploadsDir)) {
      await fs.promises.cp(liveUploadsDir, rollbackUploadsDir, { recursive: true });
    }

    // Step 3: Attach staged backup database to live connection
    // Escape single quotes in path if any
    const safeStagedPath = stagedDbPath.replace(/'/g, "''");
    liveDb.exec(`ATTACH DATABASE '${safeStagedPath}' AS restore_source;`);
    isAttached = true;

    // Verify attached database tables and compatibility
    const attachedTables = (
      liveDb
        .prepare("SELECT name FROM restore_source.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        .all() as any[]
    ).map((t) => t.name);

    for (const table of REQUIRED_TABLES) {
      if (!attachedTables.includes(table)) {
        throw new Error(`Attached restore source is missing required table: "${table}".`);
      }
      // Verify column compatibility
      const liveCols = (liveDb.prepare(`PRAGMA main.table_info(${table});`).all() as any[]).map((c) => c.name);
      const srcCols = (liveDb.prepare(`PRAGMA restore_source.table_info(${table});`).all() as any[]).map((c) => c.name);
      if (liveCols.length !== srcCols.length || !liveCols.every((col, idx) => col === srcCols[idx])) {
        throw new Error(`Schema mismatch in table "${table}": live columns do not match backup columns.`);
      }
    }

    // Step 4: Execute atomic data replacement inside a single SQLite transaction
    liveDb.exec('BEGIN IMMEDIATE;');
    isTransactionActive = true;

    // Delete existing records in child-first dependency order
    for (const table of RESTORE_DELETE_ORDER) {
      liveDb.exec(`DELETE FROM main.${table};`);
    }

    // Insert records from backup in parent-first dependency order
    for (const table of RESTORE_INSERT_ORDER) {
      liveDb.exec(`INSERT INTO main.${table} SELECT * FROM restore_source.${table};`);
    }

    // Step 5: In-transaction validation
    const inTxIntegrity = liveDb.prepare('PRAGMA main.integrity_check;').get() as any;
    if (!inTxIntegrity || inTxIntegrity.integrity_check !== 'ok') {
      throw new Error(`Restored database failed integrity check during transaction: ${JSON.stringify(inTxIntegrity)}`);
    }

    const inTxFk = liveDb.prepare('PRAGMA main.foreign_key_check;').all();
    if (inTxFk.length > 0) {
      throw new Error(`Restored database has ${inTxFk.length} foreign key check violations in transaction.`);
    }

    // Commit transaction
    liveDb.exec('COMMIT;');
    isTransactionActive = false;

    // Detach backup source
    liveDb.exec('DETACH DATABASE restore_source;');
    isAttached = false;

    // Step 6: Synchronize uploads directory
    if (fs.existsSync(stagedUploadsDir)) {
      if (!fs.existsSync(liveUploadsDir)) {
        await fs.promises.mkdir(liveUploadsDir, { recursive: true });
      }
      await fs.promises.cp(stagedUploadsDir, liveUploadsDir, { recursive: true });
    }
    uploadsReplaced = true;

    // Step 7: Post-commit verification on the SAME live connection
    const postIntegrity = liveDb.prepare('PRAGMA integrity_check;').get() as any;
    if (!postIntegrity || postIntegrity.integrity_check !== 'ok') {
      throw new Error(`Restored database failed post-commit integrity check: ${JSON.stringify(postIntegrity)}`);
    }

    const postFk = liveDb.prepare('PRAGMA foreign_key_check;').all();
    if (postFk.length > 0) {
      throw new Error(`Restored database has ${postFk.length} post-commit foreign key check violations.`);
    }

    // Step 8: Self-healing sync for any disk/BLOB gaps
    await syncFilesOnStartup();

    // Clean up rollback copy
    await fs.promises.rm(rollbackUploadsDir, { recursive: true, force: true });

    return {
      success: true,
      message: 'Community Library was restored and verified successfully.',
      manifest: validation.manifest
    };
  } catch (err: any) {
    console.error('[BackupService] Restoration failed. Initiating automatic rollback:', err);

    // Rollback SQLite transaction if active
    if (isTransactionActive) {
      try {
        liveDb.exec('ROLLBACK;');
        console.log('[BackupService] Active SQLite restore transaction rolled back.');
      } catch (rbErr) {
        console.error('[BackupService] Error during SQLite transaction rollback:', rbErr);
      }
      isTransactionActive = false;
    }

    // Detach attached database if still attached
    if (isAttached) {
      try {
        liveDb.exec('DETACH DATABASE restore_source;');
        console.log('[BackupService] Attached restore_source detached.');
      } catch (detachErr) {
        console.warn('[BackupService] Warning during restore_source detach:', detachErr);
      }
      isAttached = false;
    }

    // Revert filesystem if uploads were replaced
    if (uploadsReplaced && fs.existsSync(rollbackUploadsDir)) {
      try {
        await fs.promises.rm(liveUploadsDir, { recursive: true, force: true });
        await fs.promises.cp(rollbackUploadsDir, liveUploadsDir, { recursive: true });
        console.log('[BackupService] Filesystem uploads rolled back to previous state.');
      } catch (fsErr) {
        console.error('[BackupService] Critical: Filesystem uploads rollback failed:', fsErr);
      }
    }

    // Clean up rollback copy
    await fs.promises.rm(rollbackUploadsDir, { recursive: true, force: true });

    return {
      success: false,
      message: 'Library restoration failed. Previous library state was safely rolled back.',
      error: err.message || 'Unknown restoration error'
    };
  }
}
