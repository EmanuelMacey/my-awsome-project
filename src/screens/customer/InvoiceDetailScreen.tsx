
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { theme, globalStyles } from '../../styles/theme';
import { formatCurrency } from '../../utils/currency';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { getErrandInvoiceById, ErrandInvoice } from '../../api/invoices';

export default function InvoiceDetailScreen() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<ErrandInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching invoice:', invoiceId);
      const data = await getErrandInvoiceById(invoiceId);
      setInvoice(data);
    } catch (err: any) {
      console.error('Error fetching invoice:', err);
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleShare = async () => {
    if (!invoice) return;

    const invoiceText = `
ErrandRunners
INVOICE

Invoice ID: ${invoice.id.slice(0, 8)}
Date: ${new Date(invoice.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })}

Bill To: ${invoice.customer_name}
${invoice.customer_email}
${invoice.customer_phone || ''}

--------------------------------
Service                    Total
--------------------------------
${invoice.items.map(item => `${item.description.padEnd(20)} ${formatCurrency(item.amount)}`).join('\n')}
--------------------------------

TOTAL: ${formatCurrency(invoice.amount)}

--------------------------------
Status: [ ${invoice.status.toUpperCase()} ]
${invoice.paid_at ? `Paid on: ${new Date(invoice.paid_at).toLocaleDateString()}` : ''}

Thank you for choosing ErrandRunners.
    `.trim();

    try {
      await Share.share({
        message: invoiceText,
        title: `Invoice ${invoice.id.slice(0, 8)}`,
      });
    } catch (error) {
      console.error('Error sharing invoice:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading invoice..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchInvoice} />;
  }

  if (!invoice) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Invoice not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Text style={styles.headerBackButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Invoice Card */}
        <View style={styles.invoiceCard}>
          {/* Company Header */}
          <View style={styles.companyHeader}>
            <Text style={styles.companyName}>ErrandRunners</Text>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
          </View>

          {/* Invoice Info */}
          <View style={styles.invoiceInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invoice ID:</Text>
              <Text style={styles.infoValue}>{invoice.id.slice(0, 8)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>
                {new Date(invoice.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Bill To */}
          <View style={styles.billTo}>
            <Text style={styles.billToLabel}>Bill To:</Text>
            <Text style={styles.billToName}>{invoice.customer_name}</Text>
            {invoice.customer_email && (
              <Text style={styles.billToEmail}>{invoice.customer_email}</Text>
            )}
            {invoice.customer_phone && (
              <Text style={styles.billToPhone}>{invoice.customer_phone}</Text>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Items Header */}
          <View style={styles.itemsHeader}>
            <Text style={[styles.itemsHeaderText, { flex: 2 }]}>Service</Text>
            <Text style={[styles.itemsHeaderText, { flex: 1, textAlign: 'right' }]}>Total</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Items */}
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={[styles.itemText, { flex: 2 }]} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={[styles.itemText, { flex: 1, textAlign: 'right' }]}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Totals */}
          <View style={styles.totalsSection}>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>TOTAL:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.amount)}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Payment Status */}
          <View style={styles.statusSection}>
            <Text style={styles.statusLabel}>Status:</Text>
            <View
              style={[
                styles.statusBadge,
                invoice.status === 'paid'
                  ? styles.statusBadgePaid
                  : styles.statusBadgePending,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  invoice.status === 'paid'
                    ? styles.statusTextPaid
                    : styles.statusTextPending,
                ]}
              >
                {invoice.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {invoice.paid_at && (
            <View style={styles.paidAtSection}>
              <Text style={styles.paidAtLabel}>Paid on:</Text>
              <Text style={styles.paidAtValue}>
                {new Date(invoice.paid_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Thank you for choosing ErrandRunners.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  headerBackButton: {
    paddingVertical: theme.spacing.sm,
  },
  headerBackButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  shareButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.md,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  invoiceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  companyHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  companyName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  invoiceLabel: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  invoiceInfo: {
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  infoLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  billTo: {
    marginBottom: theme.spacing.md,
  },
  billToLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  billToName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  billToEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  billToPhone: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  itemsHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  itemsHeaderText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  itemText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  totalsSection: {
    marginBottom: theme.spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  grandTotalRow: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  grandTotalLabel: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  grandTotalValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  statusLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  statusBadgePaid: {
    backgroundColor: theme.colors.success + '20',
  },
  statusBadgePending: {
    backgroundColor: theme.colors.warning + '20',
  },
  statusText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  statusTextPaid: {
    color: theme.colors.success,
  },
  statusTextPending: {
    color: theme.colors.warning,
  },
  paidAtSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  paidAtLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  paidAtValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.success,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    ...globalStyles.button,
    paddingHorizontal: theme.spacing.xl,
  },
  backButtonText: {
    ...globalStyles.buttonText,
  },
});
