import { Router, Request, Response } from 'express';
import { queryAll, queryOne, run } from '../database/db';
import { requireAuth } from '../middleware/auth';

export const bookmarkRouter = Router();

// GET /api/bookmarks - Get all saved books for current user
bookmarkRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const rows = await queryAll<any>(
      `SELECT b.*, c.name as category_name, bm.created_at as bookmarked_at
       FROM bookmarks bm
       JOIN books b ON b.id = bm.book_id
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE bm.user_id = ?
       ORDER BY bm.created_at DESC`,
      [userId]
    );

    const bookmarks = rows.map((row) => ({
      id: row.id,
      title: row.title,
      author: row.author,
      category: row.category_name || row.category_id,
      categoryId: row.category_id,
      year: row.publication_year,
      pages: row.pages,
      language: row.language,
      isbn: row.isbn,
      coverUrl: row.cover_path,
      available: row.is_available === 1,
      rating: row.rating,
      bookmarkedAt: row.bookmarked_at
    }));

    res.json({ bookmarks, count: bookmarks.length });
  } catch (error: any) {
    console.error('Fetch bookmarks error:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// Handler to add a bookmark
async function handleAddBookmark(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const bookId = req.params.bookId || req.body.bookId;

    if (!bookId) {
      res.status(400).json({ error: 'Book ID is required' });
      return;
    }

    // Verify book exists
    const book = await queryOne('SELECT id FROM books WHERE id = ?', [bookId]);
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    const bookmarkId = `bmk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await run(
      'INSERT OR IGNORE INTO bookmarks (id, user_id, book_id) VALUES (?, ?, ?)',
      [bookmarkId, userId, bookId]
    );

    res.status(201).json({ message: 'Book saved to reading list', bookId, bookmarked: true });
  } catch (error: any) {
    console.error('Add bookmark error:', error);
    res.status(500).json({ error: error.message || 'Failed to bookmark book' });
  }
}

// POST /api/bookmarks
bookmarkRouter.post('/', requireAuth, handleAddBookmark);

// POST /api/bookmarks/:bookId
bookmarkRouter.post('/:bookId', requireAuth, handleAddBookmark);

// DELETE /api/bookmarks/:bookId - Remove book from reading list
bookmarkRouter.delete('/:bookId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { bookId } = req.params;

    await run('DELETE FROM bookmarks WHERE user_id = ? AND book_id = ?', [userId, bookId]);
    res.json({ message: 'Book removed from reading list', bookId, bookmarked: false });
  } catch (error: any) {
    console.error('Delete bookmark error:', error);
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});
