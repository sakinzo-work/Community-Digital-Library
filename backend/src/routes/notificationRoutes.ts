import { Router, Request, Response } from 'express';
import { queryAll, queryOne, run } from '../database/db';
import { requireAuth } from '../middleware/auth';

export const notificationRouter = Router();

/**
 * GET /api/notifications
 *
 * Returns the current authenticated user's notifications, newest first.
 * Also returns unreadCount for convenience.
 */
notificationRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const rows = await queryAll<any>(
      `SELECT id, user_id, title, message, type, link, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 50`,
      [userId]
    );

    const unreadCountRow = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    const notifications = rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      message: r.message,
      type: r.type,
      link: r.link,
      isRead: r.is_read === 1,
      createdAt: r.created_at
    }));

    res.json({
      notifications,
      unreadCount: unreadCountRow?.count || 0
    });
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch notifications'
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 *
 * Marks a specific notification owned by the authenticated user as read.
 */
notificationRouter.patch('/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await run(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (result.changes === 0) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    const unreadCountRow = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    res.json({
      message: 'Notification marked as read',
      unreadCount: unreadCountRow?.count || 0
    });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      error: error.message || 'Failed to update notification'
    });
  }
});

/**
 * PATCH /api/notifications/read-all
 *
 * Marks all notifications for the authenticated user as read.
 */
notificationRouter.patch('/read-all', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    await run(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    res.json({
      message: 'All notifications marked as read',
      unreadCount: 0
    });
  } catch (error: any) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      error: error.message || 'Failed to mark notifications as read'
    });
  }
});
