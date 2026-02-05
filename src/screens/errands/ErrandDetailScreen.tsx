
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  RefreshControl,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Errand, ErrandStatus } from '../../types/errand.types';
import { getErrandById, updateErrandStatus, getErrandStatusUpdates } from '../../api/errands';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { theme } from '../../styles/theme';
import { formatCurrency } from '../../utils/currency';

const STATUS_LABELS: { [key in ErrandStatus]: string } = {
  'pending': 'Pending',
  'accepted': 'Accepted',
  'at_pickup': 'At Pickup',
  'pickup_complete': 'Pickup Complete',
  'en_route': 'En Route',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
};

const STATUS_ICONS: { [key in ErrandStatus]: string } = {
  'pending': '⏳',
  'accepted': '✅',
  'at_pickup': '📍',
  'pickup_complete': '📦',
  'en_route': '🚗',
  'completed': '✓',
  'cancelled': '❌',
};

// Fixed errand price
const FIXED_ERRAND_PRICE = 2000;

export default function ErrandDetailScreen() {
  const { errandId } = useLocalSearchParams<{ errandId: string }>();
  const { user } = useAuth();
  const [errand, setErrand] = useState<Errand | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchErrand = useCallback(async () => {
    try {
      setError(null);
      const data = await getErrandById(errandId);
      setErrand(data);
    } catch (err: any) {
      console.error('Error fetching errand:', err);
      setError(err.message || 'Failed to load errand');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [errandId]);

  useEffect(() => {
    fetchErrand();
  }, [fetchErrand]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchErrand();
  };

  const handleViewLocation = (latitude?: number, longitude?: number, address?: string) => {
    if (latitude && longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      Linking.openURL(url).catch((err) => {
        console.error('Error opening maps:', err);
        Alert.alert('Error', 'Could not open maps');
      });
    } else if (address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      Linking.openURL(url).catch((err) => {
        console.error('Error opening maps:', err);
        Alert.alert('Error', 'Could not open maps');
      });
    } else {
      Alert.alert('No Location', 'Location information not available');
    }
  };

  const handleContactSupport = () => {
    const phoneNumber = '5927219769';
    const message = 'Hello, I need help with my errand on ErrandRunners.';
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          const webWhatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
          return Linking.openURL(webWhatsappUrl);
        }
      })
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        Alert.alert('Error', 'Could not open WhatsApp. Please contact us at 592-721-9769');
      });
  };

  if (loading) {
    return <LoadingSpinner message="Loading errand..." />;
  }

  if (error || !errand) {
    return <ErrorMessage message={error || 'Errand not found'} onRetry={fetchErrand} />;
  }

  const isCustomer = errand.customer_id === user?.id;
  const isRunner = errand.runner_id === user?.id;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Status Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Errand Status</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusIcon}>{STATUS_ICONS[errand.status]}</Text>
          <Text style={styles.statusText}>{STATUS_LABELS[errand.status]}</Text>
        </View>
        {errand.errand_number && (
          <Text style={styles.errandNumber}>Errand #{errand.errand_number}</Text>
        )}
      </View>

      {/* Service Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Service Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Category:</Text>
          <Text style={styles.infoValue}>{errand.category?.name || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Service:</Text>
          <Text style={styles.infoValue}>{errand.subcategory?.name || 'N/A'}</Text>
        </View>
        {errand.instructions && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Instructions:</Text>
            <Text style={styles.infoValue}>{errand.instructions}</Text>
          </View>
        )}
        {errand.custom_description && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Description:</Text>
            <Text style={styles.infoValue}>{errand.custom_description}</Text>
          </View>
        )}
        {errand.notes && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Notes:</Text>
            <Text style={styles.infoValue}>{errand.notes}</Text>
          </View>
        )}
      </View>

      {/* Locations */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Locations</Text>
        
        <View style={styles.locationSection}>
          <Text style={styles.locationTitle}>📍 Pickup Location</Text>
          <Text style={styles.locationAddress}>{errand.pickup_address}</Text>
          {(errand.pickup_latitude && errand.pickup_longitude) && (
            <TouchableOpacity
              style={styles.viewMapButton}
              onPress={() => handleViewLocation(
                Number(errand.pickup_latitude),
                Number(errand.pickup_longitude),
                errand.pickup_address
              )}
            >
              <Text style={styles.viewMapButtonText}>🗺️ View on Map</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.locationSection}>
          <Text style={styles.locationTitle}>📍 Drop-off Location</Text>
          <Text style={styles.locationAddress}>{errand.dropoff_address}</Text>
          {(errand.dropoff_latitude && errand.dropoff_longitude) && (
            <TouchableOpacity
              style={styles.viewMapButton}
              onPress={() => handleViewLocation(
                Number(errand.dropoff_latitude),
                Number(errand.dropoff_longitude),
                errand.dropoff_address
              )}
            >
              <Text style={styles.viewMapButtonText}>🗺️ View on Map</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Runner Info */}
      {errand.runner && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Runner Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{errand.runner.name}</Text>
          </View>
          {errand.runner.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{errand.runner.phone}</Text>
            </View>
          )}
        </View>
      )}

      {/* Pricing - Fixed at GYD$2000 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Errand Price:</Text>
          <Text style={styles.priceValue}>GYD${FIXED_ERRAND_PRICE}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Fixed price - distance does not affect cost
          </Text>
        </View>
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>GYD${FIXED_ERRAND_PRICE}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Payment Method:</Text>
          <Text style={styles.infoValue}>
            {errand.payment_method === 'mobile_money' ? 'MMG+' : 
             errand.payment_method ? errand.payment_method.charAt(0).toUpperCase() + errand.payment_method.slice(1) : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Contact Support */}
      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Need Help?</Text>
        <Text style={styles.contactText}>
          If you have any inquiries or difficulties, please contact management:
        </Text>
        <TouchableOpacity style={styles.whatsappButton} onPress={handleContactSupport}>
          <Text style={styles.whatsappIcon}>💬</Text>
          <Text style={styles.whatsappText}>WhatsApp: 592-721-9769</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    ...(isWeb && {
      maxWidth: 800,
      marginHorizontal: 'auto',
      width: '100%',
    }),
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  statusIcon: {
    fontSize: 40,
    marginRight: theme.spacing.md,
  },
  statusText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  errandNumber: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  infoRow: {
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  locationSection: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  locationTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  locationAddress: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  viewMapButton: {
    backgroundColor: theme.colors.primary + '20',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  viewMapButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  priceLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  priceValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  totalRow: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalLabel: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '20',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
  },
  contactCard: {
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  contactTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  contactText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  whatsappIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  whatsappText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: '#FFFFFF',
  },
});
