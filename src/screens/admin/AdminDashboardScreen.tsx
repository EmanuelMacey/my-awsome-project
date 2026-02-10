
import { router } from 'expo-router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../config/supabase';
import { searchOrders, filterOrdersByStatus } from '../../api/orders';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ErrandCategory, ErrandSubcategory } from '../../types/errand.types';
import { getErrandCategories, getErrandSubcategories, createErrand } from '../../api/errands';
import { createInvoiceFromErrand, sendInvoiceEmail, markInvoiceAsPaid } from '../../api/invoices';
import { formatCurrency } from '../../utils/currency';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { sendLocalNotification } from '../../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Linking,
  Modal,
  Platform,
} from 'react-native';
import { theme } from '../../styles/theme';

interface OrderWithDetails {
  id: string;
  order_number: string;
  customer_id: string;
  status: string;
  total: number;
  payment_method: string;
  delivery_address: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  customer_phone?: string;
  created_at: string;
  customer: {
    name: string;
    phone: string;
  } | null;
}

interface ErrandWithDetails {
  id: string;
  errand_number: string;
  customer_id: string;
  runner_id: string | null;
  status: string;
  pickup_address: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  dropoff_address: string;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
  total_price: number;
  created_at: string;
  customer: {
    name: string;
    phone: string;
  } | null;
  category: {
    name: string;
  } | null;
}

