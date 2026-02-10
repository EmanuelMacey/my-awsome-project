
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
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Errand, ErrandStatus } from '../../types/errand.types';
import { getErrandById, updateErrandStatus, assignRunner } from '../../api/errands';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { theme } from '../../styles/theme';
import { formatCurrency } from '../../utils/currency';
import { ReceiptModal } from '../../components/ReceiptModal';
import { ConfirmModal } from '../../components/ConfirmModal';

const STATUS_FLOW: { [key in ErrandStatus]?: ErrandStatus } = {
  'pending': 'accepted',
  'accepted': 'at_pickup',
  'at_pickup': 'pickup_complete',
  'pickup_complete': 'en_route',
  'en_route': 'completed',
};

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

function openInGoogleMaps(latitude: number, longitude: number, label: string = 'Location') {
  console.log('🗺️ Admin: Opening Google Maps for:', label);
  const scheme = Platform.select({
    ios: 'maps:0,0?q=',
    android: 'geo:0,0?q=',
    web: 'https://www.google.com/maps/search/?api=1&query=',
  });
  const latLng = `${latitude},${longitude}`;
  const url = Platform.select({
    ios: `${scheme}${label}@${latLng}`,
    android: `${scheme}${latLng}(${label})`,
    web: `${scheme}${latLng}`,
  });

  if (url) {
    Linking.openURL(url).catch(err => console.error('❌ Failed to open Google Maps', err));
  }
}

