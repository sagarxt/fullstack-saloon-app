// Groomish Brand Color Palette - Mobile Theme
export const Colors = {
  // Primary Brand Colors
  orange: '#FF6B35',
  orangeDark: '#E5582A',
  orangeLight: '#FFF0EB',

  gold: '#D4A843',
  goldDark: '#B8901E',
  goldLight: '#FFF8E1',

  coral: '#F7857A',
  coralLight: '#FFF1F0',

  // Background Colors
  bg: '#F8F6F2',       // cream background
  bgDark: '#EFEDE8',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAF9',

  // Slate (Text & Dark UI)
  slate: '#2D2D3A',
  slateDark: '#1A1A24',
  slateLight: '#6B6B80',
  slateXLight: '#A8A8B8',

  // Status Colors
  green: '#2ECC71',
  greenLight: '#E8F8EF',
  greenDark: '#1BA355',

  red: '#E74C3C',
  redLight: '#FDEAEA',

  amber: '#F59E0B',
  amberLight: '#FEF3C7',

  blue: '#3B82F6',
  blueLight: '#EFF6FF',

  // Tier Colors
  silver: '#8B9AA8',
  silverLight: '#F0F4F7',
  goldTier: '#D4A843',
  platinumBlue: '#64B5F6',
  diamondCoral: '#F7857A',

  // Grays
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',

  // Common
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Gradient arrays (use with LinearGradient)
  gradients: {
    orangeGold: ['#FF6B35', '#D4A843'],
    slateDeep: ['#2D2D3A', '#1A1A24'],
    slateMid: ['#3D3D4D', '#2D2D3A'],
    greenMint: ['#2ECC71', '#27AE60'],
    coralRose: ['#FF6B35', '#F7857A'],
    goldShimmer: ['#D4A843', '#F5CC6B', '#D4A843'],
    bgFade: ['#F8F6F2', '#EFEDE8'],
  }
};

// Shadows
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  orange: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  gold: {
    shadowColor: '#D4A843',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Typography scale
export const Typography = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
  '4xl': 38,
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,
};

// Border radius
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};
