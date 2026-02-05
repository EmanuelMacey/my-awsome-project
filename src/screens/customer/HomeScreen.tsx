
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { getStores } from '../../api/stores';
import { getErrandCategories } from '../../api/errands';
import { StoreCard } from '../../components/StoreCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PromotionBanner } from '../../components/PromotionBanner';
import { theme } from '../../styles/theme';
import { Store } from '../../types/database.types';
import { ErrandCategory } from '../../types/errand.types';

const isWeb = Platform.OS === 'web';

// Helper function to get greeting and godly quote based on time of day
function getGreetingAndQuote() {
  const hour = new Date().getHours();
  let greeting = '';
  let quote = '';

  if (hour >= 5 && hour < 12) {
    // Morning (5 AM - 11:59 AM)
    greeting = 'Good Morning';
    const morningQuotes = [
      'The steadfast love of the Lord never ceases; His mercies never come to an end; they are new every morning. - Lamentations 3:22-23',
      'This is the day that the Lord has made; let us rejoice and be glad in it. - Psalm 118:24',
      'In the morning, Lord, you hear my voice; in the morning I lay my requests before you. - Psalm 5:3',
      'Let the morning bring me word of your unfailing love, for I have put my trust in you. - Psalm 143:8',
      'Satisfy us in the morning with your unfailing love, that we may sing for joy all our days. - Psalm 90:14',
    ];
    quote = morningQuotes[Math.floor(Math.random() * morningQuotes.length)];
  } else if (hour >= 12 && hour < 17) {
    // Afternoon (12 PM - 4:59 PM)
    greeting = 'Good Afternoon';
    const afternoonQuotes = [
      'I can do all things through Christ who strengthens me. - Philippians 4:13',
      'Trust in the Lord with all your heart and lean not on your own understanding. - Proverbs 3:5',
      'The Lord is my strength and my shield; my heart trusts in him, and he helps me. - Psalm 28:7',
      'Be strong and courageous. Do not be afraid; the Lord your God will be with you. - Joshua 1:9',
      'Cast all your anxiety on him because he cares for you. - 1 Peter 5:7',
    ];
    quote = afternoonQuotes[Math.floor(Math.random() * afternoonQuotes.length)];
  } else {
    // Evening/Night (5 PM - 4:59 AM)
    greeting = 'Good Evening';
    const eveningQuotes = [
      'The Lord bless you and keep you; the Lord make his face shine on you. - Numbers 6:24-25',
      'In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety. - Psalm 4:8',
      'The Lord is my light and my salvation—whom shall I fear? - Psalm 27:1',
      'Be still, and know that I am God. - Psalm 46:10',
      'Come to me, all you who are weary and burdened, and I will give you rest. - Matthew 11:28',
      'The Lord will watch over your coming and going both now and forevermore. - Psalm 121:8',
    ];
    quote = eveningQuotes[Math.floor(Math.random() * eveningQuotes.length)];
  }

  return { greeting, quote };
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { cart } = useCart();
  const [stores, setStores] = useState<Store[]>([]);
  const [errandCategories, setErrandCategories] = useState<ErrandCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'stores' | 'errands'>('all');

  useEffect(() => {
    console.log('🏠 HomeScreen mounted - fetching data');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      console.log('📡 Fetching stores and errand categories...');
      const [storesData, categoriesData] = await Promise.all([
        getStores(),
        getErrandCategories(),
      ]);
      console.log(`✅ Fetched ${storesData.length} stores and ${categoriesData.length} categories`);
      setStores(storesData);
      setErrandCategories(categoriesData);
    } catch (err: any) {
      console.error('❌ Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    console.log('🔄 Refreshing home screen data');
    setRefreshing(true);
    fetchData();
  }, []);

  const fastFoodStores = stores.filter(
    (store) => store.category.toLowerCase() === 'fast food'
  );

  const filteredStores = fastFoodStores.filter((store) =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const shoppingCategory = errandCategories.find(c => 
    c.name.toLowerCase().includes('shopping')
  );
  const pharmacyCategory = errandCategories.find(c => 
    c.name.toLowerCase().includes('medical') || c.name.toLowerCase().includes('pharmacy')
  );
  const governmentCategory = errandCategories.find(c => 
    c.name.toLowerCase().includes('government') || c.name.toLowerCase().includes('document')
  );

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  const showStores = selectedFilter === 'all' || selectedFilter === 'stores';
  const showErrands = selectedFilter === 'all' || selectedFilter === 'errands';

  const cartItemCount = cart.length;
  
  // Get dynamic greeting and quote
  const greetingData = getGreetingAndQuote();
  const greetingText = greetingData.greeting;
  const quoteText = greetingData.quote;

  return (
    <View style={styles.container}>
      {/* Enhanced Multi-layer Gradient Background */}
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

      {/* Subtle dot pattern overlay */}
      <View style={styles.patternOverlay} />

      {/* Promotion Banner - Now with safe area support */}
      <PromotionBanner
        messages={[
          '🎉 Welcome to ErrandRunners! Your one-stop delivery solution',
          '🍔 Order from your favorite restaurants with fast delivery',
          '🛍️ Need groceries? We deliver from Massy, Bounty & more!',
          '💊 Pharmacy errands made easy - Medicine Chest, Mike\'s & more',
          '📄 Government services? We handle documents & GRA errands',
          '🚚 Track your order in real-time with live driver location',
          '💬 Chat with your driver directly through the app',
          '⭐ Rate your experience and help us improve',
          '🎯 New to the app? Browse stores and start shopping now!',
          '💡 Tip: Save your favorite addresses for faster checkout',
          '🔔 Enable notifications to never miss order updates',
          '🎁 Special offers coming soon - stay tuned!',
        ]}
        speed={50}
        backgroundColor="#FF8C42"
        textColor="#FFFFFF"
      />

      {/* Header */}
      <View style={[styles.header, isWeb && styles.headerWeb]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.greetingText}>{greetingText}</Text>
              <Text style={styles.quoteText}>{quoteText}</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.cartButton}
                onPress={() => {
                  console.log('🛒 Cart button pressed');
                  router.push('/customer/cart');
                }}
              >
                <Text style={styles.cartIcon}>🛒</Text>
                {cartItemCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => {
                  console.log('👤 Profile button pressed');
                  router.push('/customer/profile');
                }}
              >
                <Text style={styles.profileIcon}>👤</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for restaurants or errands"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={(text) => {
                console.log('🔍 Search query:', text);
                setSearchQuery(text);
              }}
            />
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
              onPress={() => {
                console.log('🔘 Filter: All');
                setSelectedFilter('all');
              }}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'all' && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'stores' && styles.filterChipActive]}
              onPress={() => {
                console.log('🔘 Filter: Restaurants');
                setSelectedFilter('stores');
              }}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'stores' && styles.filterChipTextActive]}>
                🍔 Restaurants
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'errands' && styles.filterChipActive]}
              onPress={() => {
                console.log('🔘 Filter: Errands');
                setSelectedFilter('errands');
              }}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'errands' && styles.filterChipTextActive]}>
                🏃 Errands
              </Text>
            </TouchableOpacity>
          </ScrollView>
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
          {/* Errands Section */}
          {showErrands && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Errand Services</Text>
                <TouchableOpacity
                  onPress={() => {
                    console.log('➡️ View all errands pressed');
                    router.push('/errands/home');
                  }}
                >
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              </View>

              {/* Errand Cards */}
              <TouchableOpacity
                style={styles.errandCard}
                onPress={() => {
                  console.log('🛍️ Shopping errand pressed');
                  if (shoppingCategory) {
                    router.push(`/errands/category/${shoppingCategory.id}`);
                  } else {
                    router.push('/errands/home');
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.errandIconContainer}>
                  <Text style={styles.errandIcon}>🛍️</Text>
                </View>
                <View style={styles.errandContent}>
                  <Text style={styles.errandTitle}>Supermarket Shopping</Text>
                  <Text style={styles.errandDescription}>Massy, Bounty, DSL & more</Text>
                </View>
                <Text style={styles.errandArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.errandCard}
                onPress={() => {
                  console.log('💊 Pharmacy errand pressed');
                  if (pharmacyCategory) {
                    router.push(`/errands/category/${pharmacyCategory.id}`);
                  } else {
                    router.push('/errands/home');
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.errandIconContainer}>
                  <Text style={styles.errandIcon}>💊</Text>
                </View>
                <View style={styles.errandContent}>
                  <Text style={styles.errandTitle}>Pharmacy Errands</Text>
                  <Text style={styles.errandDescription}>Mike&apos;s, Medicine Chest & more</Text>
                </View>
                <Text style={styles.errandArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.errandCard}
                onPress={() => {
                  console.log('📄 Government services pressed');
                  if (governmentCategory) {
                    router.push(`/errands/category/${governmentCategory.id}`);
                  } else {
                    router.push('/errands/home');
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.errandIconContainer}>
                  <Text style={styles.errandIcon}>📄</Text>
                </View>
                <View style={styles.errandContent}>
                  <Text style={styles.errandTitle}>Government Services</Text>
                  <Text style={styles.errandDescription}>GRA, Documents & more</Text>
                </View>
                <Text style={styles.errandArrow}>›</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Restaurants Section */}
          {showStores && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Restaurants</Text>
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
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
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
    top: 0,
    left: 0,
    right: 0,
    height: 600,
    zIndex: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 600,
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
    top: 450,
    left: 30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 140, 66, 0.08)',
    zIndex: 0,
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 600,
    backgroundColor: 'transparent',
    zIndex: 0,
  },
  header: {
    backgroundColor: 'transparent',
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 1,
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  quoteText: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(17, 24, 39, 0.85)',
    fontWeight: '500',
    fontStyle: 'italic',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cartIcon: {
    fontSize: 20,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF8C42',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  profileIcon: {
    fontSize: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.1)',
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
  filterContainer: {
    marginBottom: 8,
  },
  filterContent: {
    paddingRight: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginRight: 8,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.15)',
  },
  filterChipActive: {
    backgroundColor: '#FF8C42',
    borderColor: '#FF8C42',
    shadowOpacity: 0.25,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    zIndex: 1,
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
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF8C42',
  },
  errandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.12)',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  errandIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF5EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 66, 0.15)',
  },
  errandIcon: {
    fontSize: 26,
  },
  errandContent: {
    flex: 1,
  },
  errandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  errandDescription: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  errandArrow: {
    fontSize: 32,
    color: '#FF8C42',
    fontWeight: '300',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.1)',
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
  },
  storeCardWrapperWeb: {
    width: 'calc(50% - 8px)',
    minWidth: 280,
  },
});
