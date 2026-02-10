
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Order, OrderItem, OrderStatus } from '../../types/database.types';
import { getOrderById, getOrderItems, assignDriver, updateOrderStatus } from '../../api/orders';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { supabase } from '../../config/supabase';
import { theme, globalStyles } from '../../styles/theme';
import { formatCurrency } from '../../utils/currency';
import { RealtimeChannel } from '@supabase/supabase-js';
import { startLocationTracking, stopLocationTracking, getCurrentLocation, updateDriverLocation } from '../../utils/location';
import { ReceiptModal } from '../../components/ReceiptModal';

const STATUS_FLOW: { [key in OrderStatus]?: OrderStatus } = {
  'pending': 'accepted',
  'accepted': 'purchasing',
  'purchasing': 'preparing',
  'preparing': 'ready_for_pickup',
  'ready_for_pickup': 'picked_up',
  'picked_up': 'in_transit',
  'in_transit': 'delivered',
};

const STATUS_LABELS: { [key in OrderStatus]: string } = {
  'pending': 'Pending',
  'confirmed': 'Confirmed',
  'accepted': 'Accepted',
  'purchasing': 'Purchasing Items',
  'preparing': 'Preparing',
  'ready_for_pickup': 'Ready for Pickup',
  'picked_up': 'Picked Up',
  'in_transit': 'Out for Delivery',
  'delivered': 'Delivered',
  'cancelled': 'Cancelled',
};

const STATUS_ICONS: { [key in OrderStatus]: string } = {
  'pending': '⏳',
  'confirmed': '✅',
  'accepted': '👍',
  'purchasing': '🛒',
  'preparing': '👨‍🍳',
  'ready_for_pickup': '📦',
  'picked_up': '🚗',
  'in_transit': '🚚',
  'delivered': '✓',
  'cancelled': '❌',
};

