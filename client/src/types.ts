import { Order, Contact, OrderItem } from "@shared/schema";

// Define the extended type for orders with items that might come from API with different structure
export interface OrderWithItems {
  id: number;
  userId: number;
  orderNumber: string;
  contactId: number;
  eventType: string;
  eventDate: string | Date;
  dueDate?: string | Date | null;
  status: string;
  theme?: string | null;
  deliveryType: string;
  deliveryDetails?: string | null;
  deliveryTime?: string | null;
  discount?: string | number;
  discountType?: string;
  setupFee?: string | number;
  taxRate?: string | number;
  total?: string | number;
  totalAmount?: string | number; // Sometimes API returns as totalAmount
  notes?: string | null;
  jobSheetNotes?: string | null;
  imageUrls?: string[] | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  deliveryAddress?: string | null; // Adding this for OrderDetailsDialog
  
  // Extended properties
  items: OrderItem[];
  contact: Contact;
}

// Extend OrderItem to match what the UI expects
export interface ExtendedOrderItem extends OrderItem {
  productName?: string | null;
}