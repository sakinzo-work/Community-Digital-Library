import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne, run } from '../database/db';
import { generateToken, requireAuth, getPasswordFingerprint } from '../middleware/auth';

export const authRouter = Router();

// Helper to generate library card number
function generateCardNumber(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `CDL-${new Date().getFullYear()}-${randomDigits}`;
}

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const resolvedName = (req.body.fullName || req.body.name || '').trim();
    const { email, password, phone, membershipType, bio } = req.body;
    const resolvedInterests = req.body.interests || req.body.favoriteCategories || [];

    if (!resolvedName) {
      res.status(400).json({ error: 'Full name is required' });
      return;
    }
    if (!email || !email.trim()) {
      res.status(400).json({ error: 'Email address is required' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cardNumber = generateCardNumber();

    await run(
      `INSERT INTO users (
        id, full_name, email, password_hash, phone, role,
        bio, interests, library_card_number, membership_type
      ) VALUES (?, ?, ?, ?, ?, 'user', ?, ?, ?, ?)`,
      [
        userId,
        resolvedName,
        cleanEmail,
        passwordHash,
        phone ? phone.trim() : null,
        bio ? bio.trim() : null,
        resolvedInterests ? (Array.isArray(resolvedInterests) ? JSON.stringify(resolvedInterests) : resolvedInterests) : null,
        cardNumber,
        membershipType || 'Resident'
      ]
    );

    const token = generateToken({
      id: userId,
      email: cleanEmail,
      role: 'user',
      pwh: getPasswordFingerprint(passwordHash)
    });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        fullName: resolvedName,
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        role: 'user',
        bio: bio ? bio.trim() : null,
        interests: resolvedInterests ? (Array.isArray(resolvedInterests) ? resolvedInterests : JSON.parse(resolvedInterests || '[]')) : [],
        libraryCardNumber: cardNumber,
        membershipType: membershipType || 'Resident',
        savedBookIds: [],
        borrowedBooks: []
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during registration' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await queryOne<any>(
      `SELECT id, full_name, email, password_hash, phone, role, bio, interests, library_card_number, membership_type
       FROM users WHERE email = ?`,
      [cleanEmail]
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      pwh: getPasswordFingerprint(user.password_hash)
    });

    // Parse interests
    let parsedInterests: string[] = [];
    try {
      parsedInterests = user.interests ? JSON.parse(user.interests) : [];
    } catch {
      parsedInterests = [];
    }

    res.json({
      message: 'Sign in successful',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        bio: user.bio,
        interests: parsedInterests,
        libraryCardNumber: user.library_card_number,
        membershipType: user.membership_type
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during login' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Signed out successfully' });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await queryOne<any>(
      `SELECT id, full_name, email, phone, role, bio, interests, library_card_number, membership_type, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get user's bookmarks
    const bookmarks = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ?`,
      [userId]
    );

    // Get user's active borrowings
    const borrowings = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM borrowings WHERE user_id = ? AND status = 'active'`,
      [userId]
    );

    let parsedInterests: string[] = [];
    try {
      parsedInterests = user.interests ? JSON.parse(user.interests) : [];
    } catch {
      parsedInterests = [];
    }

    res.json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        bio: user.bio,
        interests: parsedInterests,
        libraryCardNumber: user.library_card_number,
        membershipType: user.membership_type,
        createdAt: user.created_at,
        stats: {
          savedBooksCount: bookmarks?.count || 0,
          activeBorrowingsCount: borrowings?.count || 0
        }
      }
    });
  } catch (error: any) {
    console.error('Auth me error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});
