import { Router, Request, Response } from 'express';
import { queryAll, queryOne, run, withTransaction } from '../database/db';
import { requireAuth } from '../middleware/auth';
import {
  expireStaleReservations,
  createNotification
} from '../services/reservationService';

export const borrowingRouter = Router();

/**
 * Helper to determine if a loan has passed its due date and is overdue.
 */
export function isBorrowingOverdue(
  dueDateStr: string | null | undefined,
  returnedAt?: string | null,
  status?: string
): boolean {
  if (status === 'returned' || returnedAt) return false;
  if (!dueDateStr) return false;

  const now = new Date();
  let due = new Date(dueDateStr);

  if (Number.isNaN(due.getTime())) return false;

  // If YYYY-MM-DD format (10 chars), loan is valid through 23:59:59.999Z of that day
  if (dueDateStr.length === 10) {
    due = new Date(dueDateStr + 'T23:59:59.999Z');
  }

  return now.getTime() > due.getTime();
}

/*
 * GET /api/borrowings
 *
 * Regular users:
 *   - Can see only their own borrowing records.
 *
 * Admin users:
 *   - Can see all borrowing records when ?all=true is supplied.
 */
borrowingRouter.get(
  '/',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'admin';
      const viewAll = isAdmin && req.query.all === 'true';

      let sql = `
        SELECT
          br.id,
          br.user_id,
          br.book_id,
          br.borrowed_at,
          br.due_date,
          br.returned_at,
          br.status,

          b.title AS book_title,
          b.author AS book_author,
          b.cover_path AS book_cover,
          b.isbn AS book_isbn,

          u.full_name AS user_name,
          u.email AS user_email,
          u.library_card_number

        FROM borrowings br

        JOIN books b
          ON b.id = br.book_id

        JOIN users u
          ON u.id = br.user_id
      `;

      const params: any[] = [];

      if (!viewAll) {
        sql += ` WHERE br.user_id = ?`;
        params.push(userId);
      }

      sql += ` ORDER BY br.borrowed_at DESC`;

      const rows = await queryAll<any>(sql, params);

      const borrowings = rows.map((row) => {
        const isOverdue = isBorrowingOverdue(
          row.due_date,
          row.returned_at,
          row.status
        );

        return {
          id: row.id,

          userId: row.user_id,
          userName: row.user_name,
          userEmail: row.user_email,
          libraryCardNumber: row.library_card_number,

          bookId: row.book_id,
          bookTitle: row.book_title,
          bookAuthor: row.book_author,
          bookCover: row.book_cover,
          bookIsbn: row.book_isbn,

          borrowedAt: row.borrowed_at,
          dueDate: row.due_date,
          returnedAt: row.returned_at,

          status: isOverdue ? 'overdue' : row.status
        };
      });

      res.json({
        borrowings,
        count: borrowings.length
      });
    } catch (error: any) {
      console.error('Fetch borrowings error:', error);

      res.status(500).json({
        error: error.message || 'Failed to fetch borrowings'
      });
    }
  }
);

/*
 * Handle borrowing a book.
 *
 * This is used by both:
 *
 * POST /api/borrowings
 * {
 *   "bookId": "bk-01"
 * }
 *
 * and:
 *
 * POST /api/borrowings/bk-01
 */
