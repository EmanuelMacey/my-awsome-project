
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { theme } from '../styles/theme';
import { formatCurrency } from '../utils/currency';
import { Order, OrderItem, Product } from '../types/database.types';
import { Errand } from '../types/errand.types';

interface ReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  order?: Order;
  orderItems?: OrderItem[];
  errand?: Errand;
  type: 'order' | 'errand';
}

interface CategorizedItems {
  [category: string]: OrderItem[];
}

export function ReceiptModal({
  visible,
  onClose,
  order,
  orderItems = [],
  errand,
  type,
}: ReceiptModalProps) {
  // Enhanced categorization for order items
  const categorizeItems = (): CategorizedItems => {
    const categorized: CategorizedItems = {};

    orderItems.forEach((item) => {
      let category = 'Other Items';
      const itemName = item.product_name.toLowerCase();

      // ===== PIZZA HUT CATEGORIES =====
      if (itemName.includes('personal pan pizza')) {
        category = 'Personal Pan Pizzas';
      } else if (
        itemName.includes('pizza') &&
        !itemName.includes('personal') &&
        (itemName.includes('lovers') ||
          itemName.includes('supreme') ||
          itemName.includes('hawaiian') ||
          itemName.includes('bbq') ||
          itemName.includes('pepperoni') ||
          itemName.includes('cheese') ||
          itemName.includes('meat') ||
          itemName.includes('vegetarian') ||
          itemName.includes('chicken') ||
          itemName.includes('ham') ||
          itemName.includes('sausage') ||
          itemName.includes('spicy'))
      ) {
        category = 'Specialty Pizzas';
      } else if (
        itemName.includes('alfredo') ||
        itemName.includes('penne') ||
        itemName.includes('spaghetti') ||
        itemName.includes('lasagna') ||
        itemName.includes('pasta') ||
        itemName.includes('mac n cheese')
      ) {
        category = 'Pastas';
      } else if (itemName.includes('wing')) {
        category = 'Chicken Wings';
      } else if (
        itemName.includes('breadstick') ||
        itemName.includes('cheesy bread') ||
        itemName.includes('garlic bread') ||
        itemName.includes('stuffed breadstick')
      ) {
        category = 'Breadsticks & Sides';
      } else if (itemName.includes('salad')) {
        category = 'Salads';
      } else if (
        itemName.includes('brownie') ||
        itemName.includes('cookie') ||
        itemName.includes('cinnamon') ||
        itemName.includes('dessert')
      ) {
        category = 'Desserts';
      } else if (
        itemName.includes('coca') ||
        itemName.includes('coke') ||
        itemName.includes('pepsi') ||
        itemName.includes('sprite') ||
        itemName.includes('7 up') ||
        itemName.includes('icee') ||
        itemName.includes('minute maid') ||
        itemName.includes('water') ||
        itemName.includes('drink') ||
        itemName.includes('soda') ||
        itemName.includes('juice') ||
        itemName.includes('beverage')
      ) {
        category = 'Beverages';
      }
      // ===== KFC CATEGORIES =====
      else if (
        itemName.includes('bucket') ||
        itemName.includes('family meal') ||
        (itemName.includes('pc') && itemName.includes('chicken'))
      ) {
        category = 'Family Meals & Buckets';
      } else if (
        itemName.includes('combo') ||
        itemName.includes('box meal') ||
        itemName.includes('meal')
      ) {
        category = 'Combo Meals';
      } else if (
        itemName.includes('sandwich') ||
        itemName.includes('burger') ||
        itemName.includes('zinger')
      ) {
        category = 'Sandwiches & Burgers';
      } else if (
        itemName.includes('tender') ||
        itemName.includes('nugget') ||
        itemName.includes('popcorn chicken') ||
        itemName.includes('strip')
      ) {
        category = 'Tenders & Nuggets';
      } else if (
        itemName.includes('fries') ||
        itemName.includes('coleslaw') ||
        itemName.includes('mashed potato') ||
        itemName.includes('corn') ||
        itemName.includes('side')
      ) {
        category = 'Sides';
      }
      // ===== CHURCH'S CHICKEN CATEGORIES =====
      else if (
        (itemName.includes('pc') && itemName.includes('chicken')) ||
        (itemName.includes('piece') && itemName.includes('chicken'))
      ) {
        category = 'Chicken Pieces';
      } else if (itemName.includes('biscuit') || itemName.includes('roll')) {
        category = 'Biscuits & Rolls';
      }
      // ===== POPEYES CATEGORIES =====
      else if (itemName.includes('family meal') || itemName.includes('box')) {
        category = 'Family Meals';
      } else if (itemName.includes('shrimp')) {
        category = 'Seafood';
      }
      // ===== GOLDEN PAGODA CATEGORIES =====
      else if (itemName.includes('fried rice')) {
        category = 'Fried Rice';
      } else if (itemName.includes('chowmein') || itemName.includes('lowmein')) {
        category = 'Chowmein & Lowmein';
      } else if (itemName.includes('serving')) {
        category = 'Servings';
      } else if (itemName.includes('kids meal')) {
        category = 'Kids Meals';
      }
      // ===== FIRESIDE GRILL AND CHILL CATEGORIES =====
      else if (
        itemName.includes('boil') ||
        itemName.includes('platter') ||
        itemName.includes('prawns') ||
        itemName.includes('salmon') ||
        itemName.includes('snapper') ||
        itemName.includes('lobster') ||
        itemName.includes('crab') ||
        itemName.includes('calamari') ||
        itemName.includes('octopus') ||
        itemName.includes('mussels') ||
        itemName.includes('crawfish')
      ) {
        category = 'Seafood';
      } else if (
        itemName.includes('lamb') ||
        itemName.includes('steak') ||
        itemName.includes('tomahawk') ||
        itemName.includes('bone')
      ) {
        category = 'Beef & Lamb';
      } else if (itemName.includes('ribs') || itemName.includes('chops')) {
        category = 'Pork';
      }
      // ===== GANGBAO CATEGORIES =====
      else if (itemName.includes('milkshake')) {
        category = 'Beverages';
      }
      // ===== KAMBOAT CATEGORIES =====
      else if (
        itemName.includes('chinese specialty') ||
        itemName.includes('sizzling') ||
        itemName.includes('diced beef') ||
        itemName.includes('spare ribs') ||
        itemName.includes('spicy chicken') ||
        itemName.includes('spicy salt') ||
        itemName.includes('stuffed tofu') ||
        itemName.includes('green chilli') ||
        itemName.includes('steam fish') ||
        itemName.includes('alaska king crab')
      ) {
        category = 'Chinese Specialty';
      } else if (
        itemName.includes('squid') ||
        itemName.includes('mussel') ||
        itemName.includes('fish ball') ||
        itemName.includes('fish fillet') ||
        itemName.includes('fish in sizzling') ||
        itemName.includes('fish with black') ||
        itemName.includes('pinecone fish') ||
        itemName.includes('lemon fish') ||
        itemName.includes('steamed fish')
      ) {
        category = 'Seafood';
      } else if (
        itemName.includes('mutton') ||
        itemName.includes('beef chop suey') ||
        itemName.includes('beef with') ||
        itemName.includes('beef in sizzling') ||
        itemName.includes('beef kebab')
      ) {
        category = 'Beef & Mutton';
      } else if (
        itemName.includes('vegetable') ||
        itemName.includes('broccoli') ||
        itemName.includes('pak choy') ||
        itemName.includes('mushroom') ||
        itemName.includes('tofu') ||
        itemName.includes('eggplant') ||
        itemName.includes('bran curd')
      ) {
        category = 'Vegetable';
      } else if (
        itemName.includes('pork') ||
        itemName.includes('lapchung') ||
        itemName.includes('steamed ribs')
      ) {
        category = 'Pork';
      } else if (
        itemName.includes('rice noodle') ||
        itemName.includes('ho-fun') ||
        itemName.includes('singapore noodle')
      ) {
        category = 'Rice Noodles';
      } else if (itemName.includes('noodle soup')) {
        category = 'Noodle Soups';
      }
      // ===== GENERAL FAST FOOD CATEGORIES =====
      else if (itemName.includes('chicken') && !itemName.includes('wing')) {
        category = 'Chicken Items';
      }

      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(item);
    });

    return categorized;
  };

  const categorizedItems = type === 'order' ? categorizeItems() : {};
  
  // Sort categories in a logical order
  const categoryOrder = [
    // Pizza Hut
    'Specialty Pizzas',
    'Personal Pan Pizzas',
    'Pastas',
    'Chicken Wings',
    'Breadsticks & Sides',
    'Salads',
    'Desserts',
    // Fast Food General
    'Combos',
    'Combo Meals',
    'Family Meals & Buckets',
    'Family Meals',
    'Chicken Pieces',
    'Chicken Items',
    'Sandwiches & Burgers',
    'Tenders & Nuggets',
    'Biscuits & Rolls',
    // Chinese
    'Fried Rice',
    'Chowmein & Lowmein',
    'Rice Noodles',
    'Noodle Soups',
    'Servings',
    'Chinese Specialty',
    // Fireside & Kamboat
    'Seafood',
    'Beef & Lamb',
    'Beef & Mutton',
    'Pork',
    'Vegetable',
    // General
    'Sides',
    'Kids Meals',
    'Beverages',
    'Other Items',
  ];

  const categories = Object.keys(categorizedItems).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const renderOrderReceipt = () => {
    if (!order) return null;

    const orderNumberText = order.order_number;
    const orderDateText = new Date(order.created_at || '').toLocaleString();
    const orderStatusText = order.status.toUpperCase();
    const paymentMethodText = order.payment_method === 'mobile_money'
      ? 'MMG+'
      : order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1);
    const deliveryAddressText = order.delivery_address;
    const deliveryNotesText = order.delivery_notes || '';
    const subtotalText = formatCurrency(order.subtotal);
    const deliveryFeeText = formatCurrency(order.delivery_fee);
    const taxText = formatCurrency(order.tax);
    const discountText = order.discount_amount ? formatCurrency(order.discount_amount) : '';
    const totalText = formatCurrency(order.total);

    return (
      <View style={styles.receiptContent}>
        {/* Header */}
        <View style={styles.receiptHeader}>
          <Text style={styles.receiptTitle}>🧾 Receipt</Text>
          <Text style={styles.receiptSubtitle}>ErrandRunners</Text>
        </View>

        <View style={styles.simpleDivider} />

        {/* Order Info - Clean Vertical List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>Order Number</Text>
            <Text style={styles.listValue}>{orderNumberText}</Text>
          </View>
          
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>Date</Text>
            <Text style={styles.listValue}>{orderDateText}</Text>
          </View>
          
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>Status</Text>
            <Text style={[styles.listValue, styles.statusText]}>{orderStatusText}</Text>
          </View>
          
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>Payment Method</Text>
            <Text style={styles.listValue}>{paymentMethodText}</Text>
          </View>
          
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>Delivery Address</Text>
            <Text style={styles.listValue}>{deliveryAddressText}</Text>
          </View>
          
          {deliveryNotesText !== '' && (
            <View style={styles.listItem}>
              <Text style={styles.listLabel}>Notes</Text>
              <Text style={styles.listValue}>{deliveryNotesText}</Text>
            </View>
          )}
        </View>

        <View style={styles.simpleDivider} />

        {/* Items - Clean Vertical List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {categories.length > 0 ? (
            categories.map((category, categoryIndex) => (
              <View key={categoryIndex} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {categorizedItems[category].map((item, itemIndex) => {
                  const itemNameText = item.product_name;
                  const itemQuantityText = `Qty: ${item.quantity}`;
                  const itemPriceText = formatCurrency(item.product_price);
                  const itemTotalText = formatCurrency(item.product_price * item.quantity);
                  
                  return (
                    <View key={itemIndex} style={styles.itemRow}>
                      <View style={styles.itemLeft}>
                        <Text style={styles.itemName}>{itemNameText}</Text>
                        <Text style={styles.itemQuantity}>{itemQuantityText}</Text>
                      </View>
                      <View style={styles.itemRight}>
                        <Text style={styles.itemPrice}>{itemPriceText} each</Text>
                        <Text style={styles.itemTotal}>{itemTotalText}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No items</Text>
          )}
        </View>

        <View style={styles.simpleDivider} />

        {/* Price Breakdown - Clean Vertical List */}
        <View style={styles.section}>
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>Subtotal</Text>
            <Text style={styles.listValue}>{subtotalText}</Text>
          </View>
          
          {order.delivery_fee > 0 && (
            <View style={styles.listItem}>
              <Text style={styles.listLabel}>Delivery Fee</Text>
              <Text style={styles.listValue}>{deliveryFeeText}</Text>
            </View>
          )}
          
          {order.tax > 0 && (
            <View style={styles.listItem}>
              <Text style={styles.listLabel}>Tax</Text>
              <Text style={styles.listValue}>{taxText}</Text>
            </View>
          )}
          
          {order.discount_amount && order.discount_amount > 0 && (
            <View style={styles.listItem}>
              <Text style={styles.listLabel}>Discount</Text>
              <Text style={[styles.listValue, styles.discountText]}>-{discountText}</Text>
            </View>
          )}
        </View>

        <View style={styles.boldDivider} />

        {/* Total - Clear and Prominent */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{totalText}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your order!</Text>
          <Text style={styles.footerSubtext}>For support: 592-721-9769</Text>
        </View>
      </View>
    );
  };

  const renderErrandReceipt = () => {
    if (!errand) return null;

    // Fixed errand price: GYD$2000 (no distance calculation)
    const fixedPrice = 2000;

    const errandNumberText = errand.errand_number;
    const errandDateText = new Date(errand.created_at || '').toLocaleString();
    const errandStatusText = errand.status.toUpperCase();
    const serviceTypeText = errand.subcategory?.name || 'Custom Errand';
    const paymentMethodText = errand.payment_method === 'mobile_money'
      ? 'MMG+'
      : errand.payment_method.charAt(0).toUpperCase() + errand.payment_method.slice(1);
    const pickupAddressText = errand.pickup_address;
    const dropoffAddressText = errand.dropoff_address;
    const instructionsText = errand.instructions || '';
    const notesText = errand.notes || '';
    const totalText = formatCurrency(fixedPrice);

    return (
      <View style={styles.receiptContent}>
        {/* Header */}
        <View style={styles.receiptHeader}>
          <Text style={styles.receiptTitle}>🧾 Receipt</Text>
          <Text style={styles.receiptSubtitle}>ErrandRunners - Errands</Text>
        </View>

        <View style={styles.simpleDivider} />

        {/* Errand Info - Clean Vertical List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Errand Details</Text>
          
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>Errand Number</Text>
            <Text style={styles.listValue}>{errandNumberText}</Text>
          </View>
          
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>Date & Time</Text>
            <Text style={styles.listValue}>{errandDateText}</Text>
          </View>
          
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>Status</Text>
            <Text style={[styles.listValue, styles.statusText]}>{errandStatusText}</Text>
          </View>
          
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>Service Type</Text>
            <Text style={styles.listValue}>{serviceTypeText}</Text>
          </View>
          
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>Payment Method</Text>
            <Text style={styles.listValue}>{paymentMethodText}</Text>
          </View>
        </View>

        <View style={styles.simpleDivider} />

        {/* Locations - Clean Vertical List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locations</Text>
          
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>Pickup</Text>
            <Text style={styles.listValue}>{pickupAddressText}</Text>
          </View>
          
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>Drop-off</Text>
            <Text style={styles.listValue}>{dropoffAddressText}</Text>
          </View>
        </View>

        {(instructionsText !== '' || notesText !== '') && (
          <>
            <View style={styles.simpleDivider} />
            <View style={styles.section}>
              {instructionsText !== '' && (
                <View style={styles.listItem}>
                  <Text style={styles.listLabel}>Instructions</Text>
                  <Text style={styles.listValue}>{instructionsText}</Text>
                </View>
              )}
              
              {notesText !== '' && (
                <View style={styles.listItem}>
                  <Text style={styles.listLabel}>Notes</Text>
                  <Text style={styles.listValue}>{notesText}</Text>
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.simpleDivider} />

        {/* Price Info */}
        <View style={styles.section}>
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>Errand Price</Text>
            <Text style={styles.listValue}>{totalText}</Text>
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>ℹ️ Fixed price - distance does not affect cost</Text>
          </View>
        </View>

        <View style={styles.boldDivider} />

        {/* Total - Clear and Prominent */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{totalText}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for using our service!</Text>
          <Text style={styles.footerSubtext}>For support: 592-721-9769</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Receipt</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {type === 'order' ? renderOrderReceipt() : renderErrandReceipt()}
          </ScrollView>

          {/* Footer Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    ...theme.shadows.xl,
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
    padding: theme.spacing.sm,
  },
  closeButtonText: {
    fontSize: 24,
    color: theme.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  receiptContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  receiptTitle: {
    fontSize: 28,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  receiptSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  listItem: {
    marginBottom: theme.spacing.md,
  },
  listLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  listValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    lineHeight: 22,
  },
  statusText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  categorySection: {
    marginBottom: theme.spacing.lg,
  },
  categoryTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '40',
  },
  itemLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  itemName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
  discountText: {
    color: theme.colors.success,
  },
  simpleDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  boldDivider: {
    height: 2,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  totalLabel: {
    fontSize: 22,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  infoBox: {
    backgroundColor: theme.colors.info + '20',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
  },
  footer: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  footerText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  modalFooter: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
});
