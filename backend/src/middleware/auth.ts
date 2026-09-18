import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { queryOne } from '../database/db';

/**
 * Enforce that JWT_SECRET is supplied via environment variable.
 * Fails fast with a clear error rather than falling back to an insecure hardcoded secret.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error(
      'FATAL SECURITY CONFIGURATION ERROR: JWT_SECRET environment variable is missing or empty. A secure JWT secret must be configured.'
    );
  }
  return secret.trim();
}

/**
 * Compute a SHA-256 fingerprint from the stored password hash.
 * This allows tokens to be immediately invalidated if the user changes their password,
 * without requiring additional schema changes.
 */
export function getPasswordFingerprint(passwordHash: string): string {
  return crypto.createHash('sha256').update(passwordHash).digest('hex').substring(0, 16);
}

export interface AuthPayload {
  id: string;
  email: string;
  role: 'user' | 'admin';
  pwh?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function generateToken(payload: AuthPayload): string {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
    return;
  }

  let decoded: AuthPayload;
  try {
    const secret = getJwtSecret();
    decoded = jwt.verify(token, secret) as AuthPayload;
  } catch (error: any) {
    if (error?.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token has expired. Please sign in again.' });
      return;
    }
    if (error?.name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Invalid or malformed token. Please sign in again.' });
      return;
    }
    res.status(401).json({ error: 'Invalid authentication token. Please sign in again.' });
    return;
  }

  if (!decoded || !decoded.id) {
    res.status(401).json({ error: 'Malformed token payload. Please sign in again.' });
    return;
  }

  try {
    // Dynamic verification: lookup current user in SQLite to verify existence,
    // current database role, and password state.
    const user = await queryOne<{
      id: string;
      email: string;
      role: 'user' | 'admin';
      password_hash: string;
    }>('SELECT id, email, role, password_hash FROM users WHERE id = ?', [decoded.id]);

    if (!user) {
      res.status(401).json({ error: 'User account no longer exists. Please sign in again.' });
      return;
    }

    // Reject tokens issued with an outdated password or missing password fingerprint
    if (!decoded.pwh || decoded.pwh !== getPasswordFingerprint(user.password_hash)) {
      res.status(401).json({
        error: 'Authentication revoked: invalid session or password was recently updated. Please sign in again.'
      });
      return;
    }

    // Role MUST come from the current SQLite database record, not from stale JWT data
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (dbErr: any) {
    console.error('Error verifying user authentication in SQLite:', dbErr);
    res.status(500).json({ error: 'Internal server error during authentication verification.' });
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (token) {
    try {
      const secret = getJwtSecret();
      const decoded = jwt.verify(token, secret) as AuthPayload;
      if (decoded && decoded.id) {
        const user = await queryOne<{
          id: string;
          email: string;
          role: 'user' | 'admin';
          password_hash: string;
        }>('SELECT id, email, role, password_hash FROM users WHERE id = ?', [decoded.id]);

        if (user && decoded.pwh === getPasswordFingerprint(user.password_hash)) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role
          };
        }
      }
    } catch {
      // Silently ignore invalid or expired tokens in optionalAuth
    }
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Administrator privileges required to access this resource.' });
    return;
  }

  next();
}

