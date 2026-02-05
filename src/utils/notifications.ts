
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

/**
 * Register for push notifications on all platforms (iOS, Android, Web)
 */
export async function registerForPushNotificationsAsync(userId?: string) {
  let token;

  try {
    console.log('🔔 Starting push notification registration...');
    console.log('📱 Platform:', Platform.OS);
    console.log('🔧 Device:', Device.isDevice);

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      console.log('🤖 Setting up Android notification channel...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        sound: 'default',
        showBadge: true,
        enableLights: true,
        enableVibrate: true,
      });
      console.log('✅ Android notification channel created');
    }

    // Web push notifications
    if (Platform.OS === 'web') {
      console.log('🌐 Registering for web push notifications...');
      
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.log('❌ This browser does not support notifications');
        return;
      }

      // Check current permission status
      const currentPermission = Notification.permission;
      console.log('🔔 Current web notification permission:', currentPermission);
      
      if (currentPermission === 'denied') {
        console.log('⚠️ Web push notifications are blocked. User needs to enable them in browser settings.');
        return;
      }

      if (currentPermission === 'default') {
        // Request permission
        const permission = await Notification.requestPermission();
        console.log('🔔 Web notification permission after request:', permission);
        
        if (permission !== 'granted') {
          console.log('❌ Web push notification permissions not granted');
          return;
        }
      }

      // For web, we'll use the browser's native notification API
      // Store a flag that web notifications are enabled
      if (userId) {
        const { error } = await supabase
          .from('users')
          .update({ 
            web_notifications_enabled: true,
            push_token: 'web-enabled' // Placeholder for web
          })
          .eq('id', userId);
        
        if (error) {
          console.error('❌ Error saving web notification preference:', error);
        } else {
          console.log('✅ Web notifications enabled for user');
        }
      }

      console.log('✅ Web push notifications registered');
      return 'web-enabled';
    }

    // Native (iOS/Android) push notifications
    if (Device.isDevice) {
      console.log('📱 Checking notification permissions...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      console.log('📋 Existing permission status:', existingStatus);
      
      if (existingStatus !== 'granted') {
        console.log('🔔 Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📋 New permission status:', finalStatus);
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Push notification permissions not granted');
        console.log('💡 User needs to enable notifications in device settings');
        return;
      }
      
      try {
        console.log('🎫 Getting Expo push token...');
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: 'your-project-id', // This will be auto-configured by Expo
        });
        token = tokenData.data;
        console.log('✅ Push token obtained:', token);
        
        // Save the push token to the user's profile
        if (userId && token) {
          console.log('💾 Saving push token to user profile...');
          const { error } = await supabase
            .from('users')
            .update({ push_token: token })
            .eq('id', userId);
          
          if (error) {
            console.error('❌ Error saving push token:', error);
          } else {
            console.log('✅ Push token saved to user profile');
          }
        }
      } catch (error) {
        console.error('❌ Error getting push token:', error);
      }
    } else {
      console.log('⚠️ Must use physical device for Push Notifications (not simulator/emulator)');
    }

    return token;
  } catch (error) {
    console.error('❌ Error in registerForPushNotificationsAsync:', error);
    return undefined;
  }
}

/**
 * Send a local notification (works on all platforms)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: any
) {
  try {
    console.log('📬 Sending local notification:', { title, body });

    // For web, use browser's native notification API
    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/assets/images/77417a0d-d5f2-4d10-be09-c5caa4ff37f6.jpeg',
          badge: '/assets/images/77417a0d-d5f2-4d10-be09-c5caa4ff37f6.jpeg',
          tag: data?.orderId || 'notification',
          requireInteraction: false,
          data,
        });
        console.log('✅ Web notification sent');
      } else if (Notification.permission === 'denied') {
        console.log('⚠️ Web notifications are blocked. Please enable them in your browser settings.');
      } else {
        console.log('⚠️ Web notifications not available or not permitted');
      }
      return;
    }

    // For native platforms, use Expo notifications
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        badge: 1,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && {
          color: '#FF6B35',
          channelId: 'default',
        }),
      },
      trigger: null, // Send immediately
    });
    
    console.log('✅ Native notification sent');
  } catch (error) {
    console.error('❌ Error sending local notification:', error);
  }
}

/**
 * Notify user about order status change
 */
export async function notifyOrderStatusChange(
  userId: string,
  orderId: string,
  orderNumber: string,
  status: string
) {
  try {
    console.log('📢 Notifying order status change:', { userId, orderId, orderNumber, status });

    const statusMessages: Record<string, { title: string; body: string }> = {
      pending: {
        title: '📦 Order Placed',
        body: `Your order #${orderNumber} has been placed and is waiting for a driver.`,
      },
      confirmed: {
        title: '✅ Order Confirmed',
        body: `Your order #${orderNumber} has been confirmed by the store.`,
      },
      accepted: {
        title: '🚗 Driver Assigned',
        body: `A driver has been assigned to your order #${orderNumber}.`,
      },
      purchasing: {
        title: '🛒 Purchasing Items',
        body: `Your driver is purchasing items for order #${orderNumber}.`,
      },
      preparing: {
        title: '👨‍🍳 Preparing Order',
        body: `Your order #${orderNumber} is being prepared.`,
      },
      ready_for_pickup: {
        title: '📦 Ready for Pickup',
        body: `Your order #${orderNumber} is ready for pickup.`,
      },
      picked_up: {
        title: '🚚 Out for Delivery',
        body: `Your order #${orderNumber} has been picked up and is on the way!`,
      },
      in_transit: {
        title: '🚚 On the Way',
        body: `Your order #${orderNumber} is on the way to you!`,
      },
      delivered: {
        title: '✅ Order Delivered',
        body: `Your order #${orderNumber} has been delivered. Enjoy!`,
      },
      cancelled: {
        title: '❌ Order Cancelled',
        body: `Your order #${orderNumber} has been cancelled.`,
      },
    };

    const message = statusMessages[status] || {
      title: '📦 Order Update',
      body: `Your order #${orderNumber} status has been updated to ${status}.`,
    };

    // Send local notification
    await sendLocalNotification(message.title, message.body, {
      orderId,
      orderNumber,
      status,
      type: 'order_status',
    });

    // Save notification to database
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: message.title,
        message: message.body,
        type: 'order',
        order_id: orderId,
        is_read: false,
        data: { orderId, orderNumber, status },
      });

    if (error) {
      console.error('❌ Error saving notification to database:', error);
    } else {
      console.log('✅ Notification saved to database');
    }

    console.log('✅ Order status notification sent');
  } catch (error) {
    console.error('❌ Error in notifyOrderStatusChange:', error);
  }
}

