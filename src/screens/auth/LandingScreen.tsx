
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';

export default function LandingScreen() {
  return (
    <View style={styles.container}>
      {/* Enhanced Multi-layer Gradient Background - Same as HomeScreen */}
      <LinearGradient
        colors={['#FF8C42', '#FFB574', '#FFE8D6', '#FFFFFF']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Secondary gradient overlay for depth */}
      <LinearGradient
        colors={['rgba(255, 140, 66, 0.15)', 'transparent', 'rgba(255, 181, 116, 0.08)']}
        locations={[0, 0.5, 1]}
        style={styles.gradientOverlay}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Large decorative circles - positioned for visual impact */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />
      <View style={styles.decorativeCircle4} />
      <View style={styles.decorativeCircle5} />

      <View style={styles.content}>
        {/* Logo/Icon */}
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

        {/* Tagline */}
        <View style={styles.taglineContainer}>
          <Text style={styles.tagline}></Text>
          <Text style={styles.tagline}></Text>
          <Text style={styles.subtitle}>
           
          </Text>
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

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.loginButtonWrapper}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.8}
          >
            <View style={styles.loginButton}>
              <Text style={styles.loginButtonText}>Login</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/auth/register')}
            activeOpacity={0.8}
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

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    ...(isWeb && {
      maxWidth: 800,
      marginHorizontal: 'auto',
      width: '100%',
    }),
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 0,
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 100,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 140, 66, 0.12)',
    zIndex: 0,
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 320,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 181, 116, 0.15)',
    zIndex: 0,
  },
  decorativeCircle4: {
    position: 'absolute',
    top: 200,
    right: 40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 0,
  },
  decorativeCircle5: {
    position: 'absolute',
    bottom: 100,
    left: 30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 140, 66, 0.08)',
    zIndex: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.md,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoTextContainer: {
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  logoText: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.extrabold,
    color: '#111827',
    marginBottom: theme.spacing.xs,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  guyanaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  guyanaFlag: {
    fontSize: 28,
  },
  logoSubtext: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: '#111827',
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  tagline: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: '#111827',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 24,
    fontWeight: '500',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: theme.spacing.xxl,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.15)',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  featureText: {
    fontSize: theme.fontSize.sm,
    color: '#111827',
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    gap: theme.spacing.md,
  },
  loginButtonWrapper: {
    width: '100%',
    borderRadius: theme.borderRadius.md,
  },
  loginButton: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: '#FF8C42',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  registerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF8C42',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    color: '#FF8C42',
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  footer: {
    fontSize: theme.fontSize.sm,
    color: '#6B7280',
    marginTop: theme.spacing.xl,
    textAlign: 'center',
    fontWeight: '500',
  },
});
