import { queryAll, queryOne, run, withTransaction } from '../database/db';

export interface ExpiryResult {
  expiredCount: number;
  promotedCount: number;
  unblockedBookCount: number;
  details: Array<{
    bookId: string;
    bookTitle: string;
    expiredReservationId: string;
    expiredUserId: string;
    promotedReservationId?: string;
    promotedUserId?: string;
  }>;
}

/**
 * Idempotently create an in-app notification for a user.
 * Avoids creating duplicate notifications for the exact same event.
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'reservation_ready' | 'reservation_expired' | 'info' | 'due_reminder' | 'general' = 'info',
  link?: string
): Promise<string> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

  // Prevent duplicate notifications sent to the same user with the same title & link in a short window
  if (link) {
    const duplicate = await queryOne<any>(
      `SELECT id FROM notifications 
       WHERE user_id = ? AND title = ? AND link = ? 
         AND created_at >= datetime('now', '-10 minutes')
       LIMIT 1`,
      [userId, title, link]
    );
    if (duplicate) {
      return duplicate.id;
    }
  }

  await run(
    `INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
    [id, userId, title, message, type, link || null]
  );

  return id;
}

/**
 * Centralized service to process stale/expired ready reservations.
 *
 * Requirements:
 * 1. Safe to call repeatedly and concurrently.
 * 2. Processes all expired ready reservations (expires_at <= CURRENT_TIMESTAMP).
 * 3. Sets expired reservations to 'cancelled' with queue_position = 0.
 * 4. Creates a 'reservation_expired' notification for the expired patron.
 * 5. Promotes the earliest waiting reservation to 'ready' with queue_position = 1,
 *    ready_at = CURRENT_TIMESTAMP, expires_at = CURRENT_TIMESTAMP + 24 hours.
 * 6. Creates a 'reservation_ready' notification for the newly promoted patron.
 * 7. Re-indexes remaining waiting reservations.
 * 8. If no waiting reservations remain, sets books.is_available = 1.
 * 9. Initializes legacy ready reservations without expires_at with a fresh 24h window.
 */
