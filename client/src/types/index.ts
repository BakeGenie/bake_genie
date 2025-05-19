export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  businessName?: string;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId?: number;
  recipeId?: number;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  notes?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  contactId: number;
  contact?: Contact;
  eventType: string;
  eventDate: string;
  deliveryType: string;
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  deliveryFee?: number;
  notes?: string;
  isQuote: boolean;
  status: string;
  subtotal: number;
  tax?: number;
  taxRate?: number;
  discount?: number;
  total: number;
  depositAmount?: number;
  depositPaid?: boolean;
  depositPaidDate?: string;
  balancePaid?: boolean;
  balancePaidDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface Task {
  id: number;
  userId: number;
  title: string;
  description?: string;
  dueDate?: string;
  priority: string;
  status: string;
  orderId?: number;
  order?: Order;
  completedAt?: string;
  createdAt: string;
}