import { Router, Request, Response } from 'express';
import { queryAll, queryOne, run } from '../database/db';
import { requireAuth } from '../middleware/auth';

export const reviewRouter = Router();

// Helper to recalculate book rating & reviews count
async function recalculateBookRating(bookId: string): Promise<void> {
  const stats = await queryOne<{ avg_rating: number | null; total: number }>(
    `SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE book_id = ?`,
    [bookId]
  );

  const avg = stats && stats.avg_rating ? Math.round(stats.avg_rating * 10) / 10 : 0.0;
  const count = stats ? stats.total : 0;

  await run(`UPDATE books SET rating = ?, reviews_count = ? WHERE id = ?`, [avg, count, bookId]);
}

// GET /api/books/:bookId/reviews
reviewRouter.get('/books/:bookId/reviews', async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;

    const reviews = await queryAll<any>(
      `SELECT r.id, r.user_id, r.book_id, r.rating, r.comment, r.created_at, r.updated_at,
              u.full_name as user_name, u.role as user_role
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.book_id = ?
       ORDER BY r.created_at DESC`,
      [bookId]
    );

    res.json({ reviews, count: reviews.length });
  } catch (error: any) {
    console.error('Fetch reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Handler to add or update user's review for a book
async function handleCreateReview(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const bookId = req.params.bookId || req.body.bookId;
    const { rating, comment } = req.body;

    if (!bookId) {
      res.status(400).json({ error: 'Book ID is required' });
      return;
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
      return;
    }

    // Verify book exists
    const book = await queryOne('SELECT id FROM books WHERE id = ?', [bookId]);
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    await run(
      `INSERT INTO reviews (id, user_id, book_id, rating, comment, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, book_id) DO UPDATE SET
         rating = excluded.rating,
         comment = excluded.comment,
         updated_at = excluded.updated_at`,
      [reviewId, userId, bookId, parsedRating, comment ? comment.trim() : null, now, now]
    );

    // Recalculate book rating
    await recalculateBookRating(bookId);

    const updatedReview = await queryOne<any>(
      `SELECT r.*, u.full_name as user_name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.user_id = ? AND r.book_id = ?`,
      [userId, bookId]
    );

    res.status(201).json({
      message: 'Review submitted successfully',
      review: updatedReview
    });
  } catch (error: any) {
    console.error('Create review error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit review' });
  }
}

// POST /api/books/:bookId/reviews
reviewRouter.post('/books/:bookId/reviews', requireAuth, handleCreateReview);

// POST /api/reviews
reviewRouter.post('/reviews', requireAuth, handleCreateReview);

// PUT /api/reviews/:id - Update review (own review or admin)
reviewRouter.put('/reviews/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await queryOne<any>('SELECT * FROM reviews WHERE id = ?', [id]);
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    if (review.user_id !== userId && !isAdmin) {
      res.status(403).json({ error: 'You are only authorized to edit your own review' });
      return;
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (rating !== undefined) {
      const parsedRating = parseInt(rating, 10);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        res.status(400).json({ error: 'Rating must be between 1 and 5' });
        return;
      }
      fields.push('rating = ?');
      params.push(parsedRating);
    }

    if (comment !== undefined) {
      fields.push('comment = ?');
      params.push(comment ? comment.trim() : null);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await run(`UPDATE reviews SET ${fields.join(', ')} WHERE id = ?`, params);
    await recalculateBookRating(review.book_id);

    res.json({ message: 'Review updated successfully' });
  } catch (error: any) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// DELETE /api/reviews/:id - Delete review (own review or admin)
reviewRouter.delete('/reviews/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';
    const { id } = req.params;

    const review = await queryOne<any>('SELECT * FROM reviews WHERE id = ?', [id]);
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    if (review.user_id !== userId && !isAdmin) {
      res.status(403).json({ error: 'You are only authorized to delete your own review' });
      return;
    }

    await run('DELETE FROM reviews WHERE id = ?', [id]);
    await recalculateBookRating(review.book_id);

    res.json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});