async function handleBorrowBook(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    const rawBookId =
      req.params.bookId ||
      req.body?.bookId ||
      req.body?.book_id ||
      req.body?.id;

    if (!rawBookId || typeof rawBookId !== 'string') {
      res.status(400).json({
        error: 'Book ID is required'
      });
      return;
    }

    const bookId = rawBookId.trim();

    // Process stale reservations for this book before checking eligibility
    await expireStaleReservations();

    const result = await withTransaction(
      async ({ queryOne, queryAll, run }) => {

        /*
         * 1. Find the book by primary ID or ISBN.
         */
        const book = await queryOne<any>(
          `
          SELECT
            id,
            title,
            is_available,
            pdf_path
          FROM books
          WHERE id = ? OR isbn = ?
          `,
          [bookId, bookId]
        );

        if (!book) {
          throw {
            status: 404,
            message: 'Book not found'
          };
        }

        /*
         * A book can only be newly borrowed if it has a valid real digital PDF.
         * A book with NULL, empty, or whitespace-only pdf_path must be treated as a catalogue-only book.
         */
        if (
          !book.pdf_path ||
          typeof book.pdf_path !== 'string' ||
          !book.pdf_path.trim()
        ) {
          throw {
            status: 400,
            message:
              'This book does not have a digital copy available to borrow.'
          };
        }

        const canonicalBookId = book.id;

        /*
         * 2. Prevent the same user from having
         *    two active or overdue loans for the same book.
         */
        const activeLoan = await queryOne<any>(
          `
          SELECT id
          FROM borrowings
          WHERE user_id = ?
            AND book_id = ?
            AND status IN ('active', 'overdue')
          `,
          [userId, canonicalBookId]
        );

        if (activeLoan) {
          throw {
            status: 400,
            message:
              'You already have an active borrowing for this book.'
          };
        }

        /*
         * 3. Check whether there is a ready reservation for this book.
         *
         *    - If a ready reservation exists, only that reserved member can borrow it.
         *    - If no ready reservation exists, general borrowing requires
         *      book.is_available = true.
         */
        const readyReservation = await queryOne<any>(
          `
          SELECT id, user_id
          FROM reservations
          WHERE book_id = ?
            AND status = 'ready'
          ORDER BY reserved_at ASC
          LIMIT 1
          `,
          [canonicalBookId]
        );

        let fulfillingReservationId: string | null = null;

        if (readyReservation) {
          if (readyReservation.user_id !== userId) {
            throw {
              status: 403,
              message:
                'This book is currently held on reserve for another member in the queue.'
            };
          }

          fulfillingReservationId = readyReservation.id;
        } else {
          // PostgreSQL BOOLEAN
          if (book.is_available !== true) {
            throw {
              status: 400,
              message:
                'This book is currently borrowed by another member. You can reserve it to join the queue.'
            };
          }
        }

        /*
         * 4. Generate a unique borrowing ID.
         */
        const borrowingId =
          `brw_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 10)}`;

        /*
         * 5. Calculate borrowing and due dates.
         *
         * Current library rule:
         * 21 days.
         */
        const borrowedAt = new Date();

        const dueDate = new Date(borrowedAt);
        dueDate.setDate(
          dueDate.getDate() + 21
        );

        const borrowedAtValue =
          borrowedAt.toISOString();

        const dueDateValue =
          dueDate.toISOString().split('T')[0];

        /*
         * 6. Create borrowing record.
         */
        await run(
          `
          INSERT INTO borrowings (
            id,
            user_id,
            book_id,
            borrowed_at,
            due_date,
            status
          )
          VALUES (?, ?, ?, ?, ?, 'active')
          `,
          [
            borrowingId,
            userId,
            canonicalBookId,
            borrowedAtValue,
            dueDateValue
          ]
        );

        /*
         * 7. Fulfill reservation if applicable.
         */
        if (fulfillingReservationId) {
          await run(
            `
            UPDATE reservations
            SET
              status = 'fulfilled',
              queue_position = 0
            WHERE id = ?
            `,
            [fulfillingReservationId]
          );

          // Re-index remaining waiting reservations so the first in line is #1
          const waitingList = await queryAll<any>(
            `
            SELECT id
            FROM reservations
            WHERE book_id = ?
              AND status = 'waiting'
            ORDER BY queue_position ASC, reserved_at ASC
            `,
            [canonicalBookId]
          );

          for (let i = 0; i < waitingList.length; i++) {
            await run(
              `
              UPDATE reservations
              SET queue_position = ?
              WHERE id = ?
              `,
              [i + 1, waitingList[i].id]
            );
          }
        } else {
          await run(
            `
            UPDATE reservations
            SET
              status = 'fulfilled',
              queue_position = 0
            WHERE user_id = ?
              AND book_id = ?
              AND status IN ('waiting', 'ready')
            `,
            [userId, canonicalBookId]
          );

          // Re-index any remaining waiting reservations
          const waitingList = await queryAll<any>(
            `
            SELECT id
            FROM reservations
            WHERE book_id = ?
              AND status = 'waiting'
            ORDER BY queue_position ASC, reserved_at ASC
            `,
            [canonicalBookId]
          );

          for (let i = 0; i < waitingList.length; i++) {
            await run(
              `
              UPDATE reservations
              SET queue_position = ?
              WHERE id = ?
              `,
              [i + 1, waitingList[i].id]
            );
          }
        }

        /*
         * 8. Mark the book as unavailable.
         *
         * PostgreSQL BOOLEAN = false
         */
        await run(
          `
          UPDATE books
          SET
            is_available = false,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          `,
          [canonicalBookId]
        );

        /*
         * 9. Return the new borrowing information.
         */
        return {
          id: borrowingId,
          userId,
          bookId: canonicalBookId,
          bookTitle: book.title,
          borrowedAt: borrowedAtValue,
          dueDate: dueDateValue,
          status: 'active'
        };
      }
    );

    res.status(201).json({
      message:
        `Successfully borrowed "${result.bookTitle}". Due date is ${result.dueDate}.`,
      borrowing: result
    });

  } catch (error: any) {
    const status =
      Number.isInteger(error?.status)
        ? error.status
        : 500;

    if (status >= 500) {
      console.error(
        'Borrow book server error:',
        error
      );
    } else {
      console.warn(
        `Borrow book notice (${status}):`,
        error?.message || error
      );
    }

    res.status(status).json({
      error:
        error?.message ||
        'Failed to borrow book'
    });
  }
}

