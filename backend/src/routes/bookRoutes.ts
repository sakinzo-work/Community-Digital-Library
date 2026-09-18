import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { queryAll, queryOne, run } from '../database/db';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth';
import { restoreFileFromDatabase } from '../services/fileStorage';
import { generatePdfSample, clearSampleCache } from '../services/pdfSampleService';
import { isBorrowingOverdue } from './borrowingRoutes';
import { expireStaleReservations } from '../services/reservationService';

export const bookRouter = Router();

// Helper to format book object
function formatBook(row: any, userBookmarked = false, userBorrowed = false) {
  let chapters = [];

  try {
    chapters = row.chapters_json ? JSON.parse(row.chapters_json) : [];
  } catch {
    chapters = [];
  }

  return {
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
    cover: row.cover_path,
    pdfPath: row.pdf_path,
    available: row.is_available === 1,
    isAvailable: row.is_available === 1,
    publisher: row.publisher,
    featured: row.featured === 1,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    ratingCount: row.reviews_count,
    description: row.description,

    // A book has a digital edition only when a real PDF exists.
    hasDigitalVersion: Boolean(row.pdf_path && typeof row.pdf_path === 'string' && row.pdf_path.trim() !== ''),

    waitingCount: Number(row.waiting_count || 0),

    chapters,
    isBookmarked: userBookmarked,
    isBorrowed: userBorrowed,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// GET /api/books - Search, filter, and sort
bookRouter.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { search, category, available, sort, featured } = req.query;
    const userId = req.user?.id;

    const conditions: string[] = [];
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;

      conditions.push(
        '(LOWER(b.title) LIKE ? OR LOWER(b.author) LIKE ? OR LOWER(b.isbn) LIKE ? OR LOWER(b.description) LIKE ?)'
      );

      params.push(term, term, term, term);
    }

    if (
      category &&
      typeof category === 'string' &&
      category.trim() &&
      category.toLowerCase() !== 'all'
    ) {
      conditions.push(
        '(LOWER(c.name) = ? OR LOWER(b.category_id) = ?)'
      );

      params.push(
        category.trim().toLowerCase(),
        category.trim().toLowerCase()
      );
    }

    if (available !== undefined && available !== '') {
      if (available === 'digital') {
        conditions.push("b.pdf_path IS NOT NULL AND TRIM(b.pdf_path) != ''");
      } else {
        const isAvail =
          available === 'true' || available === '1' ? 1 : 0;

        conditions.push('b.is_available = ?');
        params.push(isAvail);
      }
    }

    if (featured !== undefined && featured !== '') {
      const isFeat =
        featured === 'true' || featured === '1' ? 1 : 0;

      conditions.push('b.featured = ?');
      params.push(isFeat);
    }

    let orderBy = 'b.title ASC';

    if (sort === 'title_desc') {
      orderBy = 'b.title DESC';
    } else if (sort === 'year_desc') {
      orderBy = 'b.publication_year DESC';
    } else if (sort === 'year_asc') {
      orderBy = 'b.publication_year ASC';
    } else if (sort === 'rating_desc') {
      orderBy = 'b.rating DESC';
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const sql = `
      SELECT b.*, c.name as category_name,
             (
               SELECT COUNT(*)
               FROM bookmarks bm
               WHERE bm.book_id = b.id
                 AND bm.user_id = ?
             ) as user_bookmarked,
             (
               SELECT COUNT(*)
               FROM borrowings br
               WHERE br.book_id = b.id
                 AND br.user_id = ?
                 AND br.status IN ('active', 'overdue')
             ) as user_borrowed,
             (
               SELECT COUNT(*)
               FROM reservations r
               WHERE r.book_id = b.id
                 AND r.status = 'waiting'
             ) as waiting_count
      FROM books b
      LEFT JOIN categories c ON c.id = b.category_id
      ${whereClause}
      ORDER BY ${orderBy}
    `;

    const queryParams = [
      userId || null,
      userId || null,
      ...params
    ];

    const rows = await queryAll<any>(sql, queryParams);

    const books = rows.map((row) =>
      formatBook(
        row,
        row.user_bookmarked > 0,
        row.user_borrowed > 0
      )
    );

    res.json({
      books,
      count: books.length
    });
  } catch (error: any) {
    console.error('Fetch books error:', error);

    res.status(500).json({
      error: error.message || 'Failed to fetch books'
    });
  }
});

