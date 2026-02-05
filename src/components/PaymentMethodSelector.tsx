
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';

type PaymentMethod = 'cash';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
}: PaymentMethodSelectorProps) {
  console.log('PaymentMethodSelector - Current selected method:', selectedMethod);

  const handleSelectMethod = (method: PaymentMethod) => {
    console.log('User selected payment method:', method);
    onSelectMethod(method);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Method</Text>
      
      <TouchableOpacity
        style={[styles.methodCard, styles.methodCardSelected]}
        onPress={() => handleSelectMethod('cash')}
        activeOpacity={0.7}
      >
        <View style={styles.methodContent}>
          <View style={styles.methodIcon}>
            <Text style={styles.methodIconText}>💵</Text>
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>Cash on Delivery</Text>
            <Text style={styles.methodDescription}>
              Pay with cash when your order is delivered
            </Text>
          </View>
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          Please have the exact amount ready for the driver.
        </Text>
      </View>

      <View style={styles.mmgInfoBox}>
        <Text style={styles.mmgInfoIcon}>💳</Text>
        <View style={styles.mmgInfoContent}>
          <Text style={styles.mmgInfoTitle}>Need to use MMG?</Text>
          <Text style={styles.mmgInfoText}>
            If you wish to pay with Mobile Money Guyana (MMG), please contact our support team to arrange this payment method.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  methodCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  methodCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '10',
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  methodIconText: {
    fontSize: 24,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  methodDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    marginTop: theme.spacing.sm,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  mmgInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    backgroundColor: '#F3F4F6',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginTop: theme.spacing.md,
  },
  mmgInfoIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  mmgInfoContent: {
    flex: 1,
  },
  mmgInfoTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  mmgInfoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
