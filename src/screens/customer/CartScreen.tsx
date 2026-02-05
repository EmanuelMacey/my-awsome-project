
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Animated,
  ImageSourcePropType,
} from 'react-native';
import { router } from 'expo-router';

import { formatCurrency, freezePrice } from '../../utils/currency';
import { ReceiptModal } from '../../components/ReceiptModal';
import { PaymentMethodSelector } from '../../components/PaymentMethodSelector';
import { LocationPicker } from '../../components/LocationPicker';
import { LoadingSpinner } from '../../components/LoadingSpinner';

import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

import { createOrder, getOrderById, getOrderItems } from '../../api/orders';
import { getStoreById } from '../../api/stores';
import { calculateDeliveryFee } from '../../utils/pricing';

import { Order, OrderItem } from '../../types/database.types';
import { supabase } from '../../config/supabase';
import { theme } from '../../styles/theme';

const SERVICE_FEE = 200;

// Helper to resolve image sources (handles both local require() and remote URLs)
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function CartScreen() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);

  const [storeLatitude, setStoreLatitude] = useState<number | null>(null);
  const [storeLongitude, setStoreLongitude] = useState<number | null>(null);

  const [deliveryFee, setDeliveryFee] = useState(1000);
  const [paymentMethod, setPaymentMethod] = useState<'cash'>('cash');

  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [completedOrderItems, setCompletedOrderItems] = useState<OrderItem[]>([]);

  const [userPhone, setUserPhone] = useState<string>('');

  const fadeAnims = useRef(cart.map(() => new Animated.Value(0))).current;

  // Get storeId from first cart item
  const storeId = cart.length > 0 ? cart[0]?.storeId : null;

  /* ===========================
     ANIMATIONS
  =========================== */
  useEffect(() => {
    fadeAnims.forEach(anim => anim.setValue(0));

    Animated.stagger(
      80,
      fadeAnims.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [cart.length, fadeAnims]);

  /* ===========================
     CALCULATIONS
  =========================== */
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * item.quantity,
        0
      ),
    [cart]
  );

  const total = useMemo(
    () => subtotal + SERVICE_FEE + deliveryFee,
    [subtotal, deliveryFee]
  );

  /* ===========================
     FETCH STORE LOCATION
  =========================== */
  const fetchStoreLocation = useCallback(async () => {
    if (!storeId) {
      console.log('No storeId available, skipping store location fetch');
      return;
    }

    try {
      console.log('Fetching store location for storeId:', storeId);
      const store = await getStoreById(storeId);
      if (store) {
        console.log('Store location fetched:', store.latitude, store.longitude);
        setStoreLatitude(store.latitude ?? null);
        setStoreLongitude(store.longitude ?? null);
      } else {
        console.warn('Store not found for storeId:', storeId);
      }
    } catch (error) {
      console.error('Error fetching store location:', error);
    }
  }, [storeId]);

  useEffect(() => {
    fetchStoreLocation();
  }, [fetchStoreLocation]);

  /* ===========================
     FETCH USER ADDRESS & PHONE
  =========================== */
  const fetchUserDeliveryAddress = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('delivery_address, delivery_latitude, delivery_longitude, phone')
        .eq('user_id', user.id)
        .single();

      if (data?.delivery_address) {
        setDeliveryAddress(data.delivery_address);
        setDeliveryLatitude(data.delivery_latitude);
        setDeliveryLongitude(data.delivery_longitude);
      }

      // Set user phone from profile or user object
      if (data?.phone) {
        setUserPhone(data.phone);
      } else if (user.phone) {
        setUserPhone(user.phone);
      }
    } catch (error) {
      console.error('Error fetching user delivery address:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchUserDeliveryAddress();
  }, [fetchUserDeliveryAddress]);

  /* ===========================
     DELIVERY FEE
  =========================== */
  useEffect(() => {
    if (
      storeLatitude !== null &&
      storeLongitude !== null &&
      deliveryLatitude !== null &&
      deliveryLongitude !== null
    ) {
      setDeliveryFee(
        calculateDeliveryFee(
          storeLatitude,
          storeLongitude,
          deliveryLatitude,
          deliveryLongitude
        )
      );
    }
  }, [storeLatitude, storeLongitude, deliveryLatitude, deliveryLongitude]);

  /* ===========================
     HANDLERS
  =========================== */
  const handleLocationSelected = (
    address: string,
    lat: number,
    lng: number
  ) => {
    setDeliveryAddress(address);
    setDeliveryLatitude(lat);
    setDeliveryLongitude(lng);
  };

  const handlePlaceOrder = async () => {
    console.log('=== PLACE ORDER STARTED ===');
    console.log('User:', user?.id);
    console.log('Cart items:', cart.length);
    console.log('Store ID:', storeId);
    console.log('Delivery address:', deliveryAddress);
    console.log('Delivery coordinates:', deliveryLatitude, deliveryLongitude);
    console.log('Payment method:', paymentMethod);

    // Validate user is logged in
    if (!user) {
      Alert.alert('Error', 'You must be logged in to place an order');
      return;
    }

    // Validate cart is not empty
    if (cart.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    // Validate store ID exists
    if (!storeId) {
      Alert.alert(
        'Error', 
        'Unable to identify the store. Please try adding items to your cart again.'
      );
      console.error('No storeId found in cart items');
      return;
    }

    // Validate delivery address
    if (!deliveryAddress || deliveryAddress.trim().length === 0) {
      Alert.alert(
        'Delivery Address Required',
        'Please enter your delivery address before placing the order.'
      );
      return;
    }

    // Validate coordinates
    if (deliveryLatitude === null || deliveryLongitude === null) {
      Alert.alert(
        'Location Required',
        'Please use the "Use Current Location" button to pin your exact location for accurate delivery.'
      );
      return;
    }

    setLoading(true);
    try {
      console.log('Creating order with params:', {
        customerId: user.id,
        storeId: storeId,
        items: cart.map(item => ({
          item_id: item.id,
          quantity: item.quantity,
        })),
        total: freezePrice(total),
        paymentMethod: 'cash',
        deliveryAddress: deliveryAddress,
        subtotal: freezePrice(subtotal),
        deliveryFee: freezePrice(deliveryFee),
        tax: 0,
        deliveryLatitude: deliveryLatitude,
        deliveryLongitude: deliveryLongitude,
        customerPhone: userPhone || user.phone || undefined,
      });

      // Call createOrder with the correct signature - always use 'cash' as payment method
      const order = await createOrder(
        user.id, // customerId
        storeId, // storeId
        cart.map(item => ({
          item_id: item.id,
          quantity: item.quantity,
        })), // items
        freezePrice(total), // total
        'cash', // paymentMethod - always cash
        deliveryAddress, // deliveryAddress
        undefined, // deliveryNotes (optional)
        freezePrice(subtotal), // subtotal
        freezePrice(deliveryFee), // deliveryFee
        0, // tax
        deliveryLatitude, // deliveryLatitude
        deliveryLongitude, // deliveryLongitude
        userPhone || user.phone || undefined // customerPhone
      );

      console.log('Order created successfully:', order.id);

      // Fetch order data and items for receipt
      const orderData = await getOrderById(order.id);
      const orderItems = await getOrderItems(order.id);

      console.log('Order data fetched, showing receipt');

      // Set receipt data and show modal
      setCompletedOrder(orderData);
      setCompletedOrderItems(orderItems);
      setShowReceipt(true);
      
      // Clear cart
      clearCart();

      // Navigate to order detail screen after a short delay (to show receipt)
      setTimeout(() => {
        console.log('Navigating to order detail screen');
        router.replace(`/customer/order/${order.id}`);
      }, 500);
    } catch (err: any) {
      console.error('Order placement error:', err);
      Alert.alert('Order Failed', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = (itemId: string, itemName: string) => {
    Alert.alert(
      'Remove Item',
      `Remove ${itemName} from your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFromCart(itemId);
          },
        },
      ]
    );
  };

  const canCheckout =
    deliveryAddress.trim().length > 0 &&
    deliveryLatitude !== null &&
    deliveryLongitude !== null &&
    cart.length > 0 &&
    storeId !== null;

  if (loading) return <LoadingSpinner />;

  if (cart.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.push('/customer/home')}
        >
          <Text style={styles.browseButtonText}>Browse Stores</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const subtotalText = formatCurrency(subtotal);
  const serviceFeeText = formatCurrency(SERVICE_FEE);
  const deliveryFeeText = formatCurrency(deliveryFee);
  const totalText = formatCurrency(total);
  const phoneDisplay = userPhone || user?.phone || 'Not provided';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Your Items</Text>
          {cart.map((item, index) => {
            const itemNameText = item.name;
            const itemPriceText = formatCurrency(item.price);
            const itemQuantityText = item.quantity.toString();
            
            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.cartItem,
                  {
                    opacity: fadeAnims[index],
                    transform: [
                      {
                        translateY: fadeAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {item.image && (
                  <View style={styles.imageContainer}>
                    <Image 
                      source={resolveImageSource(item.image)} 
                      style={styles.itemImage}
                      resizeMode="contain"
                    />
                  </View>
                )}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{itemNameText}</Text>
                  <Text style={styles.itemPrice}>{itemPriceText}</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Text style={styles.quantityButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{itemQuantityText}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(item.id, item.name)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <View style={styles.deliverySection}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <LocationPicker
            onLocationSelected={handleLocationSelected}
            initialAddress={deliveryAddress}
            initialLatitude={deliveryLatitude ?? undefined}
            initialLongitude={deliveryLongitude ?? undefined}
          />
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <PaymentMethodSelector
            selectedMethod={paymentMethod}
            onSelectMethod={setPaymentMethod}
          />
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Order Breakdown</Text>
          
          {/* Items Breakdown */}
          <View style={styles.itemsBreakdown}>
            <Text style={styles.breakdownTitle}>Items</Text>
            {cart.map((item, index) => {
              const itemNameText = item.name;
              const itemQtyText = `Qty: ${item.quantity}`;
              const itemTotalText = formatCurrency(item.price * item.quantity);
              
              return (
                <View key={index} style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <Text style={styles.breakdownItemName}>{itemNameText}</Text>
                    <Text style={styles.breakdownItemQty}>{itemQtyText}</Text>
                  </View>
                  <Text style={styles.breakdownItemPrice}>{itemTotalText}</Text>
                </View>
              );
            })}
          </View>
          
          <View style={styles.summaryDivider} />
          
          {/* Delivery Information */}
          <View style={styles.deliveryInfoSection}>
            <Text style={styles.breakdownTitle}>Delivery Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{deliveryAddress || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{phoneDisplay}</Text>
            </View>
          </View>
          
          <View style={styles.summaryDivider} />
          
          {/* Price Breakdown */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{subtotalText}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee</Text>
            <Text style={styles.summaryValue}>{serviceFeeText}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>{deliveryFeeText}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{totalText}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.checkoutContainer}>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            !canCheckout && styles.checkoutButtonDisabled,
          ]}
          disabled={!canCheckout}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.checkoutText}>
            Place Order • {totalText}
          </Text>
        </TouchableOpacity>
      </View>

      {completedOrder && (
        <ReceiptModal
          visible={showReceipt}
          onClose={() => {
            setShowReceipt(false);
          }}
          order={completedOrder}
          orderItems={completedOrderItems}
          type="order"
        />
      )}
    </View>
  );
}

/* ===========================
   STYLES
=========================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  itemsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  imageContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  quantityText: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  deliverySection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  paymentSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  summarySection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  itemsBreakdown: {
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownLeft: {
    flex: 1,
  },
  breakdownItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  breakdownItemQty: {
    fontSize: 12,
    color: '#666',
  },
  breakdownItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  deliveryInfoSection: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    flexWrap: 'wrap',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  checkoutButton: {
    backgroundColor: theme.colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#ccc',
  },
  checkoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