// GET /api/books/:id - Get single book details
bookRouter.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Process stale reservations for this book so readiness and availability are authoritative
    await expireStaleReservations(id);

    const sql = `
      SELECT b.*, c.name as category_name,
             (
               SELECT COUNT(*)
               FROM bookmarks bm
               WHERE bm.book_id = b.id
                 AND bm.user_id = ?
             ) as user_bookmarked,
             (
               SELECT COUNT(*)
               FROM borrowings br
               WHERE br.book_id = b.id
                 AND br.user_id = ?
                 AND br.status IN ('active', 'overdue')
             ) as user_borrowed,
             (
               SELECT COUNT(*)
               FROM reservations r
               WHERE r.book_id = b.id
                 AND r.status = 'waiting'
             ) as waiting_count
      FROM books b
      LEFT JOIN categories c ON c.id = b.category_id
      WHERE b.id = ?
    `;

    const row = await queryOne<any>(
      sql,
      [
        userId || null,
        userId || null,
        id
      ]
    );

    if (!row) {
      res.status(404).json({
        error: 'Book not found'
      });
      return;
    }

    const reviews = await queryAll<any>(
      `
        SELECT
          r.id,
          r.rating,
          r.comment,
          r.created_at,
          u.full_name as user_name,
          u.id as user_id
        FROM reviews r
        JOIN users u ON u.id = r.user_id
        WHERE r.book_id = ?
        ORDER BY r.created_at DESC
      `,
      [id]
    );

    let userLoan: any = null;
    let userReservation: any = null;

    if (userId) {
      const loanRow = await queryOne<any>(
        `SELECT id, borrowed_at, due_date, returned_at, status
         FROM borrowings
         WHERE book_id = ? AND user_id = ? AND status IN ('active', 'overdue')
         ORDER BY borrowed_at DESC LIMIT 1`,
        [id, userId]
      );
      if (loanRow) {
        const isOverdue = isBorrowingOverdue(loanRow.due_date, loanRow.returned_at, loanRow.status);
        userLoan = {
          id: loanRow.id,
          bookId: id,
          borrowedAt: loanRow.borrowed_at,
          dueDate: loanRow.due_date,
          status: isOverdue ? 'overdue' : loanRow.status,
          isReturned: false
        };
      }

      const resRow = await queryOne<any>(
        `SELECT
           r.id,
           r.reserved_at,
           r.status,
           r.ready_at,
           r.expires_at,
           (
             CASE
               WHEN r.status = 'ready' THEN 1
               WHEN r.status = 'waiting' THEN (
                 (SELECT COUNT(*) FROM reservations r_ready WHERE r_ready.book_id = r.book_id AND r_ready.status = 'ready') +
                 (SELECT COUNT(*) FROM reservations r_wait WHERE r_wait.book_id = r.book_id AND r_wait.status = 'waiting' AND (r_wait.reserved_at < r.reserved_at OR (r_wait.reserved_at = r.reserved_at AND r_wait.id < r.id))) +
                 1
               )
               ELSE 0
             END
           ) as queue_position
         FROM reservations r
         WHERE r.book_id = ? AND r.user_id = ? AND r.status IN ('waiting', 'ready')
         LIMIT 1`,
        [id, userId]
      );
      if (resRow) {
        userReservation = {
          id: resRow.id,
          bookId: id,
          reservedAt: resRow.reserved_at,
          status: resRow.status,
          queuePosition: resRow.queue_position,
          readyAt: resRow.ready_at || null,
          expiresAt: resRow.expires_at || null
        };
      }
    }

    const book = {
      ...formatBook(
        row,
        row.user_bookmarked > 0,
        row.user_borrowed > 0
      ),
      userLoan,
      userReservation
    };

    res.json({
      book,
      reviews
    });
  } catch (error: any) {
    console.error('Fetch book error:', error);

    res.status(500).json({
      error: error.message || 'Failed to fetch book'
    });
  }
});

/**
 * GET /api/books/:id/sample.pdf
 * GET /api/books/:id/sample
 *
 * Serves an authentic 5-page sample extracted dynamically from the book's real PDF.
 * Protected by requireAuth (accessible by any logged-in member or admin).
 * Does NOT require an active borrowing record.
 * Never exposes or sends the original full PDF.
 */
