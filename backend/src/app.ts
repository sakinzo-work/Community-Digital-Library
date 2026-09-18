import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

import { authRouter } from './routes/authRoutes';
import { userRouter } from './routes/userRoutes';
import { bookRouter } from './routes/bookRoutes';
import { categoryRouter } from './routes/categoryRoutes';
import { bookmarkRouter } from './routes/bookmarkRoutes';
import { borrowingRouter } from './routes/borrowingRoutes';
import { reservationRouter } from './routes/reservationRoutes';
import { progressRouter } from './routes/progressRoutes';
import { reviewRouter } from './routes/reviewRoutes';
import { statsRouter } from './routes/statsRoutes';
import { uploadRouter } from './routes/uploadRoutes';
import { notificationRouter } from './routes/notificationRoutes';
import { backupRouter } from './routes/backupRoutes';

import { queryOne } from './database/db';
import { requireAuth } from './middleware/auth';
import { restoreFileFromDatabase } from './services/fileStorage';

export function createExpressApp(): express.Application {
  const app = express();

  // Parse JSON and form bodies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  const uploadsPath = path.join(process.cwd(), 'uploads');

  /*
   * IMPORTANT SECURITY RULE:
   *
   * Do NOT expose the entire uploads directory publicly.
   *
   * Covers can be served publicly, but PDF files must be checked
   * against the logged-in user's borrowing record first.
   */

  // Publicly serve book covers only
  const coversPath = path.join(uploadsPath, 'covers');
  app.use('/uploads/covers', express.static(coversPath));

  /*
   * Protected PDF endpoint
   *
   * A PDF can only be opened when:
   * 1. The user is authenticated.
   * 2. The requested PDF exists in the SQLite database.
   * 3. The user has an active borrowing for that book,
   *    OR the user is an administrator.
   */
  app.get(
    '/uploads/pdfs/:filename',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { filename } = req.params;

        // Prevent path traversal attacks.
        // Only allow a simple PDF filename.
        if (
          !filename ||
          filename !== path.basename(filename) ||
          !filename.toLowerCase().endsWith('.pdf')
        ) {
          res.status(400).json({
            error: 'Invalid PDF filename.'
          });
          return;
        }

        const requestedPdfPath = `/uploads/pdfs/${filename}`;
        const requestedBookId =
          typeof req.query.bookId === 'string' && req.query.bookId.trim()
            ? req.query.bookId.trim()
            : null;

        // Verify that this PDF exists in the library collection
        let book = null;
        if (requestedBookId) {
          book = await queryOne<any>(
            `SELECT id, title, pdf_path FROM books WHERE id = ? AND pdf_path = ?`,
            [requestedBookId, requestedPdfPath]
          );
        }

        if (!book) {
          book = await queryOne<any>(
            `SELECT id, title, pdf_path FROM books WHERE pdf_path = ?`,
            [requestedPdfPath]
          );
        }

        if (!book && requestedBookId) {
          book = await queryOne<any>(
            `SELECT id, title, pdf_path FROM books WHERE id = ?`,
            [requestedBookId]
          );
        }

        if (!book) {
          res.status(404).json({
            error: 'Digital edition not found.'
          });
          return;
        }

        /*
         * Administrators can access digital editions.
         */
        if (req.user?.role !== 'admin') {
          /*
           * Normal members must have an active borrowing
           * for the requested book or any book associated with this digital edition.
           */
          let borrowing = null;

          if (requestedBookId) {
            borrowing = await queryOne<any>(
              `
                SELECT id
                FROM borrowings
                WHERE user_id = ?
                  AND book_id = ?
                  AND status = 'active'
                LIMIT 1
              `,
              [req.user?.id, requestedBookId]
            );
          }

          if (!borrowing) {
            borrowing = await queryOne<any>(
              `
                SELECT br.id
                FROM borrowings br
                JOIN books b ON b.id = br.book_id
                WHERE br.user_id = ?
                  AND br.status = 'active'
                  AND (b.id = ? OR b.pdf_path = ?)
                LIMIT 1
              `,
              [req.user?.id, book.id, requestedPdfPath]
            );
          }

          if (!borrowing) {
            res.status(403).json({
              error:
                'You do not currently have access to this digital edition. Borrow the book first.'
            });
            return;
          }
        }

        // Resolve the exact physical file referenced by books.pdf_path
        const pdfsDir = path.join(process.cwd(), 'uploads', 'pdfs');
        const physicalPdfPath = path.join(pdfsDir, filename);

        // If the exact physical file is not on disk, restore it from SQLite durable storage
        if (!fs.existsSync(physicalPdfPath)) {
          await restoreFileFromDatabase(filename, physicalPdfPath);
        }

        // If the exact physical file is still not available, return HTTP 404 (strictly no guessing or substitution)
        if (!fs.existsSync(physicalPdfPath)) {
          res.status(404).json({
            error: 'The digital edition file is currently unavailable.'
          });
          return;
        }

        // Send the exact physical PDF with standard streaming and inline headers
        res.sendFile(physicalPdfPath, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline',
            'X-Content-Type-Options': 'nosniff',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'private, no-store'
          }
        });
      } catch (error: any) {
        console.error('Protected PDF access error:', error);

        res.status(500).json({
          error:
            error.message ||
            'Failed to access the digital edition.'
        });
      }
    }
  );

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'SQLite3',
      service: 'Community Digital Library API'
    });
  });

  // Standardize API response content type and prevent leakage to SPA fallback
  app.use('/api', (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/books', bookRouter);
  app.use('/api/categories', categoryRouter);
  app.use('/api/bookmarks', bookmarkRouter);
  app.use('/api/borrowings', borrowingRouter);
  app.use('/api/reservations', reservationRouter);
  app.use('/api/progress', progressRouter);
  app.use('/api', reviewRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/admin/backup', backupRouter);

  // Catch-all for undefined /api routes (strictly prevents HTML fallback to Vite)
  app.all('/api', (req: Request, res: Response) => {
    res.status(404).json({
      error: `API endpoint ${req.method} ${req.originalUrl} not found`
    });
  });
  app.use('/api', (req: Request, res: Response) => {
    res.status(404).json({
      error: `API endpoint ${req.method} ${req.originalUrl} not found`
    });
  });

  // Global error handler
  app.use(
    (
      err: any,
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      console.error('Unhandled server error:', err);

      res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
      });
    }
  );

  return app;
}