type OrderFilter = 'all' | 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  greeting: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  logoutButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
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
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: theme.fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  viewAllButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  viewAllText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: '#FFFFFF',
  },
  cardDetail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  actionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyStateTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#F59E0B',
    confirmed: '#3B82F6',
    accepted: '#10B981',
    purchasing: '#8B5CF6',
    preparing: '#EC4899',
    ready_for_pickup: '#06B6D4',
    picked_up: '#14B8A6',
    in_transit: '#6366F1',
    delivered: '#10B981',
    completed: '#10B981',
    cancelled: '#EF4444',
  };
  return colors[status] || '#6B7280';
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0];
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
    Linking.openURL(url).catch(err => console.error('Failed to open Google Maps', err));
  }
}

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [errands, setErrands] = useState<ErrandWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const channelRef = useRef<RealtimeChannel | null>(null);

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (filter !== 'all') {
      filtered = filtered.filter(order => order.status === filter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(query) ||
        order.customer?.name.toLowerCase().includes(query) ||
        order.delivery_address.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [orders, filter, searchQuery]);

  const fetchData = useCallback(async () => {
    try {
      console.log('📊 Admin: Fetching dashboard data...');

      // Show cached data immediately for faster perceived loading
      const cachedOrders = await AsyncStorage.getItem('admin_orders_cache');
      const cachedErrands = await AsyncStorage.getItem('admin_errands_cache');
      
      if (cachedOrders && cachedErrands && !refreshing) {
        try {
          const parsedOrders = JSON.parse(cachedOrders);
          const parsedErrands = JSON.parse(cachedErrands);
          console.log('⚡ Admin: Using cached data');
          setOrders(parsedOrders);
          setErrands(parsedErrands);
          setLoading(false);
        } catch (e) {
          console.log('⚠️ Failed to parse cached data');
        }
      }

      const [ordersResponse, errandsResponse] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            *,
            customer:users!orders_customer_id_fkey(name, phone)
          `)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('errands')
          .select(`
            *,
            customer:users!errands_customer_id_fkey(name, phone),
            category:errand_categories(name)
          `)
          .order('created_at', { ascending: false})
          .limit(50),
      ]);

      if (ordersResponse.error) throw ordersResponse.error;
      if (errandsResponse.error) throw errandsResponse.error;

      console.log('✅ Admin: Orders fetched:', ordersResponse.data?.length || 0);
      console.log('✅ Admin: Errands fetched:', errandsResponse.data?.length || 0);

      setOrders(ordersResponse.data || []);
      setErrands(errandsResponse.data || []);
      
      // Cache the fresh data
      await AsyncStorage.setItem('admin_orders_cache', JSON.stringify(ordersResponse.data || []));
      await AsyncStorage.setItem('admin_errands_cache', JSON.stringify(errandsResponse.data || []));
    } catch (error: any) {
      console.error('❌ Admin: Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    if (!user) return;

    fetchData();

    const setupRealtimeSubscription = async () => {
      try {
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        console.log('🔔 Admin: Setting up realtime subscriptions');
        const channel = supabase.channel('admin_dashboard', {
          config: {
            broadcast: { self: false },
          },
        });

        channelRef.current = channel;

        channel
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'orders',
            },
            async (payload) => {
              console.log('🆕 Admin: New order created:', payload);
              
              const newOrder = payload.new as OrderWithDetails;
              
              // Send local notification to admin about new order
              console.log('📬 Admin: Sending new order notification');
              await sendLocalNotification(
                '🆕 New Order Placed',
                `Order #${newOrder.order_number} - GYD $${newOrder.total.toFixed(2)}`,
                {
                  type: 'new_order',
                  orderId: newOrder.id,
                  orderNumber: newOrder.order_number,
                }
              );
              
              fetchData();
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
            },
            async (payload) => {
              console.log('📦 Admin: Order updated:', payload);
              
              const updatedOrder = payload.new as OrderWithDetails;
              const oldOrder = payload.old as OrderWithDetails;
              
              // Notify admin if order was cancelled
              if (updatedOrder.status === 'cancelled' && oldOrder.status !== 'cancelled') {
                console.log('📬 Admin: Sending cancellation notification');
                await sendLocalNotification(
                  '❌ Order Cancelled',
                  `Order #${updatedOrder.order_number} was cancelled.`,
                  {
                    type: 'order_cancelled',
                    orderId: updatedOrder.id,
                    orderNumber: updatedOrder.order_number,
                  }
                );
              }
              
              fetchData();
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'errands',
            },
            async (payload) => {
              console.log('🆕 Admin: New errand created:', payload);
              
              const newErrand = payload.new as ErrandWithDetails;
              
              // Send local notification to admin about new errand
              console.log('📬 Admin: Sending new errand notification');
              await sendLocalNotification(
                '🆕 New Errand Requested',
                `Errand #${newErrand.errand_number} - GYD $${newErrand.total_price.toFixed(2)}`,
                {
                  type: 'new_errand',
                  errandId: newErrand.id,
                  errandNumber: newErrand.errand_number,
                }
              );
              
              fetchData();
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'errands',
            },
            async (payload) => {
              console.log('📦 Admin: Errand updated:', payload);
              
              const updatedErrand = payload.new as ErrandWithDetails;
              const oldErrand = payload.old as ErrandWithDetails;
              
              // Notify admin if errand was cancelled
              if (updatedErrand.status === 'cancelled' && oldErrand.status !== 'cancelled') {
                console.log('📬 Admin: Sending cancellation notification');
                await sendLocalNotification(
                  '❌ Errand Cancelled',
                  `Errand #${updatedErrand.errand_number} was cancelled.`,
                  {
                    type: 'errand_cancelled',
                    errandId: updatedErrand.id,
                    errandNumber: updatedErrand.errand_number,
                  }
                );
              }
              
              fetchData();
            }
          )
          .subscribe();
      } catch (error) {
        console.error('❌ Admin: Error setting up realtime subscription:', error);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        console.log('🔕 Admin: Cleaning up realtime subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, fetchData]);

  const handleCreateOrder = () => {
    Alert.alert('Coming Soon', 'Manual order creation will be available soon');
  };

  const handleCreateErrand = () => {
    router.push('/errands/create');
  };

  const handleOrderAction = async (orderId: string, action: 'accept' | 'reject' | 'complete') => {
    try {
      let newStatus = '';
      if (action === 'accept') newStatus = 'accepted';
      else if (action === 'reject') newStatus = 'cancelled';
      else if (action === 'complete') newStatus = 'delivered';

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      console.log(`Order ${orderId} ${action}ed`);
      fetchData();
      Alert.alert('Success', `Order ${action}ed successfully`);
    } catch (error: any) {
      console.error(`Error ${action}ing order:`, error);
      Alert.alert('Error', `Failed to ${action} order`);
    }
  };

  const handleErrandAction = async (errandId: string, action: 'accept' | 'reject' | 'complete') => {
    try {
      let newStatus = '';
      if (action === 'accept') newStatus = 'accepted';
      else if (action === 'reject') newStatus = 'cancelled';
      else if (action === 'complete') newStatus = 'completed';

      const { error } = await supabase
        .from('errands')
        .update({ status: newStatus })
        .eq('id', errandId);

      if (error) throw error;

      console.log(`Errand ${errandId} ${action}ed`);
      fetchData();
      Alert.alert('Success', `Errand ${action}ed successfully`);
    } catch (error: any) {
      console.error(`Error ${action}ing errand:`, error);
      Alert.alert('Error', `Failed to ${action} errand`);
    }
  };

  const handleGenerateInvoice = async (errandId: string) => {
    try {
      if (!user) return;

      console.log('Generating invoice for errand:', errandId);
      const invoice = await createInvoiceFromErrand(errandId, user.id);
      console.log('Invoice generated:', invoice.id);

      Alert.alert(
        'Invoice Generated',
        'Would you like to send it to the customer via email?',
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Send Email',
            onPress: () => handleSendInvoiceEmail(invoice.id),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      Alert.alert('Error', error.message || 'Failed to generate invoice');
    }
  };

  const handleSendInvoiceEmail = async (invoiceId: string) => {
    try {
      if (!user) return;

      console.log('Sending invoice email:', invoiceId);
      await sendInvoiceEmail(invoiceId, user.id);
      Alert.alert('Success', 'Invoice sent via email');
    } catch (error: any) {
      console.error('Error sending invoice:', error);
      Alert.alert('Error', 'Failed to send invoice email');
    }
  };

  const handleMarkInvoiceAsPaid = async (invoiceId: string) => {
    try {
      if (!user) return;

      console.log('Marking invoice as paid:', invoiceId);
      await markInvoiceAsPaid(invoiceId, user.id);
      Alert.alert('Success', 'Invoice marked as paid');
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error);
      Alert.alert('Error', 'Failed to mark invoice as paid');
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
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
        },
      ]
    );
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const firstName = user?.name ? getFirstName(user.name) : 'Admin';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>Hello, {firstName}! 👋</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/admin/user-management')}
          >
            <Text style={styles.quickActionText}>👥 Users</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/admin/store-management')}
          >
            <Text style={styles.quickActionText}>🏪 Stores</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/admin/invoices')}
          >
            <Text style={styles.quickActionText}>📄 Invoices</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/admin/promotions')}
          >
            <Text style={styles.quickActionText}>🎉 Promotions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/admin/coupons')}
          >
            <Text style={styles.quickActionText}>🎫 Coupons</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              console.log('📢 Opening notification campaigns');
              router.push('/admin/notification-campaigns');
            }}
          >
            <Text style={styles.quickActionText}>📢 Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={handleCreateErrand}
          >
            <Text style={styles.quickActionText}>➕ New Errand</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {(['all', 'pending', 'accepted', 'in_transit', 'delivered', 'cancelled'] as OrderFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === f && styles.filterButtonTextActive,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
          </View>

          {filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📦</Text>
              <Text style={styles.emptyStateTitle}>No Orders Found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'Try a different search term' : 'Orders will appear here'}
              </Text>
            </View>
          ) : (
            filteredOrders.map((order) => (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>#{order.order_number}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                    <Text style={styles.statusText}>{order.status}</Text>
                  </View>
                </View>

                <Text style={styles.cardDetail}>
                  Customer: {order.customer?.name || 'Unknown'}
                </Text>
                <Text style={styles.cardDetail}>
                  Phone: {order.customer_phone || order.customer?.phone || 'N/A'}
                </Text>
                <Text style={styles.cardDetail}>
                  Address: {order.delivery_address}
                </Text>
                <Text style={styles.cardDetail}>
                  Total: {formatCurrency(order.total)}
                </Text>
                <Text style={styles.cardDetail}>
                  Payment: {order.payment_method}
                </Text>

                <View style={styles.cardActions}>
                  {order.delivery_latitude && order.delivery_longitude && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                      onPress={() => openInGoogleMaps(
                        order.delivery_latitude!,
                        order.delivery_longitude!,
                        'Delivery Location'
                      )}
                    >
                      <Text style={styles.actionButtonText}>📍 View Location</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/customer/order/${order.id}`)}
                  >
                    <Text style={styles.actionButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Errands</Text>
          </View>

          {errands.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📋</Text>
              <Text style={styles.emptyStateTitle}>No Errands Found</Text>
              <Text style={styles.emptyStateText}>Errands will appear here</Text>
            </View>
          ) : (
            errands.slice(0, 10).map((errand) => (
              <View key={errand.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>#{errand.errand_number}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(errand.status) }]}>
                    <Text style={styles.statusText}>{errand.status}</Text>
                  </View>
                </View>

                <Text style={styles.cardDetail}>
                  Customer: {errand.customer?.name || 'Unknown'}
                </Text>
                <Text style={styles.cardDetail}>
                  Category: {errand.category?.name || 'N/A'}
                </Text>
                <Text style={styles.cardDetail}>
                  Pickup: {errand.pickup_address}
                </Text>
                <Text style={styles.cardDetail}>
                  Dropoff: {errand.dropoff_address}
                </Text>
                <Text style={styles.cardDetail}>
                  Total: {formatCurrency(errand.total_price)}
                </Text>

                <View style={styles.cardActions}>
                  {errand.pickup_latitude && errand.pickup_longitude && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                      onPress={() => openInGoogleMaps(
                        errand.pickup_latitude!,
                        errand.pickup_longitude!,
                        'Pickup Location'
                      )}
                    >
                      <Text style={styles.actionButtonText}>📍 Pickup</Text>
                    </TouchableOpacity>
                  )}
                  {errand.dropoff_latitude && errand.dropoff_longitude && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
                      onPress={() => openInGoogleMaps(
                        errand.dropoff_latitude!,
                        errand.dropoff_longitude!,
                        'Dropoff Location'
                      )}
                    >
                      <Text style={styles.actionButtonText}>📍 Dropoff</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/errands/detail/${errand.id}`)}
                  >
                    <Text style={styles.actionButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

