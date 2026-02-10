
import { ErrandCategory, ErrandSubcategory } from '../../types/errand.types';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Platform } from 'react-native';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { router, useLocalSearchParams } from 'expo-router';
import { ErrorMessage } from '../../components/ErrorMessage';
import { supabase } from '../../config/supabase';
import React, { useEffect, useState, useCallback } from 'react';
import { getErrandCategories, getErrandSubcategories } from '../../api/errands';

export default function ErrandCategoryScreen() {
  const params = useLocalSearchParams();
  const categoryId = params.categoryId as string;
  const { user } = useAuth();

  const [category, setCategory] = useState<ErrandCategory | null>(null);
  const [subcategories, setSubcategories] = useState<ErrandSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      console.log('Fetching category and subcategories for:', categoryId);

      // Fetch category
      const categories = await getErrandCategories();
      const foundCategory = categories.find(c => c.id === categoryId);
      if (!foundCategory) {
        throw new Error('Category not found');
      }
      setCategory(foundCategory);

      // Fetch subcategories
      const subcategoriesData = await getErrandSubcategories(categoryId);
      console.log('Subcategories fetched:', subcategoriesData.length);
      setSubcategories(subcategoriesData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load errand details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSubcategorySelect = (subcategoryId: string, subcategoryName: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to create an errand.');
      router.push('/auth/login');
      return;
    }

    // Navigate to CreateErrandScreen with categoryId and subcategoryId
    router.push({
      pathname: '/errands/create',
      params: {
        categoryId: categoryId,
        subcategoryId: subcategoryId,
      },
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading services..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  if (!category) {
    return <ErrorMessage message="Category not found" onRetry={fetchData} />;
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
        <Text style={styles.categoryIcon}>{category.icon || '📦'}</Text>
        <Text style={styles.title}>{category.name}</Text>
        {category.description && (
          <Text style={styles.description}>{category.description}</Text>
        )}
      </View>

      {/* Subcategories */}
      <View style={styles.subcategoriesSection}>
        <Text style={styles.sectionTitle}>Select a Service</Text>
        {subcategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No services available in this category</Text>
          </View>
        ) : (
          <View style={styles.subcategoriesList}>
            {subcategories.map((subcategory) => (
              <TouchableOpacity
                key={subcategory.id}
                style={styles.subcategoryCard}
                onPress={() => handleSubcategorySelect(subcategory.id, subcategory.name)}
              >
                <View style={styles.subcategoryHeader}>
                  <Text style={styles.subcategoryName}>{subcategory.name}</Text>
                  {subcategory.base_price && (
                    <View style={styles.priceTag}>
                      <Text style={styles.priceText}>
                        GYD ${subcategory.base_price.toFixed(0)}
                      </Text>
                    </View>
                  )}
                </View>
                {subcategory.description && (
                  <Text style={styles.subcategoryDescription} numberOfLines={2}>
                    {subcategory.description}
                  </Text>
                )}
                {subcategory.estimated_time && (
                  <Text style={styles.estimatedTime}>
                    ⏱️ Est. {subcategory.estimated_time}
                  </Text>
                )}
                <View style={styles.subcategoryFooter}>
                  <Text style={styles.selectButton}>Select →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How It Works</Text>
        <View style={styles.infoSteps}>
          <View style={styles.infoStep}>
            <View style={styles.infoStepNumber}>
              <Text style={styles.infoStepNumberText}>1</Text>
            </View>
            <Text style={styles.infoStepText}>Select a service above</Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.infoStepNumber}>
              <Text style={styles.infoStepNumberText}>2</Text>
            </View>
            <Text style={styles.infoStepText}>Provide errand details</Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.infoStepNumber}>
              <Text style={styles.infoStepNumberText}>3</Text>
            </View>
            <Text style={styles.infoStepText}>A runner will be assigned</Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.infoStepNumber}>
              <Text style={styles.infoStepNumberText}>4</Text>
            </View>
            <Text style={styles.infoStepText}>Track and receive updates</Text>
          </View>
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
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.fontSize.md,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  subcategoriesSection: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  subcategoriesList: {
    gap: theme.spacing.md,
  },
  subcategoryCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  subcategoryName: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  priceTag: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  priceText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  subcategoryDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  estimatedTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  subcategoryFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  selectButton: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  infoSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.md,
  },
  infoTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  infoSteps: {
    gap: theme.spacing.md,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  infoStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoStepNumberText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  infoStepText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
});
