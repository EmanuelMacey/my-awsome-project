
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { theme, globalStyles } from '../../styles/theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'driver'>('customer');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    // Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert(
        'Missing Information', 
        'Please fill in all fields:\n\n• Full Name (required)\n• Email (required)\n• Phone Number with country code (e.g., +5927219769)\n• Password (min 6 characters)\n• Confirm Password\n\nNeed help? Contact us:\nEmail: errandrunners592@gmail.com\nPhone: 592-721-9769'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match. Please make sure both password fields are identical.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long for security.');
      return;
    }

    if (!phone.startsWith('+')) {
      Alert.alert(
        'Invalid Phone Number', 
        'Phone number must include country code.\n\nExample: +5927219769\n\nFormat:\n+592 = Guyana country code\n721-9769 = Your phone number\n\nNeed help? Contact us:\nEmail: errandrunners592@gmail.com\nPhone: 592-721-9769'
      );
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, name, phone, role);
      
      if (result.error) {
        console.error('Registration error:', result.error);
        
        // Provide more helpful error messages
        let errorMessage = result.error;
        if (result.error.includes('already registered')) {
          errorMessage = 'This email is already registered. Please use the "Forgot Password" option on the login screen to reset your password, or try logging in.';
        } else if (result.error.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address (e.g., yourname@example.com)';
        }
        
        Alert.alert('Registration Failed', errorMessage);
      } else if (result.needsVerification) {
        Alert.alert(
          '✅ Account Created - Verify Your Email',
          'Success! Your account has been created.\n\n📧 NEXT STEP:\nCheck your email inbox (and spam/junk folder) for a verification link from ErrandRunners.\n\n🔗 Click the verification link in the email to activate your account.\n\n⏱️ The link expires in 24 hours.\n\nAfter verifying, you can login and start using the app!',
          [
            {
              text: 'OK, I\'ll Check My Email',
              onPress: () => router.replace('/auth/login'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Success!',
          `Welcome to ErrandRunners, ${name}! ${role === 'driver' ? '\n\n🚗 Your driver account will be reviewed for approval. You\'ll receive a notification once approved.' : '\n\n🛒 You can now start browsing stores and placing orders!'}`,
          [
            {
              text: 'Get Started',
              onPress: () => {
                // Navigation is handled in AuthContext
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Registration exception:', error);
      Alert.alert(
        'Registration Error', 
        error.message || 'Failed to register. Please check your internet connection and try again.\n\nIf the problem persists, contact us:\nEmail: errandrunners592@gmail.com\nPhone: 592-721-9769'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor={theme.colors.textSecondary}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!loading}
        />

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor={theme.colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone (e.g., +5927219769)"
          placeholderTextColor={theme.colors.textSecondary}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!loading}
        />

        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password (min 6 characters)"
          placeholderTextColor={theme.colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          placeholderTextColor={theme.colors.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
        />

        <Text style={styles.label}>I want to register as:</Text>
        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'customer' && styles.roleButtonActive]}
            onPress={() => setRole('customer')}
            disabled={loading}
          >
            <Text style={[styles.roleButtonText, role === 'customer' && styles.roleButtonTextActive]}>
              🛒 Customer
            </Text>
            <Text style={[styles.roleButtonSubtext, role === 'customer' && styles.roleButtonSubtextActive]}>
              Order food & errands
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'driver' && styles.roleButtonActive]}
            onPress={() => setRole('driver')}
            disabled={loading}
          >
            <Text style={[styles.roleButtonText, role === 'driver' && styles.roleButtonTextActive]}>
              🚗 Driver
            </Text>
            <Text style={[styles.roleButtonSubtext, role === 'driver' && styles.roleButtonSubtextActive]}>
              Deliver orders
            </Text>
          </TouchableOpacity>
        </View>

        {role === 'driver' && (
          <View style={styles.driverNotice}>
            <Text style={styles.driverNoticeText}>
              ⚠️ Driver accounts require approval. You&apos;ll be notified once your account is reviewed.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/login')} disabled={loading}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>

        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>Need help signing up?</Text>
          <Text style={styles.helpContact}>Email: errandrunners592@gmail.com</Text>
          <Text style={styles.helpContact}>Phone: 592-721-9769</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingTop: 60,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    ...globalStyles.input,
    marginBottom: theme.spacing.md,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  roleButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  roleButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  roleButtonSubtext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  roleButtonSubtextActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  driverNotice: {
    backgroundColor: theme.colors.warning + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  driverNoticeText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    textAlign: 'center',
  },
  button: {
    ...globalStyles.button,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  buttonText: {
    ...globalStyles.buttonText,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  linkText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  helpContainer: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  helpText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  helpContact: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});
