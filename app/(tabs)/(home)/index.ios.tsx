
import { Redirect } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { LoadingSpinner } from '../../../src/components/LoadingSpinner';
import { useEffect } from 'react';

export default function TabsHomeScreenIOS() {
  const { session, user, loading } = useAuth();

  useEffect(() => {
    console.log('📍 Tabs Home iOS - Session:', !!session, 'User:', user?.email, 'Role:', user?.role, 'Loading:', loading);
  }, [session, user, loading]);

  if (loading) {
    console.log('⏳ Loading auth state in tabs home iOS...');
    return <LoadingSpinner />;
  }

  // If no session, redirect to landing page
  if (!session) {
    console.log('🔓 No session in tabs iOS - redirecting to landing page');
    return <Redirect href="/auth/landing" />;
  }

  // Check for admin user
  if (user?.email === 'admin@errandrunners.gy' || user?.role === 'admin') {
    console.log('👑 Admin user in tabs iOS - redirecting to admin dashboard');
    return <Redirect href="/admin/dashboard" />;
  }

  // Redirect based on role
  if (user?.role === 'customer') {
    console.log('🛒 Customer user in tabs iOS - redirecting to customer home');
    return <Redirect href="/customer/home" />;
  }

  if (user?.role === 'driver') {
    console.log('🚗 Driver user in tabs iOS - redirecting to driver dashboard');
    return <Redirect href="/driver/dashboard" />;
  }

  // Default fallback - redirect to landing
  console.log('⚠️ Unknown role in tabs iOS - redirecting to landing page');
  return <Redirect href="/auth/landing" />;
}
