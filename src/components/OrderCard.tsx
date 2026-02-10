
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Order } from '../types/database.types';
import { theme, globalStyles } from '../styles/theme';
import { formatCurrency } from '../utils/currency';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'confirmed':
      case 'preparing':
        return '#007AFF';
      case 'ready_for_pickup':
      case 'picked_up':
      case 'in_transit':
        return '#5856D6';
      case 'delivered':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳ Pending';
      case 'confirmed':
        return '✅ Confirmed';
      case 'preparing':
        return '👨‍🍳 Preparing';
      case 'ready_for_pickup':
        return '📦 Ready for Pickup';
      case 'picked_up':
        return '🚗 Picked Up';
      case 'in_transit':
        return '🚚 Out for Delivery';
      case 'delivered':
        return '✓ Delivered';
      case 'cancelled':
        return '✕ Cancelled';
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'mobile_money':
        return '📱 MMG+';
      case 'cash':
        return '💵 Cash';
      case 'card':
        return '💳 Card';
      case 'bank_transfer':
        return '🏦 Bank Transfer';
      default:
        return method;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header with Store Info */}
      <View style={styles.header}>
        <View style={styles.storeInfo}>
          {order.store?.logo && (
            <Image 
              source={{ uri: order.store.logo }} 
              style={styles.storeLogo}
              resizeMode="cover"
            />
          )}
          <View style={styles.storeDetails}>
            <Text style={styles.storeName}>{order.store?.name || 'Store'}</Text>
            <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>
            {getStatusText(order.status)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Order Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📅 Date:</Text>
          <Text style={styles.detailValue}>
            {new Date(order.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })} at {new Date(order.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>💰 Total:</Text>
          <Text style={styles.detailValueBold}>{formatCurrency(order.total)}</Text>
        </View>
        {order.payment_method && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment:</Text>
            <Text style={styles.detailValue}>{getPaymentMethodText(order.payment_method)}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.viewDetails}>View Order Details →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  storeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  storeLogo: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  orderNumber: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  details: {
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flex: 1,
    textAlign: 'right',
  },
  detailValueBold: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  footer: {
    alignItems: 'flex-end',
  },
  viewDetails: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
});
