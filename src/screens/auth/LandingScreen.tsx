
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';

export default function LandingScreen() {
  const [loading, setLoading] = useState(false);

  return (
    <View style={styles.container}>
      {/* Background Gradients */}
      <LinearGradient
        colors={['#FF8C42', '#FFB574', '#FFE8D6', '#FFFFFF']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <LinearGradient
        colors={['rgba(255, 140, 66, 0.15)', 'transparent', 'rgba(255, 181, 116, 0.08)']}
        locations={[0, 0.5, 1]}
        style={styles.gradientOverlay}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Decorative Elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />
      <View style={styles.decorativeCircle4} />
      <View style={styles.decorativeCircle5} />

      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/images/77417a0d-d5f2-4d10-be09-c5caa4ff37f6.jpeg')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View style={styles.logoTextContainer}>
            <Text style={styles.logoText}>MaceyRunners</Text>
          </View>
          <View style={styles.guyanaContainer}>
            <Text style={styles.guyanaFlag}>🇬🇾</Text>
            <Text style={styles.logoSubtext}>Guyana</Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureText}>Fast Delivery</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={styles.featureText}>MMG Payment</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🏪</Text>
            <Text style={styles.featureText}>Local Stores</Text>
          </View>
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.loginButtonWrapper}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.8}
            disabled={loading}
          >
            <View style={styles.loginButton}>
              <Text style={styles.loginButtonText}>Login</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            onPress={() => router.push('/auth/register')}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Just Say It And We Will Deliver It!!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 140, 66, 0.1)',
    top: -50,
    left: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 181, 116, 0.15)',
    top: 100,
    right: -30,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 140, 66, 0.08)',
    bottom: 200,
    left: 30,
  },
  decorativeCircle4: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 181, 116, 0.12)',
    bottom: -40,
    right: -40,
  },
  decorativeCircle5: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 140, 66, 0.06)',
    top: '40%',
    right: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: theme.spacing.lg,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoTextContainer: {
    marginBottom: theme.spacing.xs,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF8C42',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 140, 66, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  guyanaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  guyanaFlag: {
    fontSize: 20,
  },
  logoSubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.md,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  featureText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  loginButtonWrapper: {
    width: '100%',
  },
  loginButton: {
    backgroundColor: '#FF8C42',
    paddingVertical: theme.spacing.md + 2,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  registerButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: theme.spacing.md + 2,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF8C42',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    color: '#FF8C42',
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
