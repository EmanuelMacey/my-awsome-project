
import { supabase } from '../config/supabase';

export interface Driver {
  id: string;
  user_id: string;
  vehicle_type?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  license_plate?: string;
  license_number?: string;
  rating?: number;
  total_deliveries?: number;
  is_available: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Get driver profile
export async function getDriverProfile(userId: string): Promise<Driver | null> {
  console.log('Fetching driver profile for user:', userId);
  
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No driver profile found
      console.log('No driver profile found for user:', userId);
      return null;
    }
    console.error('Error fetching driver profile:', error);
    throw error;
  }
  
  console.log('Driver profile fetched:', data);
  return data;
}

// Create driver profile
export async function createDriverProfile(userId: string, driverData: Partial<Driver>): Promise<Driver> {
  console.log('Creating driver profile for user:', userId);
  
  const { data, error } = await supabase
    .from('drivers')
    .insert({
      user_id: userId,
      ...driverData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating driver profile:', error);
    throw error;
  }
  
  console.log('Driver profile created:', data);
  return data;
}

// Update driver availability
export async function updateDriverAvailability(userId: string, isAvailable: boolean): Promise<void> {
  console.log('Updating driver availability:', { userId, isAvailable });
  
  const { error } = await supabase
    .from('drivers')
    .update({ 
      is_available: isAvailable,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating driver availability:', error);
    throw error;
  }
  
  console.log('Driver availability updated successfully');
}

// Get all available drivers
export async function getAvailableDrivers(): Promise<Driver[]> {
  console.log('Fetching available drivers');
  
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('is_available', true)
    .eq('is_verified', true);

  if (error) {
    console.error('Error fetching available drivers:', error);
    throw error;
  }
  
  console.log('Available drivers fetched:', data?.length || 0);
  return data || [];
}

// Update driver location
export async function updateDriverLocation(
  driverId: string,
  orderId: string | null,
  latitude: number,
  longitude: number,
  heading?: number,
  speed?: number,
  accuracy?: number
): Promise<void> {
  console.log('Updating driver location:', { driverId, orderId, latitude, longitude });
  
  const { error } = await supabase
    .from('driver_locations')
    .insert({
      driver_id: driverId,
      order_id: orderId,
      latitude,
      longitude,
      heading,
      speed,
      accuracy,
    });

  if (error) {
    console.error('Error updating driver location:', error);
    throw error;
  }
  
  console.log('Driver location updated successfully');
}

// Get driver's current location
export async function getDriverLocation(driverId: string): Promise<any> {
  console.log('Fetching driver location:', driverId);
  
  const { data, error } = await supabase
    .from('driver_locations')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('No location found for driver:', driverId);
      return null;
    }
    console.error('Error fetching driver location:', error);
    throw error;
  }
  
  console.log('Driver location fetched:', data);
  return data;
}
