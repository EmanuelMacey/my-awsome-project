
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { theme } from '../../styles/theme';
import { formatCurrency } from '../../utils/currency';
import {
  getAllErrandInvoices,
  ErrandInvoice,
  sendInvoiceEmail,
  markInvoiceAsPaid,
} from '../../api/invoices';

interface InvoiceSummary {
  totalOrders: number;
  totalErrands: number;
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
}

interface RevenueByCategory {
  category: string;
  count: number;
  revenue: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

// Evaluate Platform.OS outside of component to avoid issues
const isWeb = Platform.OS === 'web';

// Helper function to extract first name from full name
const getFirstName = (fullName: string) => {
  if (!fullName) return 'Admin';
  return fullName.split(' ')[0];
};

export default function InvoiceManagementScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<InvoiceSummary>({
    totalOrders: 0,
    totalErrands: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
  });
  const [revenueByCategory, setRevenueByCategory] = useState<RevenueByCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState<ErrandInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<ErrandInvoice[]>([]);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<{ description: string; amount: string }[]>([
    { description: '', amount: '' }
  ]);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const fetchInvoiceData = useCallback(async () => {
    try {
      console.log('Fetching invoice data...');

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total, status, created_at, payment_status');

      if (ordersError) throw ordersError;

      const { data: errands, error: errandsError } = await supabase
        .from('errands')
        .select('id, total_price, status, created_at, payment_status');

      if (errandsError) throw errandsError;

      // Fetch errand invoices
      const errandInvoices = await getAllErrandInvoices();
      setInvoices(errandInvoices);
      setFilteredInvoices(errandInvoices);

      const totalOrders = orders?.length || 0;
      const totalErrands = errands?.length || 0;

      const orderRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      const errandRevenue = errands?.reduce((sum, errand) => sum + (errand.total_price || 0), 0) || 0;
      const totalRevenue = orderRevenue + errandRevenue;

      const pendingOrders = orders?.filter(o => o.payment_status === 'pending' || o.payment_status === null) || [];
      const pendingErrands = errands?.filter(e => e.payment_status === 'pending' || e.payment_status === null) || [];
      const pendingPayments = 
        pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0) +
        pendingErrands.reduce((sum, e) => sum + (e.total_price || 0), 0);

      const completedOrders = orders?.filter(o => o.payment_status === 'completed') || [];
      const completedErrands = errands?.filter(e => e.payment_status === 'completed') || [];
      const completedPayments = 
        completedOrders.reduce((sum, o) => sum + (o.total || 0), 0) +
        completedErrands.reduce((sum, e) => sum + (e.total_price || 0), 0);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const todayOrders = orders?.filter(o => new Date(o.created_at!) >= today) || [];
      const todayErrands = errands?.filter(e => new Date(e.created_at!) >= today) || [];
      const todayRevenue = 
        todayOrders.reduce((sum, o) => sum + (o.total || 0), 0) +
        todayErrands.reduce((sum, e) => sum + (e.total_price || 0), 0);

      const weekOrders = orders?.filter(o => new Date(o.created_at!) >= weekAgo) || [];
      const weekErrands = errands?.filter(e => new Date(e.created_at!) >= weekAgo) || [];
      const weekRevenue = 
        weekOrders.reduce((sum, o) => sum + (o.total || 0), 0) +
        weekErrands.reduce((sum, e) => sum + (e.total_price || 0), 0);

      const monthOrders = orders?.filter(o => new Date(o.created_at!) >= monthAgo) || [];
      const monthErrands = errands?.filter(e => new Date(e.created_at!) >= monthAgo) || [];
      const monthRevenue = 
        monthOrders.reduce((sum, o) => sum + (o.total || 0), 0) +
        monthErrands.reduce((sum, e) => sum + (e.total_price || 0), 0);

      setSummary({
        totalOrders,
        totalErrands,
        totalRevenue,
        pendingPayments,
        completedPayments,
        todayRevenue,
        weekRevenue,
        monthRevenue,
      });

      const categoryRevenue: RevenueByCategory[] = [
        {
          category: 'Food Orders',
          count: totalOrders,
          revenue: orderRevenue,
        },
        {
          category: 'Errand Services',
          count: totalErrands,
          revenue: errandRevenue,
        },
      ];

      setRevenueByCategory(categoryRevenue);

      console.log('Invoice data fetched successfully');
    } catch (error: any) {
      console.error('Error fetching invoice data:', error);
      Alert.alert('Error', 'Failed to fetch invoice data: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      console.log('Fetching customers from database...');
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone')
        .eq('role', 'customer')
        .order('name');

      if (error) {
        console.error('Supabase error fetching customers:', error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} customers in database`);
      
      const customerList = data || [];
      setCustomers(customerList);
      setFilteredCustomers(customerList);
      
      if (customerList.length === 0) {
        console.warn('No customers found in database. Make sure users with role="customer" exist.');
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to fetch customers: ' + error.message);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoiceData();
    fetchCustomers();
  }, [fetchInvoiceData, fetchCustomers]);

  useEffect(() => {
    if (customerSearchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const query = customerSearchQuery.toLowerCase();
      const filtered = customers.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          (c.phone && c.phone.includes(query))
      );
      setFilteredCustomers(filtered);
      console.log(`Filtered to ${filtered.length} customers matching "${customerSearchQuery}"`);
    }
  }, [customerSearchQuery, customers]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredInvoices(invoices);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = invoices.filter(
        inv =>
          inv.customer_name.toLowerCase().includes(query) ||
          inv.customer_email.toLowerCase().includes(query) ||
          inv.id.toLowerCase().includes(query)
      );
      setFilteredInvoices(filtered);
    }
  }, [searchQuery, invoices]);

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
              fetchInvoiceData();
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
              await signOut();
              router.replace('/auth/landing');
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoiceData();
    fetchCustomers();
  };

  const handleOpenCreateInvoice = () => {
    console.log('Opening create invoice modal');
    setShowCreateInvoiceModal(true);
    setSelectedCustomer(null);
    setCustomerSearchQuery('');
    setInvoiceAmount('');
    setInvoiceDescription('');
    setInvoiceItems([{ description: '', amount: '' }]);
    
    // Refresh customers when opening modal
    if (customers.length === 0) {
      console.log('No customers loaded, fetching...');
      fetchCustomers();
    }
  };

  const handleAddInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', amount: '' }]);
  };

  const handleRemoveInvoiceItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    }
  };

  const handleUpdateInvoiceItem = (index: number, field: 'description' | 'amount', value: string) => {
    const updated = [...invoiceItems];
    updated[index][field] = value;
    setInvoiceItems(updated);
  };

  const calculateTotalAmount = () => {
    return invoiceItems.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);
  };

  const handleCreateInvoice = async () => {
    if (!selectedCustomer) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }

    const hasValidItems = invoiceItems.some(item => item.description.trim() && item.amount.trim());
    if (!hasValidItems) {
      Alert.alert('Error', 'Please add at least one invoice item with description and amount');
      return;
    }

    const totalAmount = calculateTotalAmount();
    if (totalAmount <= 0) {
      Alert.alert('Error', 'Invoice total must be greater than zero');
      return;
    }

    setCreatingInvoice(true);

    try {
      console.log('Creating invoice for customer:', selectedCustomer.email);

      const invoiceData = {
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.name,
        customer_email: selectedCustomer.email,
        customer_phone: selectedCustomer.phone,
        amount: totalAmount,
        status: 'pending',
        items: invoiceItems
          .filter(item => item.description.trim() && item.amount.trim())
          .map(item => ({
            description: item.description,
            amount: parseFloat(item.amount),
          })),
      };

      const { data: invoice, error } = await supabase
        .from('errand_invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Success',
        `Invoice created successfully!\n\nTotal: ${formatCurrency(totalAmount)}\n\nYou can now send it to ${selectedCustomer.email}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowCreateInvoiceModal(false);
              fetchInvoiceData();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      Alert.alert('Error', 'Failed to create invoice: ' + error.message);
    } finally {
      setCreatingInvoice(false);
    }
  };

  const renderInvoiceCard = ({ item }: { item: ErrandInvoice }) => {
    const statusColor = item.status === 'paid' ? '#4CAF50' : '#FF9800';
    const statusLabel = item.status === 'paid' ? 'PAID' : 'PENDING';
    
    return (
      <View style={styles.invoiceCard}>
        <View style={styles.invoiceCardHeader}>
          <View style={styles.invoiceCardInfo}>
            <Text style={styles.invoiceCardTitle}>Invoice #{item.id.slice(0, 8)}</Text>
            <Text style={styles.invoiceCardCustomer}>{item.customer_name}</Text>
            <Text style={styles.invoiceCardEmail}>{item.customer_email}</Text>
          </View>
          <View style={[styles.invoiceStatusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.invoiceStatusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.invoiceCardBody}>
          <View style={styles.invoiceCardRow}>
            <Text style={styles.invoiceCardLabel}>Amount:</Text>
            <Text style={styles.invoiceCardAmount}>{formatCurrency(item.amount)}</Text>
          </View>
          <View style={styles.invoiceCardRow}>
            <Text style={styles.invoiceCardLabel}>Date:</Text>
            <Text style={styles.invoiceCardValue}>
              {new Date(item.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          {item.paid_at && (
            <View style={styles.invoiceCardRow}>
              <Text style={styles.invoiceCardLabel}>Paid on:</Text>
              <Text style={[styles.invoiceCardValue, { color: '#4CAF50' }]}>
                {new Date(item.paid_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.invoiceCardActions}>
          <TouchableOpacity
            style={[styles.invoiceActionButton, styles.viewInvoiceButton]}
            onPress={() => router.push(`/customer/invoice/${item.id}`)}
          >
            <Text style={styles.invoiceActionButtonText}>View</Text>
          </TouchableOpacity>
          
          {item.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.invoiceActionButton, styles.sendEmailButton]}
                onPress={() => handleSendInvoiceEmail(item.id)}
                disabled={sendingEmail === item.id}
              >
                <Text style={styles.invoiceActionButtonText}>
                  {sendingEmail === item.id ? 'Sending...' : 'Send Email'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.invoiceActionButton, styles.markPaidButton]}
                onPress={() => handleMarkInvoiceAsPaid(item.id)}
                disabled={markingPaid === item.id}
              >
                <Text style={styles.invoiceActionButtonText}>
                  {markingPaid === item.id ? 'Marking...' : 'Mark as Paid'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading invoice data..." />;
  }

  const totalAmountDisplay = calculateTotalAmount();
  const userFirstName = user ? getFirstName(user.name) : 'Admin';

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
            <TouchableOpacity
              style={styles.sidebarMenuItem}
              onPress={() => router.push('/admin/dashboard')}
            >
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
            <TouchableOpacity style={styles.sidebarMenuItem} onPress={() => {}}>
              <Text style={styles.sidebarMenuIcon}>📄</Text>
              <Text style={styles.sidebarMenuText}>Invoices</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sidebarFooter}>
            <View style={styles.sidebarUser}>
              <Text style={styles.sidebarUserIcon}>👤</Text>
              <View>
                <Text style={styles.sidebarUserName}>{userFirstName}</Text>
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
              <Text style={styles.headerTitle}>Invoice Management</Text>
              <Text style={styles.headerSubtitle}>Financial Overview</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Web Header */}
        {isWeb && (
          <View style={styles.webHeader}>
            <Text style={styles.webHeaderTitle}>Invoice Management</Text>
            <Text style={styles.webHeaderSubtitle}>
              Track revenue, payments, and financial overview
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalRevenue)}</Text>
            <Text style={styles.summarySubtext}>
              {summary.totalOrders + summary.totalErrands} transactions
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#2196F3' }]}>
            <Text style={styles.summaryLabel}>Today&apos;s Revenue</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.todayRevenue)}</Text>
            <Text style={styles.summarySubtext}>Last 24 hours</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#FF9800' }]}>
            <Text style={styles.summaryLabel}>Pending Payments</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.pendingPayments)}</Text>
            <Text style={styles.summarySubtext}>Awaiting payment</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#9C27B0' }]}>
            <Text style={styles.summaryLabel}>Completed Payments</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.completedPayments)}</Text>
            <Text style={styles.summarySubtext}>Successfully paid</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Timeline</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>📅 Today</Text>
              <Text style={styles.timelineValue}>{formatCurrency(summary.todayRevenue)}</Text>
            </View>
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>📊 Last 7 Days</Text>
              <Text style={styles.timelineValue}>{formatCurrency(summary.weekRevenue)}</Text>
            </View>
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>📈 Last 30 Days</Text>
              <Text style={styles.timelineValue}>{formatCurrency(summary.monthRevenue)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue by Category</Text>
          {revenueByCategory.map((item, index) => (
            <View key={index} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{item.category}</Text>
                <Text style={styles.categoryCount}>{item.count} items</Text>
              </View>
              <Text style={styles.categoryRevenue}>{formatCurrency(item.revenue)}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(item.revenue / summary.totalRevenue) * 100}%`,
                      backgroundColor: index === 0 ? '#4CAF50' : '#2196F3',
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Invoices ({filteredInvoices.length})</Text>
            <TouchableOpacity
              style={styles.createInvoiceHeaderButton}
              onPress={handleOpenCreateInvoice}
            >
              <Text style={styles.createInvoiceHeaderButtonText}>+ Create</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search invoices by customer name or email..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {filteredInvoices.length === 0 ? (
            <View style={styles.emptyInvoicesContainer}>
              <Text style={styles.emptyInvoicesText}>No invoices found</Text>
              <TouchableOpacity
                style={styles.createFirstInvoiceButton}
                onPress={handleOpenCreateInvoice}
              >
                <Text style={styles.createFirstInvoiceButtonText}>Create First Invoice</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredInvoices}
              keyExtractor={(item) => item.id}
              renderItem={renderInvoiceCard}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleOpenCreateInvoice}
          >
            <Text style={styles.actionButtonIcon}>📄</Text>
            <Text style={styles.actionButtonText}>Create New Invoice</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/admin/dashboard')}
          >
            <Text style={styles.actionButtonIcon}>📋</Text>
            <Text style={styles.actionButtonText}>View All Orders & Errands</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>

      <Modal
        visible={showCreateInvoiceModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCreateInvoiceModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Invoice</Text>
            <TouchableOpacity onPress={() => setShowCreateInvoiceModal(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSectionTitle}>Select Customer</Text>
            
            {loadingCustomers ? (
              <View style={styles.loadingCustomersContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingCustomersText}>Loading customers...</Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name, email, or phone..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={customerSearchQuery}
                  onChangeText={setCustomerSearchQuery}
                />

                {selectedCustomer ? (
                  <View style={styles.selectedCustomerCard}>
                    <View style={styles.selectedCustomerInfo}>
                      <Text style={styles.selectedCustomerName}>{selectedCustomer.name}</Text>
                      <Text style={styles.selectedCustomerEmail}>{selectedCustomer.email}</Text>
                      {selectedCustomer.phone && (
                        <Text style={styles.selectedCustomerPhone}>{selectedCustomer.phone}</Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                      <Text style={styles.changeCustomerButton}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.customerListContainer}>
                    {customers.length === 0 ? (
                      <View style={styles.noCustomersContainer}>
                        <Text style={styles.noCustomersText}>No customers found in database</Text>
                        <Text style={styles.noCustomersHint}>
                          Customers need to register with role &quot;customer&quot; first
                        </Text>
                        <TouchableOpacity 
                          style={styles.refreshCustomersButton}
                          onPress={fetchCustomers}
                        >
                          <Text style={styles.refreshCustomersButtonText}>Refresh Customer List</Text>
                        </TouchableOpacity>
                      </View>
                    ) : filteredCustomers.length === 0 ? (
                      <View style={styles.noCustomersContainer}>
                        <Text style={styles.noCustomersText}>
                          No customers match &quot;{customerSearchQuery}&quot;
                        </Text>
                        <Text style={styles.noCustomersHint}>
                          Try a different search term
                        </Text>
                      </View>
                    ) : (
                      <ScrollView style={styles.customerList} nestedScrollEnabled>
                        <Text style={styles.customerListHeader}>
                          {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} available
                        </Text>
                        {filteredCustomers.map(customer => (
                          <TouchableOpacity
                            key={customer.id}
                            style={styles.customerCard}
                            onPress={() => {
                              console.log('Selected customer:', customer.name);
                              setSelectedCustomer(customer);
                            }}
                          >
                            <Text style={styles.customerName}>{customer.name}</Text>
                            <Text style={styles.customerEmail}>{customer.email}</Text>
                            {customer.phone && (
                              <Text style={styles.customerPhone}>{customer.phone}</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
              </>
            )}

            {selectedCustomer && (
              <>
                <Text style={styles.modalSectionTitle}>Invoice Items</Text>
                {invoiceItems.map((item, index) => (
                  <View key={index} style={styles.invoiceItemRow}>
                    <View style={styles.invoiceItemInputs}>
                      <TextInput
                        style={[styles.invoiceItemInput, { flex: 2 }]}
                        placeholder="Description"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={item.description}
                        onChangeText={value => handleUpdateInvoiceItem(index, 'description', value)}
                      />
                      <TextInput
                        style={[styles.invoiceItemInput, { flex: 1 }]}
                        placeholder="Amount"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={item.amount}
                        onChangeText={value => handleUpdateInvoiceItem(index, 'amount', value)}
                        keyboardType="numeric"
                      />
                    </View>
                    {invoiceItems.length > 1 && (
                      <TouchableOpacity onPress={() => handleRemoveInvoiceItem(index)}>
                        <Text style={styles.removeItemButton}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity style={styles.addItemButton} onPress={handleAddInvoiceItem}>
                  <Text style={styles.addItemButtonText}>+ Add Item</Text>
                </TouchableOpacity>

                <View style={styles.totalAmountCard}>
                  <Text style={styles.totalAmountLabel}>Total Amount:</Text>
                  <Text style={styles.totalAmountValue}>{formatCurrency(totalAmountDisplay)}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.createInvoiceButton, creatingInvoice && styles.createInvoiceButtonDisabled]}
                  onPress={handleCreateInvoice}
                  disabled={creatingInvoice}
                >
                  {creatingInvoice ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.createInvoiceButtonText}>Create Invoice</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
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
    backgroundColor: theme.colors.primary,
    paddingTop: 60,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
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
  content: {
    flex: 1,
    backgroundColor: isWeb ? '#F8FAFC' : theme.colors.background,
  },
  contentContainer: {
    padding: isWeb ? 32 : theme.spacing.md,
    paddingBottom: 100,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    padding: isWeb ? 20 : theme.spacing.md,
    borderRadius: isWeb ? 12 : theme.borderRadius.lg,
    ...theme.shadows.md,
    ...(isWeb && {
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    }),
  },
  summaryLabel: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.spacing.xs,
  },
  summaryValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  summarySubtext: {
    fontSize: theme.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  createInvoiceHeaderButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  createInvoiceHeaderButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  timelineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  timelineLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  timelineValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  categoryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  categoryName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  categoryCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  categoryRevenue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  invoiceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  invoiceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  invoiceCardInfo: {
    flex: 1,
  },
  invoiceCardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  invoiceCardCustomer: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  invoiceCardEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  invoiceStatusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  invoiceStatusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  invoiceCardBody: {
    marginBottom: theme.spacing.md,
  },
  invoiceCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  invoiceCardLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  invoiceCardAmount: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  invoiceCardValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  invoiceCardActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  invoiceActionButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  viewInvoiceButton: {
    backgroundColor: '#9C27B0',
  },
  sendEmailButton: {
    backgroundColor: '#2196F3',
  },
  markPaidButton: {
    backgroundColor: '#4CAF50',
  },
  invoiceActionButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  emptyInvoicesContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyInvoicesText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  createFirstInvoiceButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  createFirstInvoiceButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  actionButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingTop: 60,
    backgroundColor: theme.colors.primary,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  modalCloseButton: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: theme.fontWeight.bold,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  modalSectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  loadingCustomersContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  loadingCustomersText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  customerListContainer: {
    marginBottom: theme.spacing.md,
  },
  customerListHeader: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  customerList: {
    maxHeight: 300,
  },
  customerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  customerName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  customerEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  customerPhone: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  noCustomersContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  noCustomersText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  noCustomersHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  refreshCustomersButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  refreshCustomersButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  selectedCustomerCard: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCustomerInfo: {
    flex: 1,
  },
  selectedCustomerName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  selectedCustomerEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  selectedCustomerPhone: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  changeCustomerButton: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
    padding: theme.spacing.sm,
  },
  invoiceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  invoiceItemInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  invoiceItemInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  removeItemButton: {
    fontSize: 24,
    color: '#EF4444',
    fontWeight: theme.fontWeight.bold,
    paddingHorizontal: theme.spacing.md,
  },
  addItemButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
  },
  addItemButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  totalAmountCard: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  totalAmountLabel: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  totalAmountValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  createInvoiceButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  createInvoiceButtonDisabled: {
    opacity: 0.5,
  },
  createInvoiceButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
});