export async function expireStaleReservations(specificBookId?: string): Promise<ExpiryResult> {
  const result: ExpiryResult = {
    expiredCount: 0,
    promotedCount: 0,
    unblockedBookCount: 0,
    details: []
  };

  try {
    // 0. Initialize legacy ready reservations that have no expires_at set
    const legacyReadyQuery = specificBookId
      ? `SELECT id FROM reservations WHERE book_id = ? AND status = 'ready' AND (expires_at IS NULL OR TRIM(expires_at) = '')`
      : `SELECT id FROM reservations WHERE status = 'ready' AND (expires_at IS NULL OR TRIM(expires_at) = '')`;
    const legacyParams = specificBookId ? [specificBookId] : [];
    const legacyReadyList = await queryAll<{ id: string }>(legacyReadyQuery, legacyParams);

    for (const legacy of legacyReadyList) {
      await run(
        `UPDATE reservations 
         SET ready_at = COALESCE(ready_at, CURRENT_TIMESTAMP),
             expires_at = datetime('now', '+24 hours')
         WHERE id = ?`,
        [legacy.id]
      );
    }

    // 1. Find all expired ready reservations
    const expiredQuery = specificBookId
      ? `SELECT r.id, r.user_id, r.book_id, b.title as book_title
         FROM reservations r
         JOIN books b ON b.id = r.book_id
         WHERE r.book_id = ?
           AND r.status = 'ready'
           AND r.expires_at IS NOT NULL
           AND datetime(r.expires_at) <= datetime('now')`
      : `SELECT r.id, r.user_id, r.book_id, b.title as book_title
         FROM reservations r
         JOIN books b ON b.id = r.book_id
         WHERE r.status = 'ready'
           AND r.expires_at IS NOT NULL
           AND datetime(r.expires_at) <= datetime('now')`;
    const expiredParams = specificBookId ? [specificBookId] : [];
    const expiredList = await queryAll<any>(expiredQuery, expiredParams);

    if (expiredList.length === 0) {
      return result;
    }

    // Process each expired reservation in its own isolated transaction
    // to prevent one book's error from aborting others.
    for (const item of expiredList) {
      try {
        await withTransaction(async ({ queryOne, queryAll, run }) => {
          // Double-check the reservation is still ready and expired inside transaction
          const check = await queryOne<any>(
            `SELECT id, status, user_id, book_id, expires_at 
             FROM reservations 
             WHERE id = ? AND status = 'ready' AND datetime(expires_at) <= datetime('now')`,
            [item.id]
          );

          if (!check) {
            return;
          }

          const bookId = item.book_id;
          const bookTitle = item.book_title || 'Book';
          const expiredUserId = item.user_id;

          // 1. Cancel the expired reservation
          await run(
            `UPDATE reservations 
             SET status = 'cancelled', queue_position = 0 
             WHERE id = ?`,
            [item.id]
          );
          result.expiredCount++;

          // 2. Notify the expired patron
          await createNotification(
            expiredUserId,
            'Reservation Expired',
            `Your reservation for "${bookTitle}" expired because the book was not borrowed within 24 hours.`,
            'reservation_expired',
            `/book/${bookId}`
          );

          // 3. Find earliest waiting reservation for this book
          const nextWaiting = await queryOne<any>(
            `SELECT id, user_id 
             FROM reservations 
             WHERE book_id = ? AND status = 'waiting'
             ORDER BY queue_position ASC, reserved_at ASC, id ASC
             LIMIT 1`,
            [bookId]
          );

          let promotedReservationId: string | undefined;
          let promotedUserId: string | undefined;

          if (nextWaiting) {
            promotedReservationId = nextWaiting.id;
            promotedUserId = nextWaiting.user_id;

            // Promote next waiting patron to ready with fresh 24h window
            await run(
              `UPDATE reservations 
               SET status = 'ready',
                   queue_position = 1,
                   ready_at = CURRENT_TIMESTAMP,
                   expires_at = datetime('now', '+24 hours')
               WHERE id = ?`,
              [nextWaiting.id]
            );
            result.promotedCount++;

            // Re-index remaining waiting reservations
            const remainingWaiting = await queryAll<any>(
              `SELECT id FROM reservations 
               WHERE book_id = ? AND status = 'waiting' AND id != ?
               ORDER BY queue_position ASC, reserved_at ASC, id ASC`,
              [bookId, nextWaiting.id]
            );

            for (let i = 0; i < remainingWaiting.length; i++) {
              await run(
                `UPDATE reservations SET queue_position = ? WHERE id = ?`,
                [i + 2, remainingWaiting[i].id]
              );
            }

            // Keep book is_available = 0 because it is held exclusively for promoted member
            await run(
              `UPDATE books SET is_available = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
              [bookId]
            );

            // Notify newly promoted member
            await createNotification(
              nextWaiting.user_id,
              'Your Reserved Book Is Ready',
              `"${bookTitle}" is now available for you to borrow. You have 24 hours to claim it.`,
              'reservation_ready',
              `/book/${bookId}`
            );
          } else {
            // No waiting reservations left. Check active borrowings.
            const activeLoan = await queryOne<any>(
              `SELECT id FROM borrowings WHERE book_id = ? AND status IN ('active', 'overdue')`,
              [bookId]
            );

            if (!activeLoan) {
              await run(
                `UPDATE books SET is_available = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [bookId]
              );
              result.unblockedBookCount++;
            }
          }

          result.details.push({
            bookId,
            bookTitle,
            expiredReservationId: item.id,
            expiredUserId,
            promotedReservationId,
            promotedUserId
          });
        });
      } catch (itemErr) {
        console.error(`[Reservation Service] Error processing expired reservation ${item.id}:`, itemErr);
      }
    }
  } catch (err) {
    console.error('[Reservation Service] Error in expireStaleReservations:', err);
  }

  return result;
}
