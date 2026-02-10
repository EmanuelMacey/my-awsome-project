
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

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  banner_text: string | null;
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
  promotionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  promotionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    flex: 1,
  },
  activeIndicator: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  activeIndicatorText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  promotionDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  promotionDetails: {
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
  promotionActions: {
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

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0];
}

export default function PromotionManagementScreen() {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    banner_text: '',
  });

  const fetchPromotions = useCallback(async () => {
    try {
      console.log('Fetching promotions...');
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Promotions fetched:', data?.length || 0);
      setPromotions(data || []);
    } catch (error: any) {
      console.error('Error fetching promotions:', error);
      Alert.alert('Error', 'Failed to load promotions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPromotions();
  }, [fetchPromotions]);

  const handleOpenModal = (promotion?: Promotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        title: promotion.title,
        description: promotion.description,
        discount_type: promotion.discount_type,
        discount_value: promotion.discount_value.toString(),
        start_date: promotion.start_date.split('T')[0],
        end_date: promotion.end_date.split('T')[0],
        banner_text: promotion.banner_text || '',
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        title: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        banner_text: '',
      });
    }
    setModalVisible(true);
  };

  const handleSavePromotion = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a promotion title');
      return;
    }

    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      Alert.alert('Error', 'Please enter a valid discount value');
      return;
    }

    setSaving(true);

    try {
      const promotionData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        start_date: formData.start_date,
        end_date: formData.end_date,
        banner_text: formData.banner_text.trim() || null,
        is_active: true,
      };

      if (editingPromotion) {
        const { error } = await supabase
          .from('promotions')
          .update(promotionData)
          .eq('id', editingPromotion.id);

        if (error) throw error;
        console.log('Promotion updated successfully');
      } else {
        const { error } = await supabase
          .from('promotions')
          .insert(promotionData);

        if (error) throw error;
        console.log('Promotion created successfully');
      }

      setModalVisible(false);
      fetchPromotions();
      Alert.alert('Success', `Promotion ${editingPromotion ? 'updated' : 'created'} successfully`);
    } catch (error: any) {
      console.error('Error saving promotion:', error);
      Alert.alert('Error', 'Failed to save promotion');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (promotion: Promotion) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active: !promotion.is_active })
        .eq('id', promotion.id);

      if (error) throw error;

      console.log('Promotion status toggled');
      fetchPromotions();
    } catch (error: any) {
      console.error('Error toggling promotion:', error);
      Alert.alert('Error', 'Failed to update promotion status');
    }
  };

  const handleDeletePromotion = async (promotionId: string) => {
    Alert.alert(
      'Delete Promotion',
      'Are you sure you want to delete this promotion?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('promotions')
                .delete()
                .eq('id', promotionId);

              if (error) throw error;

              console.log('Promotion deleted');
              fetchPromotions();
              Alert.alert('Success', 'Promotion deleted successfully');
            } catch (error: any) {
              console.error('Error deleting promotion:', error);
              Alert.alert('Error', 'Failed to delete promotion');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading promotions..." />;
  }

  const firstName = user?.name ? getFirstName(user.name) : 'Admin';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotions</Text>
        <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {promotions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎉</Text>
            <Text style={styles.emptyStateTitle}>No Promotions Yet</Text>
            <Text style={styles.emptyStateText}>
              Create your first promotion to attract more customers
            </Text>
          </View>
        ) : (
          promotions.map((promotion) => {
            const isActive = promotion.is_active;
            const discountText = promotion.discount_type === 'percentage'
              ? `${promotion.discount_value}% OFF`
              : `$${promotion.discount_value} OFF`;

            return (
              <View key={promotion.id} style={styles.promotionCard}>
                <View style={styles.promotionHeader}>
                  <Text style={styles.promotionTitle}>{promotion.title}</Text>
                  <View
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: isActive ? '#10B981' : '#6B7280' },
                    ]}
                  >
                    <Text style={[styles.activeIndicatorText, { color: '#FFFFFF' }]}>
                      {isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.promotionDescription}>{promotion.description}</Text>

                <View style={styles.promotionDetails}>
                  <View style={styles.detailBadge}>
                    <Text style={styles.detailText}>{discountText}</Text>
                  </View>
                  <View style={styles.detailBadge}>
                    <Text style={styles.detailText}>
                      {new Date(promotion.start_date).toLocaleDateString()} - {new Date(promotion.end_date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {promotion.banner_text && (
                  <Text style={[styles.promotionDescription, { fontStyle: 'italic' }]}>
                    Banner: {promotion.banner_text}
                  </Text>
                )}

                <View style={styles.promotionActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.toggleButton]}
                    onPress={() => handleToggleActive(promotion)}
                  >
                    <Text style={styles.actionButtonText}>
                      {isActive ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleOpenModal(promotion)}
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeletePromotion(promotion.id)}
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
                {editingPromotion ? 'Edit Promotion' : 'Create Promotion'}
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="e.g., Summer Sale"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Describe the promotion..."
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
                  placeholder={formData.discount_type === 'percentage' ? '10' : '5.00'}
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Banner Text (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.banner_text}
                  onChangeText={(text) => setFormData({ ...formData, banner_text: text })}
                  placeholder="Text to display in banner"
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
                  onPress={handleSavePromotion}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                      {editingPromotion ? 'Update' : 'Create'}
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
