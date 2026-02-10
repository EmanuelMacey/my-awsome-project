
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { theme, globalStyles } from '../../styles/theme';
import * as WebBrowser from 'expo-web-browser';
import { 
  isBiometricAvailable, 
  authenticateWithBiometrics, 
  getBiometricCredentials,
  saveBiometricCredentials,
  getBiometricType,
  isBiometricAuthEnabled
} from '../../utils/biometrics';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone' | 'otp'>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const { signIn, signInWithPhone, verifyOTP, sendPasswordResetEmail } = useAuth();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const available = await isBiometricAvailable();
    const enabled = await isBiometricAuthEnabled();
    const type = await getBiometricType();
    
    setBiometricAvailable(available);
    setBiometricEnabled(enabled);
    setBiometricType(type);
    
    console.log('Biometric available:', available, 'Type:', type, 'Enabled:', enabled);
  };

  const handleBiometricLogin = async () => {
    try {
      setLoading(true);
      
      // Check if biometric credentials are saved
      const credentials = await getBiometricCredentials();
      
      if (!credentials) {
        Alert.alert(
          'Biometric Login Not Set Up',
          'Please login with email and password first to enable biometric login.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Authenticate with biometrics
      const authenticated = await authenticateWithBiometrics();
      
      if (!authenticated) {
        Alert.alert('Authentication Failed', 'Biometric authentication was not successful.');
        return;
      }

      // Use saved credentials to sign in
      const result = await signIn(credentials.email, credentials.encryptedPassword);
      
      if (result.error) {
        console.error('Biometric login error:', result.error);
        Alert.alert('Login Failed', result.error);
      } else {
        console.log('Biometric login successful');
      }
    } catch (error: any) {
      console.error('Biometric login exception:', error);
      Alert.alert('Error', error.message || 'Failed to login with biometrics');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(email, password);
      
      if (result.error) {
        console.error('Login error:', result.error);
        Alert.alert('Login Failed', result.error);
      } else {
        console.log('Login successful');
        
        // Offer to save credentials for biometric login
        if (biometricAvailable && !biometricEnabled) {
          Alert.alert(
            `Enable ${biometricType} Login?`,
            `Would you like to use ${biometricType} to login next time?`,
            [
              { text: 'Not Now', style: 'cancel' },
              {
                text: 'Enable',
                onPress: async () => {
                  const saved = await saveBiometricCredentials(email, password);
                  if (saved) {
                    Alert.alert('Success', `${biometricType} login has been enabled!`);
                  }
                },
              },
            ]
          );
        }
      }
    } catch (error: any) {
      console.error('Login exception:', error);
      Alert.alert('Error', error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!phone.startsWith('+')) {
      Alert.alert('Error', 'Phone number must include country code (e.g., +592...)');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPhone(phone);
      
      if (result.error) {
        console.error('Phone login error:', result.error);
        Alert.alert('Login Failed', result.error);
      } else {
        setOtpSent(true);
        Alert.alert('OTP Sent', 'Please check your phone for the verification code');
      }
    } catch (error: any) {
      console.error('Phone login exception:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!phone || !otpCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(phone, otpCode);
      
      if (result.error) {
        console.error('OTP verification error:', result.error);
        Alert.alert('Verification Failed', result.error);
      } else {
        console.log('OTP verification successful');
        // Navigation is handled in AuthContext
      }
    } catch (error: any) {
      console.error('OTP verification exception:', error);
      Alert.alert('Error', error.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.prompt(
      '🔐 Reset Your Password',
      'Enter your email address to receive a password reset link.\n\n📧 We\'ll send you a magic link to reset your password.\n\n⚠️ Check your spam/junk folder if you don\'t see it in your inbox.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reset Link',
          onPress: async (emailInput) => {
            if (!emailInput || !emailInput.trim()) {
              Alert.alert('Error', 'Please enter your email address');
              return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.trim())) {
              Alert.alert('Invalid Email', 'Please enter a valid email address (e.g., yourname@example.com)');
              return;
            }

            setLoading(true);
            try {
              const result = await sendPasswordResetEmail(emailInput.trim());
              
              if (result.error) {
                let errorMessage = result.error;
                if (result.error.includes('not found')) {
                  errorMessage = 'No account found with this email address. Please check the email or register for a new account.';
                }
                Alert.alert('Error', errorMessage);
              } else {
                Alert.alert(
                  '✅ Reset Link Sent!',
                  `A password reset link has been sent to:\n${emailInput.trim()}\n\n📧 NEXT STEPS:\n1. Check your email inbox (and spam/junk folder)\n2. Click the reset link in the email\n3. Enter your new password\n4. Login with your new password\n\n⏱️ The link expires in 1 hour.\n\nDidn\'t receive it? Check spam folder or try again in a few minutes.`,
                  [{ text: 'OK' }]
                );
              }
            } catch (error: any) {
              Alert.alert(
                'Error', 
                error.message || 'Failed to send reset email. Please check your internet connection and try again.\n\nNeed help? Contact us:\nEmail: errandrunners592@gmail.com\nPhone: 592-721-9769'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      'plain-text',
      email
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Login to your account</Text>

      {/* Biometric Login Button */}
      {biometricAvailable && biometricEnabled && (
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={handleBiometricLogin}
          disabled={loading}
        >
          <Text style={styles.biometricIcon}>
            {biometricType.includes('Face') ? '👤' : '👆'}
          </Text>
          <Text style={styles.biometricButtonText}>
            Login with {biometricType}
          </Text>
        </TouchableOpacity>
      )}

      {/* Login Method Selector */}
      <View style={styles.methodSelector}>
        <TouchableOpacity
          style={[styles.methodButton, loginMethod === 'email' && styles.methodButtonActive]}
          onPress={() => {
            setLoginMethod('email');
            setOtpSent(false);
          }}
          disabled={loading}
        >
          <Text style={[styles.methodButtonText, loginMethod === 'email' && styles.methodButtonTextActive]}>
            Email
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodButton, loginMethod === 'phone' && styles.methodButtonActive]}
          onPress={() => {
            setLoginMethod('phone');
            setOtpSent(false);
          }}
          disabled={loading}
        >
          <Text style={[styles.methodButtonText, loginMethod === 'phone' && styles.methodButtonTextActive]}>
            Phone
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        {loginMethod === 'email' && (
          <>
            <Text style={styles.label}>Email</Text>
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

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleEmailLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </>
        )}

        {loginMethod === 'phone' && !otpSent && (
          <>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number (e.g., +5921234567)"
              placeholderTextColor={theme.colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handlePhoneLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Send Verification Code</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {loginMethod === 'phone' && otpSent && (
          <>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit code"
              placeholderTextColor={theme.colors.textSecondary}
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePhoneLogin} disabled={loading}>
              <Text style={styles.linkText}>Resend Code</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => router.push('/auth/register')} disabled={loading}>
          <Text style={styles.linkText}>Don&apos;t have an account? Register</Text>
        </TouchableOpacity>
        
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>Need help?</Text>
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
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  biometricIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  biometricButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  methodSelector: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  methodButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  methodButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  methodButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  methodButtonTextActive: {
    color: '#FFFFFF',
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
  forgotPasswordText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
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
