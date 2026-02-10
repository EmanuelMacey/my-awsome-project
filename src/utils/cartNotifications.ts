
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ABANDONED_CART_DELAY = 3600; // 1 hour in seconds
const CART_REMINDER_DELAY = 86400; // 24 hours in seconds

/**
 * Setup notification channel for cart reminders (Android)
 */
export async function setupCartNotificationChannel() {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('cart-reminders', {
        name: 'Cart Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        sound: 'default',
        showBadge: true,
        enableLights: true,
        enableVibrate: true,
      });
      console.log('✅ Cart notification channel created');
    } catch (error) {
      console.error('❌ Error creating cart notification channel:', error);
    }
  }
}

/**
 * Schedule cart reminder notifications
 * - 1 hour: Abandoned cart reminder
 * - 24 hours: Extended cart reminder
 */
export async function scheduleCartReminders(cartItemCount: number) {
  try {
    console.log('🛒 Scheduling cart reminders for', cartItemCount, 'items');

    // Skip on web
    if (Platform.OS === 'web') {
      console.log('⚠️ Web platform - skipping cart reminders');
      return;
    }

    // Cancel any existing cart reminders first
    await cancelCartReminders();

    // Schedule 1-hour abandoned cart reminder
    const abandonedCartId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🛒 Don\'t forget your cart!',
        body: `You have ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'items'} waiting. Complete your order now and get it delivered!`,
        data: { type: 'abandoned_cart', cartItemCount },
        sound: 'default',
        badge: 1,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && {
          color: '#FF6B35',
          channelId: 'cart-reminders',
        }),
      },
      trigger: {
        seconds: ABANDONED_CART_DELAY,
      },
    });

    // Schedule 24-hour extended reminder
    const extendedReminderId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🍔 Still hungry?',
        body: `Your cart is waiting! ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'items'} ready to order. Don't miss out!`,
        data: { type: 'cart_reminder', cartItemCount },
        sound: 'default',
        badge: 1,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && {
          color: '#FF6B35',
          channelId: 'cart-reminders',
        }),
      },
      trigger: {
        seconds: CART_REMINDER_DELAY,
      },
    });

    // Save notification IDs for later cancellation
    await AsyncStorage.setItem('cart_reminder_ids', JSON.stringify({
      abandonedCartId,
      extendedReminderId,
    }));

    console.log('✅ Cart reminders scheduled:', { abandonedCartId, extendedReminderId });
  } catch (error) {
    console.error('❌ Error scheduling cart reminders:', error);
  }
}

/**
 * Cancel all cart reminder notifications
 * Called when user completes checkout or clears cart
 */
export async function cancelCartReminders() {
  try {
    console.log('🚫 Cancelling cart reminders');

    const reminderIdsJson = await AsyncStorage.getItem('cart_reminder_ids');
    if (reminderIdsJson) {
      const { abandonedCartId, extendedReminderId } = JSON.parse(reminderIdsJson);
      
      if (abandonedCartId) {
        await Notifications.cancelScheduledNotificationAsync(abandonedCartId);
      }
      if (extendedReminderId) {
        await Notifications.cancelScheduledNotificationAsync(extendedReminderId);
      }

      await AsyncStorage.removeItem('cart_reminder_ids');
      console.log('✅ Cart reminders cancelled');
    }
  } catch (error) {
    console.error('❌ Error cancelling cart reminders:', error);
  }
}

/**
 * Schedule purchase reminder notification
 * Called by backend system based on user's last purchase date and preferences
 */
export async function schedulePurchaseReminder(
  daysUntilReminder: number,
  message: string = 'We miss you! Check out our latest menu and special offers.'
) {
  try {
    console.log('🔔 Scheduling purchase reminder in', daysUntilReminder, 'days');

    if (Platform.OS === 'web') {
      console.log('⚠️ Web platform - skipping purchase reminder');
      return;
    }

    const triggerSeconds = daysUntilReminder * 24 * 60 * 60;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🍽️ Time to treat yourself!',
        body: message,
        data: { type: 'purchase_reminder' },
        sound: 'default',
        badge: 1,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
        ...(Platform.OS === 'android' && {
          color: '#FF6B35',
          channelId: 'cart-reminders',
        }),
      },
      trigger: {
        seconds: triggerSeconds,
      },
    });

    console.log('✅ Purchase reminder scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('❌ Error scheduling purchase reminder:', error);
    return null;
  }
}
