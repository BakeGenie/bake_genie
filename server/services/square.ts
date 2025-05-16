import { SquareClient as Client, SquareEnvironment as Environment, SquareError } from 'square';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { integrations, payments } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Square service for handling Square OAuth and payments
 */
export class SquareService {
  private readonly SQUARE_APPLICATION_ID = process.env.SQUARE_APPLICATION_ID || '';
  private readonly SQUARE_APPLICATION_SECRET = process.env.SQUARE_APPLICATION_SECRET || '';
  private readonly REDIRECT_URI = process.env.NODE_ENV === 'production' 
    ? `${process.env.APP_URL}/api/square/callback` 
    : `http://localhost:3000/api/square/callback`;

  /**
   * Get the OAuth URL for connecting a Square account
   */
  getAuthUrl(userId: number): string {
    const state = randomUUID();
    
    // Store state temporarily (would normally use Redis or similar)
    // In a production app, store this state in a database or Redis with an expiry
    process.env.SQUARE_OAUTH_STATE = JSON.stringify({ state, userId });
    
    return `https://connect.squareup.com/oauth2/authorize?client_id=${this.SQUARE_APPLICATION_ID}&scope=PAYMENTS_WRITE+PAYMENTS_READ+ORDERS_READ+ORDERS_WRITE&state=${state}&response_type=code`;
  }

  /**
   * Process the OAuth callback from Square
   */
  async handleCallback(code: string, state: string): Promise<boolean> {
    // Validate state parameter to prevent CSRF attacks
    const stateData = process.env.SQUARE_OAUTH_STATE ? JSON.parse(process.env.SQUARE_OAUTH_STATE) : null;
    
    if (!stateData || stateData.state !== state) {
      throw new Error('Invalid OAuth state');
    }
    
    const userId = stateData.userId;
    
    // Exchange code for access token
    try {
      const squareClient = new Client({
        environment: Environment.Sandbox, // Use Environment.Production in production
      });
      
      const { result } = await squareClient.oAuthApi.obtainToken({
        clientId: this.SQUARE_APPLICATION_ID,
        clientSecret: this.SQUARE_APPLICATION_SECRET,
        code,
        grantType: 'authorization_code',
      });
      
      if (!result.accessToken || !result.refreshToken || !result.merchantId) {
        throw new Error('Missing required tokens in Square response');
      }
      
      // Get first location for this merchant
      let locationId = '';
      
      const newClient = new Client({
        accessToken: result.accessToken,
        environment: Environment.Sandbox, // Use Environment.Production in production
      });
      
      const locationsResponse = await newClient.locationsApi.listLocations();
      
      if (locationsResponse.result.locations && locationsResponse.result.locations.length > 0) {
        locationId = locationsResponse.result.locations[0].id as string;
      }
      
      // Store the integration details in the database
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + (result.expiresIn || 0));
      
      // Check if integration already exists
      const existingIntegration = await db
        .select()
        .from(integrations)
        .where(and(
          eq(integrations.userId, userId),
          eq(integrations.provider, 'square')
        ));
      
      if (existingIntegration.length > 0) {
        // Update existing integration
        await db
          .update(integrations)
          .set({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            merchantId: result.merchantId,
            locationId,
            expiresAt: expiryDate,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(integrations.id, existingIntegration[0].id));
      } else {
        // Create new integration
        await db
          .insert(integrations)
          .values({
            userId,
            provider: 'square',
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            merchantId: result.merchantId,
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
   * Get the Square client for a user
   */
  async getClientForUser(userId: number): Promise<Client | null> {
    try {
      const [integration] = await db
        .select()
        .from(integrations)
        .where(and(
          eq(integrations.userId, userId),
          eq(integrations.provider, 'square'),
          eq(integrations.isActive, true)
        ));
      
      if (!integration || !integration.accessToken) {
        return null;
      }
      
      // Check if token is expired and refresh if needed
      if (integration.expiresAt && integration.expiresAt < new Date()) {
        if (!integration.refreshToken) {
          return null;
        }
        
        // Refresh the token
        const squareClient = new Client({
          environment: Environment.Sandbox, // Use Environment.Production in production
        });
        
        const { result } = await squareClient.oAuthApi.obtainToken({
          clientId: this.SQUARE_APPLICATION_ID,
          clientSecret: this.SQUARE_APPLICATION_SECRET,
          refreshToken: integration.refreshToken,
          grantType: 'refresh_token',
        });
        
        if (!result.accessToken || !result.refreshToken) {
          throw new Error('Failed to refresh Square access token');
        }
        
        // Update the tokens in the database
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + (result.expiresIn || 0));
        
        await db
          .update(integrations)
          .set({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            expiresAt: expiryDate,
            updatedAt: new Date(),
          })
          .where(eq(integrations.id, integration.id));
        
        // Return client with new access token
        return new Client({
          accessToken: result.accessToken,
          environment: Environment.Sandbox, // Use Environment.Production in production
        });
      }
      
      // Return client with existing access token
      return new Client({
        accessToken: integration.accessToken,
        environment: Environment.Sandbox, // Use Environment.Production in production
      });
    } catch (error) {
      console.error('Error getting Square client for user:', error);
      return null;
    }
  }

  /**
   * Process a payment for an order
   */
  async processPayment(userId: number, orderId: number, amount: number, currency: string, sourceId: string, note?: string): Promise<any> {
    try {
      const client = await this.getClientForUser(userId);
      
      if (!client) {
        throw new Error('User does not have an active Square integration');
      }
      
      // Get the location ID for this user
      const [integration] = await db
        .select()
        .from(integrations)
        .where(and(
          eq(integrations.userId, userId),
          eq(integrations.provider, 'square')
        ));
      
      if (!integration || !integration.locationId) {
        throw new Error('No Square location found for this user');
      }
      
      // Create the payment
      const response = await client.paymentsApi.createPayment({
        sourceId,
        idempotencyKey: randomUUID(),
        amountMoney: {
          amount: BigInt(Math.round(amount * 100)), // Convert to cents
          currency,
        },
        locationId: integration.locationId,
        note: note || `Payment for order #${orderId}`,
      });
      
      if (!response.result.payment) {
        throw new Error('Payment failed');
      }
      
      // Record the payment in our database
      const paymentRecord = await db
        .insert(payments)
        .values({
          orderId,
          userId,
          amount,
          currency,
          provider: 'square',
          paymentId: response.result.payment.id,
          status: 'completed',
          paymentMethod: 'card', // Square payments are typically card payments
          notes: note,
        })
        .returning();
      
      // Update the order status to 'Paid'
      // This would depend on your order workflow, so implement as needed
      
      return {
        success: true,
        payment: response.result.payment,
        paymentRecord: paymentRecord[0],
      };
    } catch (error) {
      console.error('Error processing Square payment:', error);
      throw error;
    }
  }

  /**
   * Check if a user has connected their Square account
   */
  async hasConnectedSquare(userId: number): Promise<boolean> {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(
        eq(integrations.userId, userId),
        eq(integrations.provider, 'square'),
        eq(integrations.isActive, true)
      ));
    
    return !!integration;
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
}

export const squareService = new SquareService();