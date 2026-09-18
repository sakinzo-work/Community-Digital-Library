import { Router, Request, Response } from 'express';
import { queryOne, run } from '../database/db';
import { requireAuth } from '../middleware/auth';

export const progressRouter = Router();

// GET /api/progress/:bookId - Get reading progress for a book
progressRouter.get('/:bookId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { bookId } = req.params;

    const progress = await queryOne<any>(
      `SELECT current_page, total_pages, progress_percentage, last_read_at
       FROM reading_progress
       WHERE user_id = ? AND book_id = ?`,
      [userId, bookId]
    );

    if (!progress) {
      res.json({
        progress: {
          currentPage: 1,
          totalPages: 1,
          progressPercentage: 0,
          lastReadAt: null
        }
      });
      return;
    }

    res.json({
      progress: {
        currentPage: progress.current_page,
        totalPages: progress.total_pages,
        progressPercentage: progress.progress_percentage,
        lastReadAt: progress.last_read_at
      }
    });
  } catch (error: any) {
    console.error('Fetch progress error:', error);
    res.status(500).json({ error: 'Failed to retrieve reading progress' });
  }
});

// Handler to upsert reading progress for a book
async function handleUpdateProgress(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const bookId = req.params.bookId || req.body.bookId;
    const { currentPage, totalPages } = req.body;

    if (!bookId) {
      res.status(400).json({ error: 'bookId is required' });
      return;
    }

    const page = Math.max(1, parseInt(currentPage, 10) || 1);
    const total = Math.max(1, parseInt(totalPages, 10) || 1);
    const percentage = Math.min(100, Math.round((page / total) * 1000) / 10);

    const id = `prog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    await run(
      `INSERT INTO reading_progress (id, user_id, book_id, current_page, total_pages, progress_percentage, last_read_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, book_id) DO UPDATE SET
         current_page = excluded.current_page,
         total_pages = excluded.total_pages,
         progress_percentage = excluded.progress_percentage,
         last_read_at = excluded.last_read_at`,
      [id, userId, bookId, page, total, percentage, now]
    );

    res.json({
      message: 'Reading progress updated',
      progress: {
        bookId,
        currentPage: page,
        totalPages: total,
        progressPercentage: percentage,
        lastReadAt: now
      }
    });
  } catch (error: any) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: error.message || 'Failed to update reading progress' });
  }
}

// PUT /api/progress/:bookId
progressRouter.put('/:bookId', requireAuth, handleUpdateProgress);

// POST /api/progress/:bookId
progressRouter.post('/:bookId', requireAuth, handleUpdateProgress);

// POST /api/progress
progressRouter.post('/', requireAuth, handleUpdateProgress);
