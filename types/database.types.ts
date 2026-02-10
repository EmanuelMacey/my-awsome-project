
export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  email?: string;
  role: 'customer' | 'driver' | 'admin';
  avatar_url?: string | null;
  address?: string | null;
  delivery_address?: string | null;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
  city?: string | null;
  country?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  user_id: string;
  address_line: string;
  city: string | null;
  region: string | null;
  notes: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Cart {
  id: string;
  user_id: string;
  store_id?: string | null;
  status: 'active' | 'checked_out';
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  notes?: string | null;
  product?: Product;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  price: number;
  unit?: string;
  image?: string | null;
  images?: any;
  in_stock: boolean;
  stock_quantity?: number | null;
  is_featured: boolean;
  discount_percentage?: number;
  tags?: string[];
  requires_prescription?: boolean;
  options?: any;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  address: string;
  city?: string;
  phone?: string | null;
  email?: string | null;
  logo?: string | null;
  cover_image?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number;
  total_reviews?: number;
  delivery_time?: string;
  delivery_fee?: number;
  min_order?: number;
  is_open: boolean;
  is_featured: boolean;
  opening_hours?: any;
  created_at: string;
  updated_at: string;
}

export interface ServiceZone {
  id: string;
  zone_name: string;
  is_active: boolean;
}

export interface PricingRule {
  id: string;
  base_price: number;
  price_per_km: number;
  minimum_price: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  driver_id?: string | null;
  subtotal: number;
  service_fee: number;
  total: number;
  payment_status: 'Paid' | 'Pending';
  created_at: string;
  customer?: Profile;
  driver?: Profile;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  service_name: string;
  quantity: number;
  price: number;
  distance_km?: number | null;
}

export interface Driver {
  id: string;
  user_id: string;
  vehicle_type?: string | null;
  vehicle_model?: string | null;
  vehicle_color?: string | null;
  license_plate?: string | null;
  license_number?: string | null;
  rating?: number;
  total_deliveries?: number;
  is_available: boolean;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  driver_id?: string | null;
  store_id: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  discount_amount?: number;
  total: number;
  currency: string;
  payment_method: 'cash' | 'card' | 'mobile_money' | 'bank_transfer';
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  delivery_address: string;
  delivery_city?: string;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
  delivery_notes?: string | null;
  customer_phone?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Profile;
  driver?: Profile;
  store?: Store;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  notes?: string | null;
  product?: Product;
  created_at: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'accepted'
  | 'purchasing'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface Message {
  id: string;
  chat_id: string;
  order_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  role: 'customer' | 'driver' | 'admin';
  name?: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}
