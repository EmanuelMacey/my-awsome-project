
import { StyleSheet } from 'react-native';

// Modern color palette inspired by the ErrandRunners logo
// Orange primary (from logo) + complementary colors for a fresh, modern look
export const theme = {
  colors: {
    // Primary colors from logo
    primary: '#FF8C42',        // Vibrant orange from logo
    primaryDark: '#E67A2E',    // Darker orange for pressed states
    primaryLight: '#FFB574',   // Light orange for backgrounds
    
    // Secondary colors
    secondary: '#1E3A5F',      // Deep blue from logo
    secondaryLight: '#2E5A8F', // Lighter blue
    accent: '#00C9A7',         // Fresh teal for success states
    
    // Backgrounds
    background: '#F8F9FA',     // Light gray background
    backgroundDark: '#FFFFFF', // White for cards
    surface: '#FFFFFF',        // Surface color
    
    // Text colors
    text: '#1A1A1A',           // Almost black for primary text
    textSecondary: '#6B7280',  // Gray for secondary text
    textLight: '#9CA3AF',      // Light gray for hints
    
    // Semantic colors
    success: '#10B981',        // Green for success
    danger: '#EF4444',         // Red for errors/delete
    warning: '#F59E0B',        // Amber for warnings
    info: '#3B82F6',           // Blue for info
    
    // UI elements
    border: '#E5E7EB',         // Light border
    divider: '#F3F4F6',        // Very light divider
    shadow: 'rgba(0, 0, 0, 0.08)', // Subtle shadow
    overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlay
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 34,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
  },
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  text: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  textSecondary: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
