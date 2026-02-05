
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  getNotificationPermissionsStatus,
  requestNotificationPermissions,
  registerForPushNotificationsAsync,
  sendLocalNotification,
} from '../utils/notifications';
import { supabase } from '../config/supabase';

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webContainer: {
    maxWidth: 800,
    marginHorizontal: 'auto',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'android' ? 48 : 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  permissionStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  permissionGranted: {
    color: theme.colors.success,
  },
  permissionDenied: {
    color: theme.colors.error,
  },
  permissionUndetermined: {
    color: theme.colors.warning,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: theme.colors.secondary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
});

export default function NotificationSettingsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);
  const [promotionNotifications, setPromotionNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      
      const status = await getNotificationPermissionsStatus();
      setPermissionStatus(status);
      console.log('🔔 Notification permission status:', status);

      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();

        if (!error && data?.notification_preferences) {
          const prefs = data.notification_preferences;
          setOrderNotifications(prefs.orders !== false);
          setChatNotifications(prefs.chat !== false);
          setPromotionNotifications(prefs.promotions !== false);
          setSystemNotifications(prefs.system !== false);
        }
      }
    } catch (error) {
      console.error('❌ Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleRequestPermissions = async () => {
    try {
      console.log('🔔 Requesting notification permissions...');
      const granted = await requestNotificationPermissions();
      
      if (granted) {
        console.log('✅ Permissions granted');
        setPermissionStatus('granted');
        
        if (user) {
          await registerForPushNotificationsAsync(user.id);
        }
        
        Alert.alert(
          'Success',
          'Notifications enabled! You will now receive updates about your orders and errands.'
        );
      } else {
        console.log('❌ Permissions denied');
        setPermissionStatus('denied');
        
        Alert.alert(
          'Permissions Denied',
          'Please enable notifications in your device settings to receive updates.'
        );
      }
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions');
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    try {
      const preferences = {
        orders: orderNotifications,
        chat: chatNotifications,
        promotions: promotionNotifications,
        system: systemNotifications,
      };

      const { error } = await supabase
        .from('users')
        .update({ notification_preferences: preferences })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Success', 'Notification preferences saved');
    } catch (error) {
      console.error('❌ Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save notification preferences');
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendLocalNotification(
        '🔔 Test Notification',
        'This is a test notification from MaceyRunners!',
        { type: 'test' }
      );
      
      Alert.alert(
        'Test Sent',
        'A test notification has been sent. You should see it appear shortly.'
      );
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const getPermissionStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Notifications Enabled ✓';
      case 'denied':
        return 'Notifications Disabled ✗';
      case 'undetermined':
        return 'Permissions Not Set';
      default:
        return 'Unknown';
    }
  };

  const getPermissionStatusStyle = () => {
    switch (permissionStatus) {
      case 'granted':
        return styles.permissionGranted;
      case 'denied':
        return styles.permissionDenied;
      case 'undetermined':
        return styles.permissionUndetermined;
      default:
        return {};
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const permissionStatusText = getPermissionStatusText();
  const permissionStatusStyle = getPermissionStatusStyle();

  return (
    <View style={[styles.container, isWeb && styles.webContainer]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permission Status</Text>
          <Text style={[styles.permissionStatus, permissionStatusStyle]}>
            {permissionStatusText}
          </Text>
          
          {permissionStatus !== 'granted' && (
            <React.Fragment>
              <Text style={styles.infoText}>
                Enable notifications to receive real-time updates about your orders, errands, and messages.
              </Text>
              <TouchableOpacity style={styles.button} onPress={handleRequestPermissions}>
                <Text style={styles.buttonText}>Enable Notifications</Text>
              </TouchableOpacity>
            </React.Fragment>
          )}

          {permissionStatus === 'granted' && (
            <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
              <Text style={styles.buttonText}>Send Test Notification</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Order Updates</Text>
              <Text style={styles.settingDescription}>
                Get notified about order status changes
              </Text>
            </View>
            <Switch
              value={orderNotifications}
              onValueChange={setOrderNotifications}
              trackColor={{ false: '#D0D0D0', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Chat Messages</Text>
              <Text style={styles.settingDescription}>
                Get notified about new chat messages
              </Text>
            </View>
            <Switch
              value={chatNotifications}
              onValueChange={setChatNotifications}
              trackColor={{ false: '#D0D0D0', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Promotions</Text>
              <Text style={styles.settingDescription}>
                Get notified about special offers and deals
              </Text>
            </View>
            <Switch
              value={promotionNotifications}
              onValueChange={setPromotionNotifications}
              trackColor={{ false: '#D0D0D0', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>System Updates</Text>
              <Text style={styles.settingDescription}>
                Get notified about app updates and maintenance
              </Text>
            </View>
            <Switch
              value={systemNotifications}
              onValueChange={setSystemNotifications}
              trackColor={{ false: '#D0D0D0', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSavePreferences}>
            <Text style={styles.buttonText}>Save Preferences</Text>
          </TouchableOpacity>
        </View>

        {Platform.OS === 'web' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Web Notifications</Text>
            <Text style={styles.infoText}>
              Web notifications work differently than mobile notifications. Make sure your browser allows notifications from this site.
            </Text>
            <Text style={styles.infoText}>
              You can manage browser notification permissions in your browser settings.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
