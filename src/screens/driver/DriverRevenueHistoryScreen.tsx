
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { theme } from '../../styles/theme';
import { formatCurrency } from '../../utils/currency';
import { supabase } from '../../config/supabase';

interface RevenueData {
  date: string;
  orders: number;
  errands: number;
  totalEarnings: number;
  orderEarnings: number;
  errandEarnings: number;
}

interface EarningsSummary {
  today: number;
  week: number;
  month: number;
  allTime: number;
  totalJobs: number;
}

const isWeb = Platform.OS === 'web';

export default function DriverRevenueHistoryScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revenueHistory, setRevenueHistory] = useState<RevenueData[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({
    today: 0,
    week: 0,
    month: 0,
    allTime: 0,
    totalJobs: 0,
  });

  const fetchRevenueData = useCallback(async () => {
    if (!user) return;

    try {
      console.log('Fetching revenue data for driver:', user.id);

      // Fetch completed orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', user.id)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch completed errands
      const { data: errands, error: errandsError } = await supabase
        .from('errands')
        .select('*')
        .eq('runner_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (errandsError) throw errandsError;

      console.log('Completed orders:', orders?.length || 0);
      console.log('Completed errands:', errands?.length || 0);

      // Group by date
      const revenueByDate: Record<string, RevenueData> = {};

      // Process orders (driver gets 80% of total)
      orders?.forEach(order => {
        const date = new Date(order.delivered_at || order.created_at).toLocaleDateString();
        if (!revenueByDate[date]) {
          revenueByDate[date] = {
            date,
            orders: 0,
            errands: 0,
            totalEarnings: 0,
            orderEarnings: 0,
            errandEarnings: 0,
          };
        }
        const earnings = order.total * 0.8; // Driver gets 80%
        revenueByDate[date].orders += 1;
        revenueByDate[date].orderEarnings += earnings;
        revenueByDate[date].totalEarnings += earnings;
      });

      // Process errands (driver gets 80% of total)
      errands?.forEach(errand => {
        const date = new Date(errand.completed_at || errand.created_at).toLocaleDateString();
        if (!revenueByDate[date]) {
          revenueByDate[date] = {
            date,
            orders: 0,
            errands: 0,
            totalEarnings: 0,
            orderEarnings: 0,
            errandEarnings: 0,
          };
        }
        const earnings = errand.total_price * 0.8; // Driver gets 80%
        revenueByDate[date].errands += 1;
        revenueByDate[date].errandEarnings += earnings;
        revenueByDate[date].totalEarnings += earnings;
      });

      const historyArray = Object.values(revenueByDate).sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setRevenueHistory(historyArray);

      // Calculate summary
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let todayEarnings = 0;
      let weekEarnings = 0;
      let monthEarnings = 0;
      let allTimeEarnings = 0;
      let totalJobs = 0;

      historyArray.forEach(item => {
        const itemDate = new Date(item.date);
        allTimeEarnings += item.totalEarnings;
        totalJobs += item.orders + item.errands;

        if (itemDate >= today) {
          todayEarnings += item.totalEarnings;
        }
        if (itemDate >= weekAgo) {
          weekEarnings += item.totalEarnings;
        }
        if (itemDate >= monthAgo) {
          monthEarnings += item.totalEarnings;
        }
      });

      setSummary({
        today: todayEarnings,
        week: weekEarnings,
        month: monthEarnings,
        allTime: allTimeEarnings,
        totalJobs,
      });

      console.log('Revenue summary:', {
        today: todayEarnings,
        week: weekEarnings,
        month: monthEarnings,
        allTime: allTimeEarnings,
        totalJobs,
      });
    } catch (error: any) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRevenueData();
  };

  if (loading) {
    return <LoadingSpinner message="Loading revenue history..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Revenue History</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.summaryLabel}>Today</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.today)}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#2196F3' }]}>
            <Text style={styles.summaryLabel}>This Week</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.week)}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#FF9800' }]}>
            <Text style={styles.summaryLabel}>This Month</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.month)}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#9C27B0' }]}>
            <Text style={styles.summaryLabel}>All Time</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.allTime)}</Text>
          </View>
        </View>

        {/* Total Jobs */}
        <View style={styles.totalJobsCard}>
          <Text style={styles.totalJobsLabel}>Total Completed Jobs</Text>
          <Text style={styles.totalJobsValue}>{summary.totalJobs}</Text>
          <Text style={styles.totalJobsSubtext}>
            You&apos;ve earned {formatCurrency(summary.allTime)} in total
          </Text>
        </View>

        {/* Revenue History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Breakdown</Text>
          {revenueHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={styles.emptyTitle}>No Revenue Yet</Text>
              <Text style={styles.emptyText}>
                Complete orders and errands to start earning!
              </Text>
            </View>
          ) : (
            revenueHistory.map((item, index) => (
              <View key={index} style={styles.revenueCard}>
                <View style={styles.revenueCardHeader}>
                  <Text style={styles.revenueDate}>{item.date}</Text>
                  <Text style={styles.revenueTotal}>{formatCurrency(item.totalEarnings)}</Text>
                </View>
                <View style={styles.revenueCardBody}>
                  <View style={styles.revenueRow}>
                    <Text style={styles.revenueLabel}>🍔 Food Orders:</Text>
                    <View style={styles.revenueDetails}>
                      <Text style={styles.revenueCount}>{item.orders} orders</Text>
                      <Text style={styles.revenueAmount}>{formatCurrency(item.orderEarnings)}</Text>
                    </View>
                  </View>
                  <View style={styles.revenueRow}>
                    <Text style={styles.revenueLabel}>🏃 Errands:</Text>
                    <View style={styles.revenueDetails}>
                      <Text style={styles.revenueCount}>{item.errands} errands</Text>
                      <Text style={styles.revenueAmount}>{formatCurrency(item.errandEarnings)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How Earnings Work</Text>
            <Text style={styles.infoText}>
              You earn 80% of each order or errand total. The remaining 20% goes to platform fees.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

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
  backButton: {
    paddingVertical: theme.spacing.sm,
    width: 80,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.md,
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
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
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
  },
  totalJobsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  totalJobsLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  totalJobsValue: {
    fontSize: 48,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  totalJobsSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  revenueCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  revenueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  revenueDate: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  revenueTotal: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  revenueCardBody: {
    gap: theme.spacing.sm,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  revenueDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  revenueCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  revenueAmount: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  emptyContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: theme.colors.info + '20',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.info + '40',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
