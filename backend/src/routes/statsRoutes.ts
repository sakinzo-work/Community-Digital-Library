import { Router, Request, Response } from 'express';
import { queryOne } from '../database/db';
import { requireAuth, requireAdmin } from '../middleware/auth';

export const statsRouter = Router();

/**
 * GET /api/stats/admin - Admin-only aggregated library & circulation statistics
 * Protected with requireAuth and requireAdmin
 */
statsRouter.get('/admin', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const totalBooksRow = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM books');
    const totalCategoriesRow = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM categories'
    );
    const availableBooksRow = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM books WHERE pdf_path IS NOT NULL AND TRIM(pdf_path) != ''`
    );
    const activeMembersRow = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM users WHERE role = 'user'`
    );
    const totalBorrowingsRow = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM borrowings'
    );
    const activeBorrowingsRow = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM borrowings WHERE status = 'active'`
    );
    const overdueBorrowingsRow = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM borrowings WHERE status = 'active' AND date(due_date) < date('now')`
    );
    const totalReviewsRow = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM reviews'
    );

    res.json({
      stats: {
        totalBooks: totalBooksRow?.count || 0,
        totalCategories: totalCategoriesRow?.count || 0,
        availableToRead: availableBooksRow?.count || 0,
        activeMembers: activeMembersRow?.count || 0,
        totalReviews: totalReviewsRow?.count || 0,
        totalBorrowings: totalBorrowingsRow?.count || 0,
        activeBorrowings: activeBorrowingsRow?.count || 0,
        overdueBorrowings: overdueBorrowingsRow?.count || 0
      }
    });
  } catch (error: any) {
    console.error('Fetch admin stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve admin statistics' });
  }
});

/**
 * GET /api/stats - Public aggregated library statistics for HomePage
 * Returns ONLY non-sensitive, aggregated catalog totals.
 * Never exposes borrower names, recent borrowings, or circulation records.
 */
statsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const totalBooksRow = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM books');
    const totalCategoriesRow = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM categories'
    );
    const digitalBooksRow = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM books WHERE pdf_path IS NOT NULL AND TRIM(pdf_path) != ''`
    );
    const activeMembersRow = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM users WHERE role = 'user'`
    );
    const totalReviewsRow = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM reviews'
    );

    res.json({
      stats: {
        totalBooks: totalBooksRow?.count || 0,
        totalCategories: totalCategoriesRow?.count || 0,
        availableToRead: digitalBooksRow?.count || 0,
        activeMembers: activeMembersRow?.count || 0,
        totalReviews: totalReviewsRow?.count || 0
      }
    });
  } catch (error: any) {
    console.error('Fetch public stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve library statistics' });
  }
});

