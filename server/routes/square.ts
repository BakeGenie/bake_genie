import { Router, Request, Response } from 'express';
import { squareService } from '../services/square';
import { z } from 'zod';

export const router = Router();

// Route to get OAuth URL for connecting Square account
router.get('/auth', async (req: Request, res: Response) => {
  try {
    // In a real application, you would get the userId from the authenticated session
    const userId = req.session.userId || 1; // Default to userId 1 for development
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const authUrl = squareService.getAuthUrl(userId);
    
    return res.json({ authUrl });
  } catch (error) {
    console.error('Error getting Square auth URL:', error);
    return res.status(500).json({ error: 'Failed to generate Square auth URL' });
  }
});

// OAuth callback route
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const success = await squareService.handleCallback(code, state);
    
    if (success) {
      // Redirect to the account settings page with a success message
      return res.redirect('/account?square=connected');
    } else {
      return res.redirect('/account?square=error');
    }
  } catch (error) {
    console.error('Error handling Square callback:', error);
    return res.redirect('/account?square=error');
  }
});

// Check if user has connected Square
router.get('/status', async (req: Request, res: Response) => {
  try {
    // In a real application, you would get the userId from the authenticated session
    const userId = req.session.userId || 1; // Default to userId 1 for development
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const connected = await squareService.hasConnectedSquare(userId);
    
    return res.json({ connected });
  } catch (error) {
    console.error('Error checking Square status:', error);
    return res.status(500).json({ error: 'Failed to check Square connection status' });
  }
});

// Disconnect Square account
router.post('/disconnect', async (req: Request, res: Response) => {
  try {
    // In a real application, you would get the userId from the authenticated session
    const userId = req.session.userId || 1; // Default to userId 1 for development
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const success = await squareService.disconnectSquare(userId);
    
    return res.json({ success });
  } catch (error) {
    console.error('Error disconnecting Square:', error);
    return res.status(500).json({ error: 'Failed to disconnect Square account' });
  }
});

// Process a payment
const paymentSchema = z.object({
  orderId: z.number(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  sourceId: z.string(),
  note: z.string().optional(),
});

router.post('/payment', async (req: Request, res: Response) => {
  try {
    // In a real application, you would get the userId from the authenticated session
    const userId = req.session.userId || 1; // Default to userId 1 for development
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const paymentData = paymentSchema.parse(req.body);
    
    const result = await squareService.processPayment(
      userId,
      paymentData.orderId,
      paymentData.amount,
      paymentData.currency,
      paymentData.sourceId,
      paymentData.note
    );
    
    return res.json(result);
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({ error: 'Failed to process payment' });
  }
});