async function handleBookSamplePdf(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // 1. Look up book from SQLite
    const book = await queryOne<any>(
      'SELECT id, title, pdf_path FROM books WHERE id = ?',
      [id]
    );

    if (!book) {
      res.status(404).json({
        error: 'Book not found'
      });
      return;
    }

    if (!book.pdf_path || typeof book.pdf_path !== 'string') {
      res.status(404).json({
        error: 'This book does not have a digital PDF edition.'
      });
      return;
    }

    // 2. Resolve original PDF filename and disk path
    const rawPdfPath = book.pdf_path.trim();
    const filename = path.basename(rawPdfPath);

    if (!filename || !filename.toLowerCase().endsWith('.pdf')) {
      res.status(404).json({
        error: 'Invalid digital PDF configuration.'
      });
      return;
    }

    const pdfsDir = path.join(process.cwd(), 'uploads', 'pdfs');
    const physicalPdfPath = path.join(pdfsDir, filename);

    // 3. If missing from disk, restore from SQLite durable storage
    if (!fs.existsSync(physicalPdfPath)) {
      await restoreFileFromDatabase(filename, physicalPdfPath);
    }

    if (!fs.existsSync(physicalPdfPath)) {
      res.status(404).json({
        error: 'The digital edition file is currently unavailable.'
      });
      return;
    }

    // 4. Generate 5-page sample from the authentic real PDF
    const sampleBuffer = await generatePdfSample(physicalPdfPath, filename);

    // 5. Send strictly the 5-page sample with proper headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', sampleBuffer.length);

    res.status(200).send(sampleBuffer);
  } catch (error: any) {
    console.error('Generate book sample error:', error);
    res.status(500).json({
      error: 'Failed to generate preview sample for this book.'
    });
  }
}

bookRouter.get('/:id/sample.pdf', requireAuth, handleBookSamplePdf);
bookRouter.get('/:id/sample', requireAuth, handleBookSamplePdf);

