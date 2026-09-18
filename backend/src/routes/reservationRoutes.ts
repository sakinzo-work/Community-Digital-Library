import { Router, Request, Response } from 'express';
import { queryAll, queryOne, withTransaction } from '../database/db';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { expireStaleReservations, createNotification } from '../services/reservationService';

export const reservationRouter = Router();

/**
 * Helper to fetch formatted reservations
 */
async function fetchReservations(userId: string, viewAll: boolean) {
  let sql = `
    SELECT
      r.id,
      r.user_id,
      r.book_id,
      r.reserved_at,
      r.status,
      r.queue_position,
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
          ELSE COALESCE(r.queue_position, 0)
        END
      ) AS calculated_queue_position,
      b.title AS book_title,
      b.author AS book_author,
      b.cover_path AS book_cover,
      b.isbn AS book_isbn,
      b.is_available AS book_is_available,
      u.full_name AS user_name,
      u.email AS user_email,
      u.library_card_number
    FROM reservations r
    JOIN books b ON b.id = r.book_id
    JOIN users u ON u.id = r.user_id
  `;

  const params: any[] = [];

  if (!viewAll) {
    sql += ` WHERE r.user_id = ?`;
    params.push(userId);
  }

  sql += `
    ORDER BY
      CASE
        WHEN r.status = 'ready' THEN 1
        WHEN r.status = 'waiting' THEN 2
        WHEN r.status = 'fulfilled' THEN 3
        ELSE 4
      END,
      r.reserved_at DESC
  `;

  const rows = await queryAll<any>(sql, params);

  return rows.map((row) => ({
    id: row.id,
    reservationId: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    libraryCardNumber: row.library_card_number,
    bookId: row.book_id,
    bookTitle: row.book_title,
    bookAuthor: row.book_author,
    bookCover: row.book_cover,
    bookIsbn: row.book_isbn,
    bookIsAvailable: row.book_is_available === 1,
    reservedAt: row.reserved_at,
    status: row.status,
    queuePosition: row.calculated_queue_position ?? row.queue_position,
    readyAt: row.ready_at || null,
    expiresAt: row.expires_at || null,
    // snake_case compatibility
    user_name: row.user_name,
    user_email: row.user_email,
    book_title: row.book_title,
    book_author: row.book_author,
    library_card_number: row.library_card_number,
    reserved_at: row.reserved_at,
    queue_position: row.calculated_queue_position ?? row.queue_position,
    ready_at: row.ready_at || null,
    expires_at: row.expires_at || null
  }));
}

/**
 * GET /api/reservations/all
 *
 * Dedicated admin endpoint to retrieve all reservations across the community library.
 */
reservationRouter.get('/all', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Lazy expire stale reservations first
    await expireStaleReservations();

    const reservations = await fetchReservations(req.user!.id, true);
    res.json({
      reservations,
      count: reservations.length
    });
  } catch (error: any) {
    console.error('Fetch all reservations error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch reservations'
    });
  }
});

/**
 * GET /api/reservations
 *
 * Regular members:
 *   - See only their own reservations
 *
 * Admins:
 *   - See all reservations (or pass ?mine=true for only their personal holds)
 */
reservationRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    // Lazy expire stale reservations first
    await expireStaleReservations();

    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';
    const viewAll = isAdmin && req.query.mine !== 'true';

    const reservations = await fetchReservations(userId, viewAll);

    res.json({
      reservations,
      count: reservations.length
    });
  } catch (error: any) {
    console.error('Fetch reservations error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch reservations'
    });
  }
});

/**
 * POST /api/reservations/:bookId
 *
 * Place a real hold/reservation for an unavailable book.
 */
