
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, Linking } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Order, OrderItem } from '../../types/database.types';
import { getOrderById, getOrderItems, assignDriver, updateOrderStatus } from '../../api/orders';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { supabase } from '../../config/supabase';
import { theme } from '../../styles/theme';
import { formatCurrency } from '../../utils/currency';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ReceiptModal } from '../../components/ReceiptModal';
import { ConfirmModal } from '../../components/ConfirmModal';

type OrderStatus = 'pending' | 'confirmed' | 'accepted' | 'purchasing' | 'preparing' | 'ready_for_pickup' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';

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

export default function AdminOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchOrderData = useCallback(async () => {
    try {
      console.log('📦 Admin: Fetching order details for:', id);
      setError(null);
      const [orderData, itemsData] = await Promise.all([
        getOrderById(id),
        getOrderItems(id),
      ]);
      console.log('✅ Admin: Order data fetched:', orderData);
      console.log('✅ Admin: Order items fetched:', itemsData.length);
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
          console.log('⚠️ Admin: No profile found for customer:', profileError);
        } else {
          console.log('✅ Admin: Customer profile fetched');
          setCustomerProfile(profileData);
        }
      }
    } catch (err: any) {
      console.error('❌ Admin: Error fetching order:', err);
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderData();

    // Setup realtime subscription for order updates
    const setupRealtimeSubscription = async () => {
      if (channelRef.current?.state === 'subscribed') {
        console.log('✅ Admin: Already subscribed to order channel');
        return;
      }

      console.log('🔔 Admin: Setting up realtime subscription for order:', id);
      const channel = supabase.channel(`admin_order:${id}`, {
        config: { 
          private: true,
          broadcast: { self: false, ack: false }
        },
      });

      channelRef.current = channel;

      await supabase.realtime.setAuth();

      channel
        .on('broadcast', { event: 'UPDATE' }, (payload) => {
          console.log('📦 Admin: Order updated via realtime:', payload);
          fetchOrderData();
        })
        .subscribe((status, err) => {
          console.log('📡 Admin: Subscription status:', status);
          if (err) {
            console.error('❌ Admin: Subscription error:', err);
          }
        });
    };

    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        console.log('🔕 Admin: Cleaning up realtime subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [id, fetchOrderData]);

  const handleAcceptOrder = async () => {
    if (!user || !order) return;

    console.log('✅ Admin: Accepting order:', order.id);
    setUpdating(true);
    try {
      await assignDriver(order.id, user.id);
      Alert.alert('Success', 'Order accepted! You are now assigned as the driver.');
      fetchOrderData();
    } catch (error: any) {
      console.error('❌ Admin: Error accepting order:', error);
      Alert.alert('Error', error.message || 'Failed to accept order');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!order) return;

    console.log('✅ Admin: Confirming order:', order.id);
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, 'confirmed');
      Alert.alert('Success', 'Order confirmed!');
      fetchOrderData();
    } catch (error: any) {
      console.error('❌ Admin: Error confirming order:', error);
      Alert.alert('Error', error.message || 'Failed to confirm order');
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!order) return;

    console.log('❌ Admin: Rejecting order:', order.id);
    setShowRejectModal(false);
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, 'cancelled');
      Alert.alert('Order Rejected', 'The order has been cancelled.');
      fetchOrderData();
    } catch (error: any) {
      console.error('❌ Admin: Error rejecting order:', error);
      Alert.alert('Error', error.message || 'Failed to reject order');
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

    console.log('🔄 Admin: Updating order status to:', nextStatus);
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, nextStatus);
      Alert.alert('Success', `Order status updated to ${STATUS_LABELS[nextStatus]}`);
      fetchOrderData();
    } catch (error: any) {
      console.error('❌ Admin: Error updating status:', error);
      Alert.alert('Error', error.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCallCustomer = () => {
    const phone = customerProfile?.phone || order?.customer?.phone || order?.customer_phone;
    if (!phone) {
      Alert.alert('No Phone', 'Customer phone number not available');
      return;
    }
    console.log('📞 Admin: Calling customer:', phone);
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return <LoadingSpinner message="Loading order details..." />;
  }

  if (error || !order) {
    return <ErrorMessage message={error || 'Order not found'} onRetry={fetchOrderData} />;
  }

  const isAssignedToMe = order.driver_id === user?.id;
  const canAccept = order.status === 'pending' && !order.driver_id;
  const canConfirm = order.status === 'pending';
  const canReject = order.status === 'pending' || order.status === 'confirmed';
  const canUpdateStatus = (isAssignedToMe || !order.driver_id) && order.status !== 'delivered' && order.status !== 'cancelled';
  const nextStatus = STATUS_FLOW[order.status];
  const customerName = customerProfile?.full_name || order.customer?.name || 'Unknown';
  const customerEmail = order.customer?.email || 'N/A';
  const customerPhone = customerProfile?.phone || order.customer?.phone || order.customer_phone || 'N/A';
  const deliveryAddress = order.delivery_address || customerProfile?.delivery_address || 'N/A';
  const storeName = order.store?.name || 'N/A';
  const storeAddress = order.store?.address || 'N/A';
  const storePhone = order.store?.phone || 'N/A';
  const orderNumber = order.order_number || 'N/A';
  const statusLabel = STATUS_LABELS[order.status];
  const statusIcon = STATUS_ICONS[order.status];
  const subtotal = formatCurrency(order.subtotal);
  const serviceFee = formatCurrency(order.service_fee || 0);
  const deliveryFee = formatCurrency(order.delivery_fee);
  const tax = formatCurrency(order.tax);
  const total = formatCurrency(order.total);
  const paymentMethod = order.payment_method;

  return (
    <>
      <Stack.Screen
        options={{
          title: `Order #${orderNumber}`,
          headerShown: true,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Order Status Progress */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Progress</Text>
          <View style={styles.statusProgress}>
            <View style={styles.statusStep}>
              <View style={[styles.statusIcon, order.status !== 'pending' && styles.statusIconActive]}>
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
          <Text style={styles.orderNumber}>Order #{orderNumber}</Text>
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
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Delivery Address</Text>
              <Text style={styles.infoValue}>{deliveryAddress}</Text>
              {order.delivery_latitude && order.delivery_longitude && (
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() => openInGoogleMaps(
                    order.delivery_latitude!,
                    order.delivery_longitude!,
                    'Delivery Location'
                  )}
                >
                  <Text style={styles.mapButtonText}>🗺️ View on Google Maps</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
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
              <Text style={styles.infoValue}>{storeName}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Store Address</Text>
              <Text style={styles.infoValue}>{storeAddress}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📞</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Store Phone</Text>
              <Text style={styles.infoValue}>{storePhone}</Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {orderItems.map((orderItem, index) => {
            const itemName = orderItem.product_name || orderItem.item?.name || 'Unknown Item';
            const itemQuantity = orderItem.quantity;
            const itemPrice = orderItem.product_price || orderItem.item?.price || 0;
            const itemTotal = itemPrice * itemQuantity;
            const requiresPrescription = orderItem.item?.requires_prescription;

            return (
              <View key={index} style={styles.orderItem}>
                <View style={styles.orderItemInfo}>
                  <Text style={styles.itemName}>{itemName}</Text>
                  {requiresPrescription && (
                    <Text style={styles.prescriptionLabel}>℞ Prescription Required</Text>
                  )}
                  <Text style={styles.itemQuantity}>Qty: {itemQuantity}</Text>
                </View>
                <Text style={styles.itemPrice}>{formatCurrency(itemTotal)}</Text>
              </View>
            );
          })}
          
          {/* Order Summary */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>{subtotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Fee:</Text>
              <Text style={styles.summaryValue}>{serviceFee}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee:</Text>
              <Text style={styles.summaryValue}>{deliveryFee}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax:</Text>
              <Text style={styles.summaryValue}>{tax}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>{total}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Method:</Text>
              <Text style={styles.summaryValue}>{paymentMethod}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {canAccept && (
          <TouchableOpacity
            style={[styles.button, styles.acceptButton, updating && styles.buttonDisabled]}
            onPress={handleAcceptOrder}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>✓ Accept Order</Text>
            )}
          </TouchableOpacity>
        )}

        {canConfirm && (
          <TouchableOpacity
            style={[styles.button, styles.confirmButton, updating && styles.buttonDisabled]}
            onPress={handleConfirmOrder}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>✅ Confirm Order</Text>
            )}
          </TouchableOpacity>
        )}

        {canReject && (
          <TouchableOpacity
            style={[styles.button, styles.rejectButton, updating && styles.buttonDisabled]}
            onPress={() => setShowRejectModal(true)}
            disabled={updating}
          >
            <Text style={styles.buttonText}>❌ Reject Order</Text>
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

        {/* Chat Button */}
        {isAssignedToMe && (
          <TouchableOpacity
            style={[styles.button, styles.chatButton]}
            onPress={() => {
              console.log('💬 Admin: Opening chat with customer');
              router.push(`/chat/${order.id}`);
            }}
          >
            <Text style={styles.buttonText}>💬 Chat with Customer</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />

        {/* Receipt Modal */}
        <ReceiptModal
          visible={showReceipt}
          onClose={() => setShowReceipt(false)}
          order={order}
          orderItems={orderItems}
          type="order"
        />

        {/* Reject Confirmation Modal */}
        <ConfirmModal
          visible={showRejectModal}
          title="Reject Order?"
          message="Are you sure you want to reject this order? This action cannot be undone."
          confirmText="Reject"
          cancelText="Cancel"
          onConfirm={handleRejectOrder}
          onCancel={() => setShowRejectModal(false)}
          confirmColor="#EF4444"
        />
      </ScrollView>
    </>
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
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
  mapButton: {
    backgroundColor: theme.colors.primary + '20',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
  },
  mapButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
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
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  receiptButton: {
    backgroundColor: '#8B5CF6',
  },
  chatButton: {
    backgroundColor: '#EC4899',
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
