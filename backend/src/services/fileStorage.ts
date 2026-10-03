import fs from 'fs';
import path from 'path';
import { queryOne, run } from '../database/db';

const uploadsDir = path.join(process.cwd(), 'uploads');
const pdfsDir = path.join(uploadsDir, 'pdfs');

export function ensureDirectories(): void {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  if (!fs.existsSync(pdfsDir)) {
    fs.mkdirSync(pdfsDir, { recursive: true });
  }
}

/**
 * Save an uploaded PDF to local disk and PostgreSQL.
 *
 * PostgreSQL stores the PDF as BYTEA in uploaded_files.
 * The local copy is kept because the current PDF-serving
 * routes still use the local uploads directory.
 */
export async function saveUploadedPdf(
  filename: string,
  relativePath: string,
  fileSize: number,
  buffer: Buffer
): Promise<void> {
  ensureDirectories();

  const diskPath = path.join(pdfsDir, filename);

  if (!fs.existsSync(diskPath)) {
    await fs.promises.writeFile(diskPath, buffer);
  }

  const existing = await queryOne(
    'SELECT filename FROM uploaded_files WHERE filename = ?',
    [filename]
  );

  if (existing) {
    await run(
      `
      UPDATE uploaded_files
      SET
        file_path = ?,
        mime_type = ?,
        file_size = ?,
        data = ?,
        created_at = CURRENT_TIMESTAMP
      WHERE filename = ?
      `,
      [
        relativePath,
        'application/pdf',
        fileSize,
        buffer,
        filename
      ]
    );
  } else {
    await run(
      `
      INSERT INTO uploaded_files (
        filename,
        file_path,
        mime_type,
        file_size,
        data,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [
        filename,
        relativePath,
        'application/pdf',
        fileSize,
        buffer
      ]
    );
  }
}

/**
 * Restore a PDF from PostgreSQL BYTEA storage to local disk
 * if the local copy is missing.
 */
export async function restoreFileFromDatabase(
  filename: string,
  targetDiskPath: string
): Promise<boolean> {
  try {
    ensureDirectories();

    const row = await queryOne<{ data: Buffer }>(
      'SELECT data FROM uploaded_files WHERE filename = ?',
      [filename]
    );

    if (row?.data) {
      await fs.promises.mkdir(
        path.dirname(targetDiskPath),
        { recursive: true }
      );

      await fs.promises.writeFile(
        targetDiskPath,
        row.data
      );

      console.log(
        `[Storage] Restored PDF "${filename}" from PostgreSQL storage to disk.`
      );

      return true;
    }
  } catch (err) {
    console.error(
      `[Storage] Failed to restore "${filename}" from PostgreSQL:`,
      err
    );
  }

  return false;
}

/**
 * Synchronize uploaded PDFs between PostgreSQL and local disk.
 *
 * This is retained temporarily during the migration.
 * Supabase Storage will become the final persistent file
 * storage layer in the next migration step.
 */
export async function syncFilesOnStartup(): Promise<void> {
  try {
    ensureDirectories();

    /*
     * 1. Restore PDFs from PostgreSQL if their local copy
     *    is missing.
     */
    const dbFiles = await import('../database/db').then(
      ({ queryAll }) =>
        queryAll<{ filename: string; data: Buffer }>(
          'SELECT filename, data FROM uploaded_files'
        )
    );

    for (const file of await dbFiles) {
      const diskPath = path.join(
        pdfsDir,
        file.filename
      );

      if (!fs.existsSync(diskPath) && file.data) {
        await fs.promises.writeFile(
          diskPath,
          file.data
        );

        console.log(
          `[Storage] Restored "${file.filename}" to disk from PostgreSQL.`
        );
      }
    }

    /*
     * 2. Store any local PDFs that are not already present
     *    in PostgreSQL.
     */
    const diskFiles = await fs.promises.readdir(pdfsDir);

    for (const filename of diskFiles) {
      if (!filename.toLowerCase().endsWith('.pdf')) {
        continue;
      }

      const existsInDb = await queryOne(
        'SELECT filename FROM uploaded_files WHERE filename = ?',
        [filename]
      );

      if (existsInDb) {
        continue;
      }

      const diskPath = path.join(
        pdfsDir,
        filename
      );

      const content = await fs.promises.readFile(
        diskPath
      );

      await run(
        `
        INSERT INTO uploaded_files (
          filename,
          file_path,
          mime_type,
          file_size,
          data,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
        [
          filename,
          `/uploads/pdfs/${filename}`,
          'application/pdf',
          content.length,
          content
        ]
      );

      console.log(
        `[Storage] Backed up disk PDF "${filename}" into PostgreSQL.`
      );
    }
  } catch (err) {
    console.error(
      '[Storage] Error during file synchronization on startup:',
      err
    );
  }
}