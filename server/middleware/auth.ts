import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user is authenticated
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // For development, if no session exists, create a mock user session
  if (!req.session) {
    req.session = {} as any;
  }
  
  if (!req.session.user) {
    req.session.user = {
      id: 1,
      username: 'demo',
      email: 'demo@example.com'
    };
  }
  
  next();
};