export default function AdminErrandDetailScreen() {
  const { errandId } = useLocalSearchParams<{ errandId: string }>();
  const { user } = useAuth();
  const [errand, setErrand] = useState<Errand | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchErrand = useCallback(async () => {
    try {
      console.log('📋 Admin: Fetching errand details for:', errandId);
      setError(null);
      const data = await getErrandById(errandId);
      console.log('✅ Admin: Errand data fetched:', data);
      setErrand(data);
    } catch (err: any) {
      console.error('❌ Admin: Error fetching errand:', err);
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
    console.log('🔄 Admin: Refreshing errand data');
    setRefreshing(true);
    fetchErrand();
  };

  const handleAcceptErrand = async () => {
    if (!user || !errand) return;

    console.log('✅ Admin: Accepting errand:', errand.id);
    setUpdating(true);
    try {
      await assignRunner(errand.id, user.id);
      Alert.alert('Success', 'Errand accepted! You are now assigned as the runner.');
      fetchErrand();
    } catch (error: any) {
      console.error('❌ Admin: Error accepting errand:', error);
      Alert.alert('Error', error.message || 'Failed to accept errand');
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectErrand = async () => {
    if (!errand) return;

    console.log('❌ Admin: Rejecting errand:', errand.id);
    setShowRejectModal(false);
    setUpdating(true);
    try {
      await updateErrandStatus(errand.id, 'cancelled');
      Alert.alert('Errand Rejected', 'The errand has been cancelled.');
      fetchErrand();
    } catch (error: any) {
      console.error('❌ Admin: Error rejecting errand:', error);
      Alert.alert('Error', error.message || 'Failed to reject errand');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!errand) return;

    const nextStatus = STATUS_FLOW[errand.status];
    if (!nextStatus) {
      Alert.alert('Info', 'Errand is already at final status');
      return;
    }

    console.log('🔄 Admin: Updating errand status to:', nextStatus);
    setUpdating(true);
    try {
      await updateErrandStatus(errand.id, nextStatus);
      Alert.alert('Success', `Errand status updated to ${STATUS_LABELS[nextStatus]}`);
      fetchErrand();
    } catch (error: any) {
      console.error('❌ Admin: Error updating status:', error);
      Alert.alert('Error', error.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCallCustomer = () => {
    const phone = errand?.customer?.phone;
    if (!phone) {
      Alert.alert('No Phone', 'Customer phone number not available');
      return;
    }
    console.log('📞 Admin: Calling customer:', phone);
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return <LoadingSpinner message="Loading errand details..." />;
  }

  if (error || !errand) {
    return <ErrorMessage message={error || 'Errand not found'} onRetry={fetchErrand} />;
  }

  const isAssignedToMe = errand.runner_id === user?.id;
  const canAccept = errand.status === 'pending' && !errand.runner_id;
  const canReject = errand.status === 'pending' || errand.status === 'accepted';
  const canUpdateStatus = (isAssignedToMe || !errand.runner_id) && errand.status !== 'completed' && errand.status !== 'cancelled';
  const nextStatus = STATUS_FLOW[errand.status];
  const customerName = errand.customer?.name || 'Unknown';
  const customerEmail = errand.customer?.email || 'N/A';
  const customerPhone = errand.customer?.phone || 'N/A';
  const categoryName = errand.category?.name || 'N/A';
  const subcategoryName = errand.subcategory?.name || 'N/A';
  const pickupAddress = errand.pickup_address;
  const dropoffAddress = errand.dropoff_address;
  const errandNumber = errand.errand_number || 'N/A';
  const statusLabel = STATUS_LABELS[errand.status];
  const statusIcon = STATUS_ICONS[errand.status];

  return (
    <>
      <Stack.Screen
        options={{
          title: `Errand #${errandNumber}`,
          headerShown: true,
        }}
      />
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
          <View style={styles.statusProgress}>
            <View style={styles.statusStep}>
              <View style={[styles.statusIcon, errand.status !== 'pending' && styles.statusIconActive]}>
                <Text style={styles.statusIconText}>{statusIcon}</Text>
              </View>
              <Text style={styles.statusLabel}>{statusLabel}</Text>
            </View>
            {nextStatus && (
              <React.Fragment>
                <View style={styles.statusLine} />
                <View style={styles.statusStep}>
                  <View style={styles.statusIcon}>
                    <Text style={styles.statusIconText}>{STATUS_ICONS[nextStatus]}</Text>
                  </View>
                  <Text style={styles.statusLabel}>{STATUS_LABELS[nextStatus]}</Text>
                </View>
              </React.Fragment>
            )}
          </View>
          <Text style={styles.errandNumber}>Errand #{errandNumber}</Text>
        </View>

        {/* Customer Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👤</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{customerName}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📧</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{customerEmail}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📱</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{customerPhone}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.callButton}
            onPress={handleCallCustomer}
          >
            <Text style={styles.callButtonText}>📞 Call Customer</Text>
          </TouchableOpacity>
        </View>

        {/* Service Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📂</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{categoryName}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🔖</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Service</Text>
              <Text style={styles.infoValue}>{subcategoryName}</Text>
            </View>
          </View>
          {errand.instructions && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📝</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Instructions</Text>
                <Text style={styles.infoValue}>{errand.instructions}</Text>
              </View>
            </View>
          )}
          {errand.custom_description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📄</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Description</Text>
                <Text style={styles.infoValue}>{errand.custom_description}</Text>
              </View>
            </View>
          )}
          {errand.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>💬</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={styles.infoValue}>{errand.notes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Locations */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Locations</Text>
          
          <View style={styles.locationSection}>
            <Text style={styles.locationTitle}>📍 Pickup Location</Text>
            <Text style={styles.locationAddress}>{pickupAddress}</Text>
            {errand.pickup_latitude && errand.pickup_longitude && (
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => openInGoogleMaps(
                  Number(errand.pickup_latitude),
                  Number(errand.pickup_longitude),
                  'Pickup Location'
                )}
              >
                <Text style={styles.mapButtonText}>🗺️ View on Google Maps</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.locationSection}>
            <Text style={styles.locationTitle}>🎯 Drop-off Location</Text>
            <Text style={styles.locationAddress}>{dropoffAddress}</Text>
            {errand.dropoff_latitude && errand.dropoff_longitude && (
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => openInGoogleMaps(
                  Number(errand.dropoff_latitude),
                  Number(errand.dropoff_longitude),
                  'Drop-off Location'
                )}
              >
                <Text style={styles.mapButtonText}>🗺️ View on Google Maps</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Runner Info */}
        {errand.runner && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Runner Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🏃</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{errand.runner.name}</Text>
              </View>
            </View>
            {errand.runner.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📱</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{errand.runner.phone}</Text>
                </View>
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
            <Text style={styles.infoBoxIcon}>ℹ️</Text>
            <Text style={styles.infoBoxText}>
              Fixed price - distance does not affect cost
            </Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>GYD${FIXED_ERRAND_PRICE}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>💳</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Payment Method</Text>
              <Text style={styles.infoValue}>
                {errand.payment_method === 'mobile_money' ? 'MMG+' : 
                 errand.payment_method ? errand.payment_method.charAt(0).toUpperCase() + errand.payment_method.slice(1) : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {canAccept && (
          <TouchableOpacity
            style={[styles.button, styles.acceptButton, updating && styles.buttonDisabled]}
            onPress={handleAcceptErrand}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>✓ Accept Errand</Text>
            )}
          </TouchableOpacity>
        )}

        {canReject && (
          <TouchableOpacity
            style={[styles.button, styles.rejectButton, updating && styles.buttonDisabled]}
            onPress={() => setShowRejectModal(true)}
            disabled={updating}
          >
            <Text style={styles.buttonText}>❌ Reject Errand</Text>
          </TouchableOpacity>
        )}

        {canUpdateStatus && nextStatus && (
          <TouchableOpacity
            style={[styles.button, updating && styles.buttonDisabled]}
            onPress={handleUpdateStatus}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {STATUS_ICONS[nextStatus]} Mark as {STATUS_LABELS[nextStatus]}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* View Receipt Button */}
        <TouchableOpacity
          style={[styles.button, styles.receiptButton]}
          onPress={() => {
            console.log('🧾 Admin: Opening receipt modal');
            setShowReceipt(true);
          }}
        >
          <Text style={styles.buttonText}>🧾 View Receipt</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />

        {/* Receipt Modal */}
        <ReceiptModal
          visible={showReceipt}
          onClose={() => setShowReceipt(false)}
          errand={errand}
          type="errand"
        />

        {/* Reject Confirmation Modal */}
        <ConfirmModal
          visible={showRejectModal}
          title="Reject Errand?"
          message="Are you sure you want to reject this errand? This action cannot be undone."
          confirmText="Reject"
          cancelText="Cancel"
          onConfirm={handleRejectErrand}
          onCancel={() => setShowRejectModal(false)}
          confirmColor="#EF4444"
        />
      </ScrollView>
    </>
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
  statusProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  statusStep: {
    alignItems: 'center',
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusIconActive: {
    backgroundColor: theme.colors.primary,
  },
  statusIconText: {
    fontSize: 28,
  },
  statusLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 80,
  },
  statusLine: {
    width: 40,
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  errandNumber: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
    width: 30,
  },
  infoContent: {
    flex: 1,
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
  callButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
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
  mapButton: {
    backgroundColor: theme.colors.primary + '20',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  mapButtonText: {
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
  infoBoxIcon: {
    fontSize: 16,
  },
  infoBoxText: {
    flex: 1,
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  receiptButton: {
    backgroundColor: '#8B5CF6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
