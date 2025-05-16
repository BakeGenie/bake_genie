import { XeroClient } from 'xero-node';

// Initialize Xero client with configuration
export const createXeroClient = (accessToken?: string): XeroClient => {
  const client = new XeroClient({
    clientId: process.env.XERO_CLIENT_ID || '',
    clientSecret: process.env.XERO_CLIENT_SECRET || '',
    redirectUris: [process.env.XERO_REDIRECT_URI || 'http://localhost:5000/api/xero/callback'],
    scopes: [
      'offline_access',
      'accounting.transactions',
      'accounting.contacts',
      'accounting.settings',
      'accounting.reports.read',
      'accounting.journals.read',
      'accounting.reports.tenninetynine.read'
    ],
  });

  // Set access token if provided
  if (accessToken) {
    client.setTokenSet({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 1800,
      refresh_token: '', // Will be refreshed if needed
      scope: ''
    });
  }

  return client;
};