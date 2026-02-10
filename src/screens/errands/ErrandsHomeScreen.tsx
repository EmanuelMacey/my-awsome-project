
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Linking, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { ErrandCategory } from '../../types/errand.types';
import { getErrandCategories } from '../../api/errands';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { theme } from '../../styles/theme';

export default function ErrandsHomeScreen() {
  const [categories, setCategories] = useState<ErrandCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setError(null);
      console.log('Fetching errand categories...');
      const data = await getErrandCategories();
      console.log('Errand categories fetched:', data.length);
      setCategories(data);
    } catch (err: any) {
      console.error('Error fetching errand categories:', err);
      setError(err.message || 'Failed to load errand categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const handleContactSupport = () => {
    const phoneNumber = '592-7219769';
    const message = 'Hello, I need help with errands on ErrandRunners.';
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // Fallback to web WhatsApp
          const webWhatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
          return Linking.openURL(webWhatsappUrl);
        }
      })
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        Alert.alert('Error', 'Could not open WhatsApp. Please contact us at 592-7219769');
      });
  };

  if (loading) {
    return <LoadingSpinner message="Loading errands..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchCategories} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Errand Services</Text>
        <Text style={styles.subtitle}>
          We'll handle your errands so you don't have to
        </Text>
      </View>

      {/* Featured Services - Supermarket & Pharmacy */}
      <View style={styles.featuredSection}>
        <Text style={styles.sectionTitle}>Most Popular</Text>
        
        <TouchableOpacity
          style={styles.featuredCardLarge}
          onPress={() => {
            // Find Shopping Errands category
            const shoppingCategory = categories.find(c => c.name.includes('Shopping'));
            if (shoppingCategory) {
              router.push(`/errands/category/${shoppingCategory.id}`);
            } else {
              router.push('/errands/home');
            }
          }}
        >
          <View style={styles.featuredCardHeader}>
            <View style={styles.featuredIconContainerLarge}>
              <Text style={styles.featuredIconLarge}>🛍️</Text>
            </View>
            <View style={styles.featuredCardHeaderText}>
              <Text style={styles.featuredTitleLarge}>Supermarket Shopping</Text>
              <Text style={styles.featuredDescriptionLarge}>
                We'll shop for you at any supermarket
              </Text>
            </View>
          </View>
          <View style={styles.featuredCardBody}>
            <Text style={styles.featuredStores}>
              📍 Massy Stores • Bounty • DSL • Survival • Nigel's • Chow's • Little Asia & more
            </Text>
            <View style={styles.featuredCardFooter}>
              <View style={styles.priceTagLarge}>
                <Text style={styles.priceTextLarge}>Fixed Rate: GYD$2000</Text>
              </View>
              <Text style={styles.arrowLarge}>→</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featuredCardLarge}
          onPress={() => {
            // Find Medical Errands category
            const medicalCategory = categories.find(c => c.name.includes('Medical'));
            if (medicalCategory) {
              router.push(`/errands/category/${medicalCategory.id}`);
            } else {
              router.push('/errands/home');
            }
          }}
        >
          <View style={styles.featuredCardHeader}>
            <View style={styles.featuredIconContainerLarge}>
              <Text style={styles.featuredIconLarge}>💊</Text>
            </View>
            <View style={styles.featuredCardHeaderText}>
              <Text style={styles.featuredTitleLarge}>Pharmacy Errands</Text>
              <Text style={styles.featuredDescriptionLarge}>
                Pick up prescriptions & pharmacy items
              </Text>
            </View>
          </View>
          <View style={styles.featuredCardBody}>
            <Text style={styles.featuredStores}>
              📍 Mike's Pharmacy • Medicine Chest • Smart Aid 24hr • Dave's • Essential Care & more
            </Text>
            <View style={styles.featuredCardFooter}>
              <View style={styles.priceTagLarge}>
                <Text style={styles.priceTextLarge}>Fixed Rate: GYD$2000</Text>
              </View>
              <Text style={styles.arrowLarge}>→</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/errands/my-errands')}
        >
          <Text style={styles.quickActionIcon}>📋</Text>
          <Text style={styles.quickActionText}>My Errands</Text>
        </TouchableOpacity>
      </View>

      {/* All Categories Grid */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>All Errand Categories</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => router.push(`/errands/category/${category.id}`)}
            >
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>{category.icon || '📦'}</Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription} numberOfLines={2}>
                {category.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsList}>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Choose Your Errand</Text>
              <Text style={styles.stepDescription}>
                Select from shopping, pharmacy, government, or custom errands
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Provide Details</Text>
              <Text style={styles.stepDescription}>
                Add pickup/drop-off locations, instructions, and upload documents
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Runner Assigned</Text>
              <Text style={styles.stepDescription}>
                A verified runner accepts and completes your errand
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Track & Receive</Text>
              <Text style={styles.stepDescription}>
                Track in real-time and receive updates at every step
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Pricing Info */}
      <View style={styles.pricingSection}>
        <Text style={styles.sectionTitle}>Simple Pricing</Text>
        <View style={styles.pricingCard}>
          <Text style={styles.pricingTitle}>Fixed Rate</Text>
          <Text style={styles.pricingAmount}>GYD$2000</Text>
          <Text style={styles.pricingDescription}>
            All errands have a flat rate of GYD$2000. No hidden fees, no surprises.
          </Text>
        </View>
      </View>

      {/* Customer Support Section */}
      <View style={styles.supportSection}>
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactText}>
            If you have any inquiries or difficulties with errands, please contact management:
          </Text>
          <TouchableOpacity style={styles.whatsappButton} onPress={handleContactSupport}>
            <Text style={styles.whatsappIcon}>💬</Text>
            <Text style={styles.whatsappText}>WhatsApp: 592-7219769</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    ...(isWeb && {
      maxWidth: 800,
      marginHorizontal: 'auto',
      width: '100%',
    }),
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    padding: theme.spacing.lg,
    paddingTop: 60,
    backgroundColor: theme.colors.primary,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  featuredSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  featuredCardLarge: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  featuredCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  featuredIconContainerLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredIconLarge: {
    fontSize: 36,
  },
  featuredCardHeaderText: {
    flex: 1,
  },
  featuredTitleLarge: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  featuredDescriptionLarge: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  featuredCardBody: {
    gap: theme.spacing.sm,
  },
  featuredStores: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  featuredCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceTagLarge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  priceTextLarge: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  arrowLarge: {
    fontSize: 32,
    color: theme.colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  quickActionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  categoriesSection: {
    padding: theme.spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  categoryDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  howItWorksSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.md,
  },
  stepsList: {
    gap: theme.spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  stepDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  pricingSection: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  pricingCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  pricingTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  pricingAmount: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  pricingDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  supportSection: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  contactCard: {
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  contactTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  contactText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  whatsappIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  whatsappText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: '#FFFFFF',
  },
});