export default function DriverOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrderData = useCallback(async () => {
    try {
      setError(null);
      const [orderData, itemsData] = await Promise.all([
        getOrderById(id),
        getOrderItems(id),
      ]);
      setOrder(orderData);
      setOrderItems(itemsData);

      // Fetch customer profile for delivery address and phone
      if (orderData.customer_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', orderData.customer_id)
          .single();

        if (profileError) {
          console.log('No profile found for customer:', profileError);
        } else {
          setCustomerProfile(profileData);
        }
      }
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const startTracking = useCallback(async () => {
    if (!user || !order) return;

    try {
      // Start background location tracking
      const started = await startLocationTracking(user.id, order.id);
      
      if (started) {
        setIsTrackingLocation(true);
        
        // Also update location immediately
        const location = await getCurrentLocation();
        if (location) {
          await updateDriverLocation(user.id, order.id, location);
        }

        // Set up interval to update location every 15 seconds
        locationIntervalRef.current = setInterval(async () => {
          const loc = await getCurrentLocation();
          if (loc) {
            await updateDriverLocation(user.id, order.id, loc);
          }
        }, 15000);
      }
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  }, [user, order]);

  const stopTracking = useCallback(async () => {
    try {
      await stopLocationTracking();
      setIsTrackingLocation(false);
      
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrderData();

    // Setup realtime subscription for order updates
    const setupRealtimeSubscription = async () => {
      if (channelRef.current?.state === 'subscribed') {
        console.log('Already subscribed to order channel');
        return;
      }

      const channel = supabase.channel(`orders:${id}`, {
        config: { 
          private: true,
          broadcast: { self: false, ack: false }
        },
      });

      channelRef.current = channel;

      await supabase.realtime.setAuth();

      channel
        .on('broadcast', { event: 'UPDATE' }, (payload) => {
          console.log('Order updated:', payload);
          if (payload.new) {
            fetchOrderData();
          }
        })
        .on('broadcast', { event: 'INSERT' }, (payload) => {
          console.log('Order created:', payload);
          if (payload.new) {
            fetchOrderData();
          }
        })
        .subscribe((status, err) => {
          switch (status) {
            case 'SUBSCRIBED':
              console.log('Successfully subscribed to order updates');
              break;
            case 'CHANNEL_ERROR':
              console.error('Channel error:', err);
              break;
            case 'TIMED_OUT':
              console.error('Subscription timed out');
              break;
            case 'CLOSED':
              console.log('Channel closed');
              break;
            default:
              console.log('Channel status:', status);
          }
        });
    };

    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        console.log('Unsubscribing from order channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [id, fetchOrderData]);

  const handleAcceptOrder = async () => {
    if (!user || !order) return;

    setUpdating(true);
    try {
      await assignDriver(order.id, user.id);
      Alert.alert('Success', 'Order accepted! Location tracking will start automatically.');
      
      // Start location tracking
      await startTracking();
      
      fetchOrderData();
    } catch (error: any) {
      console.error('Error accepting order:', error);
      Alert.alert('Error', error.message || 'Failed to accept order');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!order) return;

    const nextStatus = STATUS_FLOW[order.status];
    if (!nextStatus) {
      Alert.alert('Info', 'Order is already at final status');
      return;
    }

    setUpdating(true);
    try {
      await updateOrderStatus(order.id, nextStatus);
      Alert.alert('Success', `Order status updated to ${STATUS_LABELS[nextStatus]}`);
      fetchOrderData();
    } catch (error: any) {
      console.error('Error updating status:', error);
      Alert.alert('Error', error.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  // Start tracking when order is in active delivery states
  useEffect(() => {
    const isMyOrder = order?.driver_id === user?.id;
    
    if (order && isMyOrder && user) {
      const activeStates: OrderStatus[] = ['accepted', 'purchasing', 'preparing', 'ready_for_pickup', 'picked_up', 'in_transit'];
      
      if (activeStates.includes(order.status) && !isTrackingLocation) {
        startTracking();
      } else if (!activeStates.includes(order.status) && isTrackingLocation) {
        stopTracking();
      }
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [order, user, isTrackingLocation, startTracking, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  if (loading) {
    return <LoadingSpinner message="Loading order..." />;
  }

  if (error || !order) {
    return <ErrorMessage message={error || 'Order not found'} onRetry={fetchOrderData} />;
  }

  const isMyOrder = order.driver_id === user?.id;
  const canAccept = order.status === 'pending' && !order.driver_id;
  const canUpdateStatus = isMyOrder && order.status !== 'delivered' && order.status !== 'cancelled';
  const nextStatus = STATUS_FLOW[order.status];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Order Status Progress */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Progress</Text>
        <View style={styles.statusProgress}>
          <View style={styles.statusStep}>
            <View style={[styles.statusIcon, order.status !== 'pending' && styles.statusIconActive]}>
              <Text style={styles.statusIconText}>{STATUS_ICONS[order.status]}</Text>
            </View>
            <Text style={styles.statusLabel}>{STATUS_LABELS[order.status]}</Text>
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
        {order.order_number && (
          <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
        )}
      </View>

      {/* Customer Information */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>👤</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>
              {customerProfile?.full_name || order.customer?.name || 'N/A'}
            </Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📧</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{order.customer?.email || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📱</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>
              {customerProfile?.phone || order.customer?.phone || order.customer_phone || 'N/A'}
            </Text>
          </View>
        </View>
        {(order.delivery_address || customerProfile?.delivery_address) && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Delivery Address</Text>
              <Text style={styles.infoValue}>
                {order.delivery_address || customerProfile?.delivery_address}
              </Text>
              {(order.delivery_latitude && order.delivery_longitude) || 
               (customerProfile?.delivery_latitude && customerProfile?.delivery_longitude) ? (
                <Text style={styles.coordinates}>
                  {(order.delivery_latitude || customerProfile?.delivery_latitude)?.toFixed(6)}, {(order.delivery_longitude || customerProfile?.delivery_longitude)?.toFixed(6)}
                </Text>
              ) : null}
            </View>
          </View>
        )}
        {order.delivery_notes && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📝</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Delivery Notes</Text>
              <Text style={styles.infoValue}>{order.delivery_notes}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Store Information */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Store Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🏪</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Store Name</Text>
            <Text style={styles.infoValue}>{order.store?.name || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Store Address</Text>
            <Text style={styles.infoValue}>{order.store?.address || 'N/A'}</Text>
          </View>
        </View>
        {order.store?.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📞</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Store Phone</Text>
              <Text style={styles.infoValue}>{order.store.phone}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Order Items */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {orderItems.map((orderItem, index) => (
          <View key={index} style={styles.orderItem}>
            <View style={styles.orderItemInfo}>
              <Text style={styles.itemName}>
                {orderItem.product_name || orderItem.item?.name}
              </Text>
              {orderItem.item?.requires_prescription && (
                <Text style={styles.prescriptionLabel}>℞ Prescription Required</Text>
              )}
              <Text style={styles.itemQuantity}>Qty: {orderItem.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>
              {formatCurrency((orderItem.product_price || orderItem.item?.price || 0) * orderItem.quantity)}
            </Text>
          </View>
        ))}
        
        {/* Order Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(order.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(order.delivery_fee)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(order.tax)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>{formatCurrency(order.total)}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      {canAccept && (
        <TouchableOpacity
          style={[styles.button, updating && styles.buttonDisabled]}
          onPress={handleAcceptOrder}
          disabled={updating}
        >
          <Text style={styles.buttonText}>
            {updating ? 'Accepting...' : '✓ Accept Order'}
          </Text>
        </TouchableOpacity>
      )}

      {canUpdateStatus && nextStatus && (
        <TouchableOpacity
          style={[styles.button, updating && styles.buttonDisabled]}
          onPress={handleUpdateStatus}
          disabled={updating}
        >
          <Text style={styles.buttonText}>
            {updating ? 'Updating...' : `${STATUS_ICONS[nextStatus]} Mark as ${STATUS_LABELS[nextStatus]}`}
          </Text>
        </TouchableOpacity>
      )}

      {isMyOrder && (
        <TouchableOpacity
          style={[styles.button, styles.chatButton]}
          onPress={() => router.push(`/chat/${order.id}`)}
        >
          <Text style={styles.buttonText}>💬 Chat with Customer</Text>
        </TouchableOpacity>
      )}

      {/* View Receipt Button */}
      <TouchableOpacity
        style={styles.receiptButton}
        onPress={() => setShowReceipt(true)}
      >
        <Text style={styles.buttonText}>🧾 View Receipt</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  card: {
    ...globalStyles.card,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
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
  orderNumber: {
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
  coordinates: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontFamily: 'monospace',
    marginTop: theme.spacing.xs,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  orderItemInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  itemName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  prescriptionLabel: {
    fontSize: theme.fontSize.xs,
    color: '#FF6B6B',
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  itemQuantity: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  itemPrice: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  summarySection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  summaryLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
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
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  totalAmount: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  button: {
    ...globalStyles.button,
    marginBottom: theme.spacing.md,
  },
  buttonText: {
    ...globalStyles.buttonText,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  chatButton: {
    backgroundColor: theme.colors.secondary,
  },
  receiptButton: {
    ...globalStyles.button,
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
});
