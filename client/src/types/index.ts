import { 
  type Order, 
  type OrderItem, 
  type Quote, 
  type QuoteItem, 
  type Contact, 
  type Task, 
  type OrderLog,
  type User,
  type Product,
  type Recipe,
  type Ingredient,
  type RecipeIngredient,
  type Expense,
  type Income,
  type Enquiry,
  type Settings,
  type EventType,
  type OrderStatus,
  type QuoteStatus,
  type DeliveryType,
} from "@shared/schema";

// Extended types that include related data
export interface OrderWithItems extends Order {
  items: OrderItem[];
  contact: Contact;
  logs: OrderLog[];
  tasks: Task[];
}

export interface QuoteWithItems extends Quote {
  items: QuoteItem[];
  contact: Contact;
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: (RecipeIngredient & { ingredient: Ingredient })[];
}

// Month and Year type for date filtering
export interface MonthYear {
  month: number;
  year: number;
}

// Date format options
export interface DateFormatOptions {
  short?: boolean;
  withTime?: boolean;
  dayOfWeek?: boolean;
}

// Filter options for orders and quotes
export interface OrderFilterOptions {
  status?: OrderStatus[];
  eventType?: EventType[];
  startDate?: Date;
  endDate?: Date;
  search?: string;
  contactId?: number;
}

// Profit calculation types
export interface ProfitCalculation {
  revenue: number;
  costs: number;
  profit: number;
  profitMargin: number;
}

// Dashboard stats
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  upcomingOrders: number;
  pendingQuotes: number;
  pendingTasks: number;
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
  ordersByType: {
    type: EventType;
    count: number;
  }[];
}

// Form submission types
export interface OrderFormData {
  userId: number;
  orderNumber: string;
  contactId: number;
  eventType: string;
  eventDate: Date;
  status: string;
  theme?: string;
  deliveryType: string;
  deliveryDetails?: string;
  discount: number;
  discountType: "%" | "$";
  setupFee: number;
  notes?: string;
  jobSheetNotes?: string;
  total?: number;
  imageUrls?: string[];
  items: {
    id?: number;
    productId?: number;
    type: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    price: number;
    notes?: string;
    // Cake specific fields
    isCake?: boolean;
    portionSize?: string;
    numberOfTiers?: number;
    cakeTiers?: {
      diameter: number;
      height: number;
      flavor: string;
      icing: string;
      filling: string;
      sameFlavor?: boolean;
      sameIcing?: boolean;
      sameFilling?: boolean;
    }[];
  }[];
}

export interface ProductFormData {
  type: string;
  name: string;
  description?: string;
  servings?: number;
  price: number;
  cost?: number;
  taxRate?: number;
  laborHours?: number;
  laborRate?: number;
  overhead?: number;
  active?: boolean;
}

export interface RecipeFormData {
  name: string;
  description?: string;
  servings: number;
  instructions?: string;
  prepTime?: number;
  cookTime?: number;
  category?: string;
  ingredients: {
    ingredientId: number;
    quantity: number;
    notes?: string;
  }[];
}

// Cake designer types
export interface CakeDesign {
  tiers: CakeTier[];
  cakeStand: boolean;
  standColor?: string;
  notes?: string;
}

export interface CakeTier {
  shape: 'round' | 'square' | 'heart' | 'hexagon' | 'oval';
  diameter: number;
  height: number;
  color: string;
  filling?: string;
  decorations: CakeDecoration[];
}

export interface CakeDecoration {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
  text?: string;
}

// Portion calculator types
export interface PortionCalculation {
  shape: 'round' | 'square';
  size: number;
  servingStyle: 'party' | 'wedding' | 'dessert';
  portions: number;
}
