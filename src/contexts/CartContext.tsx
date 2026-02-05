
import React, { createContext, useContext, useState, useEffect } from 'react';
import { scheduleCartReminders, cancelCartReminders, setupCartNotificationChannel } from '../utils/cartNotifications';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  storeId: string;
}

interface CartContextType {
  cart: CartItem[];
  storeId: string | null;
  setStoreId: (id: string | null) => void;
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);

  // Setup notification channel on mount
  useEffect(() => {
    console.log('🔔 Setting up cart notification channel');
    setupCartNotificationChannel();
  }, []);

  // Sync storeId with cart items
  useEffect(() => {
    if (cart.length > 0) {
      const firstItemStoreId = cart[0]?.storeId;
      if (firstItemStoreId && firstItemStoreId !== storeId) {
        console.log('Syncing storeId from cart items:', firstItemStoreId);
        setStoreId(firstItemStoreId);
      }
    } else if (cart.length === 0 && storeId !== null) {
      console.log('Cart is empty, clearing storeId');
      setStoreId(null);
    }
  }, [cart, storeId]);

  // Schedule/cancel cart reminders based on cart state
  useEffect(() => {
    console.log('🔔 Cart changed, updating reminders. Cart size:', cart.length);
    
    if (cart.length > 0) {
      // Schedule reminders when cart has items
      scheduleCartReminders(cart.length);
    } else {
      // Cancel reminders when cart is empty
      cancelCartReminders();
    }
  }, [cart.length]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    const targetStoreId = item.storeId;
    
    console.log('Adding item to cart:', {
      itemId: item.id,
      itemName: item.name,
      storeId: targetStoreId,
      currentStoreId: storeId,
      currentCartSize: cart.length,
    });

    // If adding from a different store, clear cart and show warning
    if (storeId && storeId !== targetStoreId && cart.length > 0) {
      console.log('Different store detected, clearing cart');
      setCart([{ ...item, quantity: 1 }]);
      setStoreId(targetStoreId);
      return;
    }

    // Set store ID if not already set
    if (!storeId) {
      console.log('Setting initial storeId:', targetStoreId);
      setStoreId(targetStoreId);
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        console.log('Item already in cart, incrementing quantity');
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      console.log('Adding new item to cart');
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    console.log('Removing item from cart:', itemId);
    setCart((prevCart) => {
      const newCart = prevCart.filter((cartItem) => cartItem.id !== itemId);
      // If cart is empty, clear the store ID
      if (newCart.length === 0) {
        console.log('Cart is now empty, clearing storeId');
        setStoreId(null);
      }
      return newCart;
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    console.log('Updating quantity:', { itemId, quantity });
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((cartItem) =>
        cartItem.id === itemId ? { ...cartItem, quantity } : cartItem
      )
    );
  };

  const clearCart = () => {
    console.log('Clearing cart');
    setCart([]);
    setStoreId(null);
    // Cancel reminders when cart is cleared
    cancelCartReminders();
  };

  const getTotal = () => {
    return cart.reduce((total, cartItem) => total + cartItem.price * cartItem.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{ cart, storeId, setStoreId, addToCart, removeFromCart, updateQuantity, clearCart, getTotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
