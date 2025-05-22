import { Router, Request, Response } from 'express';

export const router = Router();

/**
 * Logout a user
 */
router.get('/logout', (req: Request, res: Response) => {
  // First clear user data from session without TypeScript errors
  if (req.session) {
    // We know this property exists from how the app works, but TypeScript doesn't
    // so we use a type assertion to avoid the error
    (req.session as any).user = undefined;
    
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      
      // Clear the session cookie
      res.clearCookie('connect.sid');
      
      // Redirect to login page with a logged_out parameter
      res.redirect('/login?logged_out=true');
    });
  } else {
    // No session exists, just redirect to login
    res.redirect('/login?logged_out=true');
  }
});