
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { getStores } from '../../api/stores';
import { StoreCard } from '../../components/StoreCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PromotionBanner } from '../../components/PromotionBanner';
import { theme } from '../../styles/theme';
import { Store } from '../../types/database.types';

const isWeb = Platform.OS === 'web';

export default function FoodScreen() {
  const { user } = useAuth();
  const { cart } = useCart();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    console.log('🍕 FoodScreen mounted - fetching stores');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      console.log('📡 Fetching stores...');
      const storesData = await getStores();
      console.log(`✅ Fetched ${storesData.length} stores`);
      setStores(storesData);
    } catch (err: any) {
      console.error('❌ Error fetching stores:', err);
      setError(err.message || 'Failed to load stores');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    console.log('🔄 Refreshing food screen data');
    setRefreshing(true);
    fetchData();
  }, []);

  const fastFoodStores = stores.filter(
    (store) => store.category.toLowerCase() === 'fast food'
  );

  const filteredStores = fastFoodStores.filter((store) =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner message="Loading restaurants..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  const cartItemCount = cart.length;
  const userName = user?.name || 'Guest';
  const userFirstName = userName.split(' ')[0];

  // Food categories for filter chips
  const foodCategories = ['All', 'Rice', 'Snacks', 'Drinks', 'More'];

  return (
    <View style={styles.container}>
      {/* Promotion Banner */}
      <PromotionBanner
        messages={[
          'Promo buy 1, Get 1 more!',
          'Free Delivery on orders over $50',
          'New restaurants added weekly',
          'Order now and get 20% off',
        ]}
        speed={50}
        backgroundColor="#C84343"
        textColor="#FFFFFF"
      />

      {/* Header */}
      <View style={[styles.header, isWeb && styles.headerWeb]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Location</Text>
                <Text style={styles.locationIcon}>📍</Text>
              </View>
              <Text style={styles.locationText}>St. Abigel</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  console.log('🔔 Notifications pressed');
                }}
              >
                <Text style={styles.iconText}>🔔</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search food, restaurant, etc"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={(text) => {
                console.log('🔍 Search query:', text);
                setSearchQuery(text);
              }}
            />
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, isWeb && styles.scrollContentWeb]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[styles.contentWrapper, isWeb && styles.contentWrapperWeb]}>
          {/* Category Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {foodCategories.map((category) => {
              const isSelected = selectedCategory === category;
              const categoryIcon = category === 'Rice' ? '🍚' : 
                                   category === 'Snacks' ? '🍿' : 
                                   category === 'Drinks' ? '🥤' : 
                                   category === 'More' ? '➕' : '';
              
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipActive,
                  ]}
                  onPress={() => {
                    console.log('🔘 Category selected:', category);
                    setSelectedCategory(category);
                  }}
                >
                  {categoryIcon && <Text style={styles.categoryIcon}>{categoryIcon}</Text>}
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Top Rated Food Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top rated food</Text>
              <TouchableOpacity
                onPress={() => {
                  console.log('➡️ View all top rated pressed');
                }}
              >
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {/* Top Rated Items - Horizontal Scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topRatedContent}
            >
              {filteredStores.slice(0, 3).map((store) => (
                <TouchableOpacity
                  key={store.id}
                  style={styles.topRatedCard}
                  onPress={() => {
                    console.log('🏪 Top rated store pressed:', store.name);
                    router.push(`/customer/store/${store.id}`);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.topRatedImageContainer}>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>⭐ 4.9</Text>
                    </View>
                  </View>
                  <View style={styles.topRatedInfo}>
                    <Text style={styles.topRatedName} numberOfLines={1}>
                      {store.name}
                    </Text>
                    <View style={styles.topRatedMeta}>
                      <Text style={styles.topRatedStore}>🏪 {store.name}</Text>
                      <Text style={styles.topRatedPrice}>$5.0</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Restaurant Near You Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Restaurant near you</Text>
              <TouchableOpacity
                onPress={() => {
                  console.log('➡️ View all restaurants pressed');
                }}
              >
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {filteredStores.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🍕</Text>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No restaurants found' : 'No restaurants available'}
                </Text>
              </View>
            ) : (
              <View style={[styles.storesGrid, isWeb && styles.storesGridWeb]}>
                {filteredStores.map((store) => (
                  <View key={store.id} style={[styles.storeCardWrapper, isWeb && styles.storeCardWrapperWeb]}>
                    <StoreCard
                      store={store}
                      onPress={() => {
                        console.log('🏪 Store pressed:', store.name);
                        router.push(`/customer/store/${store.id}`);
                      }}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCartButton}
          onPress={() => {
            console.log('🛒 Floating cart button pressed');
            router.push('/customer/cart');
          }}
        >
          <Text style={styles.floatingCartIcon}>🛒</Text>
          <View style={styles.floatingCartBadge}>
            <Text style={styles.floatingCartBadgeText}>{cartItemCount}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerWeb: {
    alignItems: 'center',
  },
  headerContent: {
    width: '100%',
    ...Platform.select({
      web: {
        maxWidth: 800,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  locationIcon: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#C84343',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  filterIcon: {
    fontSize: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  scrollContentWeb: {
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
  },
  contentWrapperWeb: {
    maxWidth: 800,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingRight: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#C84343',
    borderColor: '#C84343',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C84343',
  },
  topRatedContent: {
    paddingRight: 16,
  },
  topRatedCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  topRatedImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  topRatedInfo: {
    padding: 12,
  },
  topRatedName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  topRatedMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRatedStore: {
    fontSize: 11,
    color: '#6B7280',
    flex: 1,
  },
  topRatedPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C84343',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  storesGrid: {
    width: '100%',
  },
  storesGridWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
  },
  storeCardWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  storeCardWrapperWeb: {
    width: 'calc(50% - 8px)',
    minWidth: 280,
  },
  floatingCartButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C84343',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCartIcon: {
    fontSize: 24,
  },
  floatingCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#C84343',
  },
  floatingCartBadgeText: {
    color: '#C84343',
    fontSize: 12,
    fontWeight: '700',
  },
});
