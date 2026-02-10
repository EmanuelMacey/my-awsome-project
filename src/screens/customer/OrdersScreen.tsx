
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { Order } from '../../types/database.types';
import { Errand } from '../../types/errand.types';
import { getOrdersByCustomer } from '../../api/orders';
import { getErrandsByCustomer } from '../../api/errands';
import { useAuth } from '../../contexts/AuthContext';
import { OrderCard } from '../../components/OrderCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { supabase } from '../../config/supabase';
import { theme, globalStyles } from '../../styles/theme';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Map, MapMarker } from '../../../components/Map';
import { watchDriverLocation, DriverLocation } from '../../utils/location';
import { sendLocalNotification } from '../../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TabType = 'orders' | 'errands';

const STATUS_COLORS: Record<string, string> = {
  pending: theme.colors.warning,
  accepted: theme.colors.info,
  at_pickup: theme.colors.info,
  pickup_complete: theme.colors.info,
  en_route: theme.colors.primary,
  completed: theme.colors.success,
  cancelled: theme.colors.danger,
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  at_pickup: 'At Pickup',
  pickup_complete: 'Pickup Complete',
  en_route: 'En Route',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [errands, setErrands] = useState<Errand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverLocations, setDriverLocations] = useState<Record<string, DriverLocation>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const locationUnsubscribesRef = useRef<Record<string, () => void>>({});
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('📦 Customer: Fetching orders for customer:', user.id);
      
      // Show cached data immediately for faster perceived loading
      const cachedOrders = await AsyncStorage.getItem(`orders_${user.id}`);
      if (cachedOrders && !refreshing) {
        try {
          const parsed = JSON.parse(cachedOrders);
          console.log('⚡ Customer: Using cached orders');
          setOrders(parsed);
          setLoading(false);
        } catch (e) {
          console.log('⚠️ Failed to parse cached orders');
        }
      }
      
      const data = await getOrdersByCustomer(user.id);
      console.log(`✅ Customer: Orders fetched: ${data.length}`);
      setOrders(data);
      
      // Cache the fresh data
      await AsyncStorage.setItem(`orders_${user.id}`, JSON.stringify(data));
    } catch (err: any) {
      console.error('❌ Customer: Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, refreshing]);

  const fetchErrands = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('📦 Customer: Fetching errands for customer:', user.id);
      
      // Show cached data immediately for faster perceived loading
      const cachedErrands = await AsyncStorage.getItem(`errands_${user.id}`);
      if (cachedErrands && !refreshing) {
        try {
          const parsed = JSON.parse(cachedErrands);
          console.log('⚡ Customer: Using cached errands');
          setErrands(parsed);
          setLoading(false);
        } catch (e) {
          console.log('⚠️ Failed to parse cached errands');
        }
      }
      
      const data = await getErrandsByCustomer(user.id);
      console.log(`✅ Customer: Errands fetched: ${data.length}`);
      setErrands(data);
      
      // Cache the fresh data
      await AsyncStorage.setItem(`errands_${user.id}`, JSON.stringify(data));
    } catch (err: any) {
      console.error('❌ Customer: Error fetching errands:', err);
      setError(err.message || 'Failed to load errands');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, refreshing]);

  // Setup realtime subscriptions for order updates
  useEffect(() => {
    if (!user) return;

    console.log('🔔 Customer: Setting up realtime subscriptions for customer:', user.id);

    let ordersChannel: RealtimeChannel | null = null;
    let errandsChannel: RealtimeChannel | null = null;

    const setupSubscriptions = async () => {
      // Subscribe to orders table changes for this customer ONLY
      ordersChannel = supabase
        .channel(`customer-orders:${user.id}`, {
          config: {
            broadcast: { self: false },
          },
        })
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `customer_id=eq.${user.id}`,
          },
          async (payload) => {
            console.log('📦 Customer: Order update received:', payload);
            
            const updatedOrder = payload.new as Order;
            const oldOrder = payload.old as Order;
            
            // Send local notification to customer if status changed
            if (updatedOrder.status !== oldOrder.status) {
              console.log(`🔔 Customer: Order status changed from ${oldOrder.status} to ${updatedOrder.status}`);
              
              const statusMessages: Record<string, { title: string; body: string }> = {
                accepted: {
                  title: '✅ Order Accepted',
                  body: `Your order #${updatedOrder.order_number} has been accepted by a driver!`,
                },
                purchasing: {
                  title: '🛒 Purchasing Items',
                  body: `Your driver is purchasing items for order #${updatedOrder.order_number}.`,
                },
                in_transit: {
                  title: '🚚 On the Way',
                  body: `Your order #${updatedOrder.order_number} is on the way to you!`,
                },
                delivered: {
                  title: '✅ Order Delivered',
                  body: `Your order #${updatedOrder.order_number} has been delivered. Enjoy!`,
                },
                cancelled: {
                  title: '❌ Order Cancelled',
                  body: `Your order #${updatedOrder.order_number} has been cancelled.`,
                },
              };
              
              const message = statusMessages[updatedOrder.status];
              if (message) {
                console.log('📬 Customer: Sending notification:', message.title);
                await sendLocalNotification(
                  message.title,
                  message.body,
                  {
                    type: 'order_status',
                    orderId: updatedOrder.id,
                    orderNumber: updatedOrder.order_number,
                    status: updatedOrder.status,
                  }
                );
              }
            }
            
            // Debounce refetch to prevent excessive API calls
            if (fetchTimeoutRef.current) {
              clearTimeout(fetchTimeoutRef.current);
            }
            fetchTimeoutRef.current = setTimeout(() => {
              console.log('🔄 Customer: Refetching orders due to realtime update');
              fetchOrders();
            }, 500);
          }
        )
        .subscribe((status) => {
          console.log('📡 Customer: Orders subscription status:', status);
        });

      // Subscribe to errands table changes for this customer ONLY
      errandsChannel = supabase
        .channel(`customer-errands:${user.id}`, {
          config: {
            broadcast: { self: false },
          },
        })
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'errands',
            filter: `customer_id=eq.${user.id}`,
          },
          async (payload) => {
            console.log('📦 Customer: Errand update received:', payload);
            
            const updatedErrand = payload.new as Errand;
            const oldErrand = payload.old as Errand;
            
            // Send local notification to customer if status changed
            if (updatedErrand.status !== oldErrand.status) {
              console.log(`🔔 Customer: Errand status changed from ${oldErrand.status} to ${updatedErrand.status}`);
              
              const statusMessages: Record<string, { title: string; body: string }> = {
                accepted: {
                  title: '✅ Errand Accepted',
                  body: `Your errand #${updatedErrand.errand_number} has been accepted by a runner!`,
                },
                at_pickup: {
                  title: '📍 At Pickup',
                  body: `Your runner has arrived at the pickup location for errand #${updatedErrand.errand_number}.`,
                },
                en_route: {
                  title: '🚚 On the Way',
                  body: `Your errand #${updatedErrand.errand_number} is on the way to you!`,
                },
                completed: {
                  title: '✅ Errand Completed',
                  body: `Your errand #${updatedErrand.errand_number} has been completed!`,
                },
                cancelled: {
                  title: '❌ Errand Cancelled',
                  body: `Your errand #${updatedErrand.errand_number} has been cancelled.`,
                },
              };
              
              const message = statusMessages[updatedErrand.status];
              if (message) {
                console.log('📬 Customer: Sending notification:', message.title);
                await sendLocalNotification(
                  message.title,
                  message.body,
                  {
                    type: 'errand_status',
                    errandId: updatedErrand.id,
                    errandNumber: updatedErrand.errand_number,
                    status: updatedErrand.status,
                  }
                );
              }
            }
            
            // Debounce refetch to prevent excessive API calls
            if (fetchTimeoutRef.current) {
              clearTimeout(fetchTimeoutRef.current);
            }
            fetchTimeoutRef.current = setTimeout(() => {
              console.log('🔄 Customer: Refetching errands due to realtime update');
              fetchErrands();
            }, 500);
          }
        )
        .subscribe((status) => {
          console.log('📡 Customer: Errands subscription status:', status);
        });
    };

    setupSubscriptions();

    return () => {
      console.log('🔕 Customer: Cleaning up realtime subscriptions');
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (ordersChannel) {
        supabase.removeChannel(ordersChannel);
      }
      if (errandsChannel) {
        supabase.removeChannel(errandsChannel);
      }
    };
  }, [user, fetchOrders, fetchErrands]);

  // Initial fetch based on active tab
  useEffect(() => {
    console.log('📱 Customer: Active tab changed to:', activeTab);
    if (activeTab === 'orders') {
      fetchOrders();
    } else {
      fetchErrands();
    }
  }, [activeTab, fetchOrders, fetchErrands]);

  // Track driver locations for active orders
  useEffect(() => {
    if (activeTab !== 'orders') return;

    console.log('🚗 Customer: Setting up driver location tracking for active orders');

    // Clean up old subscriptions
    Object.values(locationUnsubscribesRef.current).forEach(unsubscribe => unsubscribe());
    locationUnsubscribesRef.current = {};

    // Subscribe to driver locations for active orders
    const activeOrders = orders.filter(
      order => order.driver_id && !['delivered', 'cancelled'].includes(order.status)
    );

    console.log(`📍 Customer: Tracking ${activeOrders.length} active orders with drivers`);

    activeOrders.forEach(order => {
      if (order.driver_id) {
        console.log(`📍 Customer: Watching driver location for order ${order.order_number}`);
        const unsubscribe = watchDriverLocation(order.driver_id, (location) => {
          console.log(`📍 Customer: Driver location updated for order ${order.order_number}:`, location);
          setDriverLocations(prev => ({
            ...prev,
            [order.driver_id!]: location,
          }));
        });
        locationUnsubscribesRef.current[order.driver_id] = unsubscribe;
      }
    });

    return () => {
      console.log('🔕 Customer: Cleaning up driver location subscriptions');
      Object.values(locationUnsubscribesRef.current).forEach(unsubscribe => unsubscribe());
      locationUnsubscribesRef.current = {};
    };
  }, [orders, activeTab]);

  const onRefresh = () => {
    console.log('🔄 Customer: Manual refresh triggered');
    setRefreshing(true);
    if (activeTab === 'orders') {
      fetchOrders();
    } else {
      fetchErrands();
    }
  };

  const renderErrandCard = ({ item }: { item: Errand }) => {
    const categoryName = (item as any).category?.name || 'Errand';
    const statusColor = STATUS_COLORS[item.status];
    const statusLabel = STATUS_LABELS[item.status];
    const createdDate = new Date(item.created_at!).toLocaleDateString();
    const totalPrice = item.total_price.toLocaleString();

    return (
      <TouchableOpacity
        style={styles.errandCard}
        onPress={() => {
          console.log('📦 Customer: Opening errand detail:', item.id);
          router.push(`/errands/detail/${item.id}`);
        }}
      >
        <View style={styles.errandHeader}>
          <View style={styles.errandInfo}>
            <Text style={styles.errandNumber}>#{item.errand_number}</Text>
            <Text style={styles.errandCategory}>{categoryName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.errandDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {item.pickup_address}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🎯</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {item.dropoff_address}
            </Text>
          </View>
        </View>

        <View style={styles.errandFooter}>
          <Text style={styles.priceText}>GYD ${totalPrice}</Text>
          <Text style={styles.dateText}>{createdDate}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    const loadingMessage = activeTab === 'orders' ? 'Loading orders...' : 'Loading errands...';
    return <LoadingSpinner message={loadingMessage} />;
  }

  if (error) {
    const retryFunction = activeTab === 'orders' ? fetchOrders : fetchErrands;
    return <ErrorMessage message={error} onRetry={retryFunction} />;
  }

  const ordersCount = orders.length;
  const errandsCount = errands.length;
  const isOrdersTab = activeTab === 'orders';
  const isErrandsTab = activeTab === 'errands';

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, isOrdersTab && styles.tabActive]}
          onPress={() => {
            console.log('📱 Customer: Switching to orders tab');
            setActiveTab('orders');
          }}
        >
          <Text style={[styles.tabText, isOrdersTab && styles.tabTextActive]}>
            My Orders ({ordersCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, isErrandsTab && styles.tabActive]}
          onPress={() => {
            console.log('📱 Customer: Switching to errands tab');
            setActiveTab('errands');
          }}
        >
          <Text style={[styles.tabText, isErrandsTab && styles.tabTextActive]}>
            My Errands ({errandsCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isOrdersTab ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const driverLocation = item.driver_id ? driverLocations[item.driver_id] : null;
            const hasDriver = !!item.driver_id;
            const isActiveOrder = !['delivered', 'cancelled'].includes(item.status);
            const hasLocation = !!(driverLocation || (item.delivery_latitude && item.delivery_longitude));
            const showMap = hasDriver && isActiveOrder && hasLocation;

            return (
              <View style={styles.orderCardWrapper}>
                <OrderCard
                  order={item}
                  onPress={() => {
                    console.log('📦 Customer: Opening order detail:', item.id);
                    router.push(`/customer/order/${item.id}`);
                  }}
                />
                
                {/* Mini Map for Active Orders */}
                {showMap && (
                  <View style={styles.miniMapContainer}>
                    <View style={styles.miniMapHeader}>
                      <Text style={styles.miniMapTitle}>🚗 Track Driver</Text>
                      <TouchableOpacity onPress={() => {
                        console.log('📦 Customer: Opening order detail from map:', item.id);
                        router.push(`/customer/order/${item.id}`);
                      }}>
                        <Text style={styles.miniMapLink}>View Details →</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.miniMap}>
                      <Map
                        markers={[
                          ...(driverLocation ? [{
                            id: 'driver',
                            latitude: driverLocation.latitude,
                            longitude: driverLocation.longitude,
                            title: '🚗 Driver',
                            description: item.driver?.name || 'Your driver',
                          }] : []),
                          ...(item.delivery_latitude && item.delivery_longitude ? [{
                            id: 'delivery',
                            latitude: item.delivery_latitude,
                            longitude: item.delivery_longitude,
                            title: '🎯 Delivery',
                            description: item.delivery_address,
                          }] : []),
                        ]}
                        initialRegion={{
                          latitude: driverLocation?.latitude || item.delivery_latitude || 6.8013,
                          longitude: driverLocation?.longitude || item.delivery_longitude || -58.1551,
                          latitudeDelta: 0.05,
                          longitudeDelta: 0.05,
                        }}
                        style={styles.mapView}
                      />
                    </View>
                    <TouchableOpacity 
                      style={styles.chatButton}
                      onPress={() => {
                        console.log('💬 Customer: Opening chat for order:', item.id);
                        router.push(`/chat/${item.id}`);
                      }}
                    >
                      <Text style={styles.chatButtonText}>💬 Chat with Driver</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyText}>Start shopping to place your first order!</Text>
              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => {
                  console.log('🛍️ Customer: Navigating to home screen');
                  router.push('/customer/home');
                }}
              >
                <Text style={styles.shopButtonText}>Browse Stores</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={errands}
          keyExtractor={(item) => item.id}
          renderItem={renderErrandCard}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No errands yet</Text>
              <Text style={styles.emptyText}>Create your first errand request!</Text>
              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => {
                  console.log('🏃 Customer: Navigating to errands home');
                  router.push('/errands/home');
                }}
              >
                <Text style={styles.shopButtonText}>Create Errand</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingTop: 60,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  listContent: {
    paddingVertical: theme.spacing.md,
    paddingBottom: 100,
  },
  errandCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  errandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  errandInfo: {
    flex: 1,
  },
  errandNumber: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  errandCategory: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  errandDetails: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  detailIcon: {
    fontSize: 16,
  },
  detailValue: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  errandFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  priceText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  dateText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  shopButton: {
    ...globalStyles.button,
    paddingHorizontal: theme.spacing.xl,
  },
  shopButtonText: {
    ...globalStyles.buttonText,
  },
  orderCardWrapper: {
    marginBottom: theme.spacing.md,
  },
  miniMapContainer: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginTop: -theme.spacing.sm,
    padding: theme.spacing.md,
    borderBottomLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  miniMapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  miniMapTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  miniMapLink: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  miniMap: {
    height: 180,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  mapView: {
    flex: 1,
  },
  chatButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
});
