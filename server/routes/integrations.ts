import { Router, Request, Response } from 'express';
import { stripeService } from '../services/stripe-service';
import { squareService } from '../services/square-service';

const router = Router();

// Check if user is authenticated middleware
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
};

// Get Stripe connection status
router.get('/stripe/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!stripeService.isConfigured()) {
      return res.status(200).json({ configured: false, connected: false });
    }

    const isConnected = await stripeService.isUserConnected(req.user!.id);
    return res.status(200).json({ configured: true, connected: isConnected });
  } catch (error: any) {
    console.error('Error getting Stripe status:', error);
    return res.status(500).json({ error: error.message || 'Failed to get Stripe status' });
  }
});

// Generate OAuth URL for connecting with Stripe
router.post('/stripe/connect', isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!stripeService.isConfigured()) {
      return res.status(400).json({ error: 'Stripe is not configured' });
    }

    const { redirectUri } = req.body;
    
    if (!redirectUri) {
      return res.status(400).json({ error: 'Redirect URI is required' });
    }

    const authUrl = await stripeService.createOAuthLink(req.user!.id, redirectUri);
    return res.status(200).json({ authUrl });
  } catch (error: any) {
    console.error('Error creating Stripe OAuth link:', error);
    return res.status(500).json({ error: error.message || 'Failed to create Stripe OAuth link' });
  }
});

// Callback endpoint for Stripe OAuth
router.get('/stripe/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.redirect('/payment-settings/stripe?error=invalid_request');
    }

    const result = await stripeService.handleOAuthCallback(
      code as string,
      state as string
    );

    if (result.success) {
      return res.redirect('/payment-settings/stripe?success=true');
    } else {
      return res.redirect(`/payment-settings/stripe?error=${encodeURIComponent(result.error || 'unknown')}`);
    }
  } catch (error: any) {
    console.error('Error handling Stripe callback:', error);
    return res.redirect(`/payment-settings/stripe?error=${encodeURIComponent(error.message || 'unknown')}`);
  }
});

// Disconnect Stripe account
router.post('/stripe/disconnect', isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!stripeService.isConfigured()) {
      return res.status(400).json({ error: 'Stripe is not configured' });
    }

    const success = await stripeService.disconnectAccount(req.user!.id);
    
    if (success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(404).json({ error: 'No Stripe account connected' });
    }
  } catch (error: any) {
    console.error('Error disconnecting Stripe account:', error);
    return res.status(500).json({ error: error.message || 'Failed to disconnect Stripe account' });
  }
});

// SQUARE INTEGRATION ROUTES

// Get Square connection status
router.get('/square/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!squareService.isConfigured()) {
      return res.status(200).json({ configured: false, connected: false });
    }

    const isConnected = await squareService.isUserConnected(req.user!.id);
    return res.status(200).json({ configured: true, connected: isConnected });
  } catch (error: any) {
    console.error('Error getting Square status:', error);
    return res.status(500).json({ error: error.message || 'Failed to get Square status' });
  }
});

// Generate OAuth URL for connecting with Square
router.post('/square/connect', isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!squareService.isConfigured()) {
      return res.status(400).json({ error: 'Square is not configured' });
    }

    const { redirectUri } = req.body;
    
    if (!redirectUri) {
      return res.status(400).json({ error: 'Redirect URI is required' });
    }

    const authUrl = await squareService.createOAuthLink(req.user!.id, redirectUri);
    return res.status(200).json({ authUrl });
  } catch (error: any) {
    console.error('Error creating Square OAuth link:', error);
    return res.status(500).json({ error: error.message || 'Failed to create Square OAuth link' });
  }
});

// Callback endpoint for Square OAuth
router.get('/square/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.redirect('/payment-settings/square?error=invalid_request');
    }

    const result = await squareService.handleOAuthCallback(
      code as string,
      state as string
    );

    if (result.success) {
      return res.redirect('/payment-settings/square?success=true');
    } else {
      return res.redirect(`/payment-settings/square?error=${encodeURIComponent(result.error || 'unknown')}`);
    }
  } catch (error: any) {
    console.error('Error handling Square callback:', error);
    return res.redirect(`/payment-settings/square?error=${encodeURIComponent(error.message || 'unknown')}`);
  }
});

// Disconnect Square account
router.post('/square/disconnect', isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!squareService.isConfigured()) {
      return res.status(400).json({ error: 'Square is not configured' });
    }

    const success = await squareService.disconnectAccount(req.user!.id);
    
    if (success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(404).json({ error: 'No Square account connected' });
    }
  } catch (error: any) {
    console.error('Error disconnecting Square account:', error);
    return res.status(500).json({ error: error.message || 'Failed to disconnect Square account' });
  }
});

export default router;