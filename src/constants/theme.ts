/**
 * Design System & Theme Configuration
 * Follows PRD design tenets: authentic, gentle, private, accessible
 */

export const colors = {
  // Primary - Islamic green palette
  primary: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },

  // Secondary - Warm gold for accents
  secondary: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFC107',
    600: '#FFB300',
    700: '#FFA000',
    800: '#FF8F00',
    900: '#FF6F00',
  },

  // Neutral grays
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Semantic colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Common colors
  white: '#FFFFFF',
  black: '#000000',

  // Status colors for prayers
  onTime: '#4CAF50',
  delayed: '#FF9800',
  missed: '#F44336',
  qadaa: '#9C27B0',

  // Background
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    tertiary: '#FAFAFA',
  },

  // Text
  text: {
    primary: '#212121',
    secondary: '#757575',
    tertiary: '#9E9E9E',
    inverse: '#FFFFFF',
  },

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Borders
  border: {
    light: '#E0E0E0',
    medium: '#BDBDBD',
    dark: '#9E9E9E',
  },

  // Feedback colors (alias for semantic colors)
  feedback: {
    success: '#4CAF50',
    successLight: '#C8E6C9',
    warning: '#FF9800',
    warningLight: '#FFE0B2',
    error: '#F44336',
    errorLight: '#FFCDD2',
    info: '#2196F3',
    infoLight: '#BBDEFB',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    // Arabic fonts will be added later
    arabic: 'System',
  },

  // Font sizes - accessible, large tap targets
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const shadows = {
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Component-specific styles
export const components = {
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },

  button: {
    primary: {
      backgroundColor: colors.primary[600],
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      minHeight: 48, // Accessible tap target
    },
    secondary: {
      backgroundColor: colors.gray[100],
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      minHeight: 48,
    },
  },

  input: {
    backgroundColor: colors.background.primary,
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.md,
    minHeight: 48,
  },
};

export const layout = {
  // Safe area padding
  screenPadding: spacing.md,

  // Max width for readable content
  maxContentWidth: 600,

  // Tab bar height
  tabBarHeight: 60,

  // Header height
  headerHeight: 56,
};

// Animation durations
export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Breakpoints for responsive design
export const breakpoints = {
  sm: 375,
  md: 768,
  lg: 1024,
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  components,
  layout,
  animation,
  breakpoints,
};

export type Theme = typeof theme;