reservationRouter.post('/:bookId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { bookId } = req.params;

    if (!bookId || typeof bookId !== 'string') {
      res.status(400).json({ error: 'Book ID is required' });
      return;
    }

    // 1. Verify book exists
    const book = await queryOne<any>(
      `SELECT id, title, is_available, pdf_path FROM books WHERE id = ?`,
      [bookId]
    );

    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    // A book can only be newly reserved if it has a valid real digital PDF.
    // A book with NULL, empty, or whitespace-only pdf_path must be treated as a catalogue-only book.
    if (!book.pdf_path || typeof book.pdf_path !== 'string' || !book.pdf_path.trim()) {
      res.status(400).json({
        error: 'This book does not have a digital copy available to reserve.'
      });
      return;
    }

    // Check if there is an active ready reservation holding this book
    const readyHold = await queryOne<any>(
      `SELECT id, user_id FROM reservations WHERE book_id = ? AND status = 'ready' LIMIT 1`,
      [bookId]
    );

    // 2. If the book is currently available (and not held ready for another member), do not create reservation
    if (book.is_available === 1 && !readyHold) {
      res.status(400).json({
        error: 'This book is currently available. You can borrow it directly without placing a reservation.',
        canBorrow: true
      });
      return;
    }

    // 3. If user already has an active or overdue borrowing for the book, reject with clear response
    const activeLoan = await queryOne<any>(
      `SELECT id FROM borrowings WHERE user_id = ? AND book_id = ? AND status IN ('active', 'overdue')`,
      [userId, bookId]
    );

    if (activeLoan) {
      res.status(400).json({
        error: 'You already have this book borrowed.'
      });
      return;
    }

    // 4. If user already has a waiting or ready reservation, return existing reservation and queue position
    const existingReservation = await queryOne<any>(
      `SELECT id, user_id, book_id, reserved_at, status, queue_position
       FROM reservations
       WHERE user_id = ? AND book_id = ? AND status IN ('waiting', 'ready')`,
      [userId, bookId]
    );

    if (existingReservation) {
      res.status(200).json({
        message: `You already have an active reservation for this book (Status: ${existingReservation.status}, Position: #${existingReservation.queue_position}).`,
        reservation: {
          id: existingReservation.id,
          userId: existingReservation.user_id,
          bookId: existingReservation.book_id,
          bookTitle: book.title,
          reservedAt: existingReservation.reserved_at,
          status: existingReservation.status,
          queuePosition: existingReservation.queue_position
        }
      });
      return;
    }

    // 5. Create reservation inside transaction
    const result = await withTransaction(async ({ queryOne, run }) => {
      // Calculate queue position from existing waiting/ready reservations
      const countRow = await queryOne<any>(
        `SELECT COUNT(*) as cnt FROM reservations WHERE book_id = ? AND status IN ('waiting', 'ready')`,
        [bookId]
      );

      const queuePosition = (countRow?.cnt || 0) + 1;
      const reservationId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const reservedAt = new Date().toISOString();

      await run(
        `INSERT INTO reservations (
          id,
          user_id,
          book_id,
          reserved_at,
          status,
          queue_position
        ) VALUES (?, ?, ?, ?, 'waiting', ?)`,
        [reservationId, userId, bookId, reservedAt, queuePosition]
      );

      return {
        id: reservationId,
        userId,
        bookId,
        bookTitle: book.title,
        reservedAt,
        status: 'waiting' as const,
        queuePosition
      };
    });

    res.status(201).json({
      message: `Reservation placed successfully. You are #${result.queuePosition} in the queue.`,
      reservation: result
    });
  } catch (error: any) {
    console.error('Create reservation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to place reservation'
    });
  }
});

/**
 * DELETE /api/reservations/:id
 *
 * Member can cancel only their own waiting/ready reservation.
 * Admin can cancel any reservation.
 * After cancellation, recalculate queue positions for remaining waiting reservations for that book.
 */
reservationRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';
    const reservationId = req.params.id;

    // 1. Lazy expire stale holds before processing cancellation
    await expireStaleReservations();

    const reservation = await queryOne<any>(
      `SELECT r.id, r.user_id, r.book_id, r.status, r.queue_position, b.title as book_title
       FROM reservations r
       JOIN books b ON b.id = r.book_id
       WHERE r.id = ?`,
      [reservationId]
    );

    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found.' });
      return;
    }

    const isOwner = reservation.user_id === userId;
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Unauthorized to cancel this reservation.' });
      return;
    }

    if (reservation.status !== 'waiting' && reservation.status !== 'ready') {
      res.status(400).json({
        error: `Cannot cancel a reservation with status "${reservation.status}".`
      });
      return;
    }

    await withTransaction(async ({ queryOne, queryAll, run }) => {
      const bookId = reservation.book_id;
      const bookTitle = reservation.book_title || 'Book';
      const wasReady = reservation.status === 'ready';

      // 1. Mark this reservation cancelled
      await run(
        `UPDATE reservations SET status = 'cancelled', queue_position = 0 WHERE id = ?`,
        [reservation.id]
      );

      // 2. If the cancelled reservation was ready, advance next waiting to ready
      if (wasReady) {
        const nextWaiting = await queryOne<any>(
          `SELECT id, user_id FROM reservations WHERE book_id = ? AND status = 'waiting' ORDER BY queue_position ASC, reserved_at ASC, id ASC LIMIT 1`,
          [bookId]
        );

        if (nextWaiting) {
          await run(
            `UPDATE reservations 
             SET status = 'ready', 
                 queue_position = 1,
                 ready_at = CURRENT_TIMESTAMP,
                 expires_at = datetime('now', '+24 hours')
             WHERE id = ?`,
            [nextWaiting.id]
          );

          // Recalculate remaining waiting reservations
          const remainingWaiting = await queryAll<any>(
            `SELECT id FROM reservations WHERE book_id = ? AND status = 'waiting' AND id != ? ORDER BY queue_position ASC, reserved_at ASC, id ASC`,
            [bookId, nextWaiting.id]
          );

          for (let i = 0; i < remainingWaiting.length; i++) {
            await run(
              `UPDATE reservations SET queue_position = ? WHERE id = ?`,
              [i + 2, remainingWaiting[i].id]
            );
          }

          // Keep book is_available = 0 because it's held for next member
          await run(
            `UPDATE books SET is_available = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [bookId]
          );

          // Notify newly promoted member with 24-hour claim window
          await createNotification(
            nextWaiting.user_id,
            'Your Reserved Book Is Ready',
            `"${bookTitle}" is now available for you to borrow. You have 24 hours to claim it.`,
            'reservation_ready',
            `/book/${bookId}`
          );
        } else {
          // No more waiting reservations. If book is not actively borrowed, make it available
          const activeLoan = await queryOne<any>(
            `SELECT id FROM borrowings WHERE book_id = ? AND status IN ('active', 'overdue')`,
            [bookId]
          );

          if (!activeLoan) {
            await run(
              `UPDATE books SET is_available = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
              [bookId]
            );
          }
        }
      } else {
        // A waiting reservation was cancelled. Recalculate positions for remaining waiting reservations.
        const readyRes = await queryOne<any>(
          `SELECT id FROM reservations WHERE book_id = ? AND status = 'ready'`,
          [bookId]
        );
        const basePosition = readyRes ? 2 : 1;

        const waitingList = await queryAll<any>(
          `SELECT id FROM reservations WHERE book_id = ? AND status = 'waiting' ORDER BY queue_position ASC, reserved_at ASC`,
          [bookId]
        );

        for (let i = 0; i < waitingList.length; i++) {
          await run(
            `UPDATE reservations SET queue_position = ? WHERE id = ?`,
            [basePosition + i, waitingList[i].id]
          );
        }
      }
    });

    res.json({
      success: true,
      message: 'Reservation cancelled successfully.'
    });
  } catch (error: any) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to cancel reservation'
    });
  }
});
