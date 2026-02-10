
/**
 * Payment utilities for ErrandRunners
 * Currently supports Cash on Delivery only
 */

export type PaymentMethod = 'cash';

export interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
  available: boolean;
}

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    id: 'cash',
    name: 'Cash on Delivery',
    description: 'Pay with cash when your order is delivered',
    icon: '💵',
    available: true,
  },
];

/**
 * Get payment method display name
 */
export function getPaymentMethodName(method: string): string {
  switch (method) {
    case 'cash':
      return 'Cash on Delivery';
    case 'mobile_money':
      return 'MMG+';
    case 'card':
      return 'Card';
    case 'bank_transfer':
      return 'Bank Transfer';
    default:
      return 'Unknown';
  }
}

/**
 * Get payment method icon
 */
export function getPaymentMethodIcon(method: string): string {
  switch (method) {
    case 'cash':
      return '💵';
    case 'mobile_money':
      return '📱';
    case 'card':
      return '💳';
    case 'bank_transfer':
      return '🏦';
    default:
      return '💰';
  }
}

/**
 * Validate MMG phone number (kept for future use)
 */
export function validateMMGNumber(number: string): boolean {
  // Remove spaces and dashes
  const cleaned = number.replace(/[\s-]/g, '');
  
  // Check if it's a valid Guyana phone number
  // Format: +592XXXXXXX or 592XXXXXXX or XXXXXXX
  const guyanaRegex = /^(\+?592)?[0-9]{7}$/;
  
  return guyanaRegex.test(cleaned);
}

/**
 * Format MMG phone number (kept for future use)
 */
export function formatMMGNumber(number: string): string {
  const cleaned = number.replace(/[\s-]/g, '');
  
  if (cleaned.startsWith('+592')) {
    return cleaned;
  } else if (cleaned.startsWith('592')) {
    return '+' + cleaned;
  } else {
    return '+592' + cleaned;
  }
}

/**
 * Validate card number (kept for future use)
 */
export function validateCardNumber(number: string): boolean {
  // Remove spaces and dashes
  const cleaned = number.replace(/[\s-]/g, '');
  
  // Check if it's a valid card number (basic check)
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false;
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Get card type from number (kept for future use)
 */
export function getCardType(number: string): string {
  const cleaned = number.replace(/[\s-]/g, '');
  
  if (/^4/.test(cleaned)) {
    return 'visa';
  } else if (/^5[1-5]/.test(cleaned)) {
    return 'mastercard';
  } else if (/^3[47]/.test(cleaned)) {
    return 'amex';
  } else if (/^6(?:011|5)/.test(cleaned)) {
    return 'discover';
  }
  
  return 'unknown';
}

/**
 * Format card number for display (kept for future use)
 */
export function formatCardNumber(number: string): string {
  const cleaned = number.replace(/[\s-]/g, '');
  const groups = cleaned.match(/.{1,4}/g);
  
  return groups ? groups.join(' ') : cleaned;
}
