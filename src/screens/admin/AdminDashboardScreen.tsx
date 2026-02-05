
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { theme } from '../../styles/theme';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { searchOrders, filterOrdersByStatus } from '../../api/orders';
import { formatCurrency } from '../../utils/currency';
import { createInvoiceFromErrand, sendInvoiceEmail, markInvoiceAsPaid } from '../../api/invoices';
import { getErrandCategories, getErrandSubcategories, createErrand } from '../../api/errands';
import { ErrandCategory, ErrandSubcategory } from '../../types/errand.types';

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

type OrderFilter = 'all' | 'pending' | 'accepted' | 'in_transit' | 'delivered';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return '#FF9800';
    case 'accepted':
    case 'purchasing':
    case 'preparing':
      return '#2196F3';
    case 'ready_for_pickup':
    case 'picked_up':
    case 'in_transit':
    case 'at_pickup':
    case 'pickup_complete':
    case 'en_route':
      return '#9C27B0';
    case 'delivered':
    case 'completed':
      return '#4CAF50';
    case 'cancelled':
      return '#F44336';
    default:
      return theme.colors.textSecondary;
  }
};

const getFirstName = (fullName: string) => {
  if (!fullName) return 'Unknown';
  return fullName.split(' ')[0];
};

// Evaluate Platform.OS outside of component to avoid issues
const isWeb = Platform.OS === 'web';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [errands, setErrands] = useState<ErrandWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'errands'>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedStoreDetails, setSelectedStoreDetails] = useState<any>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);

  const [showCreateErrandModal, setShowCreateErrandModal] = useState(false);
  const [errandCategories, setErrandCategories] = useState<ErrandCategory[]>([]);
  const [errandSubcategories, setErrandSubcategories] = useState<ErrandSubcategory[]>([]);
  const [errandCustomerName, setErrandCustomerName] = useState('');
  const [errandCustomerPhone, setErrandCustomerPhone] = useState('');
  const [errandCustomerAddress, setErrandCustomerAddress] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [errandInstructions, setErrandInstructions] = useState('');
  const [errandNotes, setErrandNotes] = useState('');
  const [creatingErrand, setCreatingErrand] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      console.log('Fetching orders and errands for admin dashboard...');
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:users!orders_customer_id_fkey(name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      console.log('Orders fetched:', ordersData?.length || 0);
      setOrders(ordersData || []);

      const { data: errandsData, error: errandsError } = await supabase
        .from('errands')
        .select(`
          *,
          customer:users!errands_customer_id_fkey(name, email, phone),
          category:errand_categories(name)
        `)
        .order('created_at', { ascending: false });

      if (errandsError) {
        console.error('Error fetching errands:', errandsError);
        throw errandsError;
      }

      console.log('Errands fetched:', errandsData?.length || 0);
      setErrands(errandsData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchStores = useCallback(async () => {
    try {
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name, address')
        .order('name');

      if (storesError) {
        console.error('Error fetching stores:', storesError);
      } else {
        setStores(storesData || []);
      }
    } catch (error: any) {
      console.error('Error fetching stores:', error);
    }
  }, []);

  const fetchErrandCategories = useCallback(async () => {
    try {
      const categories = await getErrandCategories();
      setErrandCategories(categories);
    } catch (error: any) {
      console.error('Error fetching errand categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchStores();
    fetchErrandCategories();
  }, [fetchData, fetchStores, fetchErrandCategories]);

  useEffect(() => {
    if (selectedCategory) {
      getErrandSubcategories(selectedCategory).then(setErrandSubcategories);
    } else {
      setErrandSubcategories([]);
    }
  }, [selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleCreateOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim() || !selectedStore) {
      Alert.alert('Error', 'Please fill in all customer details and select a store');
      return;
    }

    if (!orderPrice.trim() || isNaN(parseFloat(orderPrice))) {
      Alert.alert('Error', 'Please enter a valid price for the order');
      return;
    }

    setCreatingOrder(true);
    try {
      const orderNumber = `ORD-${Date.now()}`;
      const totalPrice = parseFloat(orderPrice);

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: user?.id,
          store_id: selectedStore,
          status: 'pending',
          total: totalPrice,
          subtotal: totalPrice,
          delivery_fee: 0,
          tax: 0,
          payment_method: 'cash',
          delivery_address: customerAddress,
          customer_phone: customerPhone,
          delivery_notes: `Customer: ${customerName}\nPhone: ${customerPhone}\n${orderNotes}`,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw orderError;
      }

      Alert.alert(
        'Success',
        `Order ${orderNumber} created successfully for ${customerName}!\n\nTotal: GYD $${totalPrice.toFixed(2)}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowCreateOrderModal(false);
              setCustomerName('');
              setCustomerPhone('');
              setCustomerAddress('');
              setSelectedStore('');
              setSelectedStoreDetails(null);
              setOrderNotes('');
              setOrderPrice('');
              fetchData();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating order:', error);
      Alert.alert('Error', error.message || 'Failed to create order. Please check payment method constraints.');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleCreateErrand = async () => {
    if (!errandCustomerName.trim() || !errandCustomerPhone.trim()) {
      Alert.alert('Error', 'Please fill in customer name and phone');
      return;
    }

    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      Alert.alert('Error', 'Please provide pickup and dropoff addresses');
      return;
    }

    if (!errandInstructions.trim()) {
      Alert.alert('Error', 'Please provide instructions for the errand');
      return;
    }

    setCreatingErrand(true);
    try {
      const errandNumber = `ERR-${Date.now()}`;
      const fixedPrice = 2000;
      
      let defaultCategoryId = null;
      if (errandCategories.length > 0) {
        defaultCategoryId = errandCategories[0].id;
      }

      const { data: errandData, error: errandError } = await supabase
        .from('errands')
        .insert({
          errand_number: errandNumber,
          customer_id: user?.id,
          category_id: defaultCategoryId,
          subcategory_id: null,
          pickup_address: pickupAddress,
          dropoff_address: dropoffAddress,
          instructions: errandInstructions,
          notes: `Customer: ${errandCustomerName}\nPhone: ${errandCustomerPhone}\nAddress: ${errandCustomerAddress}\n${errandNotes}`,
          status: 'pending',
          is_asap: true,
          base_price: fixedPrice,
          distance_fee: 0,
          complexity_fee: 0,
          total_price: fixedPrice,
          payment_method: 'cash',
        })
        .select()
        .single();

      if (errandError) {
        console.error('Errand creation error:', errandError);
        throw errandError;
      }

      Alert.alert(
        'Success',
        `Errand ${errandNumber} created successfully for ${errandCustomerName}!\n\nFixed Price: GYD $${fixedPrice.toFixed(2)}\n\nDrivers can now see and accept this errand.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowCreateErrandModal(false);
              setErrandCustomerName('');
              setErrandCustomerPhone('');
              setErrandCustomerAddress('');
              setSelectedCategory('');
              setSelectedSubcategory('');
              setPickupAddress('');
              setDropoffAddress('');
              setErrandInstructions('');
              setErrandNotes('');
              fetchData();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating errand:', error);
      Alert.alert('Error', error.message || 'Failed to create errand. Please check payment method constraints.');
    } finally {
      setCreatingErrand(false);
    }
  };

  const handleOrderAction = async (orderId: string, action: 'accept' | 'reject' | 'complete') => {
    try {
      let newStatus = '';
      let message = '';

      switch (action) {
        case 'accept':
          newStatus = 'accepted';
          message = 'Order accepted successfully';
          break;
        case 'reject':
          newStatus = 'cancelled';
          message = 'Order cancelled';
          break;
        case 'complete':
          newStatus = 'delivered';
          message = 'Order marked as delivered';
          break;
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      Alert.alert('Success', message);
      fetchData();
    } catch (error: any) {
      console.error('Error updating order:', error);
      Alert.alert('Error', 'Failed to update order');
    }
  };

  const handleErrandAction = async (errandId: string, action: 'accept' | 'reject' | 'complete') => {
    try {
      let newStatus = '';
      let message = '';

      switch (action) {
        case 'accept':
          newStatus = 'accepted';
          message = 'Errand accepted successfully';
          break;
        case 'reject':
          newStatus = 'cancelled';
          message = 'Errand cancelled';
          break;
        case 'complete':
          newStatus = 'completed';
          message = 'Errand marked as completed';
          break;
      }

      const { error } = await supabase
        .from('errands')
        .update({ status: newStatus })
        .eq('id', errandId);

      if (error) throw error;

      Alert.alert('Success', message);
      fetchData();
    } catch (error: any) {
      console.error('Error updating errand:', error);
      Alert.alert('Error', 'Failed to update errand');
    }
  };

  const handleGenerateInvoice = async (errandId: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    Alert.alert(
      'Generate Invoice',
      'Generate invoice for this errand?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              setGeneratingInvoice(errandId);
              console.log('Generating invoice for errand:', errandId);
              const invoice = await createInvoiceFromErrand(errandId, user.id);

              Alert.alert(
                'Success',
                'Invoice generated successfully! You can now send it to the customer or mark it as paid.',
                [
                  {
                    text: 'View Invoice',
                    onPress: () => router.push(`/customer/invoice/${invoice.id}`),
                  },
                  { text: 'OK' },
                ]
              );

              fetchData();
            } catch (error: any) {
              console.error('Error generating invoice:', error);
              Alert.alert('Error', error.message || 'Failed to generate invoice');
            } finally {
              setGeneratingInvoice(null);
            }
          },
        },
      ]
    );
  };

  const handleSendInvoiceEmail = async (invoiceId: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    Alert.alert(
      'Send Invoice',
      'Send this invoice to the customer via email?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setSendingEmail(invoiceId);
              console.log('Sending invoice email:', invoiceId);
              await sendInvoiceEmail(invoiceId, user.id);

              Alert.alert('Success', 'Invoice sent to customer email successfully!');
            } catch (error: any) {
              console.error('Error sending invoice email:', error);
              Alert.alert('Error', error.message || 'Failed to send invoice email');
            } finally {
              setSendingEmail(null);
            }
          },
        },
      ]
    );
  };

  const handleMarkInvoiceAsPaid = async (invoiceId: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    Alert.alert(
      'Mark as Paid',
      'Mark this invoice as paid? This action will record the payment timestamp.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Paid',
          onPress: async () => {
            try {
              setMarkingPaid(invoiceId);
              console.log('Marking invoice as paid:', invoiceId);
              await markInvoiceAsPaid(invoiceId, user.id);

              Alert.alert('Success', 'Invoice marked as paid successfully!');
              fetchData();
            } catch (error: any) {
              console.error('Error marking invoice as paid:', error);
              Alert.alert('Error', error.message || 'Failed to mark invoice as paid');
            } finally {
              setMarkingPaid(null);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/auth/landing');
    } catch (error: any) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchData();
      return;
    }

    try {
      const results = await searchOrders(searchQuery);
      setOrders(results);
    } catch (error: any) {
      console.error('Error searching orders:', error);
      Alert.alert('Error', 'Failed to search orders');
    }
  };

  const filteredOrders = orderFilter === 'all'
    ? orders
    : orders.filter(order => order.status === orderFilter);

  const filteredErrands = errands;

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      {/* Sidebar Navigation (Web Only) */}
      {isWeb && (
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarLogo}>🚚</Text>
            <Text style={styles.sidebarTitle}>ErrandRunners</Text>
            <Text style={styles.sidebarSubtitle}>Admin Panel</Text>
          </View>

          <View style={styles.sidebarMenu}>
            <TouchableOpacity style={styles.sidebarMenuItem} onPress={() => {}}>
              <Text style={styles.sidebarMenuIcon}>📊</Text>
              <Text style={styles.sidebarMenuText}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sidebarMenuItem}
              onPress={() => router.push('/admin/store-management')}
            >
              <Text style={styles.sidebarMenuIcon}>🏪</Text>
              <Text style={styles.sidebarMenuText}>Stores</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sidebarMenuItem}
              onPress={() => router.push('/admin/user-management')}
            >
              <Text style={styles.sidebarMenuIcon}>👥</Text>
              <Text style={styles.sidebarMenuText}>Users</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sidebarMenuItem}
              onPress={() => router.push('/admin/invoices')}
            >
              <Text style={styles.sidebarMenuIcon}>📄</Text>
              <Text style={styles.sidebarMenuText}>Invoices</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sidebarFooter}>
            <View style={styles.sidebarUser}>
              <Text style={styles.sidebarUserIcon}>👤</Text>
              <View>
                <Text style={styles.sidebarUserName}>
                  {user ? getFirstName(user.name) : 'Admin'}
                </Text>
                <Text style={styles.sidebarUserRole}>Administrator</Text>
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
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
              <Text style={styles.headerSubtitle}>
                {user ? getFirstName(user.name) : 'Admin'}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/admin/store-management')}
              >
                <Text style={styles.headerButtonText}>🏪 Stores</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/admin/user-management')}
              >
                <Text style={styles.headerButtonText}>👥 Users</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Web Header */}
        {isWeb && (
          <View style={styles.webHeader}>
            <Text style={styles.webHeaderTitle}>Dashboard</Text>
            <Text style={styles.webHeaderSubtitle}>
              Manage orders, errands, and operations
            </Text>
          </View>
        )}

        <View style={styles.createSection}>
          <TouchableOpacity
            style={[styles.createButton, styles.createOrderButton]}
            onPress={() => setShowCreateOrderModal(true)}
          >
            <Text style={styles.createButtonText}>➕ Create Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createButton, styles.createErrandButton]}
            onPress={() => setShowCreateErrandModal(true)}
          >
            <Text style={styles.createButtonText}>🏃 Create Errand</Text>
          </TouchableOpacity>
        </View>

        {!isWeb && (
          <View style={styles.invoiceSection}>
            <TouchableOpacity
              style={styles.invoiceButton}
              onPress={() => router.push('/admin/invoices')}
            >
              <Text style={styles.invoiceButtonText}>📄 Invoice Management</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
            onPress={() => setActiveTab('orders')}
          >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
              Orders ({orders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'errands' && styles.tabActive]}
            onPress={() => setActiveTab('errands')}
          >
            <Text style={[styles.tabText, activeTab === 'errands' && styles.tabTextActive]}>
              Errands ({errands.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        {activeTab === 'orders' ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersContainer}
              contentContainerStyle={styles.filtersContent}
            >
              {(['all', 'pending', 'accepted', 'in_transit', 'delivered'] as OrderFilter[]).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    orderFilter === filter && styles.filterChipActive,
                  ]}
                  onPress={() => setOrderFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      orderFilter === filter && styles.filterChipTextActive,
                    ]}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1).replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No orders found</Text>
              </View>
            ) : (
              filteredOrders.map((order) => (
                <View key={order.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>#{order.order_number}</Text>
                      <Text style={styles.cardSubtitle}>
                        Customer: {order.customer?.name || 'Unknown Customer'}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        Phone: {order.customer?.phone || order.customer_phone || 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                        {order.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardText}>📍 {order.delivery_address}</Text>
                    <Text style={styles.cardText}>💰 {formatCurrency(order.total)}</Text>
                    <Text style={styles.cardText}>
                      📅 {new Date(order.created_at).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    {order.status === 'pending' && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleOrderAction(order.id, 'accept')}
                        >
                          <Text style={styles.actionButtonText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton]}
                          onPress={() => handleOrderAction(order.id, 'reject')}
                        >
                          <Text style={styles.actionButtonText}>Reject</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {order.status === 'in_transit' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.completeButton]}
                        onPress={() => handleOrderAction(order.id, 'complete')}
                      >
                        <Text style={styles.actionButtonText}>Mark Delivered</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.viewButton]}
                      onPress={() => router.push(`/customer/order/${order.id}`)}
                    >
                      <Text style={styles.actionButtonText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            {filteredErrands.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No errands found</Text>
              </View>
            ) : (
              filteredErrands.map((errand) => (
                <View key={errand.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>#{errand.errand_number}</Text>
                      <Text style={styles.cardSubtitle}>
                        Customer: {errand.customer?.name || 'Unknown Customer'}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        Phone: {errand.customer?.phone || 'N/A'}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        Category: {errand.category?.name || 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(errand.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(errand.status) }]}>
                        {errand.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardText}>📍 Pickup: {errand.pickup_address}</Text>
                    <Text style={styles.cardText}>🎯 Dropoff: {errand.dropoff_address}</Text>
                    <Text style={styles.cardText}>💰 {formatCurrency(errand.total_price)}</Text>
                    <Text style={styles.cardText}>
                      📅 {new Date(errand.created_at).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    {errand.status === 'pending' && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleErrandAction(errand.id, 'accept')}
                        >
                          <Text style={styles.actionButtonText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton]}
                          onPress={() => handleErrandAction(errand.id, 'reject')}
                        >
                          <Text style={styles.actionButtonText}>Reject</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {errand.status === 'en_route' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.completeButton]}
                        onPress={() => handleErrandAction(errand.id, 'complete')}
                      >
                        <Text style={styles.actionButtonText}>Mark Completed</Text>
                      </TouchableOpacity>
                    )}
                    {(errand.status === 'completed' || errand.status === 'delivered') && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.invoiceButtonLarge]}
                        onPress={() => handleGenerateInvoice(errand.id)}
                        disabled={generatingInvoice === errand.id}
                      >
                        <Text style={styles.invoiceButtonIcon}>📄</Text>
                        <Text style={styles.invoiceButtonText}>
                          {generatingInvoice === errand.id ? 'Generating...' : 'Generate Invoice'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.viewButton]}
                      onPress={() => router.push(`/errands/detail/${errand.id}`)}
                    >
                      <Text style={styles.actionButtonText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      <Modal
        visible={showCreateOrderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateOrderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Order for Customer</Text>
              
              <Text style={styles.modalLabel}>Customer Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter customer name..."
                placeholderTextColor={theme.colors.textSecondary}
                value={customerName}
                onChangeText={setCustomerName}
              />

              <Text style={styles.modalLabel}>Customer Phone *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter phone number..."
                placeholderTextColor={theme.colors.textSecondary}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.modalLabel}>Delivery Address *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Enter delivery address..."
                placeholderTextColor={theme.colors.textSecondary}
                value={customerAddress}
                onChangeText={setCustomerAddress}
                multiline
                numberOfLines={2}
              />

              <Text style={styles.modalLabel}>Select Store *</Text>
              <ScrollView style={styles.pickerContainer}>
                {stores.length === 0 ? (
                  <Text style={styles.emptyPickerText}>No stores available</Text>
                ) : (
                  stores.map((store) => (
                    <TouchableOpacity
                      key={store.id}
                      style={[
                        styles.pickerItem,
                        selectedStore === store.id && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedStore(store.id);
                        setSelectedStoreDetails(store);
                      }}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedStore === store.id && styles.pickerItemTextSelected,
                      ]}>
                        {store.name} - {store.address}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              {selectedStoreDetails && (
                <View style={styles.storeDetailsCard}>
                  <Text style={styles.storeDetailsTitle}>📍 Store Details</Text>
                  <Text style={styles.storeDetailsText}>
                    <Text style={styles.storeDetailsLabel}>Name: </Text>
                    {selectedStoreDetails.name}
                  </Text>
                  <Text style={styles.storeDetailsText}>
                    <Text style={styles.storeDetailsLabel}>Address: </Text>
                    {selectedStoreDetails.address}
                  </Text>
                </View>
              )}

              <Text style={styles.modalLabel}>Order Notes (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Add any special instructions..."
                placeholderTextColor={theme.colors.textSecondary}
                value={orderNotes}
                onChangeText={setOrderNotes}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.modalLabel}>Order Price (GYD) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter total price (e.g., 5000)"
                placeholderTextColor={theme.colors.textSecondary}
                value={orderPrice}
                onChangeText={setOrderPrice}
                keyboardType="numeric"
              />

              {orderPrice && !isNaN(parseFloat(orderPrice)) && (
                <View style={styles.pricingInfo}>
                  <Text style={styles.pricingInfoText}>
                    💰 Total: GYD ${parseFloat(orderPrice).toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowCreateOrderModal(false);
                    setCustomerName('');
                    setCustomerPhone('');
                    setCustomerAddress('');
                    setSelectedStore('');
                    setOrderNotes('');
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCreate]}
                  onPress={handleCreateOrder}
                  disabled={creatingOrder}
                >
                  <Text style={styles.modalButtonText}>
                    {creatingOrder ? 'Creating...' : 'Create Order'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showCreateErrandModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateErrandModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Errand for Customer</Text>
              
              <Text style={styles.modalLabel}>Customer Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter customer name..."
                placeholderTextColor={theme.colors.textSecondary}
                value={errandCustomerName}
                onChangeText={setErrandCustomerName}
              />

              <Text style={styles.modalLabel}>Customer Phone *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter phone number..."
                placeholderTextColor={theme.colors.textSecondary}
                value={errandCustomerPhone}
                onChangeText={setErrandCustomerPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.modalLabel}>Customer Address *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Enter customer address..."
                placeholderTextColor={theme.colors.textSecondary}
                value={errandCustomerAddress}
                onChangeText={setErrandCustomerAddress}
                multiline
                numberOfLines={2}
              />

              <Text style={styles.modalLabel}>Pickup Address *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter pickup address..."
                placeholderTextColor={theme.colors.textSecondary}
                value={pickupAddress}
                onChangeText={setPickupAddress}
              />

              <Text style={styles.modalLabel}>Dropoff Address *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter dropoff address..."
                placeholderTextColor={theme.colors.textSecondary}
                value={dropoffAddress}
                onChangeText={setDropoffAddress}
              />

              <Text style={styles.modalLabel}>Instructions *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Provide detailed instructions..."
                placeholderTextColor={theme.colors.textSecondary}
                value={errandInstructions}
                onChangeText={setErrandInstructions}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.modalLabel}>Additional Notes (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Any additional notes..."
                placeholderTextColor={theme.colors.textSecondary}
                value={errandNotes}
                onChangeText={setErrandNotes}
                multiline
                numberOfLines={2}
              />

              <View style={styles.pricingInfo}>
                <Text style={styles.pricingInfoText}>💰 Fixed Price: GYD $2000.00</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowCreateErrandModal(false);
                    setErrandCustomerName('');
                    setErrandCustomerPhone('');
                    setErrandCustomerAddress('');
                    setSelectedCategory('');
                    setSelectedSubcategory('');
                    setPickupAddress('');
                    setDropoffAddress('');
                    setErrandInstructions('');
                    setErrandNotes('');
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCreate]}
                  onPress={handleCreateErrand}
                  disabled={creatingErrand}
                >
                  <Text style={styles.modalButtonText}>
                    {creatingErrand ? 'Creating...' : 'Create Errand'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: '#1E88E5',
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: theme.fontWeight.semibold,
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
  createSection: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    backgroundColor: isWeb ? '#FFFFFF' : theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: isWeb ? '#E2E8F0' : theme.colors.border,
    ...(isWeb && {
      paddingHorizontal: 32,
      paddingVertical: 20,
    }),
  },
  createButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  createOrderButton: {
    backgroundColor: '#4CAF50',
  },
  createErrandButton: {
    backgroundColor: '#FF9800',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  invoiceSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  invoiceButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  invoiceButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: isWeb ? '#FFFFFF' : theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: isWeb ? '#E2E8F0' : theme.colors.border,
    ...(isWeb && {
      paddingHorizontal: 32,
    }),
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1E88E5',
  },
  tabText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: '#1E88E5',
    fontWeight: theme.fontWeight.bold,
  },
  content: {
    flex: 1,
    backgroundColor: isWeb ? '#F8FAFC' : theme.colors.background,
  },
  contentContainer: {
    padding: isWeb ? 32 : theme.spacing.md,
  },
  filtersContainer: {
    maxHeight: 60,
    marginBottom: theme.spacing.md,
  },
  filtersContent: {
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  filterChipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: theme.fontWeight.bold,
  },
  card: {
    backgroundColor: isWeb ? '#FFFFFF' : theme.colors.surface,
    borderRadius: isWeb ? 12 : theme.borderRadius.lg,
    padding: isWeb ? 20 : theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
    ...(isWeb && {
      borderWidth: 1,
      borderColor: '#E2E8F0',
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  cardSubtitle: {
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
    textTransform: 'uppercase',
  },
  cardBody: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  cardText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  completeButton: {
    backgroundColor: '#1E88E5',
  },
  viewButton: {
    backgroundColor: '#9C27B0',
  },
  invoiceButtonLarge: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    minWidth: '100%',
    ...theme.shadows.md,
  },
  invoiceButtonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  pickerContainer: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  pickerItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  pickerItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  pickerItemText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  pickerItemTextSelected: {
    color: '#1E88E5',
    fontWeight: theme.fontWeight.bold,
  },
  emptyPickerText: {
    padding: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlignVertical: 'top',
  },
  textArea: {
    minHeight: 80,
  },
  pricingInfo: {
    backgroundColor: '#4CAF50' + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  pricingInfoText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#4CAF50',
  },
  storeDetailsCard: {
    backgroundColor: '#E3F2FD',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#1E88E5',
  },
  storeDetailsTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#1E88E5',
    marginBottom: theme.spacing.sm,
  },
  storeDetailsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  storeDetailsLabel: {
    fontWeight: theme.fontWeight.bold,
    color: '#1E88E5',
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: theme.colors.textSecondary,
  },
  modalButtonCreate: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
});
