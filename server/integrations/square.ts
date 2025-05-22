// Import Square SDK
import { ApiError, Client as SquareClient } from 'square';

const squareApplicationId = process.env.SQUARE_APPLICATION_ID;
const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
const squareLocationId = process.env.SQUARE_LOCATION_ID;

if (!squareApplicationId || !squareAccessToken || !squareLocationId) {
  console.warn('Warning: Square application credentials not found in environment variables');
}

let squareClient: SquareClient | null = null;

if (squareApplicationId && squareAccessToken) {
  squareClient = new SquareClient({
    environment: 'sandbox', // Change to 'production' for production
    accessToken: squareAccessToken,
  });
}

export async function createPayment(
  sourceId: string,
  amount: number,
  currency: string = 'USD',
  note: string = '',
  referenceId: string = '',
) {
  if (!squareClient || !squareLocationId) {
    throw new Error('Square is not configured. Please set Square environment variables.');
  }

  try {
    const { result } = await squareClient.paymentsApi.createPayment({
      sourceId,
      amountMoney: {
        amount: Math.round(amount * 100), // Convert to cents
        currency,
      },
      locationId: squareLocationId,
      note,
      referenceId,
      idempotencyKey: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    });

    return result.payment;
  } catch (error: any) {
    console.error('Error creating Square payment:', error);
    throw error;
  }
}

export async function getPayment(paymentId: string) {
  if (!squareClient) {
    throw new Error('Square is not configured. Please set Square environment variables.');
  }

  try {
    const { result } = await squareClient.paymentsApi.getPayment(paymentId);
    return result.payment;
  } catch (error: any) {
    console.error('Error retrieving Square payment:', error);
    throw error;
  }
}

export async function createCustomer(
  givenName: string,
  familyName: string,
  emailAddress: string,
  phoneNumber?: string,
  note?: string,
) {
  if (!squareClient) {
    throw new Error('Square is not configured. Please set Square environment variables.');
  }

  try {
    const { result } = await squareClient.customersApi.createCustomer({
      givenName,
      familyName,
      emailAddress,
      phoneNumber,
      note,
      referenceId: `${Date.now()}`,
    });

    return result.customer;
  } catch (error: any) {
    console.error('Error creating Square customer:', error);
    throw error;
  }
}

export async function getCustomer(customerId: string) {
  if (!squareClient) {
    throw new Error('Square is not configured. Please set Square environment variables.');
  }

  try {
    const { result } = await squareClient.customersApi.retrieveCustomer(customerId);
    return result.customer;
  } catch (error: any) {
    console.error('Error retrieving Square customer:', error);
    throw error;
  }
}

export async function createOrder(
  locationId: string = squareLocationId || '',
  lineItems: Array<{
    name: string;
    quantity: string;
    basePriceMoney: {
      amount: number;
      currency: string;
    };
  }>,
  customerId?: string,
  note?: string,
) {
  if (!squareClient || !locationId) {
    throw new Error('Square is not configured. Please set Square environment variables.');
  }

  try {
    const { result } = await squareClient.ordersApi.createOrder({
      order: {
        locationId,
        customerId,
        lineItems,
        state: 'OPEN',
        source: {
          name: 'Bakery Management System',
        },
        note,
      },
      idempotencyKey: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    });

    return result.order;
  } catch (error: any) {
    console.error('Error creating Square order:', error);
    throw error;
  }
}

export async function getOrder(orderId: string) {
  if (!squareClient) {
    throw new Error('Square is not configured. Please set Square environment variables.');
  }

  try {
    const { result } = await squareClient.ordersApi.retrieveOrder(orderId);
    return result.order;
  } catch (error: any) {
    console.error('Error retrieving Square order:', error);
    throw error;
  }
}

export default {
  client: squareClient,
  locationId: squareLocationId,
  createPayment,
  getPayment,
  createCustomer,
  getCustomer,
  createOrder,
  getOrder,
};