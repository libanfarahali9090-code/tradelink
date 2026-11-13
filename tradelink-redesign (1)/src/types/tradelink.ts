export type Language = 'en' | 'so' | 'am';
export type ThemeMode = 'light' | 'dark';
export type CurrencyCode = 'ETB' | 'USD';

export type UserRole = 'owner' | 'admin' | 'manager' | 'employee' | 'pending';

export type ProductCategory =
  | 'rice'
  | 'flour'
  | 'sugar'
  | 'cooking_oil'
  | 'dates'
  | 'pasta'
  | 'beans'
  | 'other_food';

export type ProductStatus = 'active' | 'inactive' | 'archived';

/** Public availability shown on the marketplace. Derived from stock, never typed in by hand. */
export type ProductAvailability = 'in_stock' | 'low_stock' | 'out_of_stock';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_for_dispatch'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type StockMovementType = 'received' | 'issued' | 'adjustment' | 'transfer';

export type DeliveryStatus = 'scheduled' | 'loading' | 'dispatched' | 'delivered';

export type TransactionType =
  | 'buyer_payment'
  | 'supplier_payment'
  | 'purchase_expense'
  | 'commission_payment';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'other';

export type AppRoute =
  | 'overview'
  | 'products'
  | 'orders'
  | 'suppliers'
  | 'buyers'
  | 'inventory'
  | 'warehouse'
  | 'stock_movements'
  | 'deliveries'
  | 'payments'
  | 'commissions'
  | 'transactions'
  | 'financial_reports'
  | 'analytics'
  | 'team_members'
  | 'activity_logs'
  | 'settings';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Product {
  id: string;
  sku?: string;
  name: string;
  nameSo?: string;
  nameAm?: string;
  category: ProductCategory;
  description?: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  currency: CurrencyCode;
  stockQty: number;
  minStockQty: number;
  status: ProductStatus;
  photoUrl?: string;
  supplierId?: string;
  supplierName?: string;
  warehouseBay?: string;
  origin?: string;
  expiryDate?: string;
  /** Agent who represents this lot and answers customer enquiries. */
  agentId?: string;
  /** Where the customer collects the goods, in plain words (e.g. "Malka Jabdu Central Warehouse, Bay A1"). */
  collectionLocation?: string;
  /** ISO 8601 time of the last stock change. Set on every stock movement. */
  stockUpdatedAt?: string;
  /** Legacy fields from an earlier version of the app. Kept so existing products still save. */
  agentName?: string;
  agentPhone?: string;
  agentWhatsapp?: string;
  agentTelegram?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/** Authorised agent. Contact details are public by design: customers reach agents without an account. */
export interface Agent {
  id: string;
  /** Short public label, e.g. "Agent 001". */
  code: string;
  name: string;
  /** International format with country code, e.g. +251915402280. */
  phone: string;
  /** WhatsApp number in international format. Falls back to phone. */
  whatsapp?: string;
  /** Telegram username without the @. Telegram links need a username; a phone number alone will not open a chat. */
  telegram?: string;
  languages: Language[];
  status: 'active' | 'inactive';
  createdAt?: unknown;
  updatedAt?: unknown;
}

/**
 * What the public marketplace may see. Built from a Product by toPublicListing and stored in
 * `public_listings`. Deliberately has no purchase price, supplier, selling price or minimum
 * stock: those stay in `products`, readable by staff only.
 */
export interface PublicListing {
  id: string;
  sku?: string;
  name: string;
  nameSo?: string;
  nameAm?: string;
  category: ProductCategory;
  description?: string;
  unit: string;
  origin?: string;
  expiryDate?: string;
  photoUrl?: string;
  availability: ProductAvailability;
  stockQty: number;
  agentId?: string;
  collectionLocation?: string;
  warehouseBay?: string;
  stockUpdatedAt?: string;
  updatedAt?: unknown;
}

export interface Order {
  id: string;
  orderCode: string;
  buyerId: string;
  buyerName: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: CurrencyCode;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  orderDate: string;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OrderHistoryEvent {
  id: string;
  orderId: string;
  fromStatus: string;
  toStatus: string;
  actorUid: string;
  actorName: string;
  note?: string;
  createdAt?: unknown;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email?: string;
  city?: string;
  suppliedCategories?: string;
  totalPurchased: number;
  outstandingBalance: number;
  onTimeRate: number;
  status: 'active' | 'inactive';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Buyer {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email?: string;
  city?: string;
  totalOrders: number;
  totalSpent: number;
  outstandingBalance: number;
  status: 'active' | 'inactive';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantityDelta: number;
  balanceAfter: number;
  referenceId: string;
  actorUid: string;
  actorName: string;
  notes?: string;
  createdAt?: unknown;
}

export interface Delivery {
  id: string;
  orderId: string;
  orderCode: string;
  buyerName: string;
  destination: string;
  vehiclePlate: string;
  driverName: string;
  scheduledDate: string;
  status: DeliveryStatus;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FinancialTransaction {
  id: string;
  txCode: string;
  type: TransactionType;
  partyId?: string;
  partyName: string;
  orderId?: string;
  amount: number;
  currency: CurrencyCode;
  method: PaymentMethod;
  status: 'completed' | 'pending';
  date: string;
  notes?: string;
  createdAt?: unknown;
}

export interface CommissionRecord {
  id: string;
  orderId: string;
  orderCode: string;
  productName: string;
  saleAmount: number;
  ratePercent: number;
  commissionAmount: number;
  currency: CurrencyCode;
  payer: 'owner';
  status: 'pending' | 'paid';
  date: string;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AuditEvent {
  id: string;
  actorUid: string;
  actorName: string;
  actorRole: string;
  action: string;
  category: 'order' | 'payment' | 'inventory' | 'supplier' | 'buyer' | 'team' | 'settings';
  summary: string;
  createdAt?: unknown;
}

export interface PlatformSettings {
  id: string;
  businessName: string;
  warehouseName: string;
  location?: string;
  phone?: string;
  email?: string;
  currency: CurrencyCode;
  defaultLanguage: Language;
  commissionRatePercent: number;
  lowStockAlertEnabled: boolean;
  orderAlertEnabled?: boolean;
  paymentAlertEnabled?: boolean;
  updatedAt?: unknown;
}

export interface ToastMessage {
  id: string;
  kind: 'success' | 'error' | 'info';
  title: string;
  detail?: string;
}

export const FOOD_CATEGORIES: ProductCategory[] = [
  'rice',
  'flour',
  'sugar',
  'cooking_oil',
  'dates',
  'pasta',
  'beans',
  'other_food',
];

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'ready_for_dispatch',
  'delivered',
  'cancelled',
];
