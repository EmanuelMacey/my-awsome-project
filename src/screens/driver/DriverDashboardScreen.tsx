
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Switch, TextInput, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Order } from '../../types/database.types';
import { Errand } from '../../types/errand.types';
import { getOrdersByDriver, getPendingOrders, filterOrdersByStatus, searchOrders } from '../../api/orders';
import { getErrandsByRunner, getPendingErrands } from '../../api/errands';
import { getDriverProfile, updateDriverAvailability } from '../../api/drivers';
import { useAuth } from '../../contexts/AuthContext';
import { OrderCard } from '../../components/OrderCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { supabase } from '../../config/supabase';
import { theme, globalStyles } from '../../styles/theme';
import { RealtimeChannel } from '@supabase/supabase-js';
import { formatCurrency } from '../../utils/currency';

type OrderFilter = 'all' | 'pending' | 'confirmed' | 'in_transit' | 'delivered';
type ViewMode = 'orders' | 'errands' | 'both';

// Evaluate Platform.OS outside of component to avoid issues
const isWeb = Platform.OS === 'web';

// Get first name only
const getFirstName = (fullName: string) => {
  if (!fullName) return 'Unknown';
  return fullName.split(' ')[0];
};

export default function DriverDashboardScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [errands, setErrands] = useState<Errand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Earnings state
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);

  const fetchDriverProfile = useCallback(async () => {
    if (!user) return;

    try {
      const profile = await getDriverProfile(user.id);
      if (profile) {
        setIsAvailable(profile.is_available);
      }
    } catch (err: any) {
      console.error('Error fetching driver profile:', err);
    }
  }, [user]);

  const calculateTodayEarnings = useCallback((ordersData: Order[], errandsData: Errand[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate earnings from completed orders today
    const completedOrders = ordersData.filter(order => {
      if (order.status !== 'delivered' || !order.driver_id || order.driver_id !== user?.id) return false;
      const completedDate = new Date(order.delivered_at || order.created_at);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });
    
    // Calculate earnings from completed errands today
    const completedErrands = errandsData.filter(errand => {
      if (errand.status !== 'completed' || !errand.runner_id || errand.runner_id !== user?.id) return false;
      const completedDate = new Date(errand.completed_at || errand.created_at);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });
    
    // Driver gets 80% of order total (20% platform fee)
    const orderEarnings = completedOrders.reduce((sum, order) => sum + (order.total * 0.8), 0);
    
    // Driver gets 80% of errand total (20% platform fee)
    const errandEarnings = completedErrands.reduce((sum, errand) => sum + (errand.total_price * 0.8), 0);
    
    const totalEarnings = orderEarnings + errandEarnings;
    const totalCompleted = completedOrders.length + completedErrands.length;
    
    console.log('Today earnings calculated:', {
      completedOrders: completedOrders.length,
      completedErrands: completedErrands.length,
      orderEarnings,
      errandEarnings,
      totalEarnings,
    });
    
    setTodayEarnings(totalEarnings);
    setCompletedToday(totalCompleted);
  }, [user]);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      console.log('No user found, skipping order fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching orders for driver:', user.id);
      setError(null);
      
      let ordersData: Order[] = [];
      let errandsData: Errand[] = [];

      if (searchQuery.trim()) {
        // Search orders
        ordersData = await searchOrders(searchQuery);
      } else if (filter !== 'all') {
        // Filter by status
        ordersData = await filterOrdersByStatus(filter as any);
      } else {
        // Get both assigned orders and pending orders with customer details
        const [assignedOrdersResult, pendingOrdersResult, assignedErrands, pendingErrandsData] = await Promise.all([
          supabase
            .from('orders')
            .select(`
              *,
              customer:users!orders_customer_id_fkey(name, email, phone),
              store:stores(name, address, phone)
            `)
            .eq('driver_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('orders')
            .select(`
              *,
              customer:users!orders_customer_id_fkey(name, email, phone),
              store:stores(name, address, phone)
            `)
            .is('driver_id', null)
            .eq('status', 'pending')
            .order('created_at', { ascending: false }),
          getErrandsByRunner(user.id),
          getPendingErrands(),
        ]);

        const assignedOrders = assignedOrdersResult.data || [];
        const pendingOrders = pendingOrdersResult.data || [];

        console.log('Assigned orders:', assignedOrders.length);
        console.log('Pending orders:', pendingOrders.length);
        console.log('Sample order with customer:', assignedOrders[0] || pendingOrders[0]);
        console.log('Assigned errands:', assignedErrands.length);
        console.log('Pending errands:', pendingErrandsData.length);

        // Combine and sort
        ordersData = [...assignedOrders, ...pendingOrders];
        errandsData = [...assignedErrands, ...pendingErrandsData];
      }

      const sorted = ordersData.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const sortedErrands = errandsData.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log('Total orders to display:', sorted.length);
      console.log('Total errands to display:', sortedErrands.length);
      setOrders(sorted);
      setErrands(sortedErrands);
      
      // Calculate today's earnings
      calculateTodayEarnings(sorted, sortedErrands);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, filter, searchQuery, calculateTodayEarnings]);

  useEffect(() => {
    fetchDriverProfile();
    fetchOrders();

    // Setup realtime subscription for order updates
    if (user && !channelRef.current) {
      console.log('Setting up realtime subscription for driver:', user.id);
      
      const channel = supabase.channel(`orders:driver:${user.id}`, {
        config: { private: true },
      });

      channel
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders' 
        }, (payload) => {
          console.log('New order inserted:', payload);
          fetchOrders();
        })
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders' 
        }, (payload) => {
          console.log('Order updated:', payload);
          fetchOrders();
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to order updates');
          } else {
            console.log('Subscription status:', status);
          }
        });

      channelRef.current = channel;
    }

    return () => {
      if (channelRef.current) {
        console.log('Cleaning up realtime subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, fetchOrders, fetchDriverProfile]);

  const handleAvailabilityToggle = async (value: boolean) => {
    if (!user) return;

    try {
      await updateDriverAvailability(user.id, value);
      setIsAvailable(value);
      Alert.alert(
        'Success',
        value ? 'You are now available for orders' : 'You are now offline'
      );
    } catch (err: any) {
      console.error('Error updating availability:', err);
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              router.replace('/auth/landing');
            } catch (error: any) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleSearch = () => {
    fetchOrders();
  };

  if (loading) {
    return <LoadingSpinner message="Loading orders..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchOrders} />;
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const filteredErrands = errands.filter(errand => {
    if (filter === 'all') return true;
    // Map errand statuses to order statuses for filtering
    if (filter === 'pending') return errand.status === 'pending';
    if (filter === 'confirmed') return errand.status === 'accepted';
    if (filter === 'in_transit') return errand.status === 'en_route';
    if (filter === 'delivered') return errand.status === 'completed';
    return false;
  });

  // Combine orders and errands for display
  const combinedData = [
    ...(viewMode === 'orders' || viewMode === 'both' ? filteredOrders.map(o => ({ type: 'order' as const, data: o })) : []),
    ...(viewMode === 'errands' || viewMode === 'both' ? filteredErrands.map(e => ({ type: 'errand' as const, data: e })) : []),
  ].sort((a, b) => {
    const aDate = new Date(a.data.created_at).getTime();
    const bDate = new Date(b.data.created_at).getTime();
    return bDate - aDate;
  });

  return (
    <View style={styles.container}>
      {/* Sidebar Navigation (Web Only) */}
      {isWeb && (
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarLogo}>🚚</Text>
            <Text style={styles.sidebarTitle}>ErrandRunners</Text>
            <Text style={styles.sidebarSubtitle}>Driver Portal</Text>
          </View>

          <View style={styles.sidebarMenu}>
            <TouchableOpacity style={styles.sidebarMenuItem} onPress={() => {}}>
              <Text style={styles.sidebarMenuIcon}>📊</Text>
              <Text style={styles.sidebarMenuText}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sidebarMenuItem}
              onPress={() => router.push('/driver/profile')}
            >
              <Text style={styles.sidebarMenuIcon}>👤</Text>
              <Text style={styles.sidebarMenuText}>Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sidebarFooter}>
            <View style={styles.sidebarUser}>
              <Text style={styles.sidebarUserIcon}>👤</Text>
              <View>
                <Text style={styles.sidebarUserName}>
                  {user ? getFirstName(user.name) : 'Driver'}
                </Text>
                <Text style={styles.sidebarUserRole}>Driver</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.sidebarLogout} onPress={handleLogout}>
              <Text style={styles.sidebarLogoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Content Area */}
      <View style={[styles.mainContent, isWeb && styles.mainContentWeb]}>
        {/* Mobile Header (Hidden on Web) */}
        {!isWeb && (
          <View style={styles.driverHeader}>
            <View style={styles.driverHeaderLeft}>
              <Text style={styles.driverHeaderTitle}>Driver Dashboard</Text>
              <Text style={styles.driverHeaderSubtitle}>
                {user ? getFirstName(user.name) : 'Driver'}
              </Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Web Header */}
        {isWeb && (
          <View style={styles.webHeader}>
            <Text style={styles.webHeaderTitle}>Driver Dashboard</Text>
            <Text style={styles.webHeaderSubtitle}>
              Manage your deliveries and errands
            </Text>
          </View>
        )}

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <Text style={styles.earningsTitle}>💰 Today's Earnings</Text>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => router.push('/driver/earnings-history' as any)}
            >
              <Text style={styles.historyButtonText}>History →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.earningsContent}>
            <Text style={styles.earningsAmount}>{formatCurrency(todayEarnings)}</Text>
            <Text style={styles.earningsSubtext}>
              {completedToday} completed {completedToday === 1 ? 'job' : 'jobs'} today
            </Text>
          </View>
        </View>

        {/* Availability Toggle */}
        <View style={styles.availabilityContainer}>
        <View style={styles.availabilityInfo}>
          <Text style={styles.availabilityLabel}>Driver Status:</Text>
          <Text style={[styles.availabilityStatus, isAvailable && styles.availabilityStatusActive]}>
            {isAvailable ? '🟢 Online' : '🔴 Offline'}
          </Text>
        </View>
        <Switch
          value={isAvailable}
          onValueChange={handleAvailabilityToggle}
          trackColor={{ false: '#767577', true: theme.colors.primary }}
          thumbColor={isAvailable ? '#fff' : '#f4f3f4'}
        />
      </View>

        {/* View Mode Toggle */}
        <View style={styles.viewModeContainer}>
        {(['both', 'orders', 'errands'] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.viewModeButton, viewMode === mode && styles.viewModeButtonActive]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.viewModeButtonText, viewMode === mode && styles.viewModeButtonTextActive]}>
              {mode === 'both' ? '📦 All' : mode === 'orders' ? '🍔 Fast Food' : '🏃 Errands'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
        {(['all', 'pending', 'confirmed', 'in_transit', 'delivered'] as OrderFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterButtonText, filter === f && styles.filterButtonTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

        <FlatList
          data={combinedData}
          keyExtractor={(item) => `${item.type}-${item.data.id}`}
        renderItem={({ item }) => {
          if (item.type === 'order') {
            const order = item.data as Order;
            return (
              <TouchableOpacity
                style={styles.orderCard}
                onPress={() => router.push(`/driver/order/${order.id}`)}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>🍔 {order.order_number}</Text>
                  <View style={[styles.orderStatusBadge, { backgroundColor: getOrderStatusColor(order.status) }]}>
                    <Text style={styles.orderStatusText}>{order.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.orderCustomer}>
                  Customer: {order.customer?.name ? getFirstName(order.customer.name) : 'Unknown Customer'}
                </Text>
                <Text style={styles.orderStore}>
                  Store: {order.store?.name || 'N/A'}
                </Text>
                <Text style={styles.orderAddress}>📍 {order.delivery_address}</Text>
                <View style={styles.orderFooter}>
                  <Text style={styles.orderPrice}>{formatCurrency(order.total)}</Text>
                  <Text style={styles.orderTime}>
                    {new Date(order.created_at).toLocaleTimeString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          } else {
            // Render errand card
            const errand = item.data as Errand;
            return (
              <TouchableOpacity
                style={styles.errandCard}
                onPress={() => router.push(`/errands/detail/${errand.id}`)}
              >
                <View style={styles.errandHeader}>
                  <Text style={styles.errandNumber}>🏃 {errand.errand_number}</Text>
                  <View style={[styles.errandStatusBadge, { backgroundColor: getErrandStatusColor(errand.status) }]}>
                    <Text style={styles.errandStatusText}>{errand.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.errandCustomer}>
                  Customer: {errand.customer?.name ? getFirstName(errand.customer.name) : 'Unknown Customer'}
                </Text>
                <Text style={styles.errandCategory}>
                  {errand.category?.name} - {errand.subcategory?.name}
                </Text>
                <View style={styles.errandAddresses}>
                  <Text style={styles.errandAddress}>📍 From: {errand.pickup_address}</Text>
                  <Text style={styles.errandAddress}>📍 To: {errand.dropoff_address}</Text>
                </View>
                <View style={styles.errandFooter}>
                  <Text style={styles.errandPrice}>{formatCurrency(errand.total_price)}</Text>
                  <Text style={styles.errandTime}>
                    {new Date(errand.created_at).toLocaleTimeString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }
        }}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.header}>
              {viewMode === 'both' ? 'Available Jobs' : viewMode === 'orders' ? 'Fast Food Orders' : 'Errand Services'}
            </Text>
            <Text style={styles.subheader}>
              {filteredOrders.filter(o => !o.driver_id).length} pending orders, {' '}
              {filteredErrands.filter(e => !e.runner_id).length} pending errands
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No jobs available</Text>
            <Text style={styles.emptySubtext}>
              {filter !== 'all' 
                ? `No ${filter} jobs found`
                : 'New jobs will appear here when customers place them'}
            </Text>
          </View>
        }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    </View>
  );
}

function getErrandStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#FF9500';
    case 'accepted':
      return '#007AFF';
    case 'at_pickup':
    case 'pickup_complete':
      return '#5856D6';
    case 'en_route':
      return '#AF52DE';
    case 'completed':
      return '#34C759';
    case 'cancelled':
      return '#FF3B30';
    default:
      return '#8E8E93';
  }
}

function getOrderStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#FF9500';
    case 'confirmed':
    case 'accepted':
      return '#007AFF';
    case 'purchasing':
    case 'preparing':
      return '#5856D6';
    case 'ready_for_pickup':
    case 'picked_up':
    case 'in_transit':
      return '#AF52DE';
    case 'delivered':
      return '#34C759';
    case 'cancelled':
      return '#FF3B30';
    default:
      return '#8E8E93';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    ...(isWeb && {
      flexDirection: 'row',
      width: '100%',
    }),
  },
  sidebar: {
    width: 260,
    backgroundColor: '#1E293B',
    borderRightWidth: 1,
    borderRightColor: '#334155',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  sidebarLogo: {
    fontSize: 32,
    marginBottom: 8,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sidebarSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  sidebarMenu: {
    flex: 1,
    paddingVertical: 16,
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  sidebarMenuIcon: {
    fontSize: 20,
  },
  sidebarMenuText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#E2E8F0',
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  sidebarUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sidebarUserIcon: {
    fontSize: 24,
  },
  sidebarUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sidebarUserRole: {
    fontSize: 12,
    color: '#94A3B8',
  },
  sidebarLogout: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  sidebarLogoutText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
  },
  mainContentWeb: {
    backgroundColor: '#F8FAFC',
  },
  webHeader: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  webHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  webHeaderSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: '#1E88E5',
  },
  driverHeaderLeft: {
    flex: 1,
  },
  driverHeaderTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  driverHeaderSubtitle: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: theme.spacing.xs,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  availabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isWeb ? '#FFFFFF' : theme.colors.surface,
    padding: isWeb ? 20 : theme.spacing.md,
    marginHorizontal: isWeb ? 32 : theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
    ...(isWeb && {
      borderWidth: 1,
      borderColor: '#E2E8F0',
    }),
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: '600',
    marginRight: theme.spacing.sm,
  },
  availabilityStatus: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  availabilityStatusActive: {
    color: theme.colors.success,
  },
  earningsCard: {
    backgroundColor: isWeb ? '#FFFFFF' : theme.colors.surface,
    padding: isWeb ? 20 : theme.spacing.md,
    marginHorizontal: isWeb ? 32 : theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
    ...(isWeb && {
      borderWidth: 1,
      borderColor: '#E2E8F0',
    }),
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  earningsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },
  historyButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
  },
  historyButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  earningsContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.success,
    marginBottom: theme.spacing.xs,
  },
  earningsSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    marginHorizontal: isWeb ? 32 : theme.spacing.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    ...theme.shadows.sm,
  },
  searchButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: isWeb ? 32 : theme.spacing.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: theme.spacing.md,
  },
  headerContainer: {
    marginHorizontal: isWeb ? 32 : theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  header: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  subheader: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  viewModeContainer: {
    flexDirection: 'row',
    marginHorizontal: isWeb ? 32 : theme.spacing.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  viewModeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  viewModeButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  viewModeButtonTextActive: {
    color: '#FFFFFF',
  },
  orderCard: {
    backgroundColor: isWeb ? '#FFFFFF' : theme.colors.surface,
    borderRadius: isWeb ? 12 : theme.borderRadius.lg,
    padding: isWeb ? 20 : theme.spacing.md,
    marginHorizontal: isWeb ? 32 : theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
    ...(isWeb && {
      borderWidth: 1,
      borderColor: '#E2E8F0',
    }),
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  orderNumber: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  orderStatusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  orderStatusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  orderCustomer: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  orderStore: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  orderAddress: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  orderPrice: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  orderTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  errandCard: {
    backgroundColor: isWeb ? '#FFFFFF' : theme.colors.surface,
    borderRadius: isWeb ? 12 : theme.borderRadius.lg,
    padding: isWeb ? 20 : theme.spacing.md,
    marginHorizontal: isWeb ? 32 : theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
    ...(isWeb && {
      borderWidth: 1,
      borderColor: '#E2E8F0',
    }),
  },
  errandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  errandNumber: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  errandStatusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  errandStatusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  errandCustomer: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  errandCategory: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  errandAddresses: {
    marginBottom: theme.spacing.sm,
  },
  errandAddress: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  errandFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  errandPrice: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  errandTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
});
