import { Router, Request, Response } from 'express';
import { xeroService } from '../services/xero';

export const router = Router();

/**
 * Get Xero authorization URL
 */
router.get('/auth', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const authUrl = xeroService.getAuthUrl(req.session.userId);
    res.json({ url: authUrl });
  } catch (error) {
    console.error('Error getting Xero auth URL:', error);
    res.status(500).json({ error: 'Failed to get authorization URL' });
  }
});

/**
 * Handle Xero OAuth callback
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const success = await xeroService.handleCallback(code.toString(), state.toString());
    
    if (success) {
      res.redirect('/account?xero=connected');
    } else {
      res.redirect('/account?xero=error');
    }
  } catch (error) {
    console.error('Error handling Xero callback:', error);
    res.redirect('/account?xero=error');
  }
});

/**
 * Check Xero connection status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isConnected = await xeroService.hasConnectedXero(req.session.userId);
    res.json({ connected: isConnected });
  } catch (error) {
    console.error('Error checking Xero status:', error);
    res.status(500).json({ error: 'Failed to check Xero connection status' });
  }
});

/**
 * Disconnect Xero
 */
router.post('/disconnect', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const success = await xeroService.disconnectXero(req.session.userId);
    res.json({ success });
  } catch (error) {
    console.error('Error disconnecting Xero:', error);
    res.status(500).json({ error: 'Failed to disconnect Xero' });
  }
});

/**
 * Sync orders to Xero
 */
router.post('/sync/orders', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const success = await xeroService.syncOrdersToXero(req.session.userId);
    res.json({ success });
  } catch (error) {
    console.error('Error syncing orders to Xero:', error);
    res.status(500).json({ error: 'Failed to sync orders to Xero' });
  }
});

/**
 * Sync contacts to Xero
 */
router.post('/sync/contacts', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const success = await xeroService.syncContactsToXero(req.session.userId);
    res.json({ success });
  } catch (error) {
    console.error('Error syncing contacts to Xero:', error);
    res.status(500).json({ error: 'Failed to sync contacts to Xero' });
  }
});