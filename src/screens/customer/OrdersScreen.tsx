
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

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Fetching orders for user:', user.id);
      const data = await getOrdersByCustomer(user.id);
      console.log('Orders fetched:', data.length);
      setOrders(data);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const fetchErrands = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Fetching errands for user:', user.id);
      const data = await getErrandsByCustomer(user.id);
      console.log('Errands fetched:', data.length);
      setErrands(data);
    } catch (err: any) {
      console.error('Error fetching errands:', err);
      setError(err.message || 'Failed to load errands');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else {
      fetchErrands();
    }

    // Setup realtime subscription for order updates
    if (user && !channelRef.current) {
      const channel = supabase.channel(`orders:customer:${user.id}`, {
        config: { private: true },
      });

      channel
        .on('broadcast', { event: 'UPDATE' }, (payload) => {
          console.log('Order/Errand updated:', payload);
          if (activeTab === 'orders') {
            fetchOrders();
          } else {
            fetchErrands();
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to order/errand updates');
            await supabase.realtime.setAuth();
          }
        });

      channelRef.current = channel;
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, activeTab, fetchOrders, fetchErrands]);

  // Track driver locations for active orders
  useEffect(() => {
    if (activeTab !== 'orders') return;

    // Clean up old subscriptions
    Object.values(locationUnsubscribesRef.current).forEach(unsubscribe => unsubscribe());
    locationUnsubscribesRef.current = {};

    // Subscribe to driver locations for active orders
    const activeOrders = orders.filter(
      order => order.driver_id && !['delivered', 'cancelled'].includes(order.status)
    );

    activeOrders.forEach(order => {
      if (order.driver_id) {
        const unsubscribe = watchDriverLocation(order.driver_id, (location) => {
          setDriverLocations(prev => ({
            ...prev,
            [order.driver_id!]: location,
          }));
        });
        locationUnsubscribesRef.current[order.driver_id] = unsubscribe;
      }
    });

    return () => {
      Object.values(locationUnsubscribesRef.current).forEach(unsubscribe => unsubscribe());
      locationUnsubscribesRef.current = {};
    };
  }, [orders, activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'orders') {
      fetchOrders();
    } else {
      fetchErrands();
    }
  };

  const renderErrandCard = ({ item }: { item: Errand }) => (
    <TouchableOpacity
      style={styles.errandCard}
      onPress={() => router.push(`/errands/detail/${item.id}`)}
    >
      <View style={styles.errandHeader}>
        <View style={styles.errandInfo}>
          <Text style={styles.errandNumber}>#{item.errand_number}</Text>
          <Text style={styles.errandCategory}>
            {(item as any).category?.name || 'Errand'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {STATUS_LABELS[item.status]}
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
        <Text style={styles.priceText}>GYD ${item.total_price.toLocaleString()}</Text>
        <Text style={styles.dateText}>
          {new Date(item.created_at!).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner message={activeTab === 'orders' ? 'Loading orders...' : 'Loading errands...'} />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={activeTab === 'orders' ? fetchOrders : fetchErrands} />;
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            My Orders ({orders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'errands' && styles.tabActive]}
          onPress={() => setActiveTab('errands')}
        >
          <Text style={[styles.tabText, activeTab === 'errands' && styles.tabTextActive]}>
            My Errands ({errands.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'orders' ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const driverLocation = item.driver_id ? driverLocations[item.driver_id] : null;
            const showMap = item.driver_id && 
                           !['delivered', 'cancelled'].includes(item.status) &&
                           (driverLocation || (item.delivery_latitude && item.delivery_longitude));

            return (
              <View style={styles.orderCardWrapper}>
                <OrderCard
                  order={item}
                  onPress={() => router.push(`/customer/order/${item.id}`)}
                />
                
                {/* Mini Map for Active Orders */}
                {showMap && (
                  <View style={styles.miniMapContainer}>
                    <View style={styles.miniMapHeader}>
                      <Text style={styles.miniMapTitle}>🚗 Track Driver</Text>
                      <TouchableOpacity onPress={() => router.push(`/customer/order/${item.id}`)}>
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
                      onPress={() => router.push(`/chat/${item.id}`)}
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
                onPress={() => router.push('/customer/home')}
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
                onPress={() => router.push('/errands/home')}
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
