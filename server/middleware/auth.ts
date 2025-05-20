import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';

// Extend the Express Request type to include user information
export interface AuthRequest extends Request {
  user: User;
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // For development, we're using a simplified auth model
  // In this simple version, we're just ensuring there's a session user
  if (req.session && req.session.user) {
    // Set the user on the custom AuthRequest interface
    (req as AuthRequest).user = req.session.user;
    return next();
  }
  
  return res.status(401).json({ message: 'Not authenticated' });
}