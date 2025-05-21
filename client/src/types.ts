import { Order, Contact, OrderItem } from "@shared/schema";

// Define the extended type for orders with items
export interface OrderWithItems extends Order {
  items: OrderItem[];
  contact: Contact;
  total?: number | string;
}