// POST /api/books - Admin only: Add new book
bookRouter.post('/', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      title,
      author,
      categoryId,
      description,
      publicationYear,
      pages,
      language,
      isbn,
      coverPath,
      pdfPath,
      isAvailable,
      publisher,
      featured,
      chapters
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({
        error: 'Title is required'
      });
      return;
    }

    if (!author || typeof author !== 'string' || !author.trim()) {
      res.status(400).json({
        error: 'Author is required'
      });
      return;
    }

    if (!categoryId) {
      res.status(400).json({
        error: 'Category ID is required'
      });
      return;
    }

    // Verify category exists
    const cat = await queryOne(
      'SELECT id FROM categories WHERE id = ?',
      [categoryId]
    );

    if (!cat) {
      res.status(400).json({
        error: 'Invalid category ID. Category does not exist.'
      });
      return;
    }

    const id = `bk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const chaptersJson =
      chapters !== undefined && chapters !== null
        ? JSON.stringify(chapters)
        : null;

    await run(
      `
        INSERT INTO books (
          id,
          title,
          author,
          category_id,
          description,
          publication_year,
          pages,
          language,
          isbn,
          cover_path,
          pdf_path,
          is_available,
          publisher,
          featured,
          chapters_json,
          rating,
          reviews_count
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, 0)
      `,
      [
        id,
        title.trim(),
        author.trim(),
        categoryId,
        description && typeof description === 'string'
          ? description.trim()
          : null,
        publicationYear || new Date().getFullYear(),
        pages || 100,
        language || 'English',
        isbn && typeof isbn === 'string'
          ? isbn.trim()
          : null,

        // No fake external cover.
        coverPath || null,

        // IMPORTANT:
        // No fake default PDF. A digital edition exists
        // only when an actual PDF has been uploaded.
        pdfPath || null,

        isAvailable !== undefined
          ? (isAvailable ? 1 : 0)
          : 1,

        publisher && typeof publisher === 'string' && publisher.trim()
          ? publisher.trim()
          : 'Not specified',

        featured ? 1 : 0,
        chaptersJson
      ]
    );

    const created = await queryOne<any>(
      `
        SELECT
          b.*,
          c.name as category_name
        FROM books b
        LEFT JOIN categories c
          ON c.id = b.category_id
        WHERE b.id = ?
      `,
      [id]
    );

    res.status(201).json({
      message: 'Book added successfully',
      book: formatBook(created)
    });
  } catch (error: any) {
    console.error('Create book error:', error);

    res.status(500).json({
      error: error.message || 'Failed to create book'
    });
  }
});

// PUT /api/books/:id - Admin only: Update book
bookRouter.put('/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const {
      title,
      author,
      categoryId,
      description,
      publicationYear,
      pages,
      language,
      isbn,
      coverPath,
      pdfPath,
      isAvailable,
      publisher,
      featured,
      chapters
    } = req.body;

    const existing = await queryOne(
      'SELECT id FROM books WHERE id = ?',
      [id]
    );

    if (!existing) {
      res.status(404).json({
        error: 'Book not found'
      });
      return;
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (title !== undefined) {
      if (
        typeof title !== 'string' ||
        !title.trim()
      ) {
        res.status(400).json({
          error: 'Title cannot be empty'
        });
        return;
      }

      fields.push('title = ?');
      params.push(title.trim());
    }

    if (author !== undefined) {
      if (
        typeof author !== 'string' ||
        !author.trim()
      ) {
        res.status(400).json({
          error: 'Author cannot be empty'
        });
        return;
      }

      fields.push('author = ?');
      params.push(author.trim());
    }

    if (categoryId !== undefined) {
      const cat = await queryOne(
        'SELECT id FROM categories WHERE id = ?',
        [categoryId]
      );

      if (!cat) {
        res.status(400).json({
          error: 'Invalid category ID'
        });
        return;
      }

      fields.push('category_id = ?');
      params.push(categoryId);
    }

    if (description !== undefined) {
      fields.push('description = ?');
      params.push(
        description === null
          ? null
          : String(description).trim()
      );
    }

    if (publicationYear !== undefined) {
      fields.push('publication_year = ?');
      params.push(publicationYear);
    }

    if (pages !== undefined) {
      fields.push('pages = ?');
      params.push(pages);
    }

    if (language !== undefined) {
      fields.push('language = ?');
      params.push(language);
    }

    if (isbn !== undefined) {
      fields.push('isbn = ?');
      params.push(
        isbn === null
          ? null
          : String(isbn).trim()
      );
    }

    if (coverPath !== undefined) {
      fields.push('cover_path = ?');
      params.push(coverPath || null);
    }

    if (pdfPath !== undefined) {
      fields.push('pdf_path = ?');
      params.push(pdfPath || null);
    }

    if (isAvailable !== undefined) {
      fields.push('is_available = ?');
      params.push(isAvailable ? 1 : 0);
    }

    if (publisher !== undefined) {
      fields.push('publisher = ?');
      params.push(
        publisher === null
          ? null
          : String(publisher).trim()
      );
    }

    if (featured !== undefined) {
      fields.push('featured = ?');
      params.push(featured ? 1 : 0);
    }

    if (chapters !== undefined) {
      fields.push('chapters_json = ?');
      params.push(
        chapters === null
          ? null
          : JSON.stringify(chapters)
      );
    }

    if (fields.length === 0) {
      res.status(400).json({
        error: 'No fields provided to update'
      });
      return;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await run(
      `UPDATE books SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    if (pdfPath !== undefined) {
      clearSampleCache();
    }

    const updated = await queryOne<any>(
      `
        SELECT
          b.*,
          c.name as category_name
        FROM books b
        LEFT JOIN categories c
          ON c.id = b.category_id
        WHERE b.id = ?
      `,
      [id]
    );

    res.json({
      message: 'Book updated successfully',
      book: formatBook(updated)
    });
  } catch (error: any) {
    console.error('Update book error:', error);

    res.status(500).json({
      error: error.message || 'Failed to update book'
    });
  }
});

// DELETE /api/books/:id - Admin only: Delete book
bookRouter.delete('/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if book has active borrowings
    const activeBorrowings = await queryOne<{ count: number }>(
      `
        SELECT COUNT(*) as count
        FROM borrowings
        WHERE book_id = ?
          AND status = 'active'
      `,
      [id]
    );

    if (activeBorrowings && activeBorrowings.count > 0) {
      res.status(400).json({
        error:
          'Cannot delete book with active borrowing loans. Please wait for the book to be returned.'
      });
      return;
    }

    const result = await run(
      'DELETE FROM books WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      res.status(404).json({
        error: 'Book not found'
      });
      return;
    }

    clearSampleCache();

    res.json({
      message: 'Book deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete book error:', error);

    res.status(500).json({
      error: error.message || 'Failed to delete book'
    });
  }
});