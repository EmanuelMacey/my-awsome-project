
import * as Location from 'expo-location';

export const PRICING_CONFIG = {
  BASE_PRICE: 800, // Minimum charge in GYD
  PRICE_PER_KM: 150, // Price per kilometer
  MINIMUM_TOTAL: 800, // Minimum total enforced
};

export const SERVICE_ZONES = {
  GEORGETOWN: { name: 'Georgetown', region: 'Region 4', active: true },
  EAST_BANK: { name: 'East Bank Demerara', region: 'Region 4', active: true },
  EAST_COAST: { name: 'East Coast Demerara', region: 'Region 4', active: true },
  REGION_3: { name: 'Region 3', region: 'Region 3', active: false },
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimals
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate delivery price based on distance
 * Formula: BASE_PRICE + (distance_km * PRICE_PER_KM)
 * Minimum: MINIMUM_TOTAL ($800)
 */
export function calculateDeliveryPrice(distanceKm: number): number {
  const calculatedPrice = PRICING_CONFIG.BASE_PRICE + (distanceKm * PRICING_CONFIG.PRICE_PER_KM);
  return Math.max(calculatedPrice, PRICING_CONFIG.MINIMUM_TOTAL);
}

/**
 * Calculate price breakdown for display
 */
export function calculatePriceBreakdown(distanceKm: number) {
  const basePrice = PRICING_CONFIG.BASE_PRICE;
  const distanceFee = distanceKm * PRICING_CONFIG.PRICE_PER_KM;
  const subtotal = basePrice + distanceFee;
  const total = Math.max(subtotal, PRICING_CONFIG.MINIMUM_TOTAL);
  
  return {
    basePrice,
    distanceFee,
    distanceKm,
    subtotal,
    total,
    minimumApplied: total > subtotal,
  };
}

/**
 * Check if coordinates are within service area
 * Georgetown, East Bank, East Coast allowed
 * Region 3 blocked
 */
export async function isWithinServiceArea(
  latitude: number,
  longitude: number
): Promise<{ allowed: boolean; zone?: string; message?: string }> {
  // Georgetown approximate bounds (6.78-6.85 N, -58.20 to -58.12 W)
  const georgetownBounds = {
    minLat: 6.78, maxLat: 6.85,
    minLon: -58.20, maxLon: -58.12
  };
  
  // East Bank approximate bounds (6.70-6.85 N, -58.25 to -58.15 W)
  const eastBankBounds = {
    minLat: 6.70, maxLat: 6.85,
    minLon: -58.25, maxLon: -58.15
  };
  
  // East Coast approximate bounds (6.75-6.90 N, -58.10 to -57.95 W)
  const eastCoastBounds = {
    minLat: 6.75, maxLat: 6.90,
    minLon: -58.10, maxLon: -57.95
  };
  
  // Check Georgetown
  if (
    latitude >= georgetownBounds.minLat && latitude <= georgetownBounds.maxLat &&
    longitude >= georgetownBounds.minLon && longitude <= georgetownBounds.maxLon
  ) {
    return { allowed: true, zone: 'Georgetown' };
  }
  
  // Check East Bank
  if (
    latitude >= eastBankBounds.minLat && latitude <= eastBankBounds.maxLat &&
    longitude >= eastBankBounds.minLon && longitude <= eastBankBounds.maxLon
  ) {
    return { allowed: true, zone: 'East Bank Demerara' };
  }
  
  // Check East Coast
  if (
    latitude >= eastCoastBounds.minLat && latitude <= eastCoastBounds.maxLat &&
    longitude >= eastCoastBounds.minLon && longitude <= eastCoastBounds.maxLon
  ) {
    return { allowed: true, zone: 'East Coast Demerara' };
  }
  
  // Not in service area
  return {
    allowed: false,
    message: '⚠️ Sorry, we currently do not service Region 3.\n\nAvailable areas:\n• Georgetown\n• East Bank Demerara\n• East Coast Demerara'
  };
}

/**
 * Format currency in GYD
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Get store location (default Georgetown coordinates)
 */
export function getDefaultStoreLocation() {
  return {
    latitude: 6.8013,
    longitude: -58.1551,
    address: 'Georgetown, Guyana'
  };
}
