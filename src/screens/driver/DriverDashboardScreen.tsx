
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { OrderCard } from '../../components/OrderCard';
import { getErrandsByRunner, getPendingErrands } from '../../api/errands';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Switch, TextInput, Alert, Platform, Linking } from 'react-native';
import { supabase } from '../../config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { sendLocalNotification } from '../../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrdersByDriver, getPendingOrders, filterOrdersByStatus, searchOrders } from '../../api/orders';
import { getDriverProfile, updateDriverAvailability } from '../../api/drivers';
import { Errand } from '../../types/errand.types';
import { theme, globalStyles } from '../../styles/theme';
import { Order } from '../../types/database.types';
import { ErrorMessage } from '../../components/ErrorMessage';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../contexts/AuthContext';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { router } from 'expo-router';

type OrderFilter = 'all' | 'pending' | 'accepted' | 'in_transit' | 'delivered';
type ViewMode = 'orders' | 'errands';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  greeting: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    fontSize: 20,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  availabilityLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  viewModeContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  viewModeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  viewModeTextActive: {
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  filterButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: theme.fontWeight.semibold,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
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
  },
  errandCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
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
  mapButton: {
    backgroundColor: theme.colors.info,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
});

function getFirstName(fullName: string): string {
  const firstName = fullName.split(' ')[0];
  return firstName;
}

function openInGoogleMaps(latitude: number, longitude: number, label: string = 'Location') {
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
    console.log('🗺️ Driver: Opening Google Maps:', url);
    Linking.openURL(url).catch((err) => console.error('❌ Driver: Failed to open maps', err));
  }
}

function getErrandStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: theme.colors.warning,
    accepted: theme.colors.info,
    at_pickup: theme.colors.info,
    pickup_complete: theme.colors.info,
    en_route: theme.colors.primary,
    completed: theme.colors.success,
    cancelled: theme.colors.danger,
  };
  return colors[status] || theme.colors.textSecondary;
}

function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: theme.colors.warning,
    accepted: theme.colors.info,
    purchasing: theme.colors.info,
    in_transit: theme.colors.primary,
    delivered: theme.colors.success,
    cancelled: theme.colors.danger,
  };
  return colors[status] || theme.colors.textSecondary;
}

