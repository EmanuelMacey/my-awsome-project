
import { supabase } from '../config/supabase';
import { calculateDistance } from './location';

export interface PricingRules {
  base_price: number;
  price_per_km: number;
  minimum_price: number;
}

interface ItemWithQuantity {
  price: number;
  quantity: number;
}

let cachedPricingRules: PricingRules | null = null;

// TODO: Backend Integration - Fetch pricing rules from backend API
export async function getPricingRules(): Promise<PricingRules> {
  // Return cached rules if available
  if (cachedPricingRules) {
    return cachedPricingRules;
  }

  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching pricing rules:', error);
      // Return default values if fetch fails - MINIMUM $1000
      return {
        base_price: 1000,
        price_per_km: 150,
        minimum_price: 1000,
      };
    }

    cachedPricingRules = {
      base_price: Number(data.base_price),
      price_per_km: Number(data.price_per_km),
      minimum_price: Number(data.minimum_price),
    };

    return cachedPricingRules;
  } catch (error) {
    console.error('Exception fetching pricing rules:', error);
    return {
      base_price: 1000,
      price_per_km: 150,
      minimum_price: 1000,
    };
  }
}

// TODO: Backend Integration - Calculate delivery price based on distance for fast food
export async function calculateDeliveryPrice(distanceKm: number): Promise<number> {
  const rules = await getPricingRules();
  
  // Price = base_price + (distance_in_km × price_per_km)
  const calculatedPrice = rules.base_price + (distanceKm * rules.price_per_km);
  
  // IF calculated_price < minimum_price THEN price = minimum_price
  // Ensure delivery fee is NEVER less than $1000
  const finalPrice = Math.max(calculatedPrice, rules.minimum_price);
  
  return Math.round(finalPrice);
}

/**
 * Calculate delivery fee based on store and delivery coordinates
 * Ensures minimum $1000 delivery fee for fast food orders
 */
export function calculateDeliveryFee(
  storeLatitude: number,
  storeLongitude: number,
  deliveryLatitude: number,
  deliveryLongitude: number
): number {
  try {
    // Calculate distance in kilometers
    const distance = calculateDistance(
      storeLatitude,
      storeLongitude,
      deliveryLatitude,
      deliveryLongitude
    );

    // Base price $1000 + $150 per km
    const basePrice = 1000;
    const pricePerKm = 150;
    const calculatedFee = basePrice + (distance * pricePerKm);
    
    // Ensure minimum $1000
    const finalFee = Math.max(calculatedFee, 1000);

    console.log(`Distance: ${distance.toFixed(2)} km, Delivery Fee: GYD$${finalFee}`);

    return Math.round(finalFee);
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    // Return minimum fee on error
    return 1000;
  }
}

// Clear cached pricing rules (call this when rules are updated)
export function clearPricingCache() {
  cachedPricingRules = null;
}

// Check if a service zone is active
export async function isServiceZoneActive(zoneName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('service_zones')
      .select('is_active')
      .eq('zone_name', zoneName)
      .single();

    if (error) {
      console.error('Error checking service zone:', error);
      return false;
    }

    return data?.is_active || false;
  } catch (error) {
    console.error('Exception checking service zone:', error);
    return false;
  }
}

// Get all service zones
export async function getServiceZones(): Promise<ItemWithQuantity[]> {
  try {
    const { data, error } = await supabase
      .from('service_zones')
      .select('zone_name, is_active')
      .order('zone_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching service zones:', error);
    return [];
  }
}
