
import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Redirect based on auth state
  if (!user) {
    return <Redirect href="/auth/landing" />;
  }

  // Redirect based on role
  if (user.role === 'admin') {
    return <Redirect href="/admin/dashboard" />;
  } else if (user.role === 'driver') {
    return <Redirect href="/driver/dashboard" />;
  } else {
    return <Redirect href="/customer/home" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
