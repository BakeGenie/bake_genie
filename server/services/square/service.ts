import { createSquareClient, generateOAuthUrl } from './client';
import { db } from '../../db';
import { integrations, payments } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Multi-tenant Square integration service
 */
export class SquareService {
  private applicationId: string;
  private applicationSecret: string;
  
  constructor() {
    this.applicationId = process.env.SQUARE_APPLICATION_ID || '';
    this.applicationSecret = process.env.SQUARE_APPLICATION_SECRET || '';
    
    if (!this.applicationId || !this.applicationSecret) {
      console.warn('Square application credentials not configured');
    }
  }
  
  /**
   * Get OAuth URL for connecting a Square account
   */
  getAuthUrl(userId: number): string {
    return generateOAuthUrl(this.applicationId, userId);
  }
  
  /**
   * Handle OAuth callback from Square
   */
  async handleCallback(code: string, state: string): Promise<boolean> {
    // Validate state parameter to prevent CSRF attacks
    const stateData = process.env.SQUARE_OAUTH_STATE ? JSON.parse(process.env.SQUARE_OAUTH_STATE) : null;
    
    if (!stateData || stateData.state !== state) {
      throw new Error('Invalid OAuth state');
    }
    
    const userId = stateData.userId;
    
    try {
      // Create Square client
      const client = createSquareClient();
      
      // Exchange code for access token
      const { result } = await client.oAuthApi.obtainToken({
        clientId: this.applicationId,
        clientSecret: this.applicationSecret,
        code,
        grantType: 'authorization_code',
      });
      
      const { accessToken, refreshToken, merchantId, expiresAt } = result;
      
      if (!accessToken || !refreshToken || !merchantId) {
        throw new Error('Missing required tokens in Square response');
      }
      
      // Get merchant's locations
      const tokenClient = createSquareClient(accessToken);
      const locationsResponse = await tokenClient.locationsApi.listLocations();
      
      // Use the first location by default
      let locationId = '';
      if (locationsResponse.result.locations && locationsResponse.result.locations.length > 0) {
        locationId = locationsResponse.result.locations[0].id;
      }
      
      // Check if integration already exists
      const existingIntegration = await db
        .select()
        .from(integrations)
        .where(and(
          eq(integrations.userId, userId),
          eq(integrations.provider, 'square')
        ));
      
      // Convert expiry date
      const expiryDate = expiresAt ? new Date(expiresAt) : undefined;
      
      if (existingIntegration.length > 0) {
        // Update existing integration
        await db
          .update(integrations)
          .set({
            accessToken,
            refreshToken,
            merchantId,
            locationId,
            expiresAt: expiryDate,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(integrations.id, existingIntegration[0].id));
      } else {
        // Create new integration
        await db.insert(integrations).values({
          userId,
          provider: 'square',
          accessToken,
          refreshToken,
          merchantId,
          locationId,
          expiresAt: expiryDate,
          isActive: true,
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error handling Square OAuth callback:', error);
      throw error;
    }
  }
  
  /**
   * Check if a user has connected their Square account
   */
  async hasConnectedSquare(userId: number): Promise<boolean> {
    const integrationExists = await db
      .select({ id: integrations.id })
      .from(integrations)
      .where(and(
        eq(integrations.userId, userId),
        eq(integrations.provider, 'square'),
        eq(integrations.isActive, true)
      ));
    
    return integrationExists.length > 0;
  }
  
  /**
   * Disconnect a user's Square account
   */
  async disconnectSquare(userId: number): Promise<boolean> {
    await db
      .update(integrations)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(
        eq(integrations.userId, userId),
        eq(integrations.provider, 'square')
      ));
    
    return true;
  }
  
  /**
   * Process a payment for an order
   */
  async processPayment(userId: number, orderId: number, amount: number, currency: string, sourceId: string, note?: string): Promise<any> {
    try {
      // Get the integration for this user
      const [integration] = await db
        .select()
        .from(integrations)
        .where(and(
          eq(integrations.userId, userId),
          eq(integrations.provider, 'square'),
          eq(integrations.isActive, true)
        ));
      
      if (!integration || !integration.accessToken || !integration.locationId) {
        throw new Error('User does not have an active Square integration');
      }
      
      // Check if token is expired and refresh if needed
      if (integration.expiresAt && integration.expiresAt < new Date()) {
        if (!integration.refreshToken) {
          throw new Error('Refresh token not available');
        }
        
        // Create Square client for refreshing token
        const client = createSquareClient();
        
        // Refresh the token
        const { result } = await client.oAuthApi.obtainToken({
          clientId: this.applicationId,
          clientSecret: this.applicationSecret,
          refreshToken: integration.refreshToken,
          grantType: 'refresh_token',
        });
        
        const { accessToken, refreshToken, expiresAt } = result;
        
        if (!accessToken || !refreshToken) {
          throw new Error('Failed to refresh Square access token');
        }
        
        // Update the tokens in the database
        await db
          .update(integrations)
          .set({
            accessToken,
            refreshToken,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            updatedAt: new Date(),
          })
          .where(eq(integrations.id, integration.id));
        
        // Update the integration object with new values
        integration.accessToken = accessToken;
        integration.refreshToken = refreshToken;
      }
      
      // Create Square client with access token
      const client = createSquareClient(integration.accessToken);
      
      // Convert amount to cents for Square API
      const amountInCents = BigInt(Math.round(amount * 100));
      
      // Process the payment
      const response = await client.paymentsApi.createPayment({
        sourceId,
        idempotencyKey: randomUUID(),
        amountMoney: {
          amount: amountInCents,
          currency,
        },
        locationId: integration.locationId,
        note: note || `Payment for order #${orderId}`,
      });
      
      if (!response.result.payment) {
        throw new Error('Payment failed');
      }
      
      // Convert the payment amount back for storage
      const paymentAmount = Number(response.result.payment.amountMoney?.amount || 0) / 100;
      
      // Record the payment in our database
      const [paymentRecord] = await db
        .insert(payments)
        .values({
          orderId: orderId.toString(),
          userId: userId.toString(),
          amount: paymentAmount.toString(),
          currency,
          provider: 'square',
          paymentId: response.result.payment.id,
          status: 'completed',
          paymentMethod: 'card',
          notes: note,
        })
        .returning();
      
      return {
        success: true,
        payment: response.result.payment,
        paymentRecord,
      };
    } catch (error) {
      console.error('Error processing Square payment:', error);
      throw error;
    }
  }
}

// Singleton instance
export const squareService = new SquareService();