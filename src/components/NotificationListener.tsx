
import React, { useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Platform } from 'react-native';

export function NotificationListener() {
  const { user } = useAuth();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const showNotificationPopup = useCallback((title: string, body: string) => {
    if (Platform.OS === 'web') {
      // For web, show a simple alert
      console.log('📬 Notification:', title, body);
    } else {
      // For native, the notification will be shown by the system
      console.log('📬 Notification:', title, body);
    }
  }, []);

  const handleNotificationTap = useCallback((notification: Notifications.Notification) => {
    const data = notification.request.content.data;
    console.log('👆 Notification tapped:', data);

    if (data.type === 'cart_reminder') {
      // Navigate to cart screen
      console.log('🛒 Navigating to cart from notification');
      router.push('/customer/cart');
    } else if (data.type === 'order_status' && data.orderId) {
      // Navigate to order detail screen
      console.log('📦 Navigating to order detail:', data.orderId);
      router.push(`/customer/order/${data.orderId}`);
    } else if (data.type === 'new_order' && data.orderId) {
      // Navigate to driver order detail screen
      console.log('🚗 Navigating to driver order detail:', data.orderId);
      router.push(`/driver/order/${data.orderId}`);
    } else if (data.type === 'chat_message' && data.orderId) {
      // Navigate to chat screen
      console.log('💬 Navigating to chat:', data.orderId);
      router.push(`/chat/${data.orderId}`);
    } else if (data.type === 'errand_status' && data.errandId) {
      // Navigate to errand detail screen
      console.log('🏃 Navigating to errand detail:', data.errandId);
      router.push(`/errands/detail/${data.errandId}`);
    } else if (data.type === 'new_invoice' && data.invoiceId) {
      // Navigate to invoice detail screen
      console.log('📄 Navigating to invoice detail:', data.invoiceId);
      router.push(`/customer/invoice/${data.invoiceId}`);
    }
  }, []);

  useEffect(() => {
    console.log('🔔 Setting up notification listeners');

    // Listen for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received in foreground:', notification);
      const { title, body } = notification.request.content;
      showNotificationPopup(title || 'Notification', body || '');
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification response received:', response);
      handleNotificationTap(response.notification);
    });

    // Check for notification that opened the app (ONLY on native platforms)
    if (Platform.OS !== 'web') {
      Notifications.getLastNotificationResponseAsync().then(response => {
        if (response) {
          console.log('📱 App opened from notification:', response);
          handleNotificationTap(response.notification);
        }
      });
    }

    return () => {
      console.log('🔕 Removing notification listeners');
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user, showNotificationPopup, handleNotificationTap]);

  return null;
}
