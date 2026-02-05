
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '../src/contexts/AuthContext';
import { CartProvider } from '../src/contexts/CartContext';
import { NotificationListener } from '../src/components/NotificationListener';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <CartProvider>
          <NotificationListener />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="auth/landing" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/register" options={{ headerShown: false }} />
            <Stack.Screen name="auth/reset-password" options={{ headerShown: false }} />
            <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
            <Stack.Screen name="email-confirmed" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="customer/home" options={{ headerShown: false }} />
            <Stack.Screen name="customer/cart" options={{ headerShown: false }} />
            <Stack.Screen name="customer/orders" options={{ headerShown: false }} />
            <Stack.Screen name="customer/order/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="customer/store/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="customer/profile" options={{ headerShown: false }} />
            <Stack.Screen name="customer/addresses" options={{ headerShown: false }} />
            <Stack.Screen name="customer/invoices" options={{ headerShown: false }} />
            <Stack.Screen name="customer/invoice/[invoiceId]" options={{ headerShown: false }} />
            <Stack.Screen name="driver/dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="driver/order/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="driver/profile" options={{ headerShown: false }} />
            <Stack.Screen name="admin/dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="admin/store-management" options={{ headerShown: false }} />
            <Stack.Screen name="admin/user-management" options={{ headerShown: false }} />
            <Stack.Screen name="admin/invoices" options={{ headerShown: false }} />
            <Stack.Screen name="errands/home" options={{ headerShown: false }} />
            <Stack.Screen name="errands/category/[categoryId]" options={{ headerShown: false }} />
            <Stack.Screen name="errands/create" options={{ headerShown: false }} />
            <Stack.Screen name="errands/my-errands" options={{ headerShown: false }} />
            <Stack.Screen name="errands/detail/[errandId]" options={{ headerShown: false }} />
            <Stack.Screen name="chat/[orderId]" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="notification-test" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
