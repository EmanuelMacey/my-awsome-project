
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Errand } from '../../types/errand.types';
import { getErrandsByCustomer } from '../../api/errands';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { theme } from '../../styles/theme';

const STATUS_COLORS: Record<string, string> = {
  pending: theme.colors.warning,
  accepted: theme.colors.info,
  at_pickup: theme.colors.info,
  pickup_complete: theme.colors.info,
  en_route: theme.colors.primary,
  completed: theme.colors.success,
  cancelled: theme.colors.danger,
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  at_pickup: 'At Pickup',
  pickup_complete: 'Pickup Complete',
  en_route: 'En Route',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function MyErrandsScreen() {
  const { user } = useAuth();
  const [errands, setErrands] = useState<Errand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const fetchErrands = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Fetching errands for user:', user.id);
      const data = await getErrandsByCustomer(user.id);
      console.log('Errands fetched:', data.length);
      setErrands(data);
    } catch (err: any) {
      console.error('Error fetching errands:', err);
      setError(err.message || 'Failed to load errands');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchErrands();
  }, [fetchErrands]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchErrands();
  };

  const activeErrands = errands.filter(
    (errand) => !['completed', 'cancelled'].includes(errand.status)
  );

  const completedErrands = errands.filter(
    (errand) => ['completed', 'cancelled'].includes(errand.status)
  );

  const renderErrandCard = ({ item }: { item: Errand }) => (
    <TouchableOpacity
      style={styles.errandCard}
      onPress={() => router.push(`/errands/detail/${item.id}`)}
    >
      <View style={styles.errandHeader}>
        <View style={styles.errandInfo}>
          <Text style={styles.errandNumber}>#{item.errand_number}</Text>
          <Text style={styles.errandCategory}>
            {(item as any).category?.name || 'Errand'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {STATUS_LABELS[item.status]}
          </Text>
        </View>
      </View>

      <View style={styles.errandDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📍</Text>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Pickup:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {item.pickup_address}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>🎯</Text>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Drop-off:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {item.dropoff_address}
            </Text>
          </View>
        </View>

        {(item as any).subcategory && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📋</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailValue}>
                {(item as any).subcategory.name}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.errandFooter}>
        <Text style={styles.priceText}>GYD ${item.total_price.toLocaleString()}</Text>
        <Text style={styles.dateText}>
          {new Date(item.created_at!).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner message="Loading errands..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchErrands} />;
  }

  const displayedErrands = activeTab === 'active' ? activeErrands : completedErrands;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>My Errands</Text>
        <Text style={styles.subheader}>
          {errands.length} {errands.length === 1 ? 'errand' : 'errands'}
        </Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active ({activeErrands.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed ({completedErrands.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Errands List */}
      <FlatList
        data={displayedErrands}
        keyExtractor={(item) => item.id}
        renderItem={renderErrandCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'active' ? 'No active errands' : 'No completed errands'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'active'
                ? 'Create your first errand request to get started!'
                : 'Your completed errands will appear here.'}
            </Text>
            {activeTab === 'active' && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/errands/home')}
              >
                <Text style={styles.createButtonText}>Create Errand</Text>
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
  listContent: {
    paddingVertical: theme.spacing.md,
    paddingBottom: 100,
  },
  headerContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  header: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subheader: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  errandCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
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
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  detailIcon: {
    fontSize: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
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
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  createButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
});