/*
 * POST /api/borrowings
 *
 * Body:
 * {
 *   "bookId": "bk-01"
 * }
 */
borrowingRouter.post(
  '/',
  requireAuth,
  handleBorrowBook
);

/*
 * POST /api/borrowings/:bookId
 *
 * Example:
 * POST /api/borrowings/bk-01
 */
borrowingRouter.post(
  '/:bookId',
  requireAuth,
  handleBorrowBook
);

/*
 * Handle returning a book.
 * Works with both PUT and POST on /:id/return
 */
async function handleReturnBook(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';

    const rawRequestedId =
      req.params.id ||
      req.body?.borrowingId ||
      req.body?.borrowing_id ||
      req.body?.bookId ||
      req.body?.book_id ||
      '';

    const requestedId =
      typeof rawRequestedId === 'string'
        ? rawRequestedId.trim()
        : '';

    if (!requestedId) {
      res.status(400).json({
        error:
          'Borrowing ID or Book ID is required'
      });
      return;
    }

    const result = await withTransaction(
      async ({ queryOne, queryAll, run }) => {

        /*
         * 1. Try finding by borrowing ID directly.
         */
        let borrowing = await queryOne<any>(
          `
          SELECT
            id,
            user_id,
            book_id,
            status
          FROM borrowings
          WHERE id = ?
          `,
          [requestedId]
        );

        /*
         * 2. If not found by borrowing ID, try finding active/overdue loan
         *    by book ID or ISBN for current user.
         */
        if (!borrowing) {
          borrowing = await queryOne<any>(
            `
            SELECT
              id,
              user_id,
              book_id,
              status
            FROM borrowings
            WHERE (
              book_id = ?
              OR book_id IN (
                SELECT id
                FROM books
                WHERE isbn = ?
              )
            )
              AND user_id = ?
              AND status IN ('active', 'overdue')
            ORDER BY borrowed_at DESC
            LIMIT 1
            `,
            [
              requestedId,
              requestedId,
              userId
            ]
          );
        }

        /*
         * 3. If still not found and caller is admin,
         *    try finding active/overdue loan across all users.
         */
        if (!borrowing && isAdmin) {
          borrowing = await queryOne<any>(
            `
            SELECT
              id,
              user_id,
              book_id,
              status
            FROM borrowings
            WHERE (
              book_id = ?
              OR book_id IN (
                SELECT id
                FROM books
                WHERE isbn = ?
              )
            )
              AND status IN ('active', 'overdue')
            ORDER BY borrowed_at DESC
            LIMIT 1
            `,
            [
              requestedId,
              requestedId
            ]
          );
        }

        /*
         * 4. Check if this record or book was already returned.
         *
         * PostgreSQL BOOLEAN parameter is used for the admin flag.
         */
        if (!borrowing) {
          const alreadyReturned = await queryOne<any>(
            `
            SELECT
              id,
              user_id,
              book_id,
              status
            FROM borrowings
            WHERE
              id = ?
              OR (
                (
                  book_id = ?
                  OR book_id IN (
                    SELECT id
                    FROM books
                    WHERE isbn = ?
                  )
                )
                AND (
                  user_id = ?
                  OR ? = true
                )
              )
            ORDER BY borrowed_at DESC
            LIMIT 1
            `,
            [
              requestedId,
              requestedId,
              requestedId,
              userId,
              isAdmin
            ]
          );

          if (
            alreadyReturned &&
            alreadyReturned.status === 'returned'
          ) {
            throw {
              status: 400,
              message:
                'This book has already been marked as returned.'
            };
          }
        }

        /*
         * 5. No borrowing record found.
         */
        if (!borrowing) {
          throw {
            status: 404,
            message:
              'Borrowing record not found.'
          };
        }

        /*
         * 6. Only the owner or an admin can return the book.
         */
        if (
          borrowing.user_id !== userId &&
          !isAdmin
        ) {
          throw {
            status: 403,
            message:
              'Unauthorized to return this borrowing record.'
          };
        }

        /*
         * 7. Prevent returning the same loan twice.
         */
        if (borrowing.status === 'returned') {
          throw {
            status: 400,
            message:
              'This book has already been marked as returned.'
          };
        }

        /*
         * 8. Only active/overdue loans can be returned.
         */
        if (
          borrowing.status !== 'active' &&
          borrowing.status !== 'overdue'
        ) {
          throw {
            status: 400,
            message:
              'This borrowing record cannot be returned.'
          };
        }

        const returnTime =
          new Date().toISOString();

        /*
         * 9. Update borrowing record.
         */
        const updateBorrowing = await run(
          `
          UPDATE borrowings
          SET
            status = 'returned',
            returned_at = ?
          WHERE id = ?
            AND status IN ('active', 'overdue')
          `,
          [
            returnTime,
            borrowing.id
          ]
        );

        if (updateBorrowing.changes !== 1) {
          throw {
            status: 409,
            message:
              'The borrowing record could not be updated. It may already have been returned.'
          };
        }

        /*
         * 10. Check for earliest active waiting reservation for this book.
         */
        const nextWaiting = await queryOne<any>(
          `
          SELECT
            id,
            user_id
          FROM reservations
          WHERE book_id = ?
            AND status = 'waiting'
          ORDER BY queue_position ASC, reserved_at ASC
          LIMIT 1
          `,
          [borrowing.book_id]
        );

        let isReservedForNext = false;
        let nextReservationId: string | null = null;

        if (nextWaiting) {
          isReservedForNext = true;
          nextReservationId = nextWaiting.id;

          /*
           * PostgreSQL date arithmetic:
           * ready now + 24 hours.
           */
          await run(
            `
            UPDATE reservations
            SET
              status = 'ready',
              queue_position = 1,
              ready_at = CURRENT_TIMESTAMP,
              expires_at = CURRENT_TIMESTAMP + INTERVAL '24 hours'
            WHERE id = ?
            `,
            [nextWaiting.id]
          );

          const remainingWaiting =
            await queryAll<any>(
              `
              SELECT id
              FROM reservations
              WHERE book_id = ?
                AND status = 'waiting'
                AND id != ?
              ORDER BY queue_position ASC, reserved_at ASC
              `,
              [
                borrowing.book_id,
                nextWaiting.id
              ]
            );

          for (
            let i = 0;
            i < remainingWaiting.length;
            i++
          ) {
            await run(
              `
              UPDATE reservations
              SET queue_position = ?
              WHERE id = ?
              `,
              [
                i + 2,
                remainingWaiting[i].id
              ]
            );
          }

          /*
           * Keep the book unavailable because
           * it is held for the promoted member.
           */
          await run(
            `
            UPDATE books
            SET
              is_available = false,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [borrowing.book_id]
          );

          // Get book title for notification
          const returnedBook =
            await queryOne<any>(
              `SELECT title FROM books WHERE id = ?`,
              [borrowing.book_id]
            );

          const bTitle =
            returnedBook?.title ||
            'Your reserved book';

          // Notify the promoted member
          await createNotification(
            nextWaiting.user_id,
            'Your Reserved Book Is Ready',
            `"${bTitle}" is now available for you to borrow. You have 24 hours to claim it.`,
            'reservation_ready',
            `/book/${borrowing.book_id}`
          );
        } else {
          /*
           * No waiting reservation exists,
           * so the book becomes available again.
           */
          await run(
            `
            UPDATE books
            SET
              is_available = true,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [borrowing.book_id]
          );
        }

        return {
          id: borrowing.id,
          userId: borrowing.user_id,
          bookId: borrowing.book_id,
          returnedAt: returnTime,
          status: 'returned',
          isReservedForNext,
          nextReservationId
        };
      }
    );

    res.json({
      message: result.isReservedForNext
        ? 'Book returned successfully. The book is now reserved and ready for the next member in the queue.'
        : 'Book returned successfully to library collection.',
      borrowing: result
    });

  } catch (error: any) {
    const status =
      Number.isInteger(error?.status)
        ? error.status
        : 500;

    if (status >= 500) {
      console.error(
        'Return book server error:',
        error
      );
    } else {
      console.warn(
        `Return book notice (${status}):`,
        error?.message || error
      );
    }

    res.status(status).json({
      error:
        error?.message ||
        'Failed to return book'
    });
  }
}

/*
 * PUT /api/borrowings/:id/return
 */
borrowingRouter.put(
  '/:id/return',
  requireAuth,
  handleReturnBook
);

/*
 * POST /api/borrowings/:id/return
 */
borrowingRouter.post(
  '/:id/return',
  requireAuth,
  handleReturnBook
);