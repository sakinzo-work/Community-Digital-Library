import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryAll, queryOne, run } from '../database/db';
import { requireAuth, requireAdmin, generateToken, getPasswordFingerprint } from '../middleware/auth';

export const userRouter = Router();

// PUT /api/users/profile - Update current user profile
userRouter.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { fullName, phone, bio, interests, membershipType } = req.body;

    const fields: string[] = [];
    const params: any[] = [];

    if (fullName !== undefined) {
      fields.push('full_name = ?');
      params.push(fullName.trim());
    }
    if (phone !== undefined) {
      fields.push('phone = ?');
      params.push(phone.trim());
    }
    if (bio !== undefined) {
      fields.push('bio = ?');
      params.push(bio.trim());
    }
    if (interests !== undefined) {
      fields.push('interests = ?');
      params.push(Array.isArray(interests) ? JSON.stringify(interests) : interests);
    }
    if (membershipType !== undefined) {
      fields.push('membership_type = ?');
      params.push(membershipType);
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields provided to update' });
      return;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    await run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

    const updated = await queryOne<any>(
      `SELECT id, full_name, email, phone, role, bio, interests, library_card_number, membership_type
       FROM users WHERE id = ?`,
      [userId]
    );

    let parsedInterests: string[] = [];
    try {
      parsedInterests = updated.interests ? JSON.parse(updated.interests) : [];
    } catch {
      parsedInterests = [];
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updated.id,
        fullName: updated.full_name,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        bio: updated.bio,
        interests: parsedInterests,
        libraryCardNumber: updated.library_card_number,
        membershipType: updated.membership_type
      }
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// PUT /api/users/password - Change password
userRouter.put('/password', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long' });
      return;
    }

    const user = await queryOne<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Current password does not match' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      newHash,
      userId
    ]);

    const newToken = generateToken({
      id: userId,
      email: req.user!.email,
      role: req.user!.role,
      pwh: getPasswordFingerprint(newHash)
    });

    res.json({ message: 'Password updated successfully', token: newToken });
  } catch (error: any) {
    console.error('Password change error:', error);
    res.status(500).json({ error: error.message || 'Failed to change password' });
  }
});

// GET /api/users - Admin only: List all users
userRouter.get('/', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await queryAll<any>(
      `SELECT u.id, u.full_name, u.full_name as name, u.full_name as fullName,
              u.email, u.phone, u.role, u.membership_type,
              u.library_card_number, u.created_at,
              (SELECT COUNT(*) FROM borrowings b WHERE b.user_id = u.id) as total_borrowings,
              (SELECT COUNT(*) FROM bookmarks bm WHERE bm.user_id = u.id) as total_bookmarks
       FROM users u
       ORDER BY u.created_at DESC`
    );

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.full_name || '',
      fullName: u.full_name || '',
      full_name: u.full_name || '',
      email: u.email,
      phone: u.phone,
      role: u.role,
      membership_type: u.membership_type,
      membershipType: u.membership_type,
      library_card_number: u.library_card_number,
      libraryCardNumber: u.library_card_number,
      created_at: u.created_at,
      createdAt: u.created_at,
      total_borrowings: Number(u.total_borrowings || 0),
      totalBorrowings: Number(u.total_borrowings || 0),
      total_bookmarks: Number(u.total_bookmarks || 0),
      totalBookmarks: Number(u.total_bookmarks || 0)
    }));

    res.json({ users: formattedUsers });
  } catch (error: any) {
    console.error('Admin list users error:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// PUT /api/users/:id/role - Admin only: Change user role
userRouter.put('/:id/role', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ error: "Role must be 'user' or 'admin'" });
      return;
    }

    await run('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      role,
      id
    ]);

    res.json({ message: `User role updated to ${role}` });
  } catch (error: any) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});
