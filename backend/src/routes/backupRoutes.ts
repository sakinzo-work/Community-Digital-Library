import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { uploadBackupZip } from '../middleware/upload';
import {
  createBackupArchive,
  validateStagedBackup,
  restoreValidatedBackup,
  isSafeArchivePath
} from '../services/backupService';

export const backupRouter = Router();

/**
 * In-process concurrency lock for backup restoration operations.
 * Protects against simultaneous restore executions.
 */
let isRestoreInProgress = false;

/**
 * Safely inspect and extract an uploaded ZIP file into an isolated staging directory.
 * Employs strict Zip-Slip protection before any extraction occurs.
 */
async function safelyExtractZip(zipFilePath: string, targetStagingDir: string): Promise<void> {
  // Step 1: List all files inside the ZIP using unzip -Z -1 (zipinfo mode) to verify paths
  const fileList = await new Promise<string[]>((resolve, reject) => {
    const proc = spawn('unzip', ['-Z', '-1', zipFilePath]);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Failed to inspect archive structure: ${stderr.trim() || 'Invalid or corrupted ZIP file'}`));
      } else {
        const entries = stdout
          .split('\n')
          .map((e) => e.trim())
          .filter((e) => e.length > 0);
        resolve(entries);
      }
    });
  });

  // Step 2: Strict Zip-Slip and path traversal verification for every entry
  for (const entry of fileList) {
    if (!isSafeArchivePath(entry)) {
      throw new Error(`Archive contains dangerous or illegal entry path: "${entry}". Restoration aborted.`);
    }
  }

  // Step 3: Extract strictly into the isolated targetStagingDir
  await new Promise<void>((resolve, reject) => {
    const proc = spawn('unzip', ['-q', '-o', zipFilePath, '-d', targetStagingDir]);
    let stderr = '';

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Failed to extract archive: ${stderr.trim() || 'Corrupted archive extraction'}`));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Safely delete a temporary directory or file without touching live application folders.
 */
async function cleanupTempPath(targetPath: string): Promise<void> {
  try {
    if (targetPath && targetPath.startsWith('/tmp') && fs.existsSync(targetPath)) {
      const stat = await fs.promises.stat(targetPath);
      if (stat.isDirectory()) {
        await fs.promises.rm(targetPath, { recursive: true, force: true });
      } else {
        await fs.promises.unlink(targetPath);
      }
    }
  } catch (err) {
    console.warn(`[BackupRoutes] Warning: Failed to clean up temp resource "${targetPath}":`, err);
  }
}

/**
 * GET /api/admin/backup/export
 * Admin-only: Creates a consistent SQLite snapshot, packages manifest and file assets,
 * and streams the resulting ZIP to the client.
 */
backupRouter.get(
  '/export',
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    const rand = crypto.randomBytes(6).toString('hex');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempZipName = `community-library-backup-${timestamp}-${rand}.zip`;
    const tempZipPath = path.join('/tmp', tempZipName);

    let isStreamPiped = false;

    try {
      // 1. Create consistent backup archive (uses SQLite VACUUM INTO internally)
      await createBackupArchive(tempZipPath);

      // 2. Set download headers
      const downloadFilename = `community-library-backup-${timestamp}.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

      // 3. Stream file to HTTP response
      const readStream = fs.createReadStream(tempZipPath);
      isStreamPiped = true;

      readStream.pipe(res);

      // 4. Ensure cleanup when stream closes or client disconnects
      let cleanedUp = false;
      const onFinished = () => {
        if (!cleanedUp) {
          cleanedUp = true;
          cleanupTempPath(tempZipPath);
        }
      };

      res.on('finish', onFinished);
      res.on('close', onFinished);
      readStream.on('error', (streamErr) => {
        console.error('[BackupExport] Read stream error:', streamErr);
        onFinished();
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream backup archive.' });
        }
      });
    } catch (err: any) {
      console.error('[BackupExport] Error during export:', err);
      cleanupTempPath(tempZipPath);

      if (!res.headersSent && !isStreamPiped) {
        res.status(500).json({
          error: 'Failed to generate library backup archive.'
        });
      }
    }
  }
);

/**
 * POST /api/admin/backup/import
 * Admin-only: Uploads, verifies, and restores a library backup ZIP archive.
 * Supports ?dryRun=true query parameter to perform deep pre-flight validation without mutation.
 */
backupRouter.post(
  '/import',
  requireAuth,
  requireAdmin,
  (req: Request, res: Response): void => {
    uploadBackupZip.single('backupZip')(req, res, async (uploadErr: any) => {
      if (uploadErr) {
        res.status(400).json({
          success: false,
          error: uploadErr.message || 'Backup file upload failed.'
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No backup archive file was provided. Please attach a valid .zip backup.'
        });
        return;
      }

      const uploadedZipPath = req.file.path;
      const isDryRun = req.query.dryRun === 'true' || req.query.dryRun === '1';

      // Check restore concurrency lock
      if (!isDryRun && isRestoreInProgress) {
        cleanupTempPath(uploadedZipPath);
        res.status(409).json({
          success: false,
          error: 'Another library restoration is currently in progress. Please wait until it completes.'
        });
        return;
      }

      const rand = crypto.randomBytes(6).toString('hex');
      const stagingDir = path.join('/tmp', `cdl_restore_stage_${Date.now()}_${rand}`);

      try {
        // Step 1: Create isolated staging directory and safely extract ZIP
        fs.mkdirSync(stagingDir, { recursive: true });
        await safelyExtractZip(uploadedZipPath, stagingDir);

        // Step 2: Validate staged backup with the 21-point verification suite
        const validation = await validateStagedBackup(stagingDir);

        if (!validation.valid) {
          res.status(400).json({
            success: false,
            error: 'Backup validation failed',
            validation: {
              valid: false,
              errors: validation.errors,
              warnings: validation.warnings,
              manifest: validation.manifest
            }
          });
          return;
        }

        // Step 3: Handle Dry-Run Mode
        // In dryRun mode, validate completely, return HTTP 200, and NEVER call restoreValidatedBackup
        if (isDryRun) {
          res.status(200).json({
            success: true,
            dryRun: true,
            message: 'Backup archive passed all validation checks successfully.',
            validation: {
              valid: true,
              manifest: validation.manifest,
              warnings: validation.warnings
            }
          });
          return;
        }

        // Step 4: Execute Full Restoration (Protected by concurrency lock)
        isRestoreInProgress = true;
        try {
          const restoreResult = await restoreValidatedBackup(stagingDir);

          if (!restoreResult.success) {
            res.status(500).json({
              success: false,
              error: restoreResult.error || 'Backup restore failed during application.'
            });
            return;
          }

          res.status(200).json({
            success: true,
            message: restoreResult.message,
            restoredAt: new Date().toISOString(),
            validation: {
              valid: true,
              manifest: validation.manifest
            }
          });
        } finally {
          isRestoreInProgress = false;
        }
      } catch (err: any) {
        console.error('[BackupImport] Error during import processing:', err);
        res.status(500).json({
          success: false,
          error: err.message || 'An error occurred while processing the backup archive.'
        });
      } finally {
        // Always clean up uploaded ZIP and extracted staging directory in finally block
        await cleanupTempPath(uploadedZipPath);
        await cleanupTempPath(stagingDir);
      }
    });
  }
);
