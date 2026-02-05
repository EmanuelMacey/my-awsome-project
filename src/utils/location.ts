
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from '../config/supabase';

const LOCATION_TASK_NAME = 'background-location-task';

export interface DriverLocation {
  id: string;
  driver_id: string;
  order_id: string | null;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Request location permissions
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      console.log('Foreground location permission not granted');
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    if (backgroundStatus !== 'granted') {
      console.log('Background location permission not granted');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return false;
  }
}

/**
 * Get current location
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('Location permission not granted');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return location;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

/**
 * Update driver location in database
 */
export async function updateDriverLocation(
  driverId: string,
  orderId: string | null,
  location: Location.LocationObject
): Promise<void> {
  try {
    const { error } = await supabase
      .from('driver_locations')
      .insert({
        driver_id: driverId,
        order_id: orderId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
        accuracy: location.coords.accuracy,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }

    console.log('Driver location updated successfully');
  } catch (error) {
    console.error('Error in updateDriverLocation:', error);
    throw error;
  }
}

/**
 * Get latest driver location
 */
export async function getDriverLocation(driverId: string): Promise<DriverLocation | null> {
  try {
    const { data, error } = await supabase
      .from('driver_locations')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching driver location:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getDriverLocation:', error);
    return null;
  }
}

/**
 * Start tracking driver location
 */
export async function startLocationTracking(driverId: string, orderId: string): Promise<boolean> {
  try {
    const hasPermission = await requestLocationPermissions();
    
    if (!hasPermission) {
      console.log('Location permissions not granted');
      return false;
    }

    // Define the background task
    TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
      if (error) {
        console.error('Location task error:', error);
        return;
      }

      if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        
        if (locations && locations.length > 0) {
          const location = locations[0];
          
          try {
            await updateDriverLocation(driverId, orderId, location);
          } catch (err) {
            console.error('Error updating location in background:', err);
          }
        }
      }
    });

    // Start location updates
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000, // Update every 10 seconds
      distanceInterval: 10, // Or when moved 10 meters
      foregroundService: {
        notificationTitle: 'ErrandRunners',
        notificationBody: 'Tracking your location for delivery',
        notificationColor: '#FF6B6B',
      },
    });

    console.log('Location tracking started');
    return true;
  } catch (error) {
    console.error('Error starting location tracking:', error);
    return false;
  }
}

/**
 * Stop tracking driver location
 */
export async function stopLocationTracking(): Promise<void> {
  try {
    const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    
    if (isTracking) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log('Location tracking stopped');
    }
  } catch (error) {
    console.error('Error stopping location tracking:', error);
  }
}

/**
 * Watch driver location in real-time
 */
export async function watchDriverLocation(
  driverId: string,
  callback: (location: DriverLocation) => void
): Promise<() => void> {
  // Subscribe to real-time updates
  const channel = supabase
    .channel(`driver_location:${driverId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'driver_locations',
        filter: `driver_id=eq.${driverId}`,
      },
      (payload) => {
        console.log('Driver location updated:', payload);
        callback(payload.new as DriverLocation);
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Calculate distance between two coordinates (in kilometers)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}
