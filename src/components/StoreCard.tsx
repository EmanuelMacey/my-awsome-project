
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  Platform,
} from 'react-native';
import { Store } from '../types/database.types';

const isWeb = Platform.OS === 'web';

interface StoreCardProps {
  store: Store;
  onPress: () => void;
}

function resolveImageSource(
  source: string | number | ImageSourcePropType | undefined
): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export function StoreCard({ store, onPress }: StoreCardProps) {
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const getStoreImage = (storeName: string, logoUrl?: string) => {
    if (logoUrl && logoUrl.trim() !== '') {
      console.log(`Using database logo for ${storeName} : ${logoUrl}`);
      return logoUrl;
    }

    const name = storeName.toLowerCase();
    
    // Specific store mappings
    if (name.includes('fireside')) return 'https://i.imgur.com/n4wQyjp.jpeg';
    if (name.includes('exclusive eggball')) return 'https://i.imgur.com/hO3bc3N.jpeg';
    if (name.includes('gangbao')) return 'https://i.imgur.com/5E79A1d.jpeg';
    if (name.includes('golden pagoda')) return 'https://i.imgur.com/qR8jGxz.png';
    if (name.includes('kfc')) return 'https://i.imgur.com/oipuxiK.jpeg';
    if (name.includes('royal castle')) return 'https://i.imgur.com/gfRIYNi.jpeg';
    if (name.includes('white castle fish')) return 'https://i.imgur.com/cbt6lq8.jpeg';
    if (name.includes('popeyes')) return 'https://i.imgur.com/BjDqpmy.jpeg';
    if (name.includes('starbucks')) return 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/Starbucks.jpg';
    if (name.includes('church')) return 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/churchs%20chicken.png';
    if (name.includes('pizza')) return 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/pizzahut.png';
    if (name.includes('kamboat')) return 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/Kamboat%20Resturant%20Logo.png';
    
    // Default fallback
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop';
  };

  const getFallbackImage = () => {
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop';
  };

  const bannerImage = bannerError ? getFallbackImage() : getStoreImage(store.name, store.logo);
  const logoImage = logoError ? getFallbackImage() : (store.logo || bannerImage);

  const handleBannerError = (error: any) => {
    console.log(`Image load error for ${store.name} banner: ${error.nativeEvent?.error || 'Unknown error'}`);
    setBannerError(true);
  };

  const handleLogoError = (error: any) => {
    console.log(`Image load error for ${store.name} logo: ${error.nativeEvent?.error || 'Unknown error'}`);
    setLogoError(true);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Banner */}
      <View style={styles.imageWrapper}>
        <Image
          source={resolveImageSource(bannerImage)}
          style={styles.bannerImage}
          resizeMode="cover"
          onError={handleBannerError}
        />

        {/* Logo Overlay */}
        <View style={styles.logoWrapper}>
          <Image
            source={resolveImageSource(logoImage)}
            style={styles.logo}
            resizeMode="contain"
            onError={handleLogoError}
          />
        </View>
      </View>

      {/* Text */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {store.name}
        </Text>
        <Text style={styles.description} numberOfLines={1}>
          {store.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    ...(isWeb && {
      maxWidth: 360,
      marginHorizontal: 'auto',
    }),
  },

  imageWrapper: {
    position: 'relative',
  },

  bannerImage: {
    width: '100%',
    height: isWeb ? 100 : 140,
    backgroundColor: '#F3F4F6',
  },

  logoWrapper: {
    position: 'absolute',
    bottom: isWeb ? -16 : -20,
    left: isWeb ? 12 : 16,
    width: isWeb ? 44 : 56,
    height: isWeb ? 44 : 56,
    borderRadius: isWeb ? 6 : 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },

  logo: {
    width: isWeb ? 36 : 48,
    height: isWeb ? 36 : 48,
    borderRadius: isWeb ? 4 : 6,
  },

  content: {
    paddingTop: isWeb ? 22 : 28,
    paddingHorizontal: isWeb ? 12 : 16,
    paddingBottom: isWeb ? 12 : 16,
  },

  name: {
    fontSize: isWeb ? 14 : 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },

  description: {
    fontSize: isWeb ? 12 : 14,
    color: '#6B7280',
  },
});
