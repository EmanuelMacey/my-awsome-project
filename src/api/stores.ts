
import { supabase } from '../config/supabase';
import { Store, Product } from '../types/database.types';

export async function getStores(): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getStoreById(id: string): Promise<Store | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getStoreItems(storeId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProducts(filters?: {
  storeId?: string;
  requiresPrescription?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}): Promise<Product[]> {
  let query = supabase.from('products').select('*');

  if (filters?.storeId) {
    query = query.eq('store_id', filters.storeId);
  }

  if (filters?.requiresPrescription !== undefined) {
    query = query.eq('requires_prescription', filters.requiresPrescription);
  }

  if (filters?.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters?.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  if (filters?.inStock !== undefined) {
    query = query.eq('in_stock', filters.inStock);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function createStore(store: Omit<Store, 'id' | 'created_at'>): Promise<Store> {
  const { data, error } = await supabase
    .from('stores')
    .insert(store)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateStore(id: string, updates: Partial<Store>): Promise<Store> {
  const { data, error } = await supabase
    .from('stores')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('images')
    .createSignedUrl(path, 3600);

  if (error) throw error;
  return data.signedUrl;
}
