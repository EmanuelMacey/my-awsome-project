
/**
 * Helper utility functions used across the app
 */

/**
 * Extract first name from a full name string
 * @param fullName - The full name to extract from
 * @returns The first name, or a default value if not available
 */
export function getFirstName(fullName: string | null | undefined): string {
  if (!fullName || typeof fullName !== 'string') return 'User';
  const trimmed = fullName.trim();
  if (!trimmed) return 'User';
  return trimmed.split(' ')[0];
}

/**
 * Format a phone number for display
 * @param phone - The phone number to format
 * @returns Formatted phone number or 'N/A' if not available
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return 'N/A';
  return phone;
}

/**
 * Get initials from a name
 * @param name - The name to get initials from
 * @returns The initials (up to 2 characters)
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
