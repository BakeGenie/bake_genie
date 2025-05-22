import session from 'express-session';
import { randomBytes } from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Generate a random secret for session encryption
const generateSecret = () => {
  return randomBytes(32).toString('hex');
};

// Session middleware setup
export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || generateSecret(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
  }
});

// Authentication middleware for protected routes
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};