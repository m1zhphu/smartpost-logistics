import { COLORS } from "./colors";

export const SPACING = {
  hairline: 1,
  xxs: 2,
  xs: 4,
  sm: 8,
  md_sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxxl: 40,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

export const TYPOGRAPHY = {
  fontSize: {
    caption: 12,
    bodySm: 14,
    body: 16,
    subtitle: 18,
    headingSm: 24,
    heading: 28,
    headingLg: 32,
  },
  lineHeight: {
    caption: 16,
    bodySm: 20,
    body: 24,
    subtitle: 26,
    headingSm: 32,
    heading: 36,
    headingLg: 40,
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.textMain,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: COLORS.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.textMain,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const TOUCH_TARGET = {
  iosMin: 44,
  androidMin: 48,
};

export const LAYOUT = {
  screenPadding: SPACING.md,
  sectionGap: SPACING.lg,
  itemGap: SPACING.sm,
};

export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  typography: TYPOGRAPHY,
  radius: BORDER_RADIUS,
  shadows: SHADOWS,
  touchTarget: TOUCH_TARGET,
  layout: LAYOUT,
};

export default THEME;

