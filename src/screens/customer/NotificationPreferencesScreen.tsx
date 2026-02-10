
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { theme } from '../../styles/theme';
import { requestNotificationPermissions, getNotificationPermissionsStatus } from '../../utils/notifications';

interface NotificationPreferences {
  purchase_reminders: boolean;
  reminder_frequency: 'daily' | 'every_3_days' | 'weekly' | 'never';
  order_updates: boolean;
  promotions: boolean;
  new_stores: boolean;
  price_drops: boolean;
  abandoned_cart: boolean;
}

export default function NotificationPreferencesScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    purchase_reminders: true,
    reminder_frequency: 'every_3_days',
    order_updates: true,
    promotions: true,
    new_stores: false,
    price_drops: false,
    abandoned_cart: true,
  });

  useEffect(() => {
    fetchPreferences();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const status = await getNotificationPermissionsStatus();
    setPermissionStatus(status);
    console.log('🔔 Notification permission status:', status);
  };

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      console.log('📡 Fetching notification preferences for user:', user.id);
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching preferences:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Preferences loaded:', data);
        setPreferences({
          purchase_reminders: data.purchase_reminders ?? true,
          reminder_frequency: data.reminder_frequency ?? 'every_3_days',
          order_updates: data.order_updates ?? true,
          promotions: data.promotions ?? true,
          new_stores: data.new_stores ?? false,
          price_drops: data.price_drops ?? false,
          abandoned_cart: data.abandoned_cart ?? true,
        });
      } else {
        console.log('ℹ️ No preferences found, using defaults');
      }
    } catch (error) {
      console.error('❌ Error in fetchPreferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      console.log('💾 Saving notification preferences:', preferences);

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ Error saving preferences:', error);
        throw error;
      }

      console.log('✅ Preferences saved successfully');
      Alert.alert('Success', 'Your notification preferences have been saved');
    } catch (error) {
      console.error('❌ Error in savePreferences:', error);
      Alert.alert('Error', 'Failed to save notification preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestPermissions = async () => {
    console.log('🔔 Requesting notification permissions...');
    const granted = await requestNotificationPermissions();
    
    if (granted) {
      setPermissionStatus('granted');
      Alert.alert('Success', 'Notification permissions granted! You will now receive reminders and updates.');
    } else {
      setPermissionStatus('denied');
      Alert.alert(
        'Permissions Denied',
        'Please enable notifications in your device settings to receive purchase reminders and order updates.'
      );
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    console.log('🔄 Updating preference:', key, '=', value);
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  const frequencyLabel = preferences.reminder_frequency === 'daily' ? 'Daily' :
    preferences.reminder_frequency === 'every_3_days' ? 'Every 3 Days' :
    preferences.reminder_frequency === 'weekly' ? 'Weekly' : 'Never';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Permission Status Banner */}
        {permissionStatus !== 'granted' && (
          <View style={styles.permissionBanner}>
            <Text style={styles.permissionIcon}>🔔</Text>
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>Enable Notifications</Text>
              <Text style={styles.permissionText}>
                Get reminders about great deals and never miss an order update
              </Text>
              <TouchableOpacity
                style={styles.enableButton}
                onPress={handleRequestPermissions}
              >
                <Text style={styles.enableButtonText}>Enable Notifications</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Purchase Reminders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase Reminders</Text>
          <Text style={styles.sectionDescription}>
            Get reminded to check out new items and special offers
          </Text>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceLeft}>
              <Text style={styles.preferenceIcon}>🛍️</Text>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Purchase Reminders</Text>
                <Text style={styles.preferenceDescription}>
                  Remind me to shop and discover new items
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.purchase_reminders}
              onValueChange={(value) => updatePreference('purchase_reminders', value)}
              trackColor={{ false: '#D1D5DB', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {preferences.purchase_reminders && (
            <View style={styles.frequencySection}>
              <Text style={styles.frequencyLabel}>Reminder Frequency</Text>
              <View style={styles.frequencyOptions}>
                {(['daily', 'every_3_days', 'weekly', 'never'] as const).map((freq) => {
                  const isSelected = preferences.reminder_frequency === freq;
                  const label = freq === 'daily' ? 'Daily' :
                    freq === 'every_3_days' ? 'Every 3 Days' :
                    freq === 'weekly' ? 'Weekly' : 'Never';
                  
                  return (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.frequencyOption,
                        isSelected && styles.frequencyOptionSelected,
                      ]}
                      onPress={() => updatePreference('reminder_frequency', freq)}
                    >
                      <Text style={[
                        styles.frequencyOptionText,
                        isSelected && styles.frequencyOptionTextSelected,
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceLeft}>
              <Text style={styles.preferenceIcon}>🛒</Text>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Abandoned Cart</Text>
                <Text style={styles.preferenceDescription}>
                  Remind me about items left in my cart
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.abandoned_cart}
              onValueChange={(value) => updatePreference('abandoned_cart', value)}
              trackColor={{ false: '#D1D5DB', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Order Updates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Updates</Text>
          <Text style={styles.sectionDescription}>
            Stay informed about your order status
          </Text>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceLeft}>
              <Text style={styles.preferenceIcon}>📦</Text>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Order Status Updates</Text>
                <Text style={styles.preferenceDescription}>
                  Get notified when your order status changes
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.order_updates}
              onValueChange={(value) => updatePreference('order_updates', value)}
              trackColor={{ false: '#D1D5DB', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Promotions & Deals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promotions & Deals</Text>
          <Text style={styles.sectionDescription}>
            Never miss out on special offers
          </Text>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceLeft}>
              <Text style={styles.preferenceIcon}>🎉</Text>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Promotions</Text>
                <Text style={styles.preferenceDescription}>
                  Get notified about sales and special offers
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.promotions}
              onValueChange={(value) => updatePreference('promotions', value)}
              trackColor={{ false: '#D1D5DB', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceLeft}>
              <Text style={styles.preferenceIcon}>💰</Text>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Price Drops</Text>
                <Text style={styles.preferenceDescription}>
                  Alert me when items go on sale
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.price_drops}
              onValueChange={(value) => updatePreference('price_drops', value)}
              trackColor={{ false: '#D1D5DB', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceLeft}>
              <Text style={styles.preferenceIcon}>🏪</Text>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>New Stores</Text>
                <Text style={styles.preferenceDescription}>
                  Know when new restaurants join
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.new_stores}
              onValueChange={(value) => updatePreference('new_stores', value)}
              trackColor={{ false: '#D1D5DB', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            You can change these settings anytime. We respect your preferences and will only send notifications you&apos;ve enabled.
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={savePreferences}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  permissionBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF5EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  permissionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  permissionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  enableButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  preferenceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  frequencySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  frequencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  frequencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  frequencyOptionSelected: {
    backgroundColor: theme.colors.primaryLight + '20',
    borderColor: theme.colors.primary,
  },
  frequencyOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  frequencyOptionTextSelected: {
    color: theme.colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
