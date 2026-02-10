
/**
 * Format a number as currency (GYD)
 */
export function formatCurrency(amount: number): string {
  return `GYD$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Format a number with K/M notation for large numbers
 * Examples: 1500 -> 1.5K, 1500000 -> 1.5M
 */
export function formatCompactCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `GYD$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `GYD$${(amount / 1000).toFixed(1)}K`;
  } else {
    return `GYD$${amount}`;
  }
}

/**
 * Freeze price to prevent floating point errors
 */
export function freezePrice(price: number): number {
  return Math.round(price * 100) / 100;
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string): number {
  return parseFloat(currencyString.replace(/[^0-9.-]+/g, ''));
}
