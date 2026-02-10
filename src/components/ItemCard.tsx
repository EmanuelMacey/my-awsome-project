
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { Product } from '../types/database.types';
import { theme } from '../styles/theme';
import { formatCurrency } from '../utils/currency';

interface ItemCardProps {
  item: Product;
  onPress: (item: Product, selectedOption?: { name: string; price: number }) => void;
  storeName?: string;
}

export function ItemCard({ item, onPress, storeName }: ItemCardProps) {
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  
  // Parse options if they exist
  const options = item.options ? (Array.isArray(item.options) ? item.options : []) : null;
  const hasOptions = options && options.length > 0;

  // Extract the actual selectable options from the nested structure
  const getSelectableOptions = () => {
    if (!options || options.length === 0) return [];
    
    // Check if options have nested structure (like Fish Shop)
    if (options[0]?.options && Array.isArray(options[0].options)) {
      return options[0].options.map((opt: any) => ({
        name: opt.label || opt.name,
        price: opt.price
      }));
    }
    
    // Otherwise, use the options directly
    return options.map((opt: any) => ({
      name: opt.label || opt.name,
      price: opt.price
    }));
  };

  const selectableOptions = getSelectableOptions();
  const hasSelectableOptions = selectableOptions.length > 0;

  const handlePress = () => {
    if (hasSelectableOptions) {
      setShowOptionsModal(true);
    } else {
      onPress(item);
    }
  };

  const handleOptionSelect = (option: { name: string; price: number }) => {
    setShowOptionsModal(false);
    onPress(item, option);
  };

  const getImageSource = () => {
    // If item has a specific image, use it
    if (item.image) {
      // Check if it's a local asset path
      if (item.image.startsWith('/expo-project/assets/')) {
        const assetPath = item.image.replace('/expo-project/', '../../');
        // Map the specific KFC images
        if (item.image.includes('231a8ccb-96d5-4457-a652-88e43897ba95')) {
          return require('../../assets/images/231a8ccb-96d5-4457-a652-88e43897ba95.jpeg');
        } else if (item.image.includes('5096174d-cc3b-4bfc-b865-87ea3a258945')) {
          return require('../../assets/images/5096174d-cc3b-4bfc-b865-87ea3a258945.webp');
        } else if (item.image.includes('45f50f86-5ce4-4c40-bf80-abcce402ef95')) {
          return require('../../assets/images/45f50f86-5ce4-4c40-bf80-abcce402ef95.png');
        } else if (item.image.includes('12a53465-465d-40ae-b6f8-56fb0ed6abb8')) {
          return require('../../assets/images/12a53465-465d-40ae-b6f8-56fb0ed6abb8.png');
        } else if (item.image.includes('6e650db2-15e8-4d7b-ba96-c92c59c58358')) {
          return require('../../assets/images/6e650db2-15e8-4d7b-ba96-c92c59c58358.png');
        }
      }
      return { uri: item.image };
    }
    
    // Default images based on category/tags - only for non-KFC items
    const isKFC = storeName?.toLowerCase().includes('kfc');
    const tags = item.tags || [];
    const firstTag = tags[0]?.toLowerCase() || '';
    
    // For KFC items without images, use generic food images
    if (isKFC) {
      if (firstTag.includes('wing')) {
        return { uri: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&q=80' };
      } else if (firstTag.includes('combo') || firstTag.includes('meal')) {
        return { uri: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80' };
      } else if (firstTag.includes('bucket')) {
        return { uri: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80' };
      } else if (firstTag.includes('sandwich')) {
        return { uri: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80' };
      } else if (firstTag.includes('chicken')) {
        return { uri: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80' };
      } else if (firstTag.includes('side')) {
        return { uri: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80' };
      } else if (firstTag.includes('beverage') || firstTag.includes('drink')) {
        return { uri: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400&q=80' };
      }
    } else {
      // For other restaurants, use generic images
      if (firstTag.includes('wing')) {
        return { uri: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&q=80' };
      } else if (firstTag.includes('combo') || firstTag.includes('meal')) {
        return { uri: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80' };
      } else if (firstTag.includes('bucket')) {
        return { uri: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80' };
      } else if (firstTag.includes('sandwich') || firstTag.includes('burger')) {
        return { uri: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' };
      } else if (firstTag.includes('chicken')) {
        return { uri: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80' };
      } else if (firstTag.includes('side')) {
        return { uri: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80' };
      } else if (firstTag.includes('beverage') || firstTag.includes('drink')) {
        return { uri: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400&q=80' };
      } else if (firstTag.includes('snack') || firstTag.includes('eggball')) {
        return { uri: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80' };
      }
    }
    
    return { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' };
  };

  const getCategoryLabel = () => {
    if (item.tags && item.tags.length > 0) {
      return item.tags[0].charAt(0).toUpperCase() + item.tags[0].slice(1);
    }
    return 'Item';
  };

  // Get the option group name (e.g., "Fish Type")
  const getOptionGroupName = () => {
    if (options && options.length > 0 && options[0]?.name) {
      return options[0].name;
    }
    return 'Select Option';
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.card, !item.in_stock && styles.cardOutOfStock]} 
        onPress={handlePress}
        disabled={!item.in_stock}
      >
        <Image
          source={getImageSource()}
          style={styles.image}
          resizeMode="cover"
        />
        
        {!item.in_stock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}

        {hasSelectableOptions && (
          <View style={styles.optionsBadge}>
            <Text style={styles.optionsText}>Options</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.category}>{getCategoryLabel()}</Text>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          {item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {hasSelectableOptions ? 'From ' : ''}{formatCurrency(item.price)}
            </Text>
            {item.discount_percentage && item.discount_percentage > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{item.discount_percentage}%</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getOptionGroupName()}</Text>
              <TouchableOpacity onPress={() => setShowOptionsModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.itemNameModal}>{item.name}</Text>
              {item.description && (
                <Text style={styles.itemDescriptionModal}>{item.description}</Text>
              )}

              <View style={styles.optionsList}>
                {selectableOptions.map((option: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.optionItem}
                    onPress={() => handleOptionSelect(option)}
                  >
                    <View style={styles.optionInfo}>
                      <Text style={styles.optionName}>{option.name}</Text>
                      <Text style={styles.optionPrice}>{formatCurrency(option.price)}</Text>
                    </View>
                    <Text style={styles.optionArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  cardOutOfStock: {
    opacity: 0.6,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.background,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.danger,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  optionsBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  optionsText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  info: {
    padding: theme.spacing.sm,
  },
  category: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  name: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  discountBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: theme.colors.textSecondary,
    padding: theme.spacing.sm,
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  itemNameModal: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  itemDescriptionModal: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  optionsList: {
    gap: theme.spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  optionPrice: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  optionArrow: {
    fontSize: 24,
    color: theme.colors.primary,
    marginLeft: theme.spacing.md,
  },
});
