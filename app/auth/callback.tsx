
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/config/supabase';
import { theme } from '../../src/styles/theme';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    console.log('Auth callback params:', params);
    
    const handleCallback = async () => {
      try {
        // The session should be automatically set by Supabase
        // Just wait a moment and check the session
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          router.replace('/auth/login');
          return;
        }
        
        if (session) {
          console.log('Session found, redirecting to home');
          router.replace('/(tabs)/(home)');
        } else {
          console.log('No session found, redirecting to login');
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.replace('/auth/login');
      }
    };

    handleCallback();
  }, [params, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
});
