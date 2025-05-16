// Import Square SDK
import { SquareClient, SquareEnvironment } from 'square';
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
      // Initialize Square client
      const squareClient = new Square.SquareClient({
        environment: Square.SquareEnvironment.Sandbox // Use SquareEnvironment.Production in production
      });
      
      // Get OAuth token
      const response = await squareClient.oAuthApi.obtainToken({
        clientId: this.SQUARE_APPLICATION_ID,
        clientSecret: this.SQUARE_APPLICATION_SECRET,
        code,
        grantType: 'authorization_code',
      });
      
      const { accessToken, refreshToken, merchantId, expiresAt } = response.result;
      
      if (!accessToken || !refreshToken || !merchantId) {
        throw new Error('Missing required tokens in Square response');
      }
      
      // Get first location for this merchant
      let locationId = '';
      
      // Create a new client with the access token
      const newClient = new Square.SquareClient({
        accessToken,
        environment: Square.SquareEnvironment.Sandbox // Use SquareEnvironment.Production in production
      });
      
      const locationsResponse = await newClient.locationsApi.listLocations();
      
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
      
      if (existingIntegration.length > 0) {
        // Update existing integration
        await db
          .update(integrations)
          .set({
            accessToken,
            refreshToken,
            merchantId,
            locationId,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
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
            accessToken,
            refreshToken,
            merchantId,
            locationId,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
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
  async getClientForUser(userId: number): Promise<Square.SquareClient | null> {
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
        const squareClient = new Square.SquareClient({
          environment: Square.SquareEnvironment.Sandbox // Use SquareEnvironment.Production in production
        });
        
        const response = await squareClient.oAuthApi.obtainToken({
          clientId: this.SQUARE_APPLICATION_ID,
          clientSecret: this.SQUARE_APPLICATION_SECRET,
          refreshToken: integration.refreshToken,
          grantType: 'refresh_token',
        });
        
        const { accessToken, refreshToken, expiresAt } = response.result;
        
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
        
        // Return client with new access token
        return new Square.SquareClient({
          accessToken,
          environment: Square.SquareEnvironment.Sandbox // Use SquareEnvironment.Production in production
        });
      }
      
      // Return client with existing access token
      return new Square.SquareClient({
        accessToken: integration.accessToken,
        environment: Square.SquareEnvironment.Sandbox // Use SquareEnvironment.Production in production
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
      
      // Convert amount to cents and handle as a BigInt for the Square API
      const amountInCents = BigInt(Math.round(amount * 100));
      
      // Create the payment
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
      
      // Convert the payment amount back to a number for storage
      const paymentAmount = Number(response.result.payment.amountMoney?.amount || 0) / 100;
      
      // Record the payment in our database
      const [paymentRecord] = await db
        .insert(payments)
        .values({
          orderId: orderId,
          userId: userId,
          amount: paymentAmount.toString(),
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
        paymentRecord,
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