// Dựa trên logo Speed Up Logistics
const SPEEDUP_GREEN = '#008037';
const SPEEDUP_YELLOW = '#FFD200';

// Bảng màu chung
const NEUTRAL_BLACK = '#1E293B';
const NEUTRAL_GRAY_1 = '#64748B';
const NEUTRAL_GRAY_2 = '#94A3B8';
const NEUTRAL_GRAY_3 = '#E2E8F0';
const NEUTRAL_WHITE = '#FFFFFF';
const NEUTRAL_BACKGROUND = '#F8F9FA';

const SUCCESS_GREEN = '#10B981';
const DANGER_RED = '#EF4444';
const INFO_BLUE = '#3B82F6';
const SECONDARY_PURPLE = '#8B5CF6';

export const lightColors = {
  // Core Brand Colors
  primary: SPEEDUP_GREEN,
  secondary: SECONDARY_PURPLE,

  // Backgrounds
  background: NEUTRAL_BACKGROUND,
  card: NEUTRAL_WHITE,

  // Text
  text: NEUTRAL_BLACK,
  textSecondary: NEUTRAL_GRAY_1,
  textMuted: NEUTRAL_GRAY_2, // Thêm cho các placeholder/disabled text
  primaryText: NEUTRAL_WHITE, 

  // Borders & Dividers
  border: NEUTRAL_GRAY_3,
  shadow: NEUTRAL_GRAY_1,

  // Semantic Colors
  success: SUCCESS_GREEN,
  danger: DANGER_RED,
  warning: SPEEDUP_YELLOW,
  info: INFO_BLUE,

  // Background Variants
  primaryBackground: '#E6F2EB', // Light version of SPEEDUP_GREEN
  secondaryBackground: '#F5F3FF', // Light version of SECONDARY_PURPLE
  successBackground: '#ECFDF5', // Light version of SUCCESS_GREEN
  dangerBackground: '#FEE2E2', // Light version of DANGER_RED
  warningBackground: '#FFF9E0', // Light version of SPEEDUP_YELLOW
  infoBackground: '#EFF6FF', // Light version of INFO_BLUE

  // Others
  disabled: NEUTRAL_GRAY_2,
};

export const darkColors = {
  ...lightColors, // Kế thừa các base color không đổi
  
  // Overrides cho Dark Theme
  primary: '#00a346', // Xanh lá sáng hơn một chút để nổi bật trên nền đen
  background: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  border: '#334155',
  shadow: '#000000',
  
  // Overrides cho Background Variants trong dark mode (để không bị chói)
  primaryBackground: 'rgba(0, 128, 55, 0.2)', 
  successBackground: 'rgba(16, 185, 129, 0.15)',
  warningBackground: 'rgba(255, 210, 0, 0.15)',
  dangerBackground: 'rgba(239, 68, 68, 0.15)',
};

// Export Type để tự động nhắc lệnh (IntelliSense) khi gõ theme.
export type ThemeType = typeof lightColors;