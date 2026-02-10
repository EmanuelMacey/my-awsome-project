
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Schedule a local notification for a future time
 * This is used for abandoned cart reminders and other time-based notifications
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  triggerSeconds: number,
  data?: any
): Promise<string | null> {
  try {
    console.log('📅 Scheduling notification:', { title, body, triggerSeconds, data });

    // Web doesn't support scheduled notifications well, so we skip
    if (Platform.OS === 'web') {
      console.log('⚠️ Web platform - skipping scheduled notification');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
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
      trigger: {
        seconds: triggerSeconds,
      },
    });

    console.log('✅ Notification scheduled with ID:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  try {
    console.log('🚫 Cancelling notification:', notificationId);
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('✅ Notification cancelled');
  } catch (error) {
    console.error('❌ Error cancelling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    console.log('🚫 Cancelling all scheduled notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ All notifications cancelled');
  } catch (error) {
    console.error('❌ Error cancelling all notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📋 Scheduled notifications:', notifications.length);
    return notifications;
  } catch (error) {
    console.error('❌ Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Schedule abandoned cart reminder
 * Reminds user after 1 hour if they have items in cart but haven't checked out
 */
export async function scheduleAbandonedCartReminder(cartItemCount: number): Promise<void> {
  try {
    console.log('🛒 Scheduling abandoned cart reminder for', cartItemCount, 'items');

    // Cancel any existing abandoned cart reminders
    const existingReminderId = await AsyncStorage.getItem('abandoned_cart_reminder_id');
    if (existingReminderId) {
      await cancelScheduledNotification(existingReminderId);
    }

    // Schedule new reminder for 1 hour from now
    const notificationId = await scheduleLocalNotification(
      '🛒 Items waiting in your cart!',
      `You have ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'items'} waiting. Complete your order now!`,
      3600, // 1 hour
      { type: 'abandoned_cart' }
    );

    if (notificationId) {
      await AsyncStorage.setItem('abandoned_cart_reminder_id', notificationId);
      console.log('✅ Abandoned cart reminder scheduled');
    }
  } catch (error) {
    console.error('❌ Error scheduling abandoned cart reminder:', error);
  }
}

/**
 * Cancel abandoned cart reminder (called when user completes checkout)
 */
export async function cancelAbandonedCartReminder(): Promise<void> {
  try {
    const reminderId = await AsyncStorage.getItem('abandoned_cart_reminder_id');
    if (reminderId) {
      await cancelScheduledNotification(reminderId);
      await AsyncStorage.removeItem('abandoned_cart_reminder_id');
      console.log('✅ Abandoned cart reminder cancelled');
    }
  } catch (error) {
    console.error('❌ Error cancelling abandoned cart reminder:', error);
  }
}

/**
 * Schedule purchase reminder based on user preferences
 * This is called by the backend notification system
 */
export async function schedulePurchaseReminder(
  frequency: 'daily' | 'every_3_days' | 'weekly',
  lastPurchaseDate: Date
): Promise<void> {
  try {
    console.log('🔔 Scheduling purchase reminder with frequency:', frequency);

    const now = new Date();
    const daysSinceLastPurchase = Math.floor((now.getTime() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24));

    let shouldSchedule = false;
    let triggerSeconds = 0;

    if (frequency === 'daily' && daysSinceLastPurchase >= 1) {
      shouldSchedule = true;
      triggerSeconds = 60 * 60; // 1 hour from now
    } else if (frequency === 'every_3_days' && daysSinceLastPurchase >= 3) {
      shouldSchedule = true;
      triggerSeconds = 60 * 60; // 1 hour from now
    } else if (frequency === 'weekly' && daysSinceLastPurchase >= 7) {
      shouldSchedule = true;
      triggerSeconds = 60 * 60; // 1 hour from now
    }

    if (shouldSchedule) {
      await scheduleLocalNotification(
        '🍔 Hungry? We miss you!',
        'Check out our latest menu items and special offers. Order now!',
        triggerSeconds,
        { type: 'purchase_reminder' }
      );
      console.log('✅ Purchase reminder scheduled');
    } else {
      console.log('ℹ️ Not time for purchase reminder yet');
    }
  } catch (error) {
    console.error('❌ Error scheduling purchase reminder:', error);
  }
}
