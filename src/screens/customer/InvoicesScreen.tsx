
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Order } from '../../types/database.types';
import { Errand } from '../../types/errand.types';
import { getOrdersByCustomer } from '../../api/orders';
import { getErrandsByCustomer } from '../../api/errands';
import { getErrandInvoicesByCustomer, ErrandInvoice } from '../../api/invoices';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { theme, globalStyles } from '../../styles/theme';
import { formatCurrency } from '../../utils/currency';

type InvoiceItem = {
  id: string;
  type: 'order' | 'errand' | 'errand_invoice';
  number: string;
  date: string;
  total: number;
  status: string;
  data: Order | Errand | ErrandInvoice;
};

export default function InvoicesScreen() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const fetchInvoices = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Fetching invoices for user:', user.id);
      
      const [ordersData, errandsData, errandInvoicesData] = await Promise.all([
        getOrdersByCustomer(user.id),
        getErrandsByCustomer(user.id),
        getErrandInvoicesByCustomer(user.id),
      ]);

      // Convert orders to invoice items
      const orderInvoices: InvoiceItem[] = ordersData.map(order => ({
        id: order.id,
        type: 'order' as const,
        number: order.order_number,
        date: order.created_at || '',
        total: order.total,
        status: order.status,
        data: order,
      }));

      // Convert errands to invoice items
      const errandInvoices: InvoiceItem[] = errandsData.map(errand => ({
        id: errand.id,
        type: 'errand' as const,
        number: errand.errand_number,
        date: errand.created_at || '',
        total: errand.total_price,
        status: errand.status,
        data: errand,
      }));

      // Convert errand invoices to invoice items
      const errandInvoiceItems: InvoiceItem[] = errandInvoicesData.map(invoice => ({
        id: invoice.id,
        type: 'errand_invoice' as const,
        number: `INV-${invoice.id.slice(0, 8)}`,
        date: invoice.created_at || '',
        total: invoice.amount,
        status: invoice.status,
        data: invoice,
      }));

      // Combine and sort by date
      const allInvoices = [...orderInvoices, ...errandInvoices, ...errandInvoiceItems].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      console.log('Total invoices:', allInvoices.length);
      setInvoices(allInvoices);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices();
  };

  const handleInvoicePress = (invoice: InvoiceItem) => {
    if (invoice.type === 'order') {
      router.push(`/customer/order/${invoice.id}`);
    } else if (invoice.type === 'errand') {
      router.push(`/errands/detail/${invoice.id}`);
    } else if (invoice.type === 'errand_invoice') {
      router.push(`/customer/invoice/${invoice.id}`);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'confirmed':
      case 'accepted':
        return theme.colors.info;
      case 'preparing':
      case 'at_pickup':
        return theme.colors.info;
      case 'in_transit':
      case 'en_route':
        return theme.colors.primary;
      case 'delivered':
      case 'completed':
      case 'paid':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.danger;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      accepted: 'Accepted',
      preparing: 'Preparing',
      at_pickup: 'At Pickup',
      pickup_complete: 'Pickup Complete',
      in_transit: 'In Transit',
      en_route: 'En Route',
      delivered: 'Delivered',
      completed: 'Completed',
      paid: 'Paid',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'all') return true;
    if (filter === 'completed') {
      return invoice.status === 'delivered' || invoice.status === 'completed' || invoice.status === 'paid';
    }
    if (filter === 'pending') {
      return invoice.status !== 'delivered' && invoice.status !== 'completed' && invoice.status !== 'cancelled' && invoice.status !== 'paid';
    }
    return true;
  });

  const renderInvoiceCard = ({ item }: { item: InvoiceItem }) => {
    const invoiceTypeLabel = item.type === 'order' 
      ? '🍔 Food Order' 
      : item.type === 'errand' 
      ? '🏃 Errand Service' 
      : '📄 Invoice';
    
    return (
      <TouchableOpacity
        style={styles.invoiceCard}
        onPress={() => handleInvoicePress(item)}
      >
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceType}>{invoiceTypeLabel}</Text>
            <Text style={styles.invoiceNumber}>#{item.number}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.invoiceDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.date).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <View style={styles.invoiceFooter}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>{formatCurrency(item.total)}</Text>
        </View>

        <View style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>View Details →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading invoices..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchInvoices} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Invoices</Text>
        <Text style={styles.headerSubtitle}>
          {filteredInvoices.length} {filteredInvoices.length === 1 ? 'invoice' : 'invoices'}
        </Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterButtonText, filter === 'completed' && styles.filterButtonTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterButtonText, filter === 'pending' && styles.filterButtonTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
      </View>

      {/* Invoice List */}
      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={renderInvoiceCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>No invoices found</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Your invoices will appear here after you place orders or create errands.'
                : `No ${filter} invoices found.`}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => router.push('/customer/home')}
              >
                <Text style={styles.shopButtonText}>Start Shopping</Text>
              </TouchableOpacity>
            )}
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
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 60,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: theme.fontWeight.bold,
  },
  listContent: {
    paddingVertical: theme.spacing.md,
    paddingBottom: 100,
  },
  invoiceCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceType: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  invoiceNumber: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
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
  invoiceDetails: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  totalAmount: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  viewDetailsButton: {
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
  },
  viewDetailsText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
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
    lineHeight: 22,
  },
  shopButton: {
    ...globalStyles.button,
    paddingHorizontal: theme.spacing.xl,
  },
  shopButtonText: {
    ...globalStyles.buttonText,
  },
});
