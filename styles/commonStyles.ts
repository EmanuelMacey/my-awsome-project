
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Modern color palette for ErrandNow Guyana
export const colors = {
  primary: '#FF8C42',        // Vibrant orange from logo
  primaryDark: '#E67A2E',    // Darker orange
  primaryLight: '#FFB574',   // Light orange
  secondary: '#1E3A5F',      // Deep blue from logo
  secondaryLight: '#2E5A8F', // Lighter blue
  accent: '#00C9A7',         // Fresh teal
  background: '#F8F9FA',     // Light gray background
  backgroundAlt: '#FFFFFF',  // White alternative
  text: '#1A1A1A',           // Almost black
  textSecondary: '#6B7280',  // Gray
  grey: '#9CA3AF',           // Light gray
  card: '#FFFFFF',           // White cards
  border: '#E5E7EB',         // Light border
  success: '#10B981',        // Green
  danger: '#EF4444',         // Red
  warning: '#F59E0B',        // Amber
};

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
    borderRadius: 12,
    paddingVertical: 16,
  },
  backButton: {
    backgroundColor: colors.backgroundAlt,
    alignSelf: 'center',
    width: '100%',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 12
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.primary,
  },
});
