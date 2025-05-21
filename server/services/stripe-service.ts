import Stripe from 'stripe';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { users, integrations } from '@shared/schema';

// Initialize Stripe with the secret key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
let stripe: Stripe | null = null;

try {
  if (stripeSecretKey) {
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
  } else {
    console.log('Warning: STRIPE_SECRET_KEY not found in environment variables');
  }
} catch (error) {
  console.error('Error initializing Stripe:', error);
}

export class StripeService {
  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return !!stripe;
  }

  /**
   * Create an OAuth link for connecting a Stripe account
   */
  async createOAuthLink(userId: number, redirectUri: string): Promise<string> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    // Include state to prevent CSRF attacks
    const state = this.generateStateParam(userId);
    
    // Standard OAuth parameters
    // Using default placeholder client ID if environment variable isn't set
    const clientId = process.env.STRIPE_CLIENT_ID || 'ca_placeholder';
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state,
      response_type: 'code',
      scope: 'read_write'
    });

    return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Handle OAuth callback and save account
   */
  async handleOAuthCallback(code: string, state: string): Promise<{success: boolean, stripeAccountId?: string, error?: string}> {
    if (!stripe) {
      return { success: false, error: 'Stripe is not configured' };
    }

    try {
      // Verify state parameter to prevent CSRF
      const userId = this.verifyStateParam(state);
      if (!userId) {
        return { success: false, error: 'Invalid state parameter' };
      }

      // Exchange authorization code for access token
      const response = await stripe.oauth.token({
        grant_type: 'authorization_code',
        code
      });

      if (!response || !response.stripe_user_id) {
        return { success: false, error: 'Failed to connect Stripe account' };
      }

      // Store Stripe account in the database
      await this.saveStripeAccount(userId, response.stripe_user_id, response.access_token || '');

      return { 
        success: true, 
        stripeAccountId: response.stripe_user_id 
      };
    } catch (error: any) {
      console.error('Stripe OAuth error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to connect Stripe account' 
      };
    }
  }

  /**
   * Check if a user has connected their Stripe account
   */
  async isUserConnected(userId: number): Promise<boolean> {
    try {
      const integration = await db.query.integrations.findFirst({
        where: eq(integrations.userId, userId),
        columns: {
          id: true,
          provider: true,
          isActive: true
        }
      });

      return !!integration && integration.provider === 'stripe' && integration.isActive;
    } catch (error) {
      console.error('Error checking Stripe connection:', error);
      return false;
    }
  }

  /**
   * Save or update Stripe account information
   */
  private async saveStripeAccount(
    userId: number, 
    stripeAccountId: string, 
    accessToken: string
  ): Promise<void> {
    try {
      // Check if record already exists
      const existingIntegration = await db.query.integrations.findFirst({
        where: (integrations, { and, eq }) => and(
          eq(integrations.userId, userId),
          eq(integrations.provider, 'stripe')
        )
      });

      if (existingIntegration) {
        // Update existing integration
        await db.update(integrations)
          .set({ 
            providerAccountId: stripeAccountId,
            accessToken: accessToken,
            isActive: true,
            updatedAt: new Date()
          })
          .where(eq(integrations.id, existingIntegration.id));
      } else {
        // Create new integration
        await db.insert(integrations).values({
          userId,
          provider: 'stripe',
          providerAccountId: stripeAccountId,
          accessToken,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error saving Stripe account:', error);
      throw new Error('Failed to save Stripe account information');
    }
  }

  /**
   * Generate state parameter for OAuth
   */
  private generateStateParam(userId: number): string {
    // In a production environment, use a more secure method
    // like cryptographically signed tokens
    return `user_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Verify state parameter from OAuth callback
   */
  private verifyStateParam(state: string): number | null {
    // Basic verification - extract userId from state
    // In production, use more secure verification
    const match = state.match(/^user_(\d+)_/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  /**
   * Disconnect a user's Stripe account
   */
  async disconnectAccount(userId: number): Promise<boolean> {
    try {
      const integration = await db.query.integrations.findFirst({
        where: (integrations, { and, eq }) => and(
          eq(integrations.userId, userId),
          eq(integrations.provider, 'stripe')
        )
      });

      if (!integration) {
        return false;
      }

      // Set as inactive rather than deleting
      await db.update(integrations)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(integrations.id, integration.id));

      return true;
    } catch (error) {
      console.error('Error disconnecting Stripe account:', error);
      return false;
    }
  }
}

export const stripeService = new StripeService();