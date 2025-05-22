import { Router, Request, Response } from 'express';

export const router = Router();

/**
 * Logout a user
 */
router.get('/logout', (req: Request, res: Response) => {
  // First clear the user data from the session
  if (req.session) {
    req.session.user = undefined;
    
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      
      // Clear the session cookie
      res.clearCookie('connect.sid');
      
      // Redirect to login page or home page
      res.redirect('/');
    });
  } else {
    // No session exists, just redirect
    res.redirect('/');
  }
});