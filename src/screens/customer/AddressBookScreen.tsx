
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { theme, globalStyles } from '../../styles/theme';
import { supabase } from '../../config/supabase';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface Address {
  id: string;
  address_line: string;
  city: string | null;
  region: string | null;
  notes: string | null;
  is_default: boolean;
}

const SERVICE_ZONES = [
  { id: 'Georgetown', name: 'Georgetown', active: true },
  { id: 'East Bank', name: 'East Bank', active: true },
  { id: 'East Coast', name: 'East Coast', active: true },
  { id: 'Region 3 (Over the River)', name: 'Region 3 (Over the River)', active: false },
];

export default function AddressBookScreen() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  // Form fields
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Georgetown');
  const [region, setRegion] = useState('Georgetown');
  const [notes, setNotes] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      Alert.alert('Error', 'Failed to load addresses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAddresses();
  };

  const resetForm = () => {
    setAddressLine('');
    setCity('Georgetown');
    setRegion('Georgetown');
    setNotes('');
    setIsDefault(false);
    setEditingAddress(null);
  };

  const handleAddAddress = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressLine(address.address_line);
    setCity(address.city || 'Georgetown');
    setRegion(address.region || 'Georgetown');
    setNotes(address.notes || '');
    setIsDefault(address.is_default);
    setShowAddModal(true);
  };

  const handleSaveAddress = async () => {
    if (!user) return;

    if (!addressLine.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return;
    }

    // Check if region is active
    const selectedZone = SERVICE_ZONES.find(z => z.id === region);
    if (selectedZone && !selectedZone.active) {
      Alert.alert(
        '⚠️ Service Not Available',
        `Services to ${selectedZone.name} will be available soon. Please select a different region.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setLoading(true);

      // If setting as default, unset other defaults first
      if (isDefault) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('customer_addresses')
          .update({
            address_line: addressLine,
            city,
            region,
            notes,
            is_default: isDefault,
          })
          .eq('id', editingAddress.id);

        if (error) throw error;
        Alert.alert('Success', 'Address updated successfully');
      } else {
        // Create new address
        const { error } = await supabase
          .from('customer_addresses')
          .insert({
            user_id: user.id,
            address_line: addressLine,
            city,
            region,
            notes,
            is_default: isDefault || addresses.length === 0, // First address is default
          });

        if (error) throw error;
        Alert.alert('Success', 'Address added successfully');
      }

      setShowAddModal(false);
      resetForm();
      await fetchAddresses();
    } catch (error: any) {
      console.error('Error saving address:', error);
      Alert.alert('Error', error.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = (address: Address) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('customer_addresses')
                .delete()
                .eq('id', address.id);

              if (error) throw error;
              Alert.alert('Success', 'Address deleted successfully');
              await fetchAddresses();
            } catch (error: any) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (address: Address) => {
    if (!user) return;

    try {
      // Unset all defaults
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set this one as default
      const { error } = await supabase
        .from('customer_addresses')
        .update({ is_default: true })
        .eq('id', address.id);

      if (error) throw error;
      Alert.alert('Success', 'Default address updated');
      await fetchAddresses();
    } catch (error: any) {
      console.error('Error setting default:', error);
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  if (loading && !refreshing) {
    return <LoadingSpinner message="Loading addresses..." />;
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
        <Text style={styles.headerTitle}>Address Book</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddAddress}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>No addresses saved</Text>
            <Text style={styles.emptyText}>
              Add your delivery addresses for faster checkout
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddAddress}
            >
              <Text style={styles.emptyButtonText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              {address.is_default && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                </View>
              )}
              
              <Text style={styles.addressLine}>{address.address_line}</Text>
              
              <View style={styles.addressDetails}>
                <Text style={styles.addressDetail}>
                  📍 {address.region || address.city || 'Georgetown'}
                </Text>
              </View>

              {address.notes && (
                <Text style={styles.addressNotes}>Note: {address.notes}</Text>
              )}

              <View style={styles.addressActions}>
                {!address.is_default && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSetDefault(address)}
                  >
                    <Text style={styles.actionButtonText}>Set as Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditAddress(address)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteAddress(address)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Address Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Address Line *</Text>
                <TextInput
                  style={styles.input}
                  value={addressLine}
                  onChangeText={setAddressLine}
                  placeholder="e.g., 212 Block XXXI, EBD"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Region *</Text>
                {SERVICE_ZONES.map((zone) => (
                  <TouchableOpacity
                    key={zone.id}
                    style={[
                      styles.zoneOption,
                      region === zone.id && styles.zoneOptionSelected,
                      !zone.active && styles.zoneOptionDisabled,
                    ]}
                    onPress={() => {
                      if (zone.active) {
                        setRegion(zone.id);
                        setCity(zone.id);
                      } else {
                        Alert.alert(
                          '⚠️ Service Not Available',
                          `Services to ${zone.name} will be available soon.`,
                          [{ text: 'OK' }]
                        );
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.zoneOptionText,
                        region === zone.id && styles.zoneOptionTextSelected,
                        !zone.active && styles.zoneOptionTextDisabled,
                      ]}
                    >
                      {zone.name}
                      {!zone.active && ' (Coming Soon)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g., Near the gas station"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setIsDefault(!isDefault)}
              >
                <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
                  {isDefault && <Text style={styles.checkboxCheck}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Set as default address</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveAddress}
                disabled={loading}
              >
                <Text style={styles.modalButtonTextSave}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
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
    paddingTop: 60,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    paddingVertical: theme.spacing.sm,
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
  addButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  addressCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  addressLine: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  addressDetails: {
    marginBottom: theme.spacing.sm,
  },
  addressDetail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  addressNotes: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.md,
  },
  addressActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.sm,
  },
  actionButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  deleteButton: {
    backgroundColor: theme.colors.danger + '20',
  },
  deleteButtonText: {
    color: theme.colors.danger,
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
  emptyButton: {
    ...globalStyles.button,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyButtonText: {
    ...globalStyles.buttonText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  modalClose: {
    fontSize: 24,
    color: theme.colors.textSecondary,
  },
  modalBody: {
    padding: theme.spacing.md,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  zoneOption: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  zoneOptionSelected: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  zoneOptionDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.6,
  },
  zoneOptionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  zoneOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  zoneOptionTextDisabled: {
    color: theme.colors.textSecondary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
  },
  checkboxLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalButtonTextCancel: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  modalButtonSave: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonTextSave: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
});
