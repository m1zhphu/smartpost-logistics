import { Platform, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import {
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from "../constants/theme";

const RegisterStyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundImageInner: {
    opacity: COLORS.primaryLight ? 0.08 : 0.08,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: "center",
  },
  topSpacer: {
    height: Platform.OS === "ios" ? SPACING.xxl + SPACING.lg : SPACING.xxl,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },
  logoImage: {
    width: "80%",
    height: SPACING.xxl + SPACING.xl,
  },
  formSection: {
    width: "100%",
    alignItems: "center",
    gap: SPACING.sm,
  },
  registerTitle: {
    fontSize: TYPOGRAPHY.fontSize.headingSm,
    lineHeight: TYPOGRAPHY.lineHeight.headingSm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primaryColorAuth,
    marginBottom: SPACING.sm,
  },
  registerButton: {
    width: "100%",
    marginTop: SPACING.sm,
    minHeight: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  loginRow: {
    flexDirection: "row",
    marginTop: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
  },
  loginTextNormal: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  loginLink: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: TOUCH_TARGET.androidMin,
  },
  loginTextBold: {
    color: COLORS.primaryColorAuth,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
  },
  loginArrow: {
    marginLeft: SPACING.xs,
  },
  flexFill: {
    flex: 1,
  },
  footerLogosContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? SPACING.xl : SPACING.md,
    marginTop: SPACING.xl,
  },
  footerImage: {
    width: "35%",
    height: TOUCH_TARGET.androidMin,
  },
  footerDivider: {
    width: SPACING.xs / SPACING.xs,
    height: SPACING.xl + SPACING.xs,
    backgroundColor: COLORS.borderColorAuth,
    marginHorizontal: SPACING.md,
  },
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
    pointerEvents: "box-none",
  },
});

export default RegisterStyles;
