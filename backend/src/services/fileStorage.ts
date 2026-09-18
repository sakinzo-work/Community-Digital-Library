import fs from 'fs';
import path from 'path';
import { queryAll, queryOne, run } from '../database/db';

const uploadsDir = path.join(process.cwd(), 'uploads');
const pdfsDir = path.join(uploadsDir, 'pdfs');

/**
 * Ensure upload directories exist on disk
 */
export function ensureDirectories(): void {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(pdfsDir)) {
    fs.mkdirSync(pdfsDir, { recursive: true });
  }
}

/**
 * Persist an uploaded PDF file into the SQLite database for permanent durable storage
 */
export async function saveUploadedPdf(
  filename: string,
  relativePath: string,
  fileSize: number,
  buffer: Buffer
): Promise<void> {
  ensureDirectories();

  // Ensure file is on disk
  const diskPath = path.join(pdfsDir, filename);
  if (!fs.existsSync(diskPath)) {
    await fs.promises.writeFile(diskPath, buffer);
  }

  // Ensure file is persisted in SQLite uploaded_files table
  await run(
    `
    INSERT OR REPLACE INTO uploaded_files (
      filename,
      file_path,
      mime_type,
      file_size,
      data,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    [filename, relativePath, 'application/pdf', fileSize, buffer]
  );
}

/**
 * Restore a specific file from SQLite database to disk if it was missing
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

    if (row && row.data) {
      await fs.promises.writeFile(targetDiskPath, row.data);
      console.log(`[Storage] Restored PDF "${filename}" from SQLite database to disk.`);
      return true;
    }
  } catch (err) {
    console.error(`[Storage] Failed to restore "${filename}" from SQLite:`, err);
  }

  return false;
}

/**
 * Synchronize all files between SQLite and the disk on startup
 */
export async function syncFilesOnStartup(): Promise<void> {
  try {
    ensureDirectories();

    // 1. Restore any database files that might be missing from disk (e.g. after container restart)
    const dbFiles = await queryAll<{ filename: string; data: Buffer }>(
      'SELECT filename, data FROM uploaded_files'
    );

    for (const f of dbFiles) {
      const diskPath = path.join(pdfsDir, f.filename);
      if (!fs.existsSync(diskPath) && f.data) {
        await fs.promises.writeFile(diskPath, f.data);
        console.log(`[Storage] Restored "${f.filename}" to disk from SQLite.`);
      }
    }

    // 2. Backup any existing disk PDFs to SQLite if not already stored
    if (fs.existsSync(pdfsDir)) {
      const diskFiles = await fs.promises.readdir(pdfsDir);
      for (const df of diskFiles) {
        if (df.toLowerCase().endsWith('.pdf')) {
          const existsInDb = await queryOne(
            'SELECT filename FROM uploaded_files WHERE filename = ?',
            [df]
          );

          if (!existsInDb) {
            const diskPath = path.join(pdfsDir, df);
            const content = await fs.promises.readFile(diskPath);
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
              [df, `/uploads/pdfs/${df}`, 'application/pdf', content.length, content]
            );
            console.log(`[Storage] Backed up disk PDF "${df}" into SQLite table.`);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Storage] Error during file synchronization on startup:', err);
  }
}
