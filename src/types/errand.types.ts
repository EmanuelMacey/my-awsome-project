
export interface ErrandCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at?: string;
}

export interface ErrandSubcategory {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  requires_authorization: boolean | null;
  estimated_time: string | null;
  base_price: number | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at?: string;
}

export interface Errand {
  id: string;
  errand_number: string;
  customer_id: string;
  runner_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  status: 'pending' | 'accepted' | 'at_pickup' | 'pickup_complete' | 'en_route' | 'completed' | 'cancelled';
  pickup_address: string;
  pickup_city: string | null;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  dropoff_address: string;
  dropoff_city: string | null;
  dropoff_latitude: number | null;
  dropoff_longitude: number | null;
  instructions: string | null;
  notes: string | null;
  custom_description: string | null;
  scheduled_time: string | null;
  is_asap: boolean | null;
  base_price: number;
  distance_fee: number;
  complexity_fee: number;
  total_price: number;
  currency: string | null;
  payment_method: 'cash' | 'card' | 'mobile_money' | 'bank_transfer';
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | null;
  accepted_at: string | null;
  at_pickup_at: string | null;
  pickup_complete_at: string | null;
  en_route_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  customer_rating: number | null;
  customer_review: string | null;
  runner_rating: number | null;
  runner_review: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined data from related tables
  customer?: {
    name: string;
    email?: string;
    phone?: string;
  } | null;
  category?: {
    name: string;
  } | null;
  subcategory?: {
    name: string;
  } | null;
}

export interface ErrandDocument {
  id: string;
  errand_id: string;
  document_type: 'receipt' | 'authorization' | 'photo' | 'other';
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at?: string;
}

export type ErrandStatus = 'pending' | 'accepted' | 'at_pickup' | 'pickup_complete' | 'en_route' | 'completed' | 'cancelled';

export interface ErrandStatusUpdate {
  id: string;
  errand_id: string;
  runner_id: string | null;
  status: ErrandStatus;
  timestamp: string;
  notes: string | null;
  created_at?: string;
}
