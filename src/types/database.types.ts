
export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'customer' | 'driver' | 'admin';
  is_approved: boolean;
  push_token: string | null;
  web_notifications_enabled: boolean | null;
  notification_preferences: {
    orders: boolean;
    chat: boolean;
    promotions: boolean;
  } | null;
  created_at: string;
};

export type Store = {
  id: string;
  name: string;
  address: string;
  logo: string | null;
  description: string | null;
  category: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

export type Product = {
  id: string;
  store_id: string;
  name: string;
  price: number;
  image: string | null;
  description: string | null;
  category: string | null;
  in_stock: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  order_number: string;
  customer_id: string;
  driver_id: string | null;
  store_id: string;
  status: 'pending' | 'confirmed' | 'accepted' | 'purchasing' | 'preparing' | 'ready_for_pickup' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  payment_method: 'cash' | 'card' | 'mobile_money' | 'bank_transfer';
  payment_status: 'pending' | 'paid' | 'failed';
  delivery_address: string;
  delivery_notes: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  customer_phone: string | null;
  created_at: string;
  confirmed_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  updated_at: string | null;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  driver?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  store?: {
    id: string;
    name: string;
    address: string;
    phone: string | null;
    logo: string | null;
  } | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  created_at: string;
  item?: Product | null;
};

export type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    avatar_url: string;
  };
};

export type Chat = {
  id: string;
  order_id: string;
  customer_id: string;
  driver_id: string | null;
  created_at: string;
};
