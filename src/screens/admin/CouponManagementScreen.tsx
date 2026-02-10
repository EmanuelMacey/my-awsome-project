
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../config/supabase';
import { theme } from '../../styles/theme';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  expiry_date: string | null;
  is_active: boolean;
  created_at: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  backButtonText: {
    fontSize: 28,
    color: theme.colors.primary,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  content: {
    padding: theme.spacing.md,
  },
  couponCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  couponCode: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  activeIndicator: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  activeIndicatorText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  couponDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  couponDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
  },
  detailBadge: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  usageInfo: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  couponActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginLeft: theme.spacing.sm,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  toggleButton: {
    backgroundColor: theme.colors.warning,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  formGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  pickerButton: {
    flex: 1,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  pickerButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pickerButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  pickerButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: theme.fontWeight.semibold,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  modalButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  cancelButton: {
    backgroundColor: theme.colors.border,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonText: {
    fontSize: theme.fontSize.md,
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

export default function CouponManagementScreen() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_value: '',
    max_discount: '',
    usage_limit: '',
    expiry_date: '',
  });

  const fetchCoupons = useCallback(async () => {
    try {
      console.log('Fetching coupons...');
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Coupons fetched:', data?.length || 0);
      setCoupons(data || []);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      Alert.alert('Error', 'Failed to load coupons');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCoupons();
  }, [fetchCoupons]);

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value.toString(),
        min_order_value: coupon.min_order_value?.toString() || '',
        max_discount: coupon.max_discount?.toString() || '',
        usage_limit: coupon.usage_limit?.toString() || '',
        expiry_date: coupon.expiry_date ? coupon.expiry_date.split('T')[0] : '',
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_value: '',
        max_discount: '',
        usage_limit: '',
        expiry_date: '',
      });
    }
    setModalVisible(true);
  };

  const handleSaveCoupon = async () => {
    if (!formData.code.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }

    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      Alert.alert('Error', 'Please enter a valid discount value');
      return;
    }

    setSaving(true);

    try {
      const couponData = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : null,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        expiry_date: formData.expiry_date || null,
        is_active: true,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;
        console.log('Coupon updated successfully');
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert({ ...couponData, usage_count: 0 });

        if (error) throw error;
        console.log('Coupon created successfully');
      }

      setModalVisible(false);
      fetchCoupons();
      Alert.alert('Success', `Coupon ${editingCoupon ? 'updated' : 'created'} successfully`);
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      Alert.alert('Error', error.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) throw error;

      console.log('Coupon status toggled');
      fetchCoupons();
    } catch (error: any) {
      console.error('Error toggling coupon:', error);
      Alert.alert('Error', 'Failed to update coupon status');
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    Alert.alert(
      'Delete Coupon',
      'Are you sure you want to delete this coupon?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', couponId);

              if (error) throw error;

              console.log('Coupon deleted');
              fetchCoupons();
              Alert.alert('Success', 'Coupon deleted successfully');
            } catch (error: any) {
              console.error('Error deleting coupon:', error);
              Alert.alert('Error', 'Failed to delete coupon');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading coupons..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coupons</Text>
        <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {coupons.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎫</Text>
            <Text style={styles.emptyStateTitle}>No Coupons Yet</Text>
            <Text style={styles.emptyStateText}>
              Create coupon codes to offer discounts to your customers
            </Text>
          </View>
        ) : (
          coupons.map((coupon) => {
            const isActive = coupon.is_active;
            const isExpired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
            const usageLimitReached = coupon.usage_limit && coupon.usage_count >= coupon.usage_limit;
            const discountText = coupon.discount_type === 'percentage'
              ? `${coupon.discount_value}% OFF`
              : `$${coupon.discount_value} OFF`;

            return (
              <View key={coupon.id} style={styles.couponCard}>
                <View style={styles.couponHeader}>
                  <Text style={styles.couponCode}>{coupon.code}</Text>
                  <View
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: isActive && !isExpired && !usageLimitReached ? '#10B981' : '#6B7280' },
                    ]}
                  >
                    <Text style={[styles.activeIndicatorText, { color: '#FFFFFF' }]}>
                      {isExpired ? 'Expired' : usageLimitReached ? 'Limit Reached' : isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.couponDescription}>{coupon.description}</Text>

                <View style={styles.couponDetails}>
                  <View style={styles.detailBadge}>
                    <Text style={styles.detailText}>{discountText}</Text>
                  </View>
                  {coupon.min_order_value && (
                    <View style={styles.detailBadge}>
                      <Text style={styles.detailText}>Min: ${coupon.min_order_value}</Text>
                    </View>
                  )}
                  {coupon.max_discount && (
                    <View style={styles.detailBadge}>
                      <Text style={styles.detailText}>Max: ${coupon.max_discount}</Text>
                    </View>
                  )}
                  {coupon.expiry_date && (
                    <View style={styles.detailBadge}>
                      <Text style={styles.detailText}>
                        Expires: {new Date(coupon.expiry_date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.usageInfo}>
                  Used: {coupon.usage_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                </Text>

                <View style={styles.couponActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.toggleButton]}
                    onPress={() => handleToggleActive(coupon)}
                  >
                    <Text style={styles.actionButtonText}>
                      {isActive ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleOpenModal(coupon)}
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteCoupon(coupon.id)}
                  >
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Coupon Code *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.code}
                  onChangeText={(text) => setFormData({ ...formData, code: text.toUpperCase() })}
                  placeholder="e.g., SUMMER20"
                  placeholderTextColor={theme.colors.textSecondary}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Describe the coupon..."
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Discount Type *</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      formData.discount_type === 'percentage' && styles.pickerButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, discount_type: 'percentage' })}
                  >
                    <Text
                      style={[
                        styles.pickerButtonText,
                        formData.discount_type === 'percentage' && styles.pickerButtonTextActive,
                      ]}
                    >
                      Percentage
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      formData.discount_type === 'fixed' && styles.pickerButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, discount_type: 'fixed' })}
                  >
                    <Text
                      style={[
                        styles.pickerButtonText,
                        formData.discount_type === 'fixed' && styles.pickerButtonTextActive,
                      ]}
                    >
                      Fixed Amount
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Discount Value * {formData.discount_type === 'percentage' ? '(%)' : '($)'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.discount_value}
                  onChangeText={(text) => setFormData({ ...formData, discount_value: text })}
                  placeholder={formData.discount_type === 'percentage' ? '20' : '10.00'}
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Minimum Order Value ($)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.min_order_value}
                  onChangeText={(text) => setFormData({ ...formData, min_order_value: text })}
                  placeholder="Optional"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Maximum Discount ($)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.max_discount}
                  onChangeText={(text) => setFormData({ ...formData, max_discount: text })}
                  placeholder="Optional"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Usage Limit</Text>
                <TextInput
                  style={styles.input}
                  value={formData.usage_limit}
                  onChangeText={(text) => setFormData({ ...formData, usage_limit: text })}
                  placeholder="Optional (unlimited if empty)"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Expiry Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.expiry_date}
                  onChangeText={(text) => setFormData({ ...formData, expiry_date: text })}
                  placeholder="Optional (e.g., 2024-12-31)"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveCoupon}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                      {editingCoupon ? 'Update' : 'Create'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
