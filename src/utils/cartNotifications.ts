
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CART_REMINDER_KEY = 'cart_reminder_scheduled';
const CART_TIMESTAMP_KEY = 'cart_last_updated';

/**
 * Schedule cart reminder notifications (5 times a day)
 * Reminds customers if they have items in cart but haven't confirmed order
 */
export async function scheduleCartReminders(cartItemCount: number) {
  try {
    console.log('📅 Scheduling cart reminders for', cartItemCount, 'items');

    // Cancel any existing cart reminders
    await cancelCartReminders();

    if (cartItemCount === 0) {
      console.log('⏭️ No items in cart, skipping reminders');
      return;
    }

    // Store the timestamp when cart was last updated
    await AsyncStorage.setItem(CART_TIMESTAMP_KEY, Date.now().toString());

    // Schedule 5 notifications throughout the day
    const reminderTimes = [
      { hours: 2, message: 'You have items waiting in your cart! 🛒' },
      { hours: 4, message: 'Don\'t forget your cart! Complete your order now 🍔' },
      { hours: 8, message: 'Your cart is still waiting! Order now and get it delivered 🚚' },
      { hours: 12, message: 'Still thinking about it? Your cart items are ready to order! 🎯' },
      { hours: 24, message: 'Last reminder! Your cart expires soon. Order now! ⏰' },
    ];

    const scheduledIds: string[] = [];

    for (const reminder of reminderTimes) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Complete Your Order',
          body: reminder.message,
          data: { 
            type: 'cart_reminder',
            cartItemCount,
            scheduledHours: reminder.hours,
          },
          sound: 'default',
          badge: cartItemCount,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          ...(Platform.OS === 'android' && {
            color: '#FF8C42',
            channelId: 'cart-reminders',
          }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: reminder.hours * 60 * 60, // Convert hours to seconds
        },
      });

      scheduledIds.push(notificationId);
      console.log(`✅ Scheduled cart reminder for ${reminder.hours} hours: ${notificationId}`);
    }

    // Store the scheduled notification IDs
    await AsyncStorage.setItem(CART_REMINDER_KEY, JSON.stringify(scheduledIds));
    console.log('✅ All cart reminders scheduled successfully');
  } catch (error) {
    console.error('❌ Error scheduling cart reminders:', error);
  }
}

/**
 * Cancel all scheduled cart reminder notifications
 */
export async function cancelCartReminders() {
  try {
    console.log('🗑️ Cancelling cart reminders');

    const scheduledIdsJson = await AsyncStorage.getItem(CART_REMINDER_KEY);
    if (scheduledIdsJson) {
      const scheduledIds: string[] = JSON.parse(scheduledIdsJson);
      
      for (const id of scheduledIds) {
        await Notifications.cancelScheduledNotificationAsync(id);
        console.log(`✅ Cancelled notification: ${id}`);
      }

      await AsyncStorage.removeItem(CART_REMINDER_KEY);
      await AsyncStorage.removeItem(CART_TIMESTAMP_KEY);
      console.log('✅ All cart reminders cancelled');
    } else {
      console.log('ℹ️ No cart reminders to cancel');
    }
  } catch (error) {
    console.error('❌ Error cancelling cart reminders:', error);
  }
}

/**
 * Check if cart reminders are currently scheduled
 */
export async function areCartRemindersScheduled(): Promise<boolean> {
  try {
    const scheduledIdsJson = await AsyncStorage.getItem(CART_REMINDER_KEY);
    return scheduledIdsJson !== null;
  } catch (error) {
    console.error('❌ Error checking cart reminders:', error);
    return false;
  }
}

/**
 * Get the time when cart was last updated
 */
export async function getCartLastUpdated(): Promise<Date | null> {
  try {
    const timestamp = await AsyncStorage.getItem(CART_TIMESTAMP_KEY);
    if (timestamp) {
      return new Date(parseInt(timestamp, 10));
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting cart timestamp:', error);
    return null;
  }
}

/**
 * Setup Android notification channel for cart reminders
 */
export async function setupCartNotificationChannel() {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('cart-reminders', {
        name: 'Cart Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF8C42',
        sound: 'default',
        showBadge: true,
        enableLights: true,
        enableVibrate: true,
        description: 'Reminders about items in your cart',
      });
      console.log('✅ Cart reminder notification channel created');
    } catch (error) {
      console.error('❌ Error creating cart notification channel:', error);
    }
  }
}
