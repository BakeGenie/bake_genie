import { db } from '../db';
import { eq } from 'drizzle-orm';
import { integrations } from '@shared/schema';
import fetch from 'node-fetch';

// Initialize Square credentials from environment variables
const squareAppId = import.meta.env?.VITE_SQUARE_APPLICATION_ID || process.env.VITE_SQUARE_APPLICATION_ID || '';
const squareSecret = import.meta.env?.SQUARE_APPLICATION_SECRET || process.env.SQUARE_APPLICATION_SECRET || '';
const isProduction = (import.meta.env?.NODE_ENV || process.env.NODE_ENV) === 'production';

// Log if credentials are missing
if (!squareAppId || !squareSecret) {
  console.log('Warning: Square application credentials not found in environment variables');
}

export class SquareService {
  /**
   * Check if Square is configured
   */
  isConfigured(): boolean {
    return Boolean(squareAppId && squareSecret);
  }

  /**
   * Create an OAuth link for connecting a Square account
   */
  async createOAuthLink(userId: number, redirectUri: string): Promise<string> {
    if (!squareAppId) {
      throw new Error('Square is not configured. Missing application ID.');
    }

    // Include state to prevent CSRF attacks
    const state = this.generateStateParam(userId);
    
    // Standard OAuth parameters
    const params = new URLSearchParams({
      client_id: squareAppId,
      redirect_uri: redirectUri,
      state: state,
      scope: 'MERCHANT_PROFILE_READ PAYMENTS_WRITE ORDERS_WRITE ORDERS_READ',
      session: 'false' // Don't prompt users who have already authorized
    });

    // Different URLs for sandbox and production
    const baseUrl = isProduction
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';

    return `${baseUrl}/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Handle OAuth callback and save account
   */
  async handleOAuthCallback(code: string, state: string): Promise<{success: boolean, squareAccountId?: string, error?: string}> {
    try {
      // Verify state parameter to prevent CSRF
      const userId = this.verifyStateParam(state);
      if (!userId) {
        return { success: false, error: 'Invalid state parameter' };
      }

      if (!squareAppId || !squareSecret) {
        return { success: false, error: 'Square is not configured' };
      }

      // Exchange authorization code for access token using fetch instead of Square SDK
      const tokenUrl = isProduction
        ? 'https://connect.squareup.com/oauth2/token'
        : 'https://connect.squareupsandbox.com/oauth2/token';

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Square-Version': '2023-05-17'
        },
        body: JSON.stringify({
          client_id: squareAppId,
          client_secret: squareSecret,
          code: code,
          grant_type: 'authorization_code'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Square token exchange error:', errorText);
        return { success: false, error: 'Failed to connect Square account' };
      }

      const data = await response.json();
      
      if (!data.access_token || !data.merchant_id) {
        return { success: false, error: 'Invalid response from Square' };
      }

      // Store Square account in the database
      await this.saveSquareAccount(
        userId, 
        data.merchant_id, 
        data.access_token,
        data.refresh_token || ''
      );

      return { 
        success: true, 
        squareAccountId: data.merchant_id 
      };
    } catch (error: any) {
      console.error('Square OAuth error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to connect Square account' 
      };
    }
  }

  /**
   * Check if a user has connected their Square account
   */
  async isUserConnected(userId: number): Promise<boolean> {
    try {
      const integration = await db.query.integrations.findFirst({
        where: (integration, { and, eq }) => and(
          eq(integration.userId, userId),
          eq(integration.type, 'square'),
          eq(integration.active, true)
        )
      });
      
      return !!integration;
    } catch (error) {
      console.error('Error checking Square connection:', error);
      return false;
    }
  }

  /**
   * Save or update Square account information
   */
  private async saveSquareAccount(
    userId: number, 
    squareAccountId: string, 
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    try {
      // Check if record already exists
      const existingIntegration = await db.query.integrations.findFirst({
        where: (integration, { and, eq }) => and(
          eq(integration.userId, userId),
          eq(integration.type, 'square')
        )
      });

      if (existingIntegration) {
        // Update existing integration
        await db.update(integrations)
          .set({ 
            config: JSON.stringify({
              merchantId: squareAccountId,
              environment: isProduction ? 'production' : 'sandbox'
            }),
            credentials: JSON.stringify({
              accessToken: accessToken,
              refreshToken: refreshToken
            }),
            active: true,
            updatedAt: new Date()
          })
          .where(eq(integrations.id, existingIntegration.id));
      } else {
        // Create new integration
        await db.insert(integrations).values({
          userId,
          type: 'square',
          config: JSON.stringify({
            merchantId: squareAccountId,
            environment: isProduction ? 'production' : 'sandbox'
          }),
          credentials: JSON.stringify({
            accessToken: accessToken,
            refreshToken: refreshToken
          }),
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error saving Square account:', error);
      throw new Error('Failed to save Square account information');
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
   * Disconnect a user's Square account
   */
  async disconnectAccount(userId: number): Promise<boolean> {
    try {
      const integration = await db.query.integrations.findFirst({
        where: (integration, { and, eq }) => and(
          eq(integration.userId, userId),
          eq(integration.type, 'square')
        )
      });

      if (!integration) {
        return false;
      }

      // Get access token from credentials
      let accessToken = '';
      try {
        const credentials = JSON.parse(integration.credentials);
        accessToken = credentials.accessToken;
      } catch (e) {
        console.error('Error parsing credentials:', e);
      }

      // Revoke the token with Square if possible
      if (accessToken && squareAppId && squareSecret) {
        try {
          // Revoke token using fetch
          const revokeUrl = isProduction
            ? 'https://connect.squareup.com/oauth2/revoke'
            : 'https://connect.squareupsandbox.com/oauth2/revoke';

          const response = await fetch(revokeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Square-Version': '2023-05-17'
            },
            body: JSON.stringify({
              client_id: squareAppId,
              client_secret: squareSecret,
              access_token: accessToken
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error revoking Square token:', errorText);
          }
        } catch (error) {
          console.error('Error revoking Square token:', error);
          // Continue even if revocation fails
        }
      }

      // Set as inactive rather than deleting
      await db.update(integrations)
        .set({ 
          active: false,
          updatedAt: new Date()
        })
        .where(eq(integrations.id, integration.id));

      return true;
    } catch (error) {
      console.error('Error disconnecting Square account:', error);
      return false;
    }
  }
}

export const squareService = new SquareService();