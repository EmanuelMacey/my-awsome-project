
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ImageBackground,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { Store, Product } from '../../types/database.types';
import { getStoreById, getStoreItems } from '../../api/stores';
import { useCart } from '../../contexts/CartContext';
import { ItemCard } from '../../components/ItemCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { theme, globalStyles } from '../../styles/theme';

/* ===========================
   STORE IMAGE RESOLVER
=========================== */
const getStoreImage = (
  storeName?: string | null,
  imageUrl?: string | null
) => {
  // 1️⃣ Supabase image has priority
  if (typeof imageUrl === 'string' && imageUrl.trim().startsWith('http')) {
    return { uri: imageUrl.trim() };
  }

  const name = storeName?.toLowerCase() || '';

  // 2️⃣ MANUAL STORE LOGOS (PASTE URLS HERE)

  if (name.includes('popeyes') || name.includes('popeye')) {
    return { uri: 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/Popeyes.jpg' };
  }

  if (name.includes('kfc')) {
    return { uri: 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/kfc%20(1).jpg' };
  }

  if (name.includes('exclusive eggball')) {
    return { uri: 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/Exclusive%20Eggball.jpeg' };
  }
  
  if (name.includes('church')) {
    return { uri: 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/churchs%20chicken.png' };
  }

  if (name.includes('royal castle')) {
    return { uri: 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/royal%20castle.jpg' };
  }

  if (name.includes('starbucks')) {
    return { uri: 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/Starbucks.jpg' };
  }

  if (name.includes('pizza')) {
    return { uri: 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/pizzahut.png' };
  }

  if (name.includes('gangbao')) {
    return { uri: 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/Gangbao%20logo.jpg' };
  }

  if (name.includes('kamboat resturant')) {
    return { uri: 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/Kamboat%20Resturant%20Logo.png' };
  }

  if (name.includes('fire side grill and chill')) {
    return { uri: 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fireside-grill-n-chill%20Logo.jpg' };
  }

  if (name.includes('golden pagoda')) {
    return { uri: 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/Golden%20Pagoda.png' };
  }

  if (name.includes('white castle fish shop')) {
    return { uri: 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/White%20Castle%20Fish%20shop.%20logo.jpg' };
  }
  
  // 3️⃣ FALLBACK
  return {
    uri: 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/Fireside%20Grill%20and%20chill.jpg',
  };
};

type SortOption = 'default' | 'price-low' | 'price-high' | 'name';

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [store, setStore] = useState<Store | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [filteredItems, setFilteredItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [showSortModal, setShowSortModal] = useState(false);

  const { addToCart, setStoreId, cart } = useCart();

  /* ===========================
     EXTRACT CATEGORIES FROM ITEMS
  =========================== */
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    
    items.forEach(item => {
      // Try to infer category from item name or description
      const itemName = item.name.toLowerCase();
      const itemDesc = item.description?.toLowerCase() || '';
      
      // Common food categories
      if (itemName.includes('burger') || itemName.includes('sandwich')) {
        categorySet.add('Burgers & Sandwiches');
      } else if (itemName.includes('chicken') || itemName.includes('wing')) {
        categorySet.add('Chicken');
      } else if (itemName.includes('fries') || itemName.includes('side')) {
        categorySet.add('Sides');
      } else if (itemName.includes('drink') || itemName.includes('soda') || itemName.includes('juice') || itemName.includes('beverage')) {
        categorySet.add('Beverages');
      } else if (itemName.includes('dessert') || itemName.includes('ice cream') || itemName.includes('cake')) {
        categorySet.add('Desserts');
      } else if (itemName.includes('salad')) {
        categorySet.add('Salads');
      } else if (itemName.includes('pizza')) {
        categorySet.add('Pizza');
      } else if (itemName.includes('pasta')) {
        categorySet.add('Pasta');
      } else if (itemName.includes('breakfast')) {
        categorySet.add('Breakfast');
      } else if (itemName.includes('combo') || itemName.includes('meal')) {
        categorySet.add('Combo Meals');
      } else {
        categorySet.add('Main Dishes');
      }
    });

    const categoriesArray = Array.from(categorySet).sort();
    return ['All', ...categoriesArray];
  }, [items]);

  /* ===========================
     CATEGORIZE ITEM HELPER
  =========================== */
  const getItemCategory = (item: Product): string => {
    const itemName = item.name.toLowerCase();
    
    if (itemName.includes('burger') || itemName.includes('sandwich')) {
      return 'Burgers & Sandwiches';
    } else if (itemName.includes('chicken') || itemName.includes('wing')) {
      return 'Chicken';
    } else if (itemName.includes('fries') || itemName.includes('side')) {
      return 'Sides';
    } else if (itemName.includes('drink') || itemName.includes('soda') || itemName.includes('juice') || itemName.includes('beverage')) {
      return 'Beverages';
    } else if (itemName.includes('dessert') || itemName.includes('ice cream') || itemName.includes('cake')) {
      return 'Desserts';
    } else if (itemName.includes('salad')) {
      return 'Salads';
    } else if (itemName.includes('pizza')) {
      return 'Pizza';
    } else if (itemName.includes('pasta')) {
      return 'Pasta';
    } else if (itemName.includes('breakfast')) {
      return 'Breakfast';
    } else if (itemName.includes('combo') || itemName.includes('meal')) {
      return 'Combo Meals';
    } else {
      return 'Main Dishes';
    }
  };

  /* ===========================
     FETCH STORE DATA
  =========================== */
  const fetchStoreData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching store data for storeId:', id);

      const [storeData, itemsData] = await Promise.all([
        getStoreById(id),
        getStoreItems(id),
      ]);

      console.log('Store data fetched:', storeData?.name);
      console.log('Items fetched:', itemsData?.length || 0);

      setStore(storeData);
      setItems(itemsData ?? []);
      setStoreId(id);
    } catch (err: any) {
      console.error('Error fetching store data:', err);
      setError(err?.message || 'Failed to load store');
    } finally {
      setLoading(false);
    }
  }, [id, setStoreId]);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  /* ===========================
     FILTER + SORT
  =========================== */
  useEffect(() => {
    console.log('Filtering items - Category:', selectedCategory, 'Search:', searchQuery);
    let data = [...items];

    // Filter by category
    if (selectedCategory !== 'All') {
      data = data.filter(item => getItemCategory(item) === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortOption) {
      case 'price-low':
        data.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        data.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        data.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    console.log('Filtered items count:', data.length);
    setFilteredItems(data);
  }, [items, searchQuery, sortOption, selectedCategory]);

  /* ===========================
     HANDLE ADD TO CART
  =========================== */
  const handleAddToCart = (product: Product, selectedOption?: { name: string; price: number }) => {
    console.log('=== ADD TO CART ===');
    console.log('Product:', product.name);
    console.log('Product store_id:', product.store_id);
    console.log('Store ID from params:', id);
    console.log('Selected option:', selectedOption);

    if (product.in_stock === false) {
      Alert.alert('Out of Stock', 'This item is currently out of stock.');
      return;
    }

    // CRITICAL FIX: Always use the store ID from the URL params (id)
    // This ensures the cart has the correct store_id even if product.store_id is missing
    const productStoreId = id;

    if (!productStoreId) {
      console.error('No store ID available - this should never happen');
      Alert.alert('Error', 'Unable to add item to cart. Please try again.');
      return;
    }

    console.log('Using store ID for cart:', productStoreId);

    // If an option was selected, create a modified product with the option details
    const cartItem = selectedOption
      ? {
          id: `${product.id}_${selectedOption.name.replace(/\s+/g, '_')}`,
          name: `${product.name} - ${selectedOption.name}`,
          price: selectedOption.price,
          image: product.image,
          storeId: productStoreId,
        }
      : {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          storeId: productStoreId,
        };

    console.log('Adding cart item with storeId:', cartItem.storeId);

    addToCart(cartItem);
    Alert.alert('Added to Cart', `${cartItem.name} has been added to your cart.`);
  };

  if (loading) return <LoadingSpinner message="Loading store..." />;

  if (error || !store) {
    return (
      <ErrorMessage
        message={error || 'Store not found'}
        onRetry={fetchStoreData}
      />
    );
  }

  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const backgroundImage = getStoreImage(
    store.name,
    store.image_url
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View style={styles.itemWrapper}>
            <ItemCard
              item={item}
              storeName={store.name}
              onPress={handleAddToCart}
            />
          </View>
        )}
        ListHeaderComponent={
          <>
            <ImageBackground
              source={backgroundImage}
              style={styles.storeHeader}
              imageStyle={{ resizeMode: 'cover' }}
            >
              <View style={styles.overlay} />
              <View style={styles.headerContent}>
                <Text style={styles.storeName}>{store.name}</Text>
                {store.description && (
                  <Text style={styles.storeDescription}>
                    {store.description}
                  </Text>
                )}
              </View>
            </ImageBackground>

            <View style={styles.searchBar}>
              <TextInput
                placeholder="Search menu..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>

            {/* Category Filter Chips */}
            {categories.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesContainer}
                contentContainerStyle={styles.categoriesContent}
              >
                {categories.map((category) => {
                  const isSelected = selectedCategory === category;
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        isSelected && styles.categoryChipSelected,
                      ]}
                      onPress={() => {
                        console.log('Category selected:', category);
                        setSelectedCategory(category);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && styles.categoryChipTextSelected,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found</Text>
            {selectedCategory !== 'All' && (
              <TouchableOpacity
                onPress={() => setSelectedCategory('All')}
                style={styles.resetButton}
              >
                <Text style={styles.resetButtonText}>View All Items</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {cartItemCount > 0 && (
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push('/customer/cart')}
        >
          <Text style={styles.cartText}>
            View Cart ({cartItemCount})
          </Text>
        </TouchableOpacity>
      )}

      <Modal visible={showSortModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {['default', 'price-low', 'price-high', 'name'].map(option => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  setSortOption(option as SortOption);
                  setShowSortModal(false);
                }}
              >
                <Text style={styles.modalItem}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ===========================
   STYLES
=========================== */
const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
    ...(isWeb && {
      maxWidth: 800,
      marginHorizontal: 'auto',
      width: '100%',
    }),
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
  itemWrapper: {
    width: '48%',
  },
  storeHeader: {
    height: 240,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerContent: {
    padding: theme.spacing.lg,
  },
  storeName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: '#fff',
  },
  storeDescription: {
    color: '#fff',
    marginTop: theme.spacing.xs,
  },
  searchBar: {
    padding: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
  },
  categoriesContainer: {
    maxHeight: 50,
    marginBottom: theme.spacing.sm,
  },
  categoriesContent: {
    paddingHorizontal: theme.spacing.md,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: theme.spacing.md,
  },
  resetButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cartButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cartText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalItem: {
    paddingVertical: 12,
    fontSize: 16,
  },
});
