
import { Redirect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { useEffect } from 'react';

export default function TabsProfileScreenIOS() {
  const { session, user, loading } = useAuth();

  useEffect(() => {
    console.log('📍 Tabs Profile iOS - Session:', !!session, 'User:', user?.email, 'Role:', user?.role, 'Loading:', loading);
  }, [session, user, loading]);

  if (loading) {
    console.log('⏳ Loading auth state in tabs profile iOS...');
    return <LoadingSpinner />;
  }

  // If no session, redirect to landing page
  if (!session) {
    console.log('🔓 No session in tabs profile iOS - redirecting to landing page');
    return <Redirect href="/auth/landing" />;
  }

  // Redirect based on role
  if (user?.role === 'customer') {
    console.log('🛒 Customer user in tabs profile iOS - redirecting to customer profile');
    return <Redirect href="/customer/profile" />;
  }

  if (user?.role === 'driver') {
    console.log('🚗 Driver user in tabs profile iOS - redirecting to driver profile');
    return <Redirect href="/driver/profile" />;
  }

  if (user?.email === 'admin@errandrunners.gy' || user?.role === 'admin') {
    console.log('👑 Admin user in tabs profile iOS - redirecting to admin dashboard');
    return <Redirect href="/admin/dashboard" />;
  }

  // Default fallback - redirect to landing
  console.log('⚠️ Unknown role in tabs profile iOS - redirecting to landing page');
  return <Redirect href="/auth/landing" />;
}
