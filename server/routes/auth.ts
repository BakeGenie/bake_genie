import { Router, Request, Response } from 'express';

export const router = Router();

/**
 * Logout a user
 */
router.get('/logout', (req: Request, res: Response) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    
    // Redirect to login page or home page
    res.redirect('/');
  });
});