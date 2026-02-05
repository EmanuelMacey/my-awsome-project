
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../styles/theme';
import * as Location from 'expo-location';

interface LocationPickerProps {
  onLocationSelected: (address: string, latitude: number, longitude: number) => void;
  initialAddress?: string;
  initialLatitude?: number;
  initialLongitude?: number;
}

export function LocationPicker({
  onLocationSelected,
  initialAddress = '',
  initialLatitude,
  initialLongitude,
}: LocationPickerProps) {
  const [address, setAddress] = useState(initialAddress);
  const [latitude, setLatitude] = useState<number | undefined>(initialLatitude);
  const [longitude, setLongitude] = useState<number | undefined>(initialLongitude);
  const [loading, setLoading] = useState(false);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use this feature. Please enable it in your device settings.'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      setLatitude(latitude);
      setLongitude(longitude);

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const formattedAddress = [
          addr.street,
          addr.city,
          addr.region,
          addr.country,
        ]
          .filter(Boolean)
          .join(', ');
        setAddress(formattedAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        onLocationSelected(formattedAddress, latitude, longitude);
      } else {
        const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setAddress(coords);
        onLocationSelected(coords, latitude, longitude);
      }

      Alert.alert('Success', 'Location pinned successfully!');
    } catch (error: any) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again or enter manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = () => {
    if (address.trim() && latitude !== undefined && longitude !== undefined) {
      onLocationSelected(address, latitude, longitude);
    } else if (address.trim()) {
      // If only address is provided, use default Georgetown coordinates
      const defaultLat = 6.8013;
      const defaultLng = -58.1551;
      setLatitude(defaultLat);
      setLongitude(defaultLng);
      onLocationSelected(address, defaultLat, defaultLng);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Delivery Location</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter delivery address"
        placeholderTextColor={theme.colors.textSecondary}
        value={address}
        onChangeText={setAddress}
        onBlur={handleManualEntry}
        multiline
        numberOfLines={2}
      />

      {latitude !== undefined && longitude !== undefined && (
        <View style={styles.coordinatesContainer}>
          <Text style={styles.coordinatesLabel}>📍 Coordinates:</Text>
          <Text style={styles.coordinatesText}>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={getCurrentLocation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <React.Fragment>
            <Text style={styles.buttonIcon}>📍</Text>
            <Text style={styles.buttonText}>Use Current Location</Text>
          </React.Fragment>
        )}
      </TouchableOpacity>

      <Text style={styles.note}>
        💡 Tip: Pin your exact location for accurate delivery
      </Text>

      <Text style={styles.mapNote}>
        📱 Note: Interactive map view is not available in this version. 
        Use &quot;Current Location&quot; button to pin your exact coordinates.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  coordinatesContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  coordinatesLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  coordinatesText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  buttonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: '#FFFFFF',
  },
  note: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  mapNote: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 16,
  },
});
