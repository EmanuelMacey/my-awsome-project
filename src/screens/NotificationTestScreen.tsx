
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import {
  registerForPushNotificationsAsync,
  sendLocalNotification,
  getNotificationPermissionsStatus,
  requestNotificationPermissions,
  notifyOrderStatusChange,
  notifyDriverNewOrder,
  notifyChatMessage,
} from '../utils/notifications';

export default function NotificationTestScreen() {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [pushToken, setPushToken] = useState<string | undefined>();

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    console.log('🔔 Checking notification permissions...');
    const status = await getNotificationPermissionsStatus();
    setPermissionStatus(status);
    console.log('📋 Permission status:', status);
  };

  const handleRequestPermissions = async () => {
    console.log('🔔 Requesting notification permissions...');
    const granted = await requestNotificationPermissions();
    
    if (granted) {
      Alert.alert('✅ Success', 'Notification permissions granted!');
      setPermissionStatus('granted');
      
      // Register for push notifications
      if (user) {
        const token = await registerForPushNotificationsAsync(user.id);
        setPushToken(token);
        console.log('🎫 Push token:', token);
      }
    } else {
      Alert.alert('❌ Denied', 'Notification permissions were denied. Please enable them in your device settings.');
      setPermissionStatus('denied');
    }
  };

  const handleTestBasicNotification = async () => {
    console.log('📬 Sending test notification...');
    await sendLocalNotification(
      '🎉 Test Notification',
      'This is a test notification with sound!',
      { test: true }
    );
    Alert.alert('✅ Sent', 'Test notification sent! You should see it appear at the top of the screen.');
  };

  const handleTestOrderNotification = async () => {
    if (!user) {
      Alert.alert('❌ Error', 'You must be logged in to test order notifications');
      return;
    }

    console.log('📦 Sending test order notification...');
    await notifyOrderStatusChange(user.id, 'test-order-123', 'ORD-12345', 'in_transit');
    Alert.alert('✅ Sent', 'Test order notification sent!');
  };

  const handleTestDriverNotification = async () => {
    if (!user) {
      Alert.alert('❌ Error', 'You must be logged in to test driver notifications');
      return;
    }

    console.log('🚗 Sending test driver notification...');
    await notifyDriverNewOrder(user.id, 'test-order-456', 'ORD-67890', 'Test Store');
    Alert.alert('✅ Sent', 'Test driver notification sent!');
  };

  const handleTestChatNotification = async () => {
    if (!user) {
      Alert.alert('❌ Error', 'You must be logged in to test chat notifications');
      return;
    }

    console.log('💬 Sending test chat notification...');
    await notifyChatMessage(user.id, 'Test User', 'Hey! This is a test message from the notification system.', 'test-order-789');
    Alert.alert('✅ Sent', 'Test chat notification sent!');
  };

  const getPermissionStatusColor = () => {
    const statusColor = permissionStatus === 'granted' ? '#4CAF50' : permissionStatus === 'denied' ? '#F44336' : '#FF9800';
    return statusColor;
  };

  const getPermissionStatusText = () => {
    const statusText = permissionStatus === 'granted' ? 'Granted ✅' : permissionStatus === 'denied' ? 'Denied ❌' : 'Not Requested ⚠️';
    return statusText;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Test</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Notification Status</Text>
          
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Permission Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: getPermissionStatusColor() }]}>
                <Text style={styles.statusBadgeText}>{getPermissionStatusText()}</Text>
              </View>
            </View>

            {pushToken && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Push Token:</Text>
                <Text style={styles.tokenText} numberOfLines={1}>
                  {pushToken.substring(0, 20)}...
                </Text>
              </View>
            )}

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Platform:</Text>
              <Text style={styles.statusValue}>{Platform.OS}</Text>
            </View>
          </View>

          {permissionStatus !== 'granted' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRequestPermissions}
            >
              <Text style={styles.primaryButtonText}>
                🔔 Request Notification Permissions
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Test Notifications</Text>
          <Text style={styles.sectionDescription}>
            Tap any button below to send a test notification. You should see a pop-up at the top of the screen and hear a sound.
          </Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestBasicNotification}
            disabled={permissionStatus !== 'granted'}
          >
            <Text style={styles.testButtonIcon}>🎉</Text>
            <View style={styles.testButtonContent}>
              <Text style={styles.testButtonTitle}>Basic Notification</Text>
              <Text style={styles.testButtonDescription}>
                Simple notification with title and body
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestOrderNotification}
            disabled={permissionStatus !== 'granted'}
          >
            <Text style={styles.testButtonIcon}>📦</Text>
            <View style={styles.testButtonContent}>
              <Text style={styles.testButtonTitle}>Order Status Update</Text>
              <Text style={styles.testButtonDescription}>
                Simulates an order status change notification
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestDriverNotification}
            disabled={permissionStatus !== 'granted'}
          >
            <Text style={styles.testButtonIcon}>🚗</Text>
            <View style={styles.testButtonContent}>
              <Text style={styles.testButtonTitle}>New Order (Driver)</Text>
              <Text style={styles.testButtonDescription}>
                Simulates a new order notification for drivers
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestChatNotification}
            disabled={permissionStatus !== 'granted'}
          >
            <Text style={styles.testButtonIcon}>💬</Text>
            <View style={styles.testButtonContent}>
              <Text style={styles.testButtonTitle}>Chat Message</Text>
              <Text style={styles.testButtonDescription}>
                Simulates a new chat message notification
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ How to Test</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              1. Make sure notification permissions are granted{'\n'}
              2. Tap any test button above{'\n'}
              3. You should see a notification pop up at the top{'\n'}
              4. You should hear a notification sound{'\n'}
              5. Tap the notification to test navigation{'\n'}
              6. The notification will auto-dismiss after 5 seconds
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🔍 Troubleshooting</Text>
            <Text style={styles.infoText}>
              • If you don't see notifications, check your device settings{'\n'}
              • On iOS: Settings → MaceyRunners → Notifications{'\n'}
              • On Android: Settings → Apps → MaceyRunners → Notifications{'\n'}
              • Make sure "Do Not Disturb" is off{'\n'}
              • Try restarting the app after granting permissions
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666666',
    flex: 1,
    marginLeft: 8,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  testButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  testButtonContent: {
    flex: 1,
  },
  testButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  testButtonDescription: {
    fontSize: 14,
    color: '#666666',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 22,
  },
});
