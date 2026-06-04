import { Platform, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import {
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from "../constants/theme";

const LoginStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },
  backgroundImage: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },
  backgroundImageOverlay: {
    opacity: SPACING.xs / SPACING.xxl,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: "center",
  },
  topSpacer: {
    height: Platform.OS === "ios" ? SPACING.xxl : SPACING.xl,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },
  logoImage: {
    width: "75%",
    height: SPACING.xxl + SPACING.xl,
  },
  formSection: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  loginTitle: {
    fontSize: TYPOGRAPHY.fontSize.headingSm,
    lineHeight: TYPOGRAPHY.lineHeight.headingSm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  inputGap: {
    height: SPACING.sm,
  },
  buttonGap: {
    height: SPACING.md,
  },
  eyeButton: {
    width: TOUCH_TARGET.iosMin,
    height: TOUCH_TARGET.iosMin,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.round,
  },
  eyeHitSlop: {
    hitSlop: {
      top: SPACING.md_sm,
      bottom: SPACING.md_sm,
      left: SPACING.md_sm,
      right: SPACING.md_sm,
    },
  },
  iconSize: {
    fontSize: TYPOGRAPHY.fontSize.body,
  },
  eyeIconSize: {
    fontSize: TYPOGRAPHY.fontSize.subtitle,
  },
  flexGrow: {
    flex: 1,
  },
  footerLogosContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? SPACING.xl : SPACING.md,
    marginTop: SPACING.xxl,
  },
  footerImage: {
    width: "35%",
    height: SPACING.lg + SPACING.md,
  },
  footerDivider: {
    width: SPACING.xs / SPACING.xs,
    height: SPACING.lg + SPACING.xs,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACING.md,
  },
});

export default LoginStyles;
