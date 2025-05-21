import { Client, Environment } from 'square';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { users, integrations } from '@shared/schema';

// Initialize Square client with credentials from environment variables
const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN || '';
const squareAppId = process.env.SQUARE_APPLICATION_ID || '';
let squareClient: Client | null = null;

try {
  if (squareAccessToken) {
    squareClient = new Client({
      accessToken: squareAccessToken,
      environment: process.env.NODE_ENV === 'production' 
        ? Environment.Production 
        : Environment.Sandbox
    });
  } else {
    console.log('Warning: SQUARE_ACCESS_TOKEN not found in environment variables');
  }
} catch (error) {
  console.error('Error initializing Square client:', error);
}

export class SquareService {
  /**
   * Check if Square is configured
   */
  isConfigured(): boolean {
    return !!squareClient && !!squareAppId;
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
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';

    return `${baseUrl}/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Handle OAuth callback and save account
   */
  async handleOAuthCallback(code: string, state: string): Promise<{success: boolean, squareAccountId?: string, error?: string}> {
    if (!squareClient) {
      return { success: false, error: 'Square is not configured' };
    }

    try {
      // Verify state parameter to prevent CSRF
      const userId = this.verifyStateParam(state);
      if (!userId) {
        return { success: false, error: 'Invalid state parameter' };
      }

      // Exchange authorization code for access token
      const { result } = await squareClient.oAuthApi.obtainToken({
        clientId: squareAppId,
        clientSecret: process.env.SQUARE_APPLICATION_SECRET || '',
        code,
        grantType: 'authorization_code'
      });

      if (!result.accessToken || !result.merchantId) {
        return { success: false, error: 'Failed to connect Square account' };
      }

      // Store Square account in the database
      await this.saveSquareAccount(
        userId, 
        result.merchantId, 
        result.accessToken,
        result.refreshToken || ''
      );

      return { 
        success: true, 
        squareAccountId: result.merchantId 
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
        where: (integrations, { and, eq }) => and(
          eq(integrations.userId, userId),
          eq(integrations.provider, 'square')
        ),
        columns: {
          id: true,
          provider: true,
          isActive: true
        }
      });

      return !!integration && integration.provider === 'square' && integration.isActive;
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
        where: (integrations, { and, eq }) => and(
          eq(integrations.userId, userId),
          eq(integrations.provider, 'square')
        )
      });

      if (existingIntegration) {
        // Update existing integration
        await db.update(integrations)
          .set({ 
            providerAccountId: squareAccountId,
            accessToken: accessToken,
            refreshToken: refreshToken,
            isActive: true,
            updatedAt: new Date()
          })
          .where(eq(integrations.id, existingIntegration.id));
      } else {
        // Create new integration
        await db.insert(integrations).values({
          userId,
          provider: 'square',
          providerAccountId: squareAccountId,
          accessToken,
          refreshToken,
          isActive: true,
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
        where: (integrations, { and, eq }) => and(
          eq(integrations.userId, userId),
          eq(integrations.provider, 'square')
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

      // Revoke the token with Square if possible
      if (squareClient && integration.accessToken) {
        try {
          await squareClient.oAuthApi.revokeToken({
            clientId: squareAppId,
            accessToken: integration.accessToken
          });
        } catch (error) {
          console.error('Error revoking Square token:', error);
          // Continue even if revocation fails
        }
      }

      return true;
    } catch (error) {
      console.error('Error disconnecting Square account:', error);
      return false;
    }
  }
}

export const squareService = new SquareService();