export default function DriverDashboardScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [errands, setErrands] = useState<Errand[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filteredErrands, setFilteredErrands] = useState<Errand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDriverProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('👤 Driver: Fetching driver profile');
      const profile = await getDriverProfile(user.id);
      setIsAvailable(profile.is_available || false);
      console.log('✅ Driver: Profile fetched, availability:', profile.is_available);
    } catch (err: any) {
      console.error('❌ Driver: Error fetching profile:', err);
    }
  }, [user]);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('📦 Driver: Fetching orders for driver:', user.id);
      
      // Show cached data immediately for faster perceived loading
      const cachedOrders = await AsyncStorage.getItem(`driver_orders_${user.id}`);
      if (cachedOrders && !refreshing) {
        try {
          const parsed = JSON.parse(cachedOrders);
          console.log('⚡ Driver: Using cached orders');
          setOrders(parsed);
          setFilteredOrders(parsed);
          setLoading(false);
        } catch (e) {
          console.log('⚠️ Failed to parse cached orders');
        }
      }
      
      // Fetch both assigned orders and pending orders
      const [assignedOrders, pendingOrders] = await Promise.all([
        getOrdersByDriver(user.id),
        getPendingOrders(),
      ]);
      
      // Combine and deduplicate
      const allOrders = [...assignedOrders];
      pendingOrders.forEach(order => {
        if (!allOrders.find(o => o.id === order.id)) {
          allOrders.push(order);
        }
      });
      
      console.log(`✅ Driver: Orders fetched - ${assignedOrders.length} assigned, ${pendingOrders.length} pending`);
      setOrders(allOrders);
      setFilteredOrders(allOrders);
      
      // Cache the fresh data
      await AsyncStorage.setItem(`driver_orders_${user.id}`, JSON.stringify(allOrders));
    } catch (err: any) {
      console.error('❌ Driver: Error fetching orders:', err);
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
      console.log('📦 Driver: Fetching errands for driver:', user.id);
      
      // Show cached data immediately for faster perceived loading
      const cachedErrands = await AsyncStorage.getItem(`driver_errands_${user.id}`);
      if (cachedErrands && !refreshing) {
        try {
          const parsed = JSON.parse(cachedErrands);
          console.log('⚡ Driver: Using cached errands');
          setErrands(parsed);
          setFilteredErrands(parsed);
          setLoading(false);
        } catch (e) {
          console.log('⚠️ Failed to parse cached errands');
        }
      }
      
      // Fetch both assigned errands and pending errands
      const [assignedErrands, pendingErrands] = await Promise.all([
        getErrandsByRunner(user.id),
        getPendingErrands(),
      ]);
      
      // Combine and deduplicate
      const allErrands = [...assignedErrands];
      pendingErrands.forEach(errand => {
        if (!allErrands.find(e => e.id === errand.id)) {
          allErrands.push(errand);
        }
      });
      
      console.log(`✅ Driver: Errands fetched - ${assignedErrands.length} assigned, ${pendingErrands.length} pending`);
      setErrands(allErrands);
      setFilteredErrands(allErrands);
      
      // Cache the fresh data
      await AsyncStorage.setItem(`driver_errands_${user.id}`, JSON.stringify(allErrands));
    } catch (err: any) {
      console.error('❌ Driver: Error fetching errands:', err);
      setError(err.message || 'Failed to load errands');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, refreshing]);

  // Setup realtime subscriptions for new orders and errands
  useEffect(() => {
    if (!user) return;

    console.log('🔔 Driver: Setting up realtime subscriptions for driver:', user.id);

    let ordersChannel: RealtimeChannel | null = null;
    let errandsChannel: RealtimeChannel | null = null;

    const setupSubscriptions = async () => {
      // Subscribe to NEW pending orders (INSERT events)
      ordersChannel = supabase
        .channel(`driver-new-orders:${user.id}`, {
          config: {
            broadcast: { self: false },
          },
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: 'status=eq.pending',
          },
          async (payload) => {
            console.log('🆕 Driver: New pending order created:', payload);
            
            const newOrder = payload.new as Order;
            
            // Send local notification to driver about new order
            console.log('📬 Driver: Sending new order notification');
            await sendLocalNotification(
              '🆕 New Order Available',
              `Order #${newOrder.order_number} is ready for pickup! Total: GYD $${newOrder.total.toFixed(2)}`,
              {
                type: 'new_order',
                orderId: newOrder.id,
                orderNumber: newOrder.order_number,
              }
            );
            
            // Debounce refetch to prevent excessive API calls
            if (fetchTimeoutRef.current) {
              clearTimeout(fetchTimeoutRef.current);
            }
            fetchTimeoutRef.current = setTimeout(() => {
              console.log('🔄 Driver: Refetching orders due to new order');
              fetchOrders();
            }, 500);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `driver_id=eq.${user.id}`,
          },
          async (payload) => {
            console.log('📦 Driver: Assigned order updated:', payload);
            
            const updatedOrder = payload.new as Order;
            const oldOrder = payload.old as Order;
            
            // Notify driver if customer cancelled their order
            if (updatedOrder.status === 'cancelled' && oldOrder.status !== 'cancelled') {
              console.log('📬 Driver: Sending cancellation notification');
              await sendLocalNotification(
                '❌ Order Cancelled',
                `Order #${updatedOrder.order_number} was cancelled by the customer.`,
                {
                  type: 'order_cancelled',
                  orderId: updatedOrder.id,
                  orderNumber: updatedOrder.order_number,
                }
              );
            }
            
            // Debounce refetch to prevent excessive API calls
            if (fetchTimeoutRef.current) {
              clearTimeout(fetchTimeoutRef.current);
            }
            fetchTimeoutRef.current = setTimeout(() => {
              console.log('🔄 Driver: Refetching orders due to update');
              fetchOrders();
            }, 500);
          }
        )
        .subscribe((status) => {
          console.log('📡 Driver: Orders subscription status:', status);
        });

      // Subscribe to NEW pending errands (INSERT events)
      errandsChannel = supabase
        .channel(`driver-new-errands:${user.id}`, {
          config: {
            broadcast: { self: false },
          },
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'errands',
            filter: 'status=eq.pending',
          },
          async (payload) => {
            console.log('🆕 Driver: New pending errand created:', payload);
            
            const newErrand = payload.new as Errand;
            
            // Send local notification to driver about new errand
            console.log('📬 Driver: Sending new errand notification');
            await sendLocalNotification(
              '🆕 New Errand Available',
              `Errand #${newErrand.errand_number} needs a runner! Price: GYD $${newErrand.total_price.toFixed(2)}`,
              {
                type: 'new_errand',
                errandId: newErrand.id,
                errandNumber: newErrand.errand_number,
              }
            );
            
            // Debounce refetch to prevent excessive API calls
            if (fetchTimeoutRef.current) {
              clearTimeout(fetchTimeoutRef.current);
            }
            fetchTimeoutRef.current = setTimeout(() => {
              console.log('🔄 Driver: Refetching errands due to new errand');
              fetchErrands();
            }, 500);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'errands',
            filter: `runner_id=eq.${user.id}`,
          },
          async (payload) => {
            console.log('📦 Driver: Assigned errand updated:', payload);
            
            const updatedErrand = payload.new as Errand;
            const oldErrand = payload.old as Errand;
            
            // Notify driver if customer cancelled their errand
            if (updatedErrand.status === 'cancelled' && oldErrand.status !== 'cancelled') {
              console.log('📬 Driver: Sending cancellation notification');
              await sendLocalNotification(
                '❌ Errand Cancelled',
                `Errand #${updatedErrand.errand_number} was cancelled by the customer.`,
                {
                  type: 'errand_cancelled',
                  errandId: updatedErrand.id,
                  errandNumber: updatedErrand.errand_number,
                }
              );
            }
            
            // Debounce refetch to prevent excessive API calls
            if (fetchTimeoutRef.current) {
              clearTimeout(fetchTimeoutRef.current);
            }
            fetchTimeoutRef.current = setTimeout(() => {
              console.log('🔄 Driver: Refetching errands due to update');
              fetchErrands();
            }, 500);
          }
        )
        .subscribe((status) => {
          console.log('📡 Driver: Errands subscription status:', status);
        });
    };

    setupSubscriptions();

    return () => {
      console.log('🔕 Driver: Cleaning up realtime subscriptions');
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

  // Initial fetch
  useEffect(() => {
    console.log('📱 Driver: View mode changed to:', viewMode);
    fetchDriverProfile();
    if (viewMode === 'orders') {
      fetchOrders();
    } else {
      fetchErrands();
    }
  }, [viewMode, fetchOrders, fetchErrands, fetchDriverProfile]);

  // Apply filters and search
  useEffect(() => {
    console.log('🔍 Driver: Applying filters - filter:', filter, 'search:', searchQuery);
    
    if (viewMode === 'orders') {
      let filtered = orders;
      
      // Apply status filter
      if (filter !== 'all') {
        filtered = filtered.filter(order => order.status === filter);
      }
      
      // Apply search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(order => 
          order.order_number.toLowerCase().includes(query) ||
          order.customer?.name?.toLowerCase().includes(query) ||
          order.delivery_address?.toLowerCase().includes(query)
        );
      }
      
      setFilteredOrders(filtered);
    } else {
      let filtered = errands;
      
      // Apply status filter
      if (filter !== 'all') {
        filtered = filtered.filter(errand => errand.status === filter);
      }
      
      // Apply search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(errand => 
          errand.errand_number.toLowerCase().includes(query) ||
          errand.pickup_address?.toLowerCase().includes(query) ||
          errand.dropoff_address?.toLowerCase().includes(query)
        );
      }
      
      setFilteredErrands(filtered);
    }
  }, [orders, errands, filter, searchQuery, viewMode]);

  const handleAvailabilityToggle = async (value: boolean) => {
    if (!user) return;
    
    try {
      console.log('🔄 Driver: Updating availability to:', value);
      await updateDriverAvailability(user.id, value);
      setIsAvailable(value);
      console.log('✅ Driver: Availability updated');
      
      Alert.alert(
        'Availability Updated',
        value 
          ? 'You are now available to receive new orders and errands.' 
          : 'You are now offline and will not receive new orders or errands.'
      );
    } catch (err: any) {
      console.error('❌ Driver: Error updating availability:', err);
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const onRefresh = () => {
    console.log('🔄 Driver: Manual refresh triggered');
    setRefreshing(true);
    if (viewMode === 'orders') {
      fetchOrders();
    } else {
      fetchErrands();
    }
  };

  const handleSearch = (text: string) => {
    console.log('🔍 Driver: Search query changed:', text);
    setSearchQuery(text);
  };

  const handleOpenProfile = () => {
    console.log('👤 Driver: Opening profile screen');
    router.push('/driver/profile');
  };

  if (loading) {
    const loadingMessage = viewMode === 'orders' ? 'Loading orders...' : 'Loading errands...';
    return <LoadingSpinner message={loadingMessage} />;
  }

  if (error) {
    const retryFunction = viewMode === 'orders' ? fetchOrders : fetchErrands;
    return <ErrorMessage message={error} onRetry={retryFunction} />;
  }

  const firstName = user?.name ? getFirstName(user.name) : 'Driver';
  const displayData = viewMode === 'orders' ? filteredOrders : filteredErrands;
  const emptyIcon = viewMode === 'orders' ? '📦' : '🏃';
  const emptyTitle = viewMode === 'orders' ? 'No orders available' : 'No errands available';
  const emptyText = viewMode === 'orders' 
    ? 'New orders will appear here when customers place them.' 
    : 'New errands will appear here when customers request them.';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>Hello, {firstName}!</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={handleOpenProfile}
            >
              <Text style={styles.profileButtonText}>👤</Text>
            </TouchableOpacity>
            <View style={styles.availabilityContainer}>
              <Text style={styles.availabilityLabel}>
                {isAvailable ? 'Online' : 'Offline'}
              </Text>
              <Switch
                value={isAvailable}
                onValueChange={handleAvailabilityToggle}
                trackColor={{ false: theme.colors.border, true: theme.colors.success }}
                thumbColor={isAvailable ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order number or address..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {/* View Mode Selector */}
        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'orders' && styles.viewModeButtonActive]}
            onPress={() => {
              console.log('📱 Driver: Switching to orders view');
              setViewMode('orders');
            }}
          >
            <Text style={[styles.viewModeText, viewMode === 'orders' && styles.viewModeTextActive]}>
              Orders ({orders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'errands' && styles.viewModeButtonActive]}
            onPress={() => {
              console.log('📱 Driver: Switching to errands view');
              setViewMode('errands');
            }}
          >
            <Text style={[styles.viewModeText, viewMode === 'errands' && styles.viewModeTextActive]}>
              Errands ({errands.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'accepted', 'in_transit', 'delivered'] as OrderFilter[]).map((f) => {
          const isActive = filter === f;
          const label = f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, isActive && styles.filterButtonActive]}
              onPress={() => {
                console.log('🔍 Driver: Filter changed to:', f);
                setFilter(f);
              }}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (viewMode === 'orders') {
            const order = item as Order;
            return (
              <OrderCard
                order={order}
                onPress={() => {
                  console.log('📦 Driver: Opening order detail:', order.id);
                  router.push(`/driver/order/${order.id}`);
                }}
              />
            );
          } else {
            const errand = item as Errand;
            const categoryName = (errand as any).category?.name || 'Errand';
            const statusColor = getErrandStatusColor(errand.status);
            const statusLabel = errand.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            const createdDate = new Date(errand.created_at!).toLocaleDateString();
            const totalPrice = errand.total_price.toLocaleString();

            return (
              <TouchableOpacity
                style={styles.errandCard}
                onPress={() => {
                  console.log('📦 Driver: Opening errand detail:', errand.id);
                  router.push(`/errands/detail/${errand.id}`);
                }}
              >
                <View style={styles.errandHeader}>
                  <View style={styles.errandInfo}>
                    <Text style={styles.errandNumber}>#{errand.errand_number}</Text>
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
                      {errand.pickup_address}
                    </Text>
                  </View>
                  {errand.pickup_latitude && errand.pickup_longitude && (
                    <TouchableOpacity
                      style={styles.mapButton}
                      onPress={() => openInGoogleMaps(errand.pickup_latitude!, errand.pickup_longitude!, 'Pickup Location')}
                    >
                      <Text style={styles.mapButtonText}>📍 View Pickup on Google Maps</Text>
                    </TouchableOpacity>
                  )}
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>🎯</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {errand.dropoff_address}
                    </Text>
                  </View>
                  {errand.dropoff_latitude && errand.dropoff_longitude && (
                    <TouchableOpacity
                      style={styles.mapButton}
                      onPress={() => openInGoogleMaps(errand.dropoff_latitude!, errand.dropoff_longitude!, 'Dropoff Location')}
                    >
                      <Text style={styles.mapButtonText}>🎯 View Dropoff on Google Maps</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.errandFooter}>
                  <Text style={styles.priceText}>GYD ${totalPrice}</Text>
                  <Text style={styles.dateText}>{createdDate}</Text>
                </View>
              </TouchableOpacity>
            );
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>{emptyIcon}</Text>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}