/**
 * Notify driver about new order
 */
export async function notifyDriverNewOrder(
  driverId: string,
  orderId: string,
  orderNumber: string,
  storeName: string
) {
  try {
    console.log('📢 Notifying driver about new order:', { driverId, orderId, orderNumber, storeName });

    const title = '🆕 New Order Available';
    const body = `New order #${orderNumber} from ${storeName} is available for pickup.`;

    // Send local notification
    await sendLocalNotification(title, body, {
      orderId,
      orderNumber,
      storeName,
      type: 'new_order',
    });

    // Save notification to database
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: driverId,
        title,
        message: body,
        type: 'order',
        order_id: orderId,
        is_read: false,
        data: { orderId, orderNumber, storeName },
      });

    if (error) {
      console.error('❌ Error saving notification to database:', error);
    } else {
      console.log('✅ Notification saved to database');
    }

    console.log('✅ Driver notification sent');
  } catch (error) {
    console.error('❌ Error in notifyDriverNewOrder:', error);
  }
}

/**
 * Notify user about new chat message
 */
export async function notifyChatMessage(
  userId: string,
  senderName: string,
  message: string,
  orderId: string
) {
  try {
    console.log('📢 Notifying chat message:', { userId, senderName, orderId });

    const title = `💬 ${senderName}`;
    const body = message.length > 100 ? `${message.substring(0, 100)}...` : message;

    // Send local notification
    await sendLocalNotification(title, body, {
      orderId,
      senderName,
      type: 'chat_message',
    });

    // Save notification to database
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message: body,
        type: 'chat',
        order_id: orderId,
        is_read: false,
        data: { orderId, senderName },
      });

    if (error) {
      console.error('❌ Error saving notification to database:', error);
    }

    console.log('✅ Chat message notification sent');
  } catch (error) {
    console.error('❌ Error in notifyChatMessage:', error);
  }
}

/**
 * Notify user about errand status change
 */
export async function notifyErrandStatusChange(
  userId: string,
  errandId: string,
  errandNumber: string,
  status: string
) {
  try {
    console.log('📢 Notifying errand status change:', { userId, errandId, errandNumber, status });

    const statusMessages: Record<string, { title: string; body: string }> = {
      pending: {
        title: '📦 Errand Created',
        body: `Your errand #${errandNumber} has been created and is waiting for a runner.`,
      },
      accepted: {
        title: '✅ Runner Assigned',
        body: `A runner has been assigned to your errand #${errandNumber}.`,
      },
      in_progress: {
        title: '🏃 Errand In Progress',
        body: `Your errand #${errandNumber} is in progress.`,
      },
      completed: {
        title: '✅ Errand Completed',
        body: `Your errand #${errandNumber} has been completed!`,
      },
      cancelled: {
        title: '❌ Errand Cancelled',
        body: `Your errand #${errandNumber} has been cancelled.`,
      },
    };

    const message = statusMessages[status] || {
      title: '📦 Errand Update',
      body: `Your errand #${errandNumber} status has been updated to ${status}.`,
    };

    // Send local notification
    await sendLocalNotification(message.title, message.body, {
      errandId,
      errandNumber,
      status,
      type: 'errand_status',
    });

    // Save notification to database
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: message.title,
        message: message.body,
        type: 'order',
        order_id: errandId,
        is_read: false,
        data: { errandId, errandNumber, status },
      });

    if (error) {
      console.error('❌ Error saving notification to database:', error);
    }

    console.log('✅ Errand status notification sent');
  } catch (error) {
    console.error('❌ Error in notifyErrandStatusChange:', error);
  }
}

/**
 * Clear all notifications badge
 */
export async function clearNotificationBadge() {
  try {
    if (Platform.OS !== 'web') {
      await Notifications.setBadgeCountAsync(0);
      console.log('✅ Notification badge cleared');
    }
  } catch (error) {
    console.error('❌ Error clearing notification badge:', error);
  }
}

/**
 * Get notification permissions status
 */
export async function getNotificationPermissionsStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    if (Platform.OS === 'web') {
      if (!('Notification' in window)) {
        return 'denied';
      }
      const permission = Notification.permission;
      if (permission === 'granted') return 'granted';
      if (permission === 'denied') return 'denied';
      return 'undetermined';
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch (error) {
    console.error('❌ Error getting notification permissions:', error);
    return 'denied';
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    console.log('🔔 Requesting notification permissions...');
    
    if (Platform.OS === 'web') {
      if (!('Notification' in window)) {
        console.log('❌ Browser does not support notifications');
        return false;
      }
      
      const permission = await Notification.requestPermission();
      console.log('🔔 Web notification permission:', permission);
      return permission === 'granted';
    }

    const { status } = await Notifications.requestPermissionsAsync();
    console.log('🔔 Native notification permission:', status);
    return status === 'granted';
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    return false;
  }
}
