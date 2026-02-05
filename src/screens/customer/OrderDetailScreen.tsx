
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  RefreshControl, 
  Platform 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Order, OrderItem } from '../../types/database.types';
import { getOrderById, getOrderItems } from '../../api/orders';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { supabase } from '../../config/supabase';
import { theme } from '../../styles/theme';
import { formatCurrency } from '../../utils/currency';
import { RealtimeChannel } from '@supabase/supabase-js';
import { watchDriverLocation, calculateDistance, DriverLocation } from '../../utils/location';
import { Map, MapMarker } from '../../../components/Map';
import { ReceiptModal } from '../../components/ReceiptModal';

const STATUS_ICONS: Record<string, string> = {
  'pending': '⏳',
  'confirmed': '✅',
  'accepted': '✅',
  'preparing': '👨‍🍳',
  'ready_for_pickup': '📦',
  'picked_up': '🚗',
  'in_transit': '🚚',
  'delivered': '✓',
  'cancelled': '❌',
};

const STATUS_LABELS: Record<string, string> = {
  'pending': 'Pending',
  'confirmed': 'Confirmed',
  'accepted': 'Accepted',
  'preparing': 'Preparing',
  'ready_for_pickup': 'Ready for Pickup',
  'picked_up': 'Picked Up',
  'in_transit': 'In Transit',
  'delivered': 'Delivered',
  'cancelled': 'Cancelled',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const locationUnsubscribeRef = useRef<(() => void) | null>(null);

  const fetchOrderData = useCallback(async () => {
    try {
      setError(null);
      const [orderData, itemsData] = await Promise.all([
        getOrderById(id!),
        getOrderItems(id!),
      ]);
      setOrder(orderData);
      setOrderItems(itemsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderData();
    // Setup Realtime Subscription
    const channel = supabase.channel(`orders:${id}`).on('broadcast', { event: 'UPDATE' }, () => fetchOrderData()).subscribe();
    channelRef.current = channel;
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [id, fetchOrderData]);

  // Driver Location Logic - Fixed dependency array
  useEffect(() => {
    if (!order?.driver_id || ['delivered', 'cancelled'].includes(order.status)) {
      return;
    }

    const deliveryLat = order.delivery_latitude;
    const deliveryLng = order.delivery_longitude;

    const unsubscribe = watchDriverLocation(order.driver_id, (location) => {
      setDriverLocation(location);
      if (deliveryLat && deliveryLng) {
        setEstimatedDistance(calculateDistance(location.latitude, location.longitude, deliveryLat, deliveryLng));
      }
    });
    
    locationUnsubscribeRef.current = unsubscribe;
    return () => locationUnsubscribeRef.current?.();
  }, [order?.driver_id, order?.status, order?.delivery_latitude, order?.delivery_longitude]);

  if (loading) return <LoadingSpinner message="Loading order details..." />;
  if (error || !order) return <ErrorMessage message={error || 'Order not found'} onRetry={fetchOrderData} />;

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderData();
  };

  const statusLabel = STATUS_LABELS[order.status] || order.status.replace('_', ' ').toUpperCase();
  const statusIcon = STATUS_ICONS[order.status] || '📋';

  // Prepare map markers
  const mapMarkers: MapMarker[] = [];
  
  // Add driver location marker if available
  if (driverLocation) {
    mapMarkers.push({
      id: 'driver',
      latitude: driverLocation.latitude,
      longitude: driverLocation.longitude,
      title: '🚗 Driver',
      description: order.driver?.name || 'Your driver',
    });
  }
  
  // Add delivery location marker
  if (order.delivery_latitude && order.delivery_longitude) {
    mapMarkers.push({
      id: 'delivery',
      latitude: order.delivery_latitude,
      longitude: order.delivery_longitude,
      title: '🎯 Delivery Location',
      description: order.delivery_address,
    });
  }

  // Show map if driver is assigned and order is not delivered/cancelled
  const showMap = order.driver_id && !['delivered', 'cancelled'].includes(order.status) && mapMarkers.length > 0;

  // Calculate map center
  const mapCenter = driverLocation 
    ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude }
    : order.delivery_latitude && order.delivery_longitude
    ? { latitude: order.delivery_latitude, longitude: order.delivery_longitude }
    : { latitude: 6.8013, longitude: -58.1551 }; // Default to Georgetown, Guyana

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 1. Status Card - Errand Style */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusIcon}>{statusIcon}</Text>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
        <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
      </View>

      {/* 2. Driver Tracking Map - Shows when driver accepts order */}
      {showMap && (
        <View style={styles.card}>
          <View style={styles.mapHeader}>
            <Text style={styles.sectionTitle}>Track Your Driver</Text>
            {estimatedDistance !== null && (
              <Text style={styles.distanceText}>
                📍 {estimatedDistance.toFixed(1)} km away
              </Text>
            )}
          </View>
          <View style={styles.mapContainer}>
            <Map
              markers={mapMarkers}
              initialRegion={{
                latitude: mapCenter.latitude,
                longitude: mapCenter.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              style={styles.map}
            />
          </View>
          {driverLocation && (
            <Text style={styles.mapCaption}>
              🚗 {order.driver?.name || 'Your driver'} is on the way
            </Text>
          )}
        </View>
      )}

      {/* 3. Quick Chat Button - Floating bubble when driver is assigned */}
      {order.driver_id && !['delivered', 'cancelled'].includes(order.status) && (
        <TouchableOpacity 
          style={styles.floatingChatButton}
          onPress={() => router.push(`/chat/${order.id}`)}
        >
          <Text style={styles.floatingChatIcon}>💬</Text>
          <Text style={styles.floatingChatText}>Chat with Driver</Text>
        </TouchableOpacity>
      )}

      {/* 4. Items Breakdown - "The Receipt" */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Items from {order.store?.name || 'Store'}</Text>
        {orderItems.map((item, index) => {
          const itemName = item.product_name || item.item?.name || 'Item';
          const itemPrice = item.product_price || 0;
          const itemQuantity = item.quantity || 1;
          const itemTotal = itemPrice * itemQuantity;
          
          return (
            <View key={index} style={styles.receiptRow}>
              <View style={styles.receiptItemInfo}>
                <Text style={styles.receiptItemName}>{itemQuantity}x {itemName}</Text>
              </View>
              <Text style={styles.receiptItemPrice}>{formatCurrency(itemTotal)}</Text>
            </View>
          );
        })}
        
        <View style={styles.divider} />
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Subtotal:</Text>
          <Text style={styles.priceValue}>{formatCurrency(order.subtotal)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Delivery Fee:</Text>
          <Text style={styles.priceValue}>{formatCurrency(order.delivery_fee)}</Text>
        </View>
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
        </View>
      </View>

      {/* 5. Locations Card - Errand Style */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Locations</Text>
        
        {order.store && (
          <View style={styles.locationSection}>
            <Text style={styles.locationTitle}>📍 Pickup Location (Store)</Text>
            <Text style={styles.locationAddress}>{order.store.name}</Text>
            <Text style={styles.locationAddress}>{order.store.address}</Text>
          </View>
        )}

        <View style={styles.locationSection}>
          <Text style={styles.locationTitle}>🎯 Delivery Location</Text>
          <Text style={styles.locationAddress}>{order.delivery_address}</Text>
        </View>
      </View>

      {/* 6. Driver Information - Errand Style */}
      {order.driver && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Runner Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{order.driver.name}</Text>
          </View>
          {order.driver.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{order.driver.phone}</Text>
            </View>
          )}
          <View style={styles.driverActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => {
                const phoneNumber = order.driver?.phone;
                if (phoneNumber) {
                  Linking.openURL(`tel:${phoneNumber}`);
                }
              }}
            >
              <Text style={styles.actionButtonText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]} 
              onPress={() => router.push(`/chat/${order.id}`)}
            >
              <Text style={styles.actionButtonText}>💬 Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 7. Payment Details - Errand Style */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Method:</Text>
          <Text style={styles.infoValue}>
            {order.payment_method === 'mobile_money' ? '📱 MMG+' : '💵 Cash on Delivery'}
          </Text>
        </View>
      </View>

      {/* View Receipt Button */}
      <TouchableOpacity 
        style={styles.receiptButton}
        onPress={() => setShowReceipt(true)}
      >
        <Text style={styles.receiptButtonText}>🧾 View Receipt</Text>
      </TouchableOpacity>

      <View style={{ height: 120 }} />

      {/* Receipt Modal */}
      <ReceiptModal
        visible={showReceipt}
        onClose={() => setShowReceipt(false)}
        order={order}
        orderItems={orderItems}
        type="order"
      />
    </ScrollView>
  );
}

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    ...(isWeb && { maxWidth: 800, marginHorizontal: 'auto', width: '100%' }),
  },
  contentContainer: { 
    padding: theme.spacing.md, 
    paddingBottom: 100 
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
    marginRight: theme.spacing.md 
  },
  statusText: { 
    fontSize: theme.fontSize.xl, 
    fontWeight: theme.fontWeight.bold, 
    color: theme.colors.text 
  },
  orderNumber: { 
    fontSize: theme.fontSize.sm, 
    color: theme.colors.textSecondary, 
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  receiptRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  receiptItemInfo: {
    flex: 1,
  },
  receiptItemName: { 
    fontSize: theme.fontSize.md, 
    color: theme.colors.text,
  },
  receiptItemPrice: { 
    fontSize: theme.fontSize.md, 
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  divider: { 
    height: 1, 
    backgroundColor: theme.colors.border, 
    marginVertical: theme.spacing.md 
  },
  priceRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: theme.spacing.xs 
  },
  priceLabel: { 
    color: theme.colors.textSecondary, 
    fontSize: theme.fontSize.sm 
  },
  priceValue: { 
    color: theme.colors.text, 
    fontSize: theme.fontSize.sm 
  },
  totalRow: { 
    marginTop: theme.spacing.sm, 
    paddingTop: theme.spacing.sm, 
    borderTopWidth: 1, 
    borderTopColor: theme.colors.border 
  },
  totalLabel: { 
    fontSize: theme.fontSize.lg, 
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  totalValue: { 
    fontSize: theme.fontSize.lg, 
    fontWeight: theme.fontWeight.bold, 
    color: theme.colors.primary 
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
    lineHeight: 20,
  },
  infoRow: { 
    marginBottom: theme.spacing.sm 
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
  driverActions: { 
    flexDirection: 'row', 
    gap: theme.spacing.md, 
    marginTop: theme.spacing.md 
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  actionButtonText: { 
    color: '#FFF', 
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  distanceText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  mapContainer: {
    height: 250,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  map: {
    flex: 1,
  },
  mapCaption: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  floatingChatButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.lg,
    zIndex: 1000,
  },
  floatingChatIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  floatingChatText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  receiptButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.md,
  },
  receiptButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
});
