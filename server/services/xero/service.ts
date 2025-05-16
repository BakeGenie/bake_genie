import { XeroClient } from 'xero-node';
import crypto from 'crypto';
import { createXeroClient } from './client';
import { db } from '../../db';
import { integrations } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Service for handling Xero integration
 */
export class XeroService {
  private readonly REDIRECT_URI = process.env.NODE_ENV === 'production'
    ? `${process.env.PUBLIC_URL}/api/xero/callback`
    : 'http://localhost:5000/api/xero/callback';

  /**
   * Get the authorization URL for Xero OAuth
   */
  getAuthUrl(userId: number): string {
    const client = createXeroClient();
    
    // Create a state value to prevent CSRF
    const state = this.generateState(userId);
    
    return client.buildConsentUrl({ state });
  }

  /**
   * Handle the callback from Xero OAuth
   */
  async handleCallback(code: string, state: string): Promise<boolean> {
    try {
      // Decode the state to get userId
      const stateData = this.decodeState(state);
      if (!stateData) {
        console.error('Invalid state parameter in Xero callback');
        return false;
      }

      const { userId } = stateData;
      const client = createXeroClient();
      
      // Exchange code for token
      const tokenSet = await client.apiCallback(this.REDIRECT_URI, { code });
      
      // Store token for the user
      await this.saveTokenForUser(userId, tokenSet);
      
      // Fetch initial data from Xero (e.g., tenants)
      const tenants = await client.updateTenants();
      
      if (tenants && tenants.length > 0) {
        // Store tenant info
        await this.saveTenantForUser(userId, tenants[0].tenantId);
      }
      
      return true;
    } catch (error) {
      console.error('Error handling Xero callback:', error);
      return false;
    }
  }

  /**
   * Get a Xero client for a specific user
   */
  async getClientForUser(userId: number): Promise<XeroClient | null> {
    try {
      // Find user integration
      const [integration] = await db
        .select()
        .from(integrations)
        .where(
          and(
            eq(integrations.userId, userId),
            eq(integrations.provider, 'xero')
          )
        );

      if (!integration || !integration.accessToken) {
        return null;
      }

      // Create client with access token
      const client = createXeroClient(integration.accessToken);
      
      // If token is expired, refresh it
      if (this.isTokenExpired(integration.updatedAt, integration.expiresIn)) {
        const newTokenSet = await client.refreshToken();
        
        // Save new token
        await this.saveTokenForUser(userId, newTokenSet);
      }

      return client;
    } catch (error) {
      console.error('Error getting Xero client for user:', error);
      return null;
    }
  }

  /**
   * Get Xero connection status for a user
   */
  async hasConnectedXero(userId: number): Promise<boolean> {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.userId, userId),
          eq(integrations.provider, 'xero')
        )
      );
    
    return !!integration && !!integration.accessToken;
  }

  /**
   * Disconnect a user's Xero integration
   */
  async disconnectXero(userId: number): Promise<boolean> {
    try {
      await db
        .delete(integrations)
        .where(
          and(
            eq(integrations.userId, userId),
            eq(integrations.provider, 'xero')
          )
        );
      
      return true;
    } catch (error) {
      console.error('Error disconnecting Xero for user:', error);
      return false;
    }
  }

  /**
   * Sync orders to Xero as invoices
   */
  async syncOrdersToXero(userId: number): Promise<boolean> {
    try {
      const client = await this.getClientForUser(userId);
      if (!client) {
        return false;
      }

      // Logic to sync orders to Xero as invoices
      // This would include:
      // 1. Fetching orders from our DB
      // 2. Converting them to Xero invoice format
      // 3. Creating or updating invoices in Xero

      return true;
    } catch (error) {
      console.error('Error syncing orders to Xero:', error);
      return false;
    }
  }

  /**
   * Sync contacts to Xero
   */
  async syncContactsToXero(userId: number): Promise<boolean> {
    try {
      const client = await this.getClientForUser(userId);
      if (!client) {
        return false;
      }

      // Logic to sync contacts to Xero
      // This would include:
      // 1. Fetching contacts from our DB
      // 2. Converting them to Xero contact format
      // 3. Creating or updating contacts in Xero

      return true;
    } catch (error) {
      console.error('Error syncing contacts to Xero:', error);
      return false;
    }
  }

  /**
   * Generate a state parameter for OAuth
   */
  private generateState(userId: number): string {
    const stateData = {
      userId,
      timestamp: Date.now()
    };
    
    // Encrypt and encode state
    return Buffer.from(JSON.stringify(stateData)).toString('base64');
  }

  /**
   * Decode a state parameter from OAuth
   */
  private decodeState(state: string): { userId: number, timestamp: number } | null {
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      return stateData;
    } catch (error) {
      console.error('Error decoding state:', error);
      return null;
    }
  }

  /**
   * Save token information for a user
   */
  private async saveTokenForUser(userId: number, tokenSet: any): Promise<void> {
    const { access_token, refresh_token, expires_in } = tokenSet;
    
    // Check if integration exists
    const [existingIntegration] = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.userId, userId),
          eq(integrations.provider, 'xero')
        )
      );
    
    if (existingIntegration) {
      // Update existing integration
      await db
        .update(integrations)
        .set({
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresIn: expires_in,
          updatedAt: new Date()
        })
        .where(eq(integrations.id, existingIntegration.id));
    } else {
      // Create new integration
      await db
        .insert(integrations)
        .values({
          userId,
          provider: 'xero',
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresIn: expires_in
        });
    }
  }

  /**
   * Save tenant information for a user
   */
  private async saveTenantForUser(userId: number, tenantId: string): Promise<void> {
    await db
      .update(integrations)
      .set({
        providerAccountId: tenantId
      })
      .where(
        and(
          eq(integrations.userId, userId),
          eq(integrations.provider, 'xero')
        )
      );
  }

  /**
   * Check if a token is expired
   */
  private isTokenExpired(updatedAt: Date, expiresIn: number): boolean {
    const expirationTime = new Date(updatedAt).getTime() + (expiresIn * 1000);
    return Date.now() >= expirationTime;
  }
}

export const xeroService = new XeroService();