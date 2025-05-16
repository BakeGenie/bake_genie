import { SquareClient as Client, SquareEnvironment as Environment } from 'square';
import { randomUUID } from 'crypto';

// Square client factory
export function createSquareClient(accessToken?: string) {
  return new Client({
    accessToken,
    environment: process.env.NODE_ENV === 'production' 
      ? Environment.Production 
      : Environment.Sandbox
  });
}

// OAuth URL generator
export function generateOAuthUrl(applicationId: string, userId: number) {
  const state = randomUUID();
  
  // In a real app, this would be stored in Redis or similar with an expiry
  process.env.SQUARE_OAUTH_STATE = JSON.stringify({ state, userId });
  
  const scopes = [
    'PAYMENTS_WRITE',
    'PAYMENTS_READ',
    'ORDERS_READ',
    'ORDERS_WRITE'
  ].join('+');
  
  return `https://connect.squareup.com/oauth2/authorize?client_id=${applicationId}&scope=${scopes}&state=${state}&response_type=code`;
}