
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../src/styles/theme';

export default function EmailConfirmedScreen() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    // Give a moment for the auth state to update
    const timer = setTimeout(() => {
      setStatus('success');
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.replace('/auth/login');
      }, 2000);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {status === 'loading' && (
        <>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.title}>Confirming your email...</Text>
        </>
      )}
      {status === 'success' && (
        <>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.title}>Email Confirmed!</Text>
          <Text style={styles.subtitle}>Redirecting to login...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  successIcon: {
    fontSize: 64,
    color: theme.colors.success,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});
