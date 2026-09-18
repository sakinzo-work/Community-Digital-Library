import { Router, Request, Response } from 'express';
import fs from 'fs';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { uploadCover, uploadPdf } from '../middleware/upload';
import { saveUploadedPdf } from '../services/fileStorage';

export const uploadRouter = Router();

// POST /api/upload/cover - Upload book cover image
uploadRouter.post(
  '/cover',
  requireAuth,
  requireAdmin,
  (req: Request, res: Response): void => {
    uploadCover.single('cover')(req, res, (err: any) => {
      if (err) {
        res.status(400).json({ error: err.message || 'Cover upload failed' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No image file uploaded' });
        return;
      }

      const relativeUrl = `/uploads/covers/${req.file.filename}`;
      res.status(201).json({
        message: 'Cover image uploaded successfully',
        url: relativeUrl,
        filename: req.file.filename,
        size: req.file.size
      });
    });
  }
);

// POST /api/upload/pdf - Upload PDF document (Admin only)
uploadRouter.post(
  '/pdf',
  requireAuth,
  requireAdmin,
  (req: Request, res: Response): void => {
    uploadPdf.single('pdf')(req, res, async (err: any) => {
      if (err) {
        res.status(400).json({ error: err.message || 'PDF upload failed' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No PDF file uploaded' });
        return;
      }

      const filePath = req.file.path;
      const filename = req.file.filename;

      try {
        // 1. Read file buffer to validate genuine PDF header
        const buffer = await fs.promises.readFile(filePath);

        // PDF files strictly begin with the 5 magic bytes '%PDF-'
        if (buffer.length < 5 || buffer.toString('utf8', 0, 5) !== '%PDF-') {
          await fs.promises.unlink(filePath).catch(() => {});
          res.status(400).json({
            error: 'Invalid file content: the uploaded file is not a valid PDF document (missing %PDF- header).'
          });
          return;
        }

        const relativeUrl = `/uploads/pdfs/${filename}`;

        // 2. Persist the file permanently into the SQLite uploaded_files table
        await saveUploadedPdf(filename, relativeUrl, req.file.size, buffer);

        // 3. Return the exact filename and relative URL
        res.status(201).json({
          message: 'PDF document uploaded successfully',
          url: relativeUrl,
          filename: filename,
          size: req.file.size
        });
      } catch (uploadError: any) {
        console.error('Failed to process uploaded PDF:', uploadError);
        await fs.promises.unlink(filePath).catch(() => {});
        res.status(500).json({
          error: uploadError?.message || 'Failed to process and store uploaded PDF'
        });
      }
    });
  }
);
