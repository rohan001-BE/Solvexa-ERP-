export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MovementType =
  | 'OPENING_STOCK'
  | 'PURCHASE'
  | 'SALE'
  | 'SALES_RETURN'
  | 'PURCHASE_RETURN'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT';

export type StockMovementDirection = 'IN' | 'OUT';

export type PurchaseStatus = 'DRAFT' | 'RECEIVED' | 'CANCELLED';
export type SaleStatus = 'CONFIRMED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CARD'
  | 'JAZZCASH'
  | 'EASYPAISA'
  | 'OTHER';
export type PaymentDirection = 'IN' | 'OUT';

export interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Permission {
  id: string;
  code: string;
  description: string | null;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role_id: string | null;
  role?: Role | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  is_active: boolean;
}

export interface Inventory {
  id: string;
  product_id: string;
  product?: Product | null;
  quantity: number;
  quantity_on_hand?: number;
  reserved_quantity: number;
  minimum_stock: number;
  last_counted_at?: string | null;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category_id: string | null;
  category?: Category | null;
  unit_id: string | null;
  unit?: Unit | null;
  brand: string | null;
  purchase_price: number;
  cost_price?: number;
  sale_price: number;
  tax_rate: number;
  minimum_stock: number;
  min_stock_level?: number;
  image_url: string | null;
  is_active: boolean;
  inventory?: Inventory | null;
  stock?: Inventory | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product?: Product | null;
  type: MovementType;
  direction?: StockMovementDirection;
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_by: string | null;
  creator?: Profile | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  company_name: string | null;
  contact_person?: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  credit_limit: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id?: string;
  purchase_id?: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_cost: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Purchase {
  id: string;
  supplier_id: string;
  supplier?: Supplier;
  invoice_number: string;
  subtotal: number;
  discount: number;
  discount_total?: number;
  tax: number;
  tax_total?: number;
  total: number;
  paid_amount: number;
  due_amount: number;
  payment_status: PaymentStatus;
  status: PurchaseStatus;
  items?: PurchaseItem[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseReturnItem {
  id: string;
  purchase_return_id: string;
  purchase_item_id: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

export interface PurchaseReturn {
  id: string;
  purchase_id: string;
  purchase?: Purchase | null;
  return_number: string;
  total: number;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface SaleItem {
  id?: string;
  sale_id?: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  customer?: Customer | null;
  subtotal: number;
  discount: number;
  discount_total?: number;
  tax: number;
  tax_total?: number;
  total: number;
  paid_amount: number;
  due_amount: number;
  payment_status: PaymentStatus;
  status: SaleStatus;
  items?: SaleItem[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleReturnItem {
  id: string;
  sales_return_id: string;
  sale_item_id: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface SaleReturn {
  id: string;
  sale_id: string;
  sale?: Sale | null;
  return_number: string;
  total: number;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  direction: PaymentDirection;
  sale_id: string | null;
  sale?: Sale | null;
  purchase_id: string | null;
  purchase?: Purchase | null;
  customer_id: string | null;
  customer?: Customer | null;
  supplier_id: string | null;
  supplier?: Supplier | null;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  is_active: boolean;
}

export interface Expense {
  id: string;
  expense_category_id: string | null;
  category?: ExpenseCategory | null;
  amount: number;
  method: PaymentMethod;
  note: string | null;
  expense_date: string;
  created_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor?: Profile | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: Json | null;
  after_data: Json | null;
  created_at: string;
}

export interface Settings {
  id: boolean;
  store_name: string;
  store_address: string | null;
  store_phone: string | null;
  currency: string;
  default_tax_rate: number;
  low_stock_alert_enabled: boolean;
  updated_at: